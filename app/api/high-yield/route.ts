import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import HighYieldTopic from "@/models/HighYieldTopic";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [subjects, chapters, topics] = await Promise.all([
      Subject.find().sort({ order: 1 }).lean(),
      Chapter.find().select("_id title subjectId").lean(),
      HighYieldTopic.find().sort({ order: 1 }).lean(),
    ]);

    const subjectMap = Object.fromEntries(
      (subjects as any[]).map((s) => [String(s._id), s.name as string])
    );
    const chapterMap = Object.fromEntries(
      (chapters as any[]).map((c) => [
        String(c._id),
        { title: c.title as string, subjectId: String(c.subjectId) },
      ])
    );

    const topicsByChapter: Record<
      string,
      { chapterId: string; chapterTitle: string; subjectName: string; topics: unknown[] }
    > = {};

    for (const topic of topics as any[]) {
      const cid = String(topic.chapterId);
      if (!topicsByChapter[cid]) {
        const chapter = chapterMap[cid];
        topicsByChapter[cid] = {
          chapterId: cid,
          chapterTitle: chapter?.title ?? "Unknown Chapter",
          subjectName: chapter ? (subjectMap[chapter.subjectId] ?? "") : "",
          topics: [],
        };
      }
      topicsByChapter[cid].topics.push({
        _id: String(topic._id),
        chapterId: cid,
        title: topic.title,
        description: topic.description,
        keyPoints: topic.keyPoints,
        order: topic.order,
      });
    }

    return NextResponse.json({ groups: Object.values(topicsByChapter) });
  } catch (error) {
    console.error("GET /api/high-yield error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
