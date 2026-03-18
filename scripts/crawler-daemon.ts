/**
 * 24/7 PYQ Crawler Daemon
 *
 * Crawls medical exam PYQ sources, generates year-specific questions using Groq AI,
 * deduplicates (exact + fuzzy), and continuously fills the question bank.
 *
 * Usage:
 *   npx tsx scripts/crawler-daemon.ts              # run forever
 *   npx tsx scripts/crawler-daemon.ts --once       # single pass then exit
 *   npx tsx scripts/crawler-daemon.ts --years 5    # only last N years
 *   npx tsx scripts/crawler-daemon.ts --exam NEET_PG  # one exam type
 *   npx tsx scripts/crawler-daemon.ts --chapter "Epidemiology"  # one chapter
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import mongoose from "mongoose";
import { searchWeb } from "../lib/webSearch";
import { robustFetch, buildYearQueries } from "../lib/puppeteerScraper";
import { generatePYQBatch, ExamType } from "../lib/contentProcessor";
import { isFuzzyDuplicate, normalizeQ } from "../lib/dedup";

const MONGODB_URI = process.env.MONGODB_URI!;

// ── Inline minimal schemas ───────────────────────────────────────────────────
const SubjectSchema = new mongoose.Schema({ name: String });
const ChapterSchema = new mongoose.Schema({
  subjectId: mongoose.Schema.Types.ObjectId,
  title: String,
});
const QuestionSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, index: true },
  question: String,
  options: [String],
  correctAnswer: Number,
  explanation: String,
  examType: { type: String, index: true },
  year: { type: Number, index: true },
  difficulty: String,
});
QuestionSchema.index({ chapterId: 1, examType: 1, year: 1 });

const CrawlerLogSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["running", "idle", "paused"], default: "running" },
    passNumber: { type: Number, default: 1 },
    totalAdded: { type: Number, default: 0 },
    totalDuplicates: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 },
    lastChapter: String,
    lastExamType: String,
    lastYear: Number,
    messages: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Subject = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", ChapterSchema);
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);
const CrawlerLog =
  mongoose.models.CrawlerLog || mongoose.model("CrawlerLog", CrawlerLogSchema);

// ── Config ───────────────────────────────────────────────────────────────────
const EXAM_YEAR_RANGES: Record<ExamType, [number, number]> = {
  NEET_PG: [1995, 2024],   // Includes pre-NEET era (AIPGE)
  INI_CET: [2021, 2024],   // INI-CET only started 2021
  UPSC_CMO: [1994, 2024],  // UPSC CMS has 30+ years
};

const QUESTIONS_PER_YEAR = 3;        // questions per chapter per exam-year combo
const MAX_QUESTIONS_PER_CHAPTER = 30; // don't over-fill one chapter
const DELAY_BETWEEN_CHAPTERS = 4000;  // ms between chapters
const DELAY_BETWEEN_YEARS = 1500;     // ms between years
const DELAY_BETWEEN_EXAMS = 2000;     // ms between exam types
const ROUND_SLEEP_HOURS = 3;          // sleep N hours between full passes
const FUZZY_THRESHOLD = 0.88;

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const ONCE = args.includes("--once");
const YEARS_BACK = (() => {
  const i = args.indexOf("--years");
  return i !== -1 ? parseInt(args[i + 1], 10) : null;
})();
const EXAM_FILTER = (() => {
  const i = args.indexOf("--exam");
  return i !== -1 ? (args[i + 1] as ExamType) : null;
})();
const CHAPTER_FILTER = (() => {
  const i = args.indexOf("--chapter");
  return i !== -1 ? args[i + 1] : null;
})();

// ── State file for graceful pause/resume ────────────────────────────────────
const STATE_FILE = path.join(__dirname, ".crawler-state.json");

function readState(): { paused: boolean } {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { paused: false };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string, logDoc?: mongoose.Document & { messages: string[]; updatedAt: Date }) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  if (logDoc) {
    (logDoc as any).messages = [...((logDoc as any).messages ?? []).slice(-199), line];
    (logDoc as any).updatedAt = new Date();
  }
}

// ── Get context for a chapter+year combo ─────────────────────────────────────
async function getYearContext(
  chapter: string,
  subject: string,
  examType: ExamType,
  year: number
): Promise<string> {
  const queries = buildYearQueries(chapter, subject, examType, year);
  const parts: string[] = [];

  for (const query of queries.slice(0, 2)) {
    try {
      const results = await searchWeb(query, 3);
      const snippets = results.map((r) => `${r.title}: ${r.snippet}`).join("\n");
      parts.push(snippets);

      // Deep-fetch first real URL
      for (const r of results) {
        if (r.url?.startsWith("http")) {
          const text = await robustFetch(r.url, 10000);
          if (text.length > 300) {
            parts.push(`--- ${r.url.slice(0, 50)} ---\n${text}`);
            break;
          }
        }
      }

      await sleep(600);
    } catch {
      /* ignore search errors */
    }
  }

  return parts.join("\n\n").slice(0, 8000);
}

// ── Dedup check against DB + in-memory buffer ─────────────────────────────────
async function isAlreadySaved(
  chapterId: mongoose.Types.ObjectId,
  examType: ExamType,
  year: number,
  questionText: string,
  inMemoryBuffer: string[]
): Promise<boolean> {
  // 1. Exact match in DB
  const exact = await Question.findOne({
    chapterId,
    question: { $regex: new RegExp("^" + questionText.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
  }).lean();
  if (exact) return true;

  // 2. Fuzzy match against in-memory buffer (questions added this session)
  if (isFuzzyDuplicate(questionText, inMemoryBuffer, FUZZY_THRESHOLD)) return true;

  // 3. Load recent questions for this chapter/exam from DB and fuzzy check
  const recent = await Question.find({ chapterId, examType })
    .select("question")
    .limit(200)
    .lean();
  const dbTexts = (recent as any[]).map((q) => normalizeQ(q.question ?? ""));
  if (isFuzzyDuplicate(questionText, dbTexts, FUZZY_THRESHOLD)) return true;

  return false;
}

// ── Process one chapter × examType × year ────────────────────────────────────
async function processCombo(
  chapterId: mongoose.Types.ObjectId,
  chapter: string,
  subject: string,
  examType: ExamType,
  year: number,
  inMemoryBuffer: string[],
  logDoc: any
): Promise<{ added: number; dupes: number; errors: number }> {
  let added = 0;
  let dupes = 0;
  let errors = 0;

  try {
    // Skip if this chapter already has many questions for this year
    const existing = await Question.countDocuments({ chapterId, examType, year });
    if (existing >= QUESTIONS_PER_YEAR) return { added: 0, dupes: 0, errors: 0 };

    const context = await getYearContext(chapter, subject, examType, year);

    const questions = await generatePYQBatch(
      chapter,
      subject,
      examType,
      context,
      QUESTIONS_PER_YEAR,
    );

    for (const q of questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        errors++;
        continue;
      }

      const isDup = await isAlreadySaved(
        chapterId,
        examType,
        year,
        q.question,
        inMemoryBuffer
      );
      if (isDup) {
        dupes++;
        continue;
      }

      await Question.create({
        chapterId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? "",
        examType,
        year,
        difficulty: q.difficulty ?? "medium",
      });

      inMemoryBuffer.push(normalizeQ(q.question));
      added++;
    }
  } catch (err) {
    log(`    ✗ Error: ${String(err)}`, logDoc);
    errors++;
  }

  return { added, dupes, errors };
}

// ── One full crawl pass ───────────────────────────────────────────────────────
async function runPass(passNumber: number): Promise<void> {
  const logDoc = await CrawlerLog.create({
    passNumber,
    status: "running",
    messages: [],
    totalAdded: 0,
    totalDuplicates: 0,
    totalErrors: 0,
  });

  log(`\n${"═".repeat(60)}`, logDoc);
  log(`PASS ${passNumber} START`, logDoc);
  log(`${"═".repeat(60)}`, logDoc);

  const subjects = await Subject.find({}).lean();
  const subjectMap = Object.fromEntries(subjects.map((s) => [String(s._id), (s as any).name as string]));

  let allChapters = await Chapter.find({}).sort({ title: 1 }).lean();

  if (CHAPTER_FILTER) {
    allChapters = allChapters.filter((c) =>
      ((c as any).title as string).toLowerCase().includes(CHAPTER_FILTER!.toLowerCase())
    );
  }

  const examTypes: ExamType[] = EXAM_FILTER
    ? [EXAM_FILTER]
    : ["NEET_PG", "INI_CET", "UPSC_CMO"];

  let totalAdded = 0;
  let totalDupes = 0;
  let totalErrors = 0;

  for (let ci = 0; ci < allChapters.length; ci++) {
    // Check pause state
    const state = readState();
    if (state.paused) {
      log("⏸  Crawler paused. Waiting...", logDoc);
      (logDoc as any).status = "paused";
      await logDoc.save();
      while (readState().paused) await sleep(5000);
      (logDoc as any).status = "running";
      log("▶  Crawler resumed.", logDoc);
    }

    const chapter = allChapters[ci];
    const chapterId = chapter._id as mongoose.Types.ObjectId;
    const title = (chapter as any).title as string;
    const subject = subjectMap[String((chapter as any).subjectId)] ?? "Medicine";

    log(`\n[${ci + 1}/${allChapters.length}] ${subject} › ${title}`, logDoc);
    (logDoc as any).lastChapter = title;

    // Check total questions cap for this chapter
    const totalExisting = await Question.countDocuments({ chapterId });
    if (totalExisting >= MAX_QUESTIONS_PER_CHAPTER * examTypes.length) {
      log(`  ✓ Cap reached (${totalExisting} questions) — skipping`, logDoc);
      continue;
    }

    const inMemoryBuffer: string[] = [];

    for (const examType of examTypes) {
      const [startYear, endYear] = EXAM_YEAR_RANGES[examType];
      const effectiveStart = YEARS_BACK
        ? Math.max(startYear, new Date().getFullYear() - YEARS_BACK)
        : startYear;

      // Shuffle years for variety across passes
      const years: number[] = [];
      for (let y = effectiveStart; y <= endYear; y++) years.push(y);
      years.sort(() => Math.random() - 0.5);

      (logDoc as any).lastExamType = examType;

      for (const year of years) {
        (logDoc as any).lastYear = year;
        const result = await processCombo(
          chapterId, title, subject, examType, year, inMemoryBuffer, logDoc
        );

        totalAdded += result.added;
        totalDupes += result.dupes;
        totalErrors += result.errors;
        (logDoc as any).totalAdded = totalAdded;
        (logDoc as any).totalDuplicates = totalDupes;
        (logDoc as any).totalErrors = totalErrors;

        if (result.added > 0) {
          log(`    ${examType} ${year}: +${result.added} | dupes: ${result.dupes}`, logDoc);
          await logDoc.save();
        }

        await sleep(DELAY_BETWEEN_YEARS);
      }

      await sleep(DELAY_BETWEEN_EXAMS);
    }

    log(`  Chapter done. Session total: +${totalAdded} questions`, logDoc);
    await sleep(DELAY_BETWEEN_CHAPTERS);
  }

  (logDoc as any).status = "idle";
  await logDoc.save();

  log(`\n${"═".repeat(60)}`, logDoc);
  log(`PASS ${passNumber} COMPLETE`, logDoc);
  log(`  Questions added  : ${totalAdded}`, logDoc);
  log(`  Duplicates found : ${totalDupes}`, logDoc);
  log(`  Errors           : ${totalErrors}`, logDoc);
  log(`${"═".repeat(60)}\n`, logDoc);
}

// ── Main daemon loop ──────────────────────────────────────────────────────────
async function main() {
  log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
  log("Connected.\n");

  let pass = 1;

  do {
    await runPass(pass++);

    if (!ONCE) {
      log(`Sleeping ${ROUND_SLEEP_HOURS}h before next pass...`);
      await sleep(ROUND_SLEEP_HOURS * 60 * 60 * 1000);
    }
  } while (!ONCE);

  await mongoose.disconnect();
  log("Crawler exited cleanly.");
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
