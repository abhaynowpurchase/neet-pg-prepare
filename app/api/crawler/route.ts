import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CrawlerLog from "@/models/CrawlerLog";
import Question from "@/models/Question";
import fs from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "scripts", ".crawler-state.json");

function readState(): { paused: boolean } {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { paused: false };
  }
}

function writeState(state: { paused: boolean }) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const [latest, totalQuestions, byExamType, byYear] = await Promise.all([
    CrawlerLog.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Question.countDocuments({}),
    Question.aggregate([
      { $group: { _id: "$examType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Question.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return NextResponse.json({
    state: readState(),
    logs: (latest as any[]).map((l) => ({
      _id: String(l._id),
      status: l.status,
      passNumber: l.passNumber,
      totalAdded: l.totalAdded,
      totalDuplicates: l.totalDuplicates,
      totalErrors: l.totalErrors,
      lastChapter: l.lastChapter ?? null,
      lastExamType: l.lastExamType ?? null,
      lastYear: l.lastYear ?? null,
      messages: (l.messages ?? []).slice(-30),
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
    stats: {
      totalQuestions,
      byExamType: Object.fromEntries(
        (byExamType as any[]).map((r) => [r._id, r.count])
      ),
      byYear: (byYear as any[]).map((r) => ({ year: r._id, count: r.count })),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as "pause" | "resume";

  if (action === "pause") {
    writeState({ paused: true });
    return NextResponse.json({ ok: true, paused: true });
  }
  if (action === "resume") {
    writeState({ paused: false });
    return NextResponse.json({ ok: true, paused: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
