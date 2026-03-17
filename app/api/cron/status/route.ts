import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import SchedulerLog from "@/models/SchedulerLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const logs = await SchedulerLog.find({})
    .sort({ runAt: -1 })
    .limit(10)
    .lean();

  return NextResponse.json({ logs });
}
