import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import UserProgress from "@/models/UserProgress";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userName = session.user.name ?? "";

    await connectToDatabase();

    const [subjects, chapters, progressRecords] = await Promise.all([
      Subject.find().sort({ order: 1 }).lean(),
      Chapter.find().select("_id subjectId").lean(),
      UserProgress.find({ userId }).lean(),
    ]);

    const chaptersBySubject: Record<string, number> = {};
    for (const ch of chapters) {
      const sid = String((ch as any).subjectId);
      chaptersBySubject[sid] = (chaptersBySubject[sid] ?? 0) + 1;
    }

    const completedChapterIds = new Set(
      (progressRecords as any[])
        .filter((p) => p.storyCompleted)
        .map((p) => String(p.chapterId))
    );

    const completedBySubject: Record<string, number> = {};
    for (const ch of chapters) {
      if (completedChapterIds.has(String((ch as any)._id))) {
        const sid = String((ch as any).subjectId);
        completedBySubject[sid] = (completedBySubject[sid] ?? 0) + 1;
      }
    }

    const scores = (progressRecords as any[])
      .filter((p) => p.quizScore !== undefined)
      .map((p) => p.quizScore as number);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const subjectsWithProgress = (subjects as any[]).map((s) => {
      const sid = String(s._id);
      return {
        _id: sid,
        name: s.name,
        description: s.description,
        icon: s.icon,
        color: s.color,
        createdAt: s.createdAt?.toISOString() ?? "",
        chaptersCount: chaptersBySubject[sid] ?? 0,
        completedCount: completedBySubject[sid] ?? 0,
      };
    });

    return NextResponse.json({
      userName,
      subjects: subjectsWithProgress,
      stats: {
        totalChapters: chapters.length,
        completedChapters: completedChapterIds.size,
        avgScore,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
