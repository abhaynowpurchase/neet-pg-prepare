import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import HighYieldTopic from "@/models/HighYieldTopic";

type LeanDoc = Record<string, unknown> & { _id: unknown; chapterId: unknown };

export async function GET(
  _req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const topics = await HighYieldTopic.find({ chapterId: params.chapterId })
      .sort({ order: 1 })
      .lean() as unknown as LeanDoc[];

    return NextResponse.json({
      topics: topics.map((t) => ({
        ...t,
        _id: String(t._id),
        chapterId: String(t.chapterId),
      })),
    });
  } catch (error) {
    console.error("GET high-yield error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
