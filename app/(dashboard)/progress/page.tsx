import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserProgress from "@/models/UserProgress";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";
import { Trophy, CheckCircle2, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScoreColor } from "@/lib/utils";

export const metadata: Metadata = { title: "My Progress" };

type LeanProgress = {
  _id: { toString(): string };
  chapterId: { toString(): string };
  storyCompleted?: boolean;
  quizScore?: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
};

type LeanChapter = {
  _id: { toString(): string };
  title: string;
  subjectId: { toString(): string };
};

type LeanSubject = {
  _id: { toString(): string };
  name: string;
};

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  await connectToDatabase();

  const progressRecords = await UserProgress.find({ userId })
    .sort({ lastAccessedAt: -1 })
    .lean() as unknown as LeanProgress[];

  const chapters = await Chapter.find()
    .select("_id title subjectId")
    .lean() as unknown as LeanChapter[];

  const subjects = await Subject.find().lean() as unknown as LeanSubject[];

  const chapterMap = Object.fromEntries(
    chapters.map((c) => [c._id.toString(), c])
  );
  const subjectMap = Object.fromEntries(
    subjects.map((s) => [s._id.toString(), s.name])
  );

  const completedChapters = progressRecords.filter((p) => p.storyCompleted);
  const quizzedChapters = progressRecords.filter((p) => p.quizScore !== undefined);
  const scores = quizzedChapters.map((p) => p.quizScore as number);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your learning journey
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{completedChapters.length}</p>
            <p className="text-xs text-muted-foreground">Stories read</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{quizzedChapters.length}</p>
            <p className="text-xs text-muted-foreground">Quizzes taken</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore > 0 ? `${avgScore}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg quiz score</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress list */}
      {progressRecords.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No progress yet.</p>
          <p className="text-xs mt-1">
            Start reading chapters to see your progress here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Chapter History
          </h2>
          {progressRecords.map((p) => {
            const chapter = chapterMap[p.chapterId.toString()];
            const subjectName = chapter
              ? subjectMap[chapter.subjectId.toString()]
              : null;

            return (
              <Card key={p._id.toString()}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {chapter?.title ?? "Unknown chapter"}
                      </p>
                      {subjectName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {subjectName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.storyCompleted && (
                        <Badge
                          variant="outline"
                          className="text-xs text-primary border-primary/30"
                        >
                          <CheckCircle2 size={10} className="mr-1" /> Story
                        </Badge>
                      )}
                      {p.quizScore !== undefined && (
                        <Badge
                          className={`text-xs border ${getScoreColor(p.quizScore)}`}
                          variant="outline"
                        >
                          {p.quizScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
