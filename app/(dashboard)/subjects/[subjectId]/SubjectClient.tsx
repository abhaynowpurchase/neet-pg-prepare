"use client";

import { useState, useEffect } from "react";
import { ChapterCard } from "@/components/dashboard/ChapterCard";
import { IChapter, IUserProgress } from "@/types";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatReadTime } from "@/lib/utils";

type SubjectData = {
  _id: string;
  name: string;
  description: string;
};

type ChapterData = {
  _id: string;
  subjectId: string;
  title: string;
  description: string;
  highYieldNotes: string;
  order: number;
  estimatedReadTime: number;
  createdAt: string;
};

type ProgressData = {
  _id: string;
  userId: string;
  chapterId: string;
  storyCompleted: boolean;
  quizScore?: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastAccessedAt: string;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function SubjectClient({ subjectId }: { subjectId: string }) {
  const [subject, setSubject] = useState<SubjectData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/subjects/${subjectId}`).then((r) => r.json()),
      fetch("/api/progress").then((r) => r.json()),
    ]).then(([subjectRes, progressRes]) => {
      setSubject(subjectRes.subject ?? null);
      setChapters(subjectRes.chapters ?? []);
      const map: Record<string, ProgressData> = {};
      for (const p of progressRes.progress ?? []) {
        map[p.chapterId] = p;
      }
      setProgressMap(map);
    }).finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-36 mb-6" />
        <Skeleton className="h-24 mb-8" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (!subject) return <div className="p-8 text-center text-muted-foreground">Subject not found.</div>;

  const totalReadTime = chapters.reduce((acc, ch) => acc + ch.estimatedReadTime, 0);
  const completedCount = chapters.filter((ch) => progressMap[ch._id]?.storyCompleted).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 gap-1.5">
        <Link href="/dashboard">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">{subject.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-4">
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
              style={{ width: `${Math.round((completedCount / chapters.length) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {chapters.map((chapter, i) => {
          const prog = progressMap[chapter._id];
          return (
            <ChapterCard
              key={chapter._id}
              chapter={{
                _id: chapter._id,
                subjectId: chapter.subjectId,
                title: chapter.title,
                description: chapter.description,
                storyContent: "",
                highYieldNotes: chapter.highYieldNotes,
                order: chapter.order,
                estimatedReadTime: chapter.estimatedReadTime,
                createdAt: chapter.createdAt,
              } as IChapter}
              subjectId={subjectId}
              progress={
                prog
                  ? ({
                      _id: prog._id,
                      userId: prog.userId,
                      chapterId: prog.chapterId,
                      storyCompleted: prog.storyCompleted ?? false,
                      quizScore: prog.quizScore,
                      questionsAttempted: prog.questionsAttempted ?? 0,
                      questionsCorrect: prog.questionsCorrect ?? 0,
                      lastAccessedAt: prog.lastAccessedAt ?? "",
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
