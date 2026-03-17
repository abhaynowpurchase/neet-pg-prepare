import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const subjects = await Subject.find().sort({ order: 1 }).lean();

    const chapterCounts = await Chapter.aggregate([
      { $group: { _id: "$subjectId", count: { $sum: 1 } } },
    ]) as { _id: unknown; count: number }[];

    const countMap = Object.fromEntries(
      chapterCounts.map((c) => [String(c._id), c.count])
    );

    const result = (subjects as unknown as { _id: unknown; [key: string]: unknown }[]).map((s) => {
      const id = String(s._id);
      return { ...s, _id: id, chaptersCount: countMap[id] ?? 0 };
    });

    return NextResponse.json({ subjects: result });
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
