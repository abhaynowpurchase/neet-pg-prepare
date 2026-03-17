"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  order: number;
}

interface FlashCardProps {
  chapterId: string;
  chapterTitle: string;
}

export default function FlashCard({ chapterId, chapterTitle }: FlashCardProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`/api/chapters/${chapterId}/flashcards`)
      .then((r) => r.json())
      .then((data) => setCards(data.flashcards ?? []))
      .finally(() => setLoading(false));
  }, [chapterId]);

  const next = useCallback(() => {
    if (index < cards.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setFinished(true);
    }
  }, [index, cards.length]);

  const prev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setFinished(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-80 h-52 bg-muted rounded-2xl" />
          <div className="w-40 h-4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
        <p className="text-muted-foreground">No flashcards available for this chapter yet.</p>
        <Button asChild variant="outline">
          <Link href={`/chapters/${chapterId}`}><ChevronLeft size={16} /> Back</Link>
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">🎉</span>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">All done!</h2>
          <p className="text-muted-foreground text-sm">You reviewed all {cards.length} flashcards.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={restart} variant="outline" className="gap-2">
            <RotateCcw size={15} /> Restart
          </Button>
          <Button asChild>
            <Link href={`/chapters/${chapterId}/story`}>Read Story</Link>
          </Button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href={`/chapters/${chapterId}`}>
            <ChevronLeft size={16} /> Back
          </Link>
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Flashcards</p>
          <p className="text-sm font-semibold truncate max-w-[200px]">{chapterTitle}</p>
        </div>
        <div className="text-sm text-muted-foreground w-16 text-right">
          {index + 1} / {cards.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "260px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border bg-card shadow-sm flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
              Question
            </span>
            <p className="text-lg font-semibold leading-relaxed">{card.front}</p>
            <p className="text-xs text-muted-foreground mt-8">Tap or press Space to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border bg-primary/5 shadow-sm flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-6">
              Answer
            </span>
            <p className="text-base leading-relaxed whitespace-pre-line">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          disabled={index === 0}
          className="rounded-full w-11 h-11"
        >
          <ArrowLeft size={18} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFlipped((f) => !f)}
          className="gap-2 px-5"
        >
          <RotateCcw size={14} />
          {flipped ? "Hide answer" : "Reveal answer"}
        </Button>

        <Button
          variant={index === cards.length - 1 ? "default" : "outline"}
          size="icon"
          onClick={next}
          className="rounded-full w-11 h-11"
        >
          <ArrowRight size={18} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        ← → arrow keys to navigate · Space to flip
      </p>
    </div>
  );
}
