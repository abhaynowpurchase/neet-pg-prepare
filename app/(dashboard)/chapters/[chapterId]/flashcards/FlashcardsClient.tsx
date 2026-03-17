"use client";

import { useState, useEffect } from "react";
import FlashCard from "@/components/flashcard/FlashCard";

export default function FlashcardsClient({ chapterId }: { chapterId: string }) {
  const [chapterTitle, setChapterTitle] = useState("");

  useEffect(() => {
    fetch(`/api/chapters/${chapterId}`)
      .then((r) => r.json())
      .then((data) => setChapterTitle(data.chapter?.title ?? ""));
  }, [chapterId]);

  return <FlashCard chapterId={chapterId} chapterTitle={chapterTitle} />;
}
