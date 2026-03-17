import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Question from "@/models/Question";
import UserProgress from "@/models/UserProgress";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  HelpCircle,
  Star,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatReadTime, examTypeBadgeColor, cn } from "@/lib/utils";

interface Props {
  params: { chapterId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectToDatabase();
  const chapter = await Chapter.findById(params.chapterId).lean() as { title?: string } | null;
  return { title: chapter?.title ?? "Chapter" };
}

export default async function ChapterPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  await connectToDatabase();

  const chapter = await Chapter.findById(params.chapterId).select("-storyContent").lean() as {
    _id: { toString(): string };
    title: string;
    description: string;
    subjectId: { toString(): string };
    estimatedReadTime: number;
  } | null;

  if (!chapter) notFound();

  const progress = await UserProgress.findOne({ userId, chapterId: params.chapterId }).lean() as {
    storyCompleted?: boolean;
    quizScore?: number;
  } | null;

  const totalQuestions = await Question.countDocuments({ chapterId: chapter._id });

  const examTypeCounts = await Question.aggregate([
    { $match: { chapterId: chapter._id } },
    { $group: { _id: "$examType", count: { $sum: 1 } } },
  ]) as { _id: string; count: number }[];

  const examTypeMap: Record<string, number> = {};
  for (const row of examTypeCounts) {
    examTypeMap[row._id] = row.count;
  }

  const isStoryCompleted = progress?.storyCompleted ?? false;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1.5">
        <Link href={`/subjects/${chapter.subjectId.toString()}`}>
          <ArrowLeft size={16} /> Back to subject
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{chapter.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {chapter.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {formatReadTime(chapter.estimatedReadTime)}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle size={13} />
            {totalQuestions} questions
          </span>
          {isStoryCompleted && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <CheckCircle2 size={13} />
              Story completed
            </span>
          )}
          {progress?.quizScore !== undefined && (
            <span className="text-primary font-medium">
              Quiz: {progress.quizScore}%
            </span>
          )}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Story card */}
        <Card className="group hover:border-primary/40 hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              {isStoryCompleted && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <CardTitle className="text-base mt-2">Story</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              Learn through an immersive medical scenario that explains all key
              concepts naturally.
            </p>
            <Button asChild className="w-full gap-2" variant={isStoryCompleted ? "outline" : "default"}>
              <Link href={`/chapters/${params.chapterId}/story`}>
                <PlayCircle size={16} />
                {isStoryCompleted ? "Re-read story" : "Read story"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quiz card */}
        <Card className="group hover:border-primary/40 hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              {progress?.quizScore !== undefined && (
                <span className="text-sm font-semibold text-primary">
                  {progress.quizScore}%
                </span>
              )}
            </div>
            <CardTitle className="text-base mt-2">Practice Quiz</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              {totalQuestions} questions from NEET PG, INI-CET and UPSC CMO
              with detailed explanations.
            </p>
            <Button
              asChild
              className="w-full gap-2"
              variant="outline"
              disabled={totalQuestions === 0}
            >
              <Link href={`/chapters/${params.chapterId}/quiz`}>
                <PlayCircle size={16} />
                {progress?.quizScore !== undefined ? "Retry quiz" : "Start quiz"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Question breakdown */}
      {totalQuestions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Question Bank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(["NEET_PG", "INI_CET", "UPSC_CMO"] as const).map((key) => {
                const labels: Record<string, string> = {
                  NEET_PG: "NEET PG",
                  INI_CET: "INI-CET",
                  UPSC_CMO: "UPSC CMO",
                };
                return examTypeMap[key] ? (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm",
                      examTypeBadgeColor(key)
                    )}
                  >
                    <span className="font-semibold">{examTypeMap[key]}</span>
                    <span>{labels[key]}</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
