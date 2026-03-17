"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Clock, HelpCircle, Star, PlayCircle,
  CheckCircle2, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatReadTime, examTypeBadgeColor, cn } from "@/lib/utils";

type ChapterData = {
  _id: string;
  subjectId: string;
  title: string;
  description: string;
  estimatedReadTime: number;
};

type ProgressData = {
  storyCompleted?: boolean;
  quizScore?: number;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function ChapterClient({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [examTypeMap, setExamTypeMap] = useState<Record<string, number>>({});
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/chapters/${chapterId}`).then((r) => r.json()),
      fetch(`/api/chapters/${chapterId}/questions?limit=100`).then((r) => r.json()),
      fetch(`/api/progress?chapterId=${chapterId}`).then((r) => r.json()),
      fetch(`/api/chapters/${chapterId}/flashcards`).then((r) => r.json()),
    ]).then(([chapterRes, questionsRes, progressRes, flashcardsRes]) => {
      setChapter(chapterRes.chapter ?? null);

      const qs = questionsRes.questions ?? [];
      setTotalQuestions(qs.length);
      const examMap: Record<string, number> = {};
      for (const q of qs) {
        examMap[q.examType] = (examMap[q.examType] ?? 0) + 1;
      }
      setExamTypeMap(examMap);

      setProgress(progressRes.progress?.[0] ?? null);
      setFlashcardCount((flashcardsRes.flashcards ?? []).length);
    }).finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-36 mb-6" />
        <Skeleton className="h-20 mb-8" />
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (!chapter) return <div className="p-8 text-center text-muted-foreground">Chapter not found.</div>;

  const isStoryCompleted = progress?.storyCompleted ?? false;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1.5">
        <Link href={`/subjects/${chapter.subjectId}`}>
          <ArrowLeft size={16} /> Back to subject
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">{chapter.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">{chapter.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {formatReadTime(chapter.estimatedReadTime)}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle size={13} />
            {totalQuestions} questions
          </span>
          {flashcardCount > 0 && (
            <span className="flex items-center gap-1">
              <Layers size={13} />
              {flashcardCount} flashcards
            </span>
          )}
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

      {/* Learning mode label */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Choose your learning mode
      </p>

      {/* Two primary learning modes */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Story Based Learning */}
        <Card className="group hover:border-primary/40 hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              {isStoryCompleted && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </div>
            <CardTitle className="text-base mt-2">Story Based Learning</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              Learn through an immersive clinical scenario that explains all key concepts naturally.
            </p>
            <Button asChild className="w-full gap-2" variant={isStoryCompleted ? "outline" : "default"}>
              <Link href={`/chapters/${chapterId}/story`}>
                <PlayCircle size={16} />
                {isStoryCompleted ? "Re-read story" : "Read story"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Flash Card Based Learning */}
        <Card className="group hover:border-amber-400/50 hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50">
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              {flashcardCount > 0 && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {flashcardCount} cards
                </span>
              )}
            </div>
            <CardTitle className="text-base mt-2">Flash Card Based Learning</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              Rapid-fire revision with high-yield facts. Flip cards to test your recall before exams.
            </p>
            <Button
              asChild
              className="w-full gap-2"
              variant="outline"
              disabled={flashcardCount === 0}
            >
              <Link href={`/chapters/${chapterId}/flashcards`}>
                <PlayCircle size={16} />
                {flashcardCount === 0 ? "Coming soon" : "Start flashcards"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Practice Quiz — secondary section */}
      <Card className="group hover:border-blue-400/50 hover:shadow-md transition-all mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Practice Quiz</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalQuestions} MCQs from NEET PG, INI-CET &amp; UPSC CMO
                </p>
              </div>
            </div>
            {progress?.quizScore !== undefined && (
              <span className="text-sm font-semibold text-primary">{progress.quizScore}%</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          <Button
            asChild
            className="w-full gap-2"
            variant="outline"
            disabled={totalQuestions === 0}
          >
            <Link href={`/chapters/${chapterId}/quiz`}>
              <PlayCircle size={16} />
              {progress?.quizScore !== undefined ? "Retry quiz" : "Start quiz"}
            </Link>
          </Button>
        </CardContent>
      </Card>

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
                  NEET_PG: "NEET PG", INI_CET: "INI-CET", UPSC_CMO: "UPSC CMO",
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
