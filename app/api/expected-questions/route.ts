import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Question from "@/models/Question";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";

const EXAM_TYPES = ["NEET_PG", "INI_CET", "UPSC_CMO"] as const;
const PER_EXAM = 8; // 8 per exam type → 24 total
const CURRENT_YEAR = new Date().getFullYear();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const examTypeFilter = searchParams.get("examType") ?? "All";

    // Score-based selection: hard (3pts) + recent year (2pts for 2023+, 1pt for 2021-22) + medium (1pt)
    // Fetch candidates: hard + medium difficulty from last 5 years, sorted by year desc
    const baseQuery: Record<string, unknown> = {
      difficulty: { $in: ["hard", "medium"] },
      year: { $gte: CURRENT_YEAR - 5 },
    };

    const typesToFetch =
      examTypeFilter !== "All"
        ? [examTypeFilter as (typeof EXAM_TYPES)[number]]
        : [...EXAM_TYPES];

    // Fetch questions per exam type in parallel
    const perTypeResults = await Promise.all(
      typesToFetch.map((et) =>
        Question.find({ ...baseQuery, examType: et })
          .sort({ year: -1, difficulty: 1 }) // hard first within same year bucket
          .limit(PER_EXAM * 3) // over-fetch, then score-select
          .lean()
      )
    );

    // Score and select top PER_EXAM per exam type
    const scoreQ = (q: { difficulty: string; year: number }): number => {
      let s = q.difficulty === "hard" ? 3 : 1;
      if (q.year >= CURRENT_YEAR - 1) s += 2;
      else if (q.year >= CURRENT_YEAR - 3) s += 1;
      return s;
    };

    const selected = perTypeResults.flatMap((qs) =>
      (qs as any[])
        .sort((a, b) => scoreQ(b) - scoreQ(a))
        .slice(0, PER_EXAM)
    );

    if (selected.length === 0) {
      return NextResponse.json({ questions: [], chapters: [], subjects: [] });
    }

    // Fetch chapter + subject metadata
    const seen = new Set<string>();
    selected.forEach((q) => seen.add(String(q.chapterId)));
    const chapterIds = Array.from(seen);
    const [chapters, subjects] = await Promise.all([
      Chapter.find({ _id: { $in: chapterIds } }).select("_id title subjectId").lean(),
      Subject.find({}).select("_id name").lean(),
    ]);

    return NextResponse.json({
      questions: selected.map((q) => ({
        _id: String(q._id),
        chapterId: String(q.chapterId),
        question: String(q.question ?? ""),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctAnswer: Number(q.correctAnswer ?? 0),
        explanation: String(q.explanation ?? ""),
        examType: String(q.examType ?? ""),
        year: Number(q.year ?? 0),
        difficulty: String(q.difficulty ?? "medium"),
      })),
      chapters: (chapters as any[]).map((c) => ({
        _id: String(c._id),
        title: String(c.title ?? ""),
        subjectId: String(c.subjectId),
      })),
      subjects: (subjects as any[]).map((s) => ({
        _id: String(s._id),
        name: String(s.name ?? ""),
      })),
    });
  } catch (error) {
    console.error("GET /api/expected-questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
