"use client";

import { useState, useEffect } from "react";
import { Trophy, CheckCircle2, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScoreColor } from "@/lib/utils";

type ProgressRecord = {
  _id: string;
  chapterId: string;
  storyCompleted?: boolean;
  quizScore?: number;
};

type ChapterData = {
  _id: string;
  title: string;
  subjectId: string;
};

type SubjectData = {
  _id: string;
  name: string;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function ProgressClient() {
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [chapterMap, setChapterMap] = useState<Record<string, ChapterData>>({});
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/progress").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]).then(([progressRes, dashboardRes]) => {
      setProgressRecords(progressRes.progress ?? []);

      // Build chapter map from subjects data
      // We need chapters — fetch subjects to get chapter info
      fetch("/api/subjects").then((r) => r.json()).then((subjectsRes) => {
        // subjects API doesn't return chapters directly, so fetch each subject's chapters
        const subjects: SubjectData[] = dashboardRes.subjects ?? [];
        const sMap: Record<string, string> = {};
        subjects.forEach((s: SubjectData) => { sMap[s._id] = s.name; });
        setSubjectMap(sMap);

        // Fetch all chapters via pyq endpoint (has chapters info)
        fetch("/api/pyq").then((r) => r.json()).then((pyqRes) => {
          const cMap: Record<string, ChapterData> = {};
          (pyqRes.chapters ?? []).forEach((c: ChapterData) => { cMap[c._id] = c; });
          setChapterMap(cMap);
        });
      });
    }).finally(() => setLoading(false));
  }, []);

  const completedChapters = progressRecords.filter((p) => p.storyCompleted);
  const quizzedChapters = progressRecords.filter((p) => p.quizScore !== undefined);
  const scores = quizzedChapters.map((p) => p.quizScore as number);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your learning journey</p>
      </div>

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

      {progressRecords.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No progress yet.</p>
          <p className="text-xs mt-1">Start reading chapters to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Chapter History
          </h2>
          {progressRecords.map((p) => {
            const chapter = chapterMap[p.chapterId];
            const subjectName = chapter ? subjectMap[chapter.subjectId] : null;
            return (
              <Card key={p._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {chapter?.title ?? "Unknown chapter"}
                      </p>
                      {subjectName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{subjectName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.storyCompleted && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          <CheckCircle2 size={10} className="mr-1" /> Story
                        </Badge>
                      )}
                      {p.quizScore !== undefined && (
                        <Badge className={`text-xs border ${getScoreColor(p.quizScore)}`} variant="outline">
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
