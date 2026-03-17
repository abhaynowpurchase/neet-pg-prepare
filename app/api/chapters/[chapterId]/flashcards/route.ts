import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Flashcard from "@/models/Flashcard";

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const flashcards = await Flashcard.find({ chapterId: params.chapterId })
    .sort({ order: 1 })
    .lean();

  return NextResponse.json({ flashcards });
}
