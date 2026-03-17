"use client";

import { useState, useEffect } from "react";
import { QuizMode } from "@/components/quiz/QuizMode";
import { IQuestion } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function QuizClient({ chapterId }: { chapterId: string }) {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/chapters/${chapterId}/questions?limit=30`).then((r) => r.json()),
      fetch(`/api/chapters/${chapterId}`).then((r) => r.json()),
    ]).then(([questionsRes, chapterRes]) => {
      setQuestions(questionsRes.questions ?? []);
      setChapterTitle(chapterRes.chapter?.title ?? "");
    }).finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-36 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <p className="text-lg font-medium mb-2">No questions yet</p>
        <p className="text-muted-foreground text-sm mb-6">
          Questions for this chapter haven&apos;t been added yet.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/chapters/${chapterId}`}>
            <ArrowLeft size={16} className="mr-2" /> Back to chapter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-6 md:px-8 pt-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 gap-1.5">
          <Link href={`/chapters/${chapterId}`}>
            <ArrowLeft size={16} /> Back to chapter
          </Link>
        </Button>
      </div>
      <QuizMode
        questions={questions}
        chapterId={chapterId}
        chapterTitle={chapterTitle}
      />
    </div>
  );
}
