"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Minus,
  Plus,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { IChapter } from "@/types";
import { formatReadTime } from "@/lib/utils";

interface Props {
  chapter: IChapter;
  chapterId: string;
}

export function StoryReader({ chapter, chapterId }: Props) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const total = scrollHeight - clientHeight;
    const pct = total > 0 ? Math.round((scrollTop / total) * 100) : 0;
    setScrollProgress(pct);
    if (pct >= 90 && !isCompleted) {
      markAsCompleted();
    }
  }, [isCompleted]);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const markAsCompleted = async () => {
    if (isCompleted || isSaving) return;
    setIsSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, storyCompleted: true }),
      });
      setIsCompleted(true);
    } catch {
      // silent fail — progress can be retried
    } finally {
      setIsSaving(false);
    }
  };

  const fontSizes = [14, 15, 16, 17, 18, 20, 22];
  const currentFontIndex = fontSizes.indexOf(fontSize);

  const decreaseFont = () => {
    if (currentFontIndex > 0) setFontSize(fontSizes[currentFontIndex - 1]);
  };

  const increaseFont = () => {
    if (currentFontIndex < fontSizes.length - 1)
      setFontSize(fontSizes[currentFontIndex + 1]);
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        isDark ? "bg-gray-950 text-gray-100" : "bg-[#faf9f7] text-gray-900"
      }`}
    >
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-3 md:px-8 py-2.5 border-b z-10 ${
          isDark
            ? "bg-gray-950 border-gray-800"
            : "bg-[#faf9f7] border-gray-200"
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-sm px-2 md:px-3"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline">Back</span>
        </Button>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={decreaseFont}
            disabled={currentFontIndex === 0}
          >
            <Minus size={14} />
          </Button>
          <span className="text-xs w-7 text-center tabular-nums">{fontSize}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={increaseFont}
            disabled={currentFontIndex === fontSizes.length - 1}
          >
            <Plus size={14} />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>
      </div>

      {/* Reading progress */}
      <Progress value={scrollProgress} className="h-0.5 rounded-none" />

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
        <article className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 pb-20">
          {/* Chapter header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
              <BookOpen size={13} />
              Story-Based Learning
            </div>
            <h1
              className={`font-serif font-bold leading-tight mb-3 ${
                fontSize >= 18 ? "text-3xl" : "text-2xl"
              }`}
            >
              {chapter.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {formatReadTime(chapter.estimatedReadTime)}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle2 size={13} />
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Story content */}
          <div
            className={`story-content ${isDark ? "dark" : ""}`}
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{
              __html: chapter.storyContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>"),
            }}
          />

          {/* High yield notes */}
          {chapter.highYieldNotes && (
            <div
              className={`mt-12 rounded-xl p-6 border ${
                isDark
                  ? "bg-green-950/30 border-green-800/50"
                  : "bg-green-50 border-green-100"
              }`}
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-primary mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold">
                  ★
                </span>
                High-Yield Notes
              </h2>
              <div
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ fontSize: `${fontSize - 2}px` }}
              >
                {chapter.highYieldNotes}
              </div>
            </div>
          )}

          {/* Completion CTA */}
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-primary font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Story completed! Ready for quiz?
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keep reading to mark this chapter as complete
              </p>
            )}
            <Button
              onClick={() =>
                router.push(`/chapters/${chapterId}/quiz`)
              }
              className="gap-2"
            >
              Practice Questions →
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
