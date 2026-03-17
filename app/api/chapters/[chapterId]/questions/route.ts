import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";

type LeanDoc = Record<string, unknown> & { _id: unknown; chapterId: unknown };

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    await connectToDatabase();

    const filter: Record<string, unknown> = { chapterId: params.chapterId };
    if (examType) filter.examType = examType;

    const questions = await Question.find(filter)
      .sort({ year: -1 })
      .limit(limit)
      .lean() as unknown as LeanDoc[];

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        _id: String(q._id),
        chapterId: String(q.chapterId),
      })),
    });
  } catch (error) {
    console.error("GET questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
