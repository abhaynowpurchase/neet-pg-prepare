import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";

type LeanDoc = Record<string, unknown> & { _id: unknown };

export async function GET(
  _req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const subject = await Subject.findById(params.subjectId).lean() as LeanDoc | null;
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const chapters = await Chapter.find({ subjectId: params.subjectId })
      .sort({ order: 1 })
      .select("-storyContent")
      .lean() as LeanDoc[];

    return NextResponse.json({
      subject: { ...subject, _id: String(subject._id) },
      chapters: chapters.map((c) => ({
        ...c,
        _id: String(c._id),
        subjectId: String(c.subjectId),
      })),
    });
  } catch (error) {
    console.error("GET /api/subjects/[subjectId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
