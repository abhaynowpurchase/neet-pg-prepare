import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserProgress from "@/models/UserProgress";

type LeanDoc = Record<string, unknown> & { _id: unknown; userId: unknown; chapterId: unknown };

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");

    await connectToDatabase();

    const filter: Record<string, unknown> = { userId };
    if (chapterId) filter.chapterId = chapterId;

    const progress = await UserProgress.find(filter).lean() as unknown as LeanDoc[];

    return NextResponse.json({
      progress: progress.map((p) => ({
        ...p,
        _id: String(p._id),
        userId: String(p.userId),
        chapterId: String(p.chapterId),
      })),
    });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const {
      chapterId,
      storyCompleted,
      quizScore,
      questionsAttempted,
      questionsCorrect,
    } = body;

    if (!chapterId) {
      return NextResponse.json(
        { error: "chapterId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const update: Record<string, unknown> = { lastAccessedAt: new Date() };
    if (storyCompleted !== undefined) update.storyCompleted = storyCompleted;
    if (quizScore !== undefined) update.quizScore = quizScore;
    if (questionsAttempted !== undefined)
      update.questionsAttempted = questionsAttempted;
    if (questionsCorrect !== undefined)
      update.questionsCorrect = questionsCorrect;

    const progress = await UserProgress.findOneAndUpdate(
      { userId, chapterId },
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      progress: {
        ...progress.toObject(),
        _id: progress._id.toString(),
        userId: progress.userId.toString(),
        chapterId: progress.chapterId.toString(),
      },
    });
  } catch (error) {
    console.error("POST /api/progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
