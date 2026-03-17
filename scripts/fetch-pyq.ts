/**
 * One-time bulk script: Fetches past year questions for NEET PG, INI-CET, UPSC CMO
 * across ALL chapters using DuckDuckGo + page scraping + Groq AI.
 *
 * Run:          npx tsx scripts/fetch-pyq.ts
 * With page:    npx tsx scripts/fetch-pyq.ts --page 2 --size 50
 * Custom range: npx tsx scripts/fetch-pyq.ts --skip 100 --limit 30
 *
 * Pagination args (all optional, can be combined):
 *   --page N     Page number (1-based). Works with --size. Default: 1.
 *   --size N     Chapters per page. Default: 50.
 *   --skip N     Skip first N chapters (overrides --page).
 *   --limit N    Process at most N chapters (overrides --size).
 *
 * Resumable: skips chapters that already have enough questions per exam type.
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { searchWeb, fetchPageContent } from "../lib/webSearch";
import { generatePYQBatch, ExamType } from "../lib/contentProcessor";

const MONGODB_URI = process.env.MONGODB_URI!;

// ── Inline minimal schemas (avoid path alias issues in scripts) ──────────────
const SubjectSchema = new mongoose.Schema({ name: String });
const ChapterSchema = new mongoose.Schema({
  subjectId: mongoose.Schema.Types.ObjectId,
  title: String,
  updatedAt: Date,
});
const QuestionSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, index: true },
  question: String,
  options: [String],
  correctAnswer: Number,
  explanation: String,
  examType: String,
  year: Number,
  difficulty: String,
});

const Subject = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", ChapterSchema);
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// ── CLI args ─────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : null;
  };

  const page = get("--page") ?? 1;
  const size = get("--size") ?? 50;
  const skip = get("--skip") ?? (page - 1) * size;
  const limit = get("--limit") ?? size;

  return { skip, limit, page, size };
}

// ── Config ───────────────────────────────────────────────────────────────────
const EXAM_TYPES: ExamType[] = ["NEET_PG", "INI_CET", "UPSC_CMO"];
const QUESTIONS_PER_EXAM = 10;       // questions to add per chapter per exam type
const MIN_EXISTING_TO_SKIP = 8;      // skip if chapter already has this many for that exam
const DELAY_BETWEEN_CHAPTERS_MS = 3000;
const DELAY_BETWEEN_EXAMS_MS = 2000;

// Search queries per exam type
const SEARCH_QUERIES: Record<ExamType, (chapter: string, subject: string) => string[]> = {
  NEET_PG: (c, s) => [
    `NEET PG ${c} ${s} previous year questions MCQ 2023 2024`,
    `NEET PG ${s} ${c} MCQ solved questions with explanation`,
    `${c} ${s} NEET PG past paper questions answers`,
  ],
  INI_CET: (c, s) => [
    `INI-CET ${c} ${s} previous year questions MCQ 2023 2024`,
    `AIIMS INI CET ${s} ${c} MCQ solved questions`,
    `INI-CET ${c} past year questions with explanation`,
  ],
  UPSC_CMO: (c, s) => [
    `UPSC CMS CMO ${c} ${s} previous year questions MCQ 2022 2023`,
    `UPSC Combined Medical Services ${s} ${c} MCQ questions answers`,
    `UPSC CMO ${c} past paper questions solved`,
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  const ts = new Date().toTimeString().slice(0, 8);
  console.log(`[${ts}] ${msg}`);
}

async function getPageContent(
  chapter: string,
  subject: string,
  examType: ExamType
): Promise<string> {
  const queries = SEARCH_QUERIES[examType](chapter, subject);
  const allContent: string[] = [];

  for (const query of queries.slice(0, 2)) {
    try {
      const results = await searchWeb(query, 3);

      // Add snippets
      const snippets = results.map((r) => `${r.title}: ${r.snippet}`).join("\n");
      allContent.push(snippets);

      // Deep-fetch the first result that has a real URL
      for (const r of results) {
        if (r.url && r.url.startsWith("http")) {
          const page = await fetchPageContent(r.url, 4000);
          if (page.length > 200) {
            allContent.push(`--- Page content from ${r.url.slice(0, 60)} ---\n${page}`);
            break; // one deep-fetch per query is enough
          }
        }
      }

      await sleep(800); // be polite to DDG
    } catch (err) {
      log(`  ⚠ Search failed for "${query}": ${String(err)}`);
    }
  }

  return allContent.join("\n\n").slice(0, 8000);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { skip, limit, page, size } = parseArgs();

  log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  log("Connected.\n");

  // Load all chapters with their subject names
  const subjects = await Subject.find({}).lean();
  const subjectMap = Object.fromEntries(subjects.map((s) => [String(s._id), s.name as string]));

  const allChapters = await Chapter.find({}).sort({ title: 1 }).lean();
  const totalChapters = allChapters.length;
  const chapters = allChapters.slice(skip, skip + limit);

  log(`Total chapters in DB : ${totalChapters}`);
  log(`Page ${page} of ${Math.ceil(totalChapters / size)} (size ${size})`);
  log(`Processing chapters  : ${skip + 1} – ${skip + chapters.length} (${chapters.length} chapters)\n`);

  let totalQuestionsAdded = 0;
  let totalChaptersProcessed = 0;
  let totalSkipped = 0;

  for (let ci = 0; ci < chapters.length; ci++) {
    const chapter = chapters[ci];
    const chapterId = chapter._id;
    const chapterTitle = chapter.title as string;
    const subjectName = subjectMap[String(chapter.subjectId)] ?? "Medicine";

    log(`\n── [${skip + ci + 1}/${totalChapters}] ${subjectName} › ${chapterTitle}`);

    let chapterAdded = 0;

    for (const examType of EXAM_TYPES) {
      // Check how many questions already exist for this chapter + exam type
      const existing = await Question.countDocuments({ chapterId, examType });

      if (existing >= MIN_EXISTING_TO_SKIP) {
        log(`  ✓ ${examType}: already has ${existing} questions — skipping`);
        totalSkipped++;
        continue;
      }

      log(`  ↓ ${examType}: ${existing} existing → fetching ${QUESTIONS_PER_EXAM} more...`);

      try {
        // 1. Get context from web
        const pageContent = await getPageContent(chapterTitle, subjectName, examType);

        // 2. Generate questions with Groq
        const questions = await generatePYQBatch(
          chapterTitle,
          subjectName,
          examType,
          pageContent,
          QUESTIONS_PER_EXAM
        );

        // 3. Save unique questions
        const currentYear = new Date().getFullYear();
        let saved = 0;

        for (const q of questions) {
          // Basic validation
          if (
            !q.question ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            q.correctAnswer < 0 ||
            q.correctAnswer > 3
          ) {
            continue;
          }

          // Skip exact duplicates
          const dup = await Question.findOne({ chapterId, question: q.question }).lean();
          if (dup) continue;

          await Question.create({
            chapterId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? "",
            examType,
            year: currentYear,
            difficulty: q.difficulty ?? "medium",
          });
          saved++;
        }

        chapterAdded += saved;
        totalQuestionsAdded += saved;
        log(`  ✓ ${examType}: added ${saved} questions`);
      } catch (err) {
        log(`  ✗ ${examType}: ERROR — ${String(err)}`);
      }

      await sleep(DELAY_BETWEEN_EXAMS_MS);
    }

    totalChaptersProcessed++;
    log(`  → Chapter total: +${chapterAdded} questions`);
    log(`  Progress: ${totalQuestionsAdded} total questions added so far`);

    await sleep(DELAY_BETWEEN_CHAPTERS_MS);
  }

  log(`\n${"═".repeat(60)}`);
  log(`DONE`);
  log(`Chapters processed : ${totalChaptersProcessed}`);
  log(`Exam types skipped : ${totalSkipped}`);
  log(`Total questions added : ${totalQuestionsAdded}`);
  log(`${"═".repeat(60)}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
