import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Question from "@/models/Question";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";

const EXAM_TYPES = ["NEET_PG", "INI_CET", "UPSC_CMO"] as const;
const PER_EXAM = 25;
const CURRENT_YEAR = new Date().getFullYear();
// Cache for 1 hour, serve stale for 24 h while revalidating in background
const CACHE_HEADER = "public, s-maxage=3600, stale-while-revalidate=86400";

type ChapterStats = {
  chapterId: string;
  count: number;
  years: number[];
  lastYear: number;
  hardCount: number;
  mediumCount: number;
};

type RawQuestion = {
  _id: unknown;
  chapterId: unknown;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: string;
  year: number;
  difficulty: string;
};

function chapterScore(s: ChapterStats): number {
  let score = 0;
  score += s.years.length * 4;                              // year spread
  score += Math.min(s.count, 10) * 0.5;                    // volume
  if (s.lastYear >= CURRENT_YEAR - 1) score += 3;          // recency
  else if (s.lastYear >= CURRENT_YEAR - 3) score += 1;
  const gap = CURRENT_YEAR - s.lastYear;
  if (gap >= 3 && gap <= 5) score += 3;                    // overdue window
  else if (gap === 2) score += 1;
  score += Math.min(s.hardCount, 5) * 0.5;                 // hard presence
  return score;
}

function questionScore(q: { difficulty: string; year: number }, cs: ChapterStats): number {
  let score = chapterScore(cs);
  score += q.difficulty === "hard" ? 3 : q.difficulty === "medium" ? 2 : 1;
  if (q.year >= CURRENT_YEAR - 2) score += 2;
  else if (q.year >= CURRENT_YEAR - 5) score += 1;
  return score;
}

function reasonTag(cs: ChapterStats): string {
  const spread = cs.years.length;
  const gap = CURRENT_YEAR - cs.lastYear;
  if (spread >= 4 && gap >= 3) return `Asked in ${spread} exam years · overdue since ${cs.lastYear}`;
  if (spread >= 4)             return `Consistently tested across ${spread} exam years`;
  if (gap >= 3 && gap <= 5)   return `Overdue — last asked in ${cs.lastYear}, repeat window now`;
  if (cs.hardCount >= 3)       return `High-yield chapter · ${cs.hardCount} hard questions`;
  if (cs.count >= 8)           return `Examiner favourite · ${cs.count} past questions`;
  if (spread >= 2)             return `Tested in ${spread} different exam years`;
  return "Recent exam question";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const examTypeFilter = searchParams.get("examType") ?? "All";

    const typesToFetch =
      examTypeFilter !== "All"
        ? [examTypeFilter as (typeof EXAM_TYPES)[number]]
        : [...EXAM_TYPES];

    // ── Single $facet aggregate: stats + question docs in ONE round-trip ──
    // The stats branches use the covered index { examType, chapterId, difficulty, year }
    // The question branches only project fields we actually need (no explanation in stats)
    const facetStages: Record<string, object[]> = {};
    for (const et of typesToFetch) {
      facetStages[`${et}_stats`] = [
        { $match: { examType: et } },
        {
          $group: {
            _id: "$chapterId",
            count: { $sum: 1 },
            years: { $addToSet: "$year" },
            lastYear: { $max: "$year" },
            hardCount: { $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] } },
            mediumCount: { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
          },
        },
      ];
      facetStages[`${et}_questions`] = [
        { $match: { examType: et } },
        {
          $project: {
            chapterId: 1, question: 1, options: 1, correctAnswer: 1,
            explanation: 1, examType: 1, year: 1, difficulty: 1,
          },
        },
      ];
    }

    // Run everything + chapter/subject lookups in parallel
    const [facetResult, chapters, subjects] = await Promise.all([
      (Question as any).aggregate([{ $facet: facetStages }]),
      Chapter.find({}).select("_id title subjectId").lean(),
      Subject.find({}).select("_id name").lean(),
    ]);

    const facet = facetResult[0] as Record<string, any[]>;

    // ── Score & select top PER_EXAM per exam type ─────────────────────────
    const selected: Array<{
      _id: string; chapterId: string; question: string; options: string[];
      correctAnswer: number; explanation: string; examType: string;
      year: number; difficulty: string; reason: string;
    }> = [];

    for (const et of typesToFetch) {
      const statsRows: ChapterStats[] = (facet[`${et}_stats`] ?? []).map((r: any) => ({
        chapterId: String(r._id),
        count: r.count,
        years: r.years,
        lastYear: r.lastYear,
        hardCount: r.hardCount,
        mediumCount: r.mediumCount,
      }));

      const statsMap: Record<string, ChapterStats> = Object.fromEntries(
        statsRows.map((s) => [s.chapterId, s])
      );

      const questions: RawQuestion[] = facet[`${et}_questions`] ?? [];

      const scored = questions
        .map((q) => {
          const cs = statsMap[String(q.chapterId)];
          if (!cs) return null;
          return { q, score: questionScore(q, cs), reason: reasonTag(cs) };
        })
        .filter(Boolean) as { q: RawQuestion; score: number; reason: string }[];

      scored.sort((a, b) => b.score - a.score);

      for (const { q, reason } of scored.slice(0, PER_EXAM)) {
        selected.push({
          _id: String(q._id),
          chapterId: String(q.chapterId),
          question: String(q.question ?? ""),
          options: Array.isArray(q.options) ? q.options.map(String) : [],
          correctAnswer: Number(q.correctAnswer ?? 0),
          explanation: String(q.explanation ?? ""),
          examType: et,
          year: Number(q.year ?? 0),
          difficulty: String(q.difficulty ?? "medium"),
          reason,
        });
      }
    }

    return NextResponse.json(
      {
        questions: selected,
        chapters: (chapters as any[]).map((c) => ({
          _id: String(c._id),
          title: String(c.title ?? ""),
          subjectId: String(c.subjectId),
        })),
        subjects: (subjects as any[]).map((s) => ({
          _id: String(s._id),
          name: String(s.name ?? ""),
        })),
      },
      { headers: { "Cache-Control": CACHE_HEADER } }
    );
  } catch (error) {
    console.error("GET /api/expected-questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
