import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [questions, chapters, subjects] = await Promise.all([
      Question.find({}).sort({ year: -1, examType: 1 }).lean(),
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
    });
  } catch (error) {
    console.error("GET /api/pyq error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
