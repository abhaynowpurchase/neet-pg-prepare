import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10)));
    const examType = searchParams.get("examType") ?? "";
    const difficulty = searchParams.get("difficulty") ?? "";
    const year = searchParams.get("year") ?? "";
    const subjectId = searchParams.get("subjectId") ?? "";

    // Build MongoDB filter
    const query: Record<string, unknown> = {};
    if (examType && examType !== "All") query.examType = examType;
    if (difficulty && difficulty !== "All") query.difficulty = difficulty;
    if (year && year !== "All") query.year = parseInt(year, 10);
    if (subjectId && subjectId !== "All") {
      const chapterIds = await Chapter.find({ subjectId }).select("_id").lean();
      query.chapterId = { $in: (chapterIds as any[]).map((c) => c._id) };
    }

    const [total, questions, chapters, subjects] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
        .sort({ year: -1, examType: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Chapter.find({}).select("_id title subjectId").lean(),
      Subject.find({}).select("_id name").lean(),
    ]);

    return NextResponse.json({
      questions: (questions as any[]).map((q) => ({
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
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/pyq error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
