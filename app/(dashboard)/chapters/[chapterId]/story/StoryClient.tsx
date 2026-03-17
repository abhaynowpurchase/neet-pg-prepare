"use client";

import { useState, useEffect } from "react";
import { StoryReader } from "@/components/story/StoryReader";
import { IChapter } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function StoryClient({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<IChapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/chapters/${chapterId}`)
      .then((r) => r.json())
      .then((d) => setChapter(d.chapter ?? null))
      .finally(() => setLoading(false));
  }, [chapterId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-96 w-full mt-8" />
      </div>
    );
  }

  if (!chapter) return <div className="p-8 text-center text-muted-foreground">Chapter not found.</div>;

  return <StoryReader chapter={chapter} chapterId={chapterId} />;
}
