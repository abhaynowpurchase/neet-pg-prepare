import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import UserProgress from "@/models/UserProgress";
import { ChapterCard } from "@/components/dashboard/ChapterCard";
import { IChapter, IUserProgress } from "@/types";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatReadTime } from "@/lib/utils";

interface Props {
  params: { subjectId: string };
}

type LeanSubject = {
  _id: { toString(): string };
  name: string;
  description: string;
};

type LeanChapter = {
  _id: { toString(): string };
  subjectId: { toString(): string };
  title: string;
  description: string;
  storyContent: string;
  highYieldNotes: string;
  order: number;
  estimatedReadTime: number;
  createdAt: Date;
};

type LeanProgress = {
  _id: unknown;
  chapterId: { toString(): string };
  storyCompleted?: boolean;
  quizScore?: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
  lastAccessedAt?: Date;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectToDatabase();
  const subject = await Subject.findById(params.subjectId).lean() as LeanSubject | null;
  return { title: subject?.name ?? "Subject" };
}

export default async function SubjectPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  await connectToDatabase();

  const subject = await Subject.findById(params.subjectId).lean() as LeanSubject | null;
  if (!subject) notFound();

  const chapters = await Chapter.find({ subjectId: params.subjectId })
    .sort({ order: 1 })
    .lean() as unknown as LeanChapter[];

  const progressRecords = await UserProgress.find({ userId }).lean() as unknown as LeanProgress[];

  const progressMap = Object.fromEntries(
    progressRecords.map((p) => [p.chapterId.toString(), p])
  );

  const totalReadTime = chapters.reduce(
    (acc, ch) => acc + ch.estimatedReadTime,
    0
  );

  const completedCount = chapters.filter((ch) =>
    progressMap[ch._id.toString()]?.storyCompleted
  ).length;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1.5">
        <Link href="/dashboard">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">{subject.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <span>{chapters.length} chapters</span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {formatReadTime(totalReadTime)} total
          </span>
          <span className="text-primary font-medium">
            {completedCount}/{chapters.length} completed
          </span>
        </div>

        {chapters.length > 0 && (
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.round((completedCount / chapters.length) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {chapters.map((chapter, i) => {
          const cid = chapter._id.toString();
          const prog = progressMap[cid];
          return (
            <ChapterCard
              key={cid}
              chapter={{
                _id: cid,
                subjectId: chapter.subjectId.toString(),
                title: chapter.title,
                description: chapter.description,
                storyContent: "",
                highYieldNotes: chapter.highYieldNotes,
                order: chapter.order,
                estimatedReadTime: chapter.estimatedReadTime,
                createdAt: chapter.createdAt.toISOString(),
              } as IChapter}
              subjectId={params.subjectId}
              progress={
                prog
                  ? ({
                      _id: String(prog._id),
                      userId,
                      chapterId: prog.chapterId.toString(),
                      storyCompleted: prog.storyCompleted ?? false,
                      quizScore: prog.quizScore,
                      questionsAttempted: prog.questionsAttempted ?? 0,
                      questionsCorrect: prog.questionsCorrect ?? 0,
                      lastAccessedAt: prog.lastAccessedAt?.toISOString() ?? "",
                    } as IUserProgress)
                  : undefined
              }
              order={i + 1}
            />
          );
        })}
      </div>
    </div>
  );
}
