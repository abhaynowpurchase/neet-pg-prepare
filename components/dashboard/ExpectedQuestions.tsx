"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Flame, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = {
  _id: string;
  chapterId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: string;
  year: number;
  difficulty: string;
};

type ChapterMeta = { _id: string; title: string; subjectId: string };
type SubjectMeta = { _id: string; name: string };

type ResponseData = {
  questions: Question[];
  chapters: ChapterMeta[];
  subjects: SubjectMeta[];
};

const EXAM_TABS = [
  { key: "All", label: "All Exams" },
  { key: "NEET_PG", label: "NEET PG" },
  { key: "INI_CET", label: "INI-CET" },
  { key: "UPSC_CMO", label: "UPSC CMO" },
] as const;

const EXAM_COLORS: Record<string, string> = {
  NEET_PG: "bg-blue-100 text-blue-700 border-blue-200",
  INI_CET: "bg-purple-100 text-purple-700 border-purple-200",
  UPSC_CMO: "bg-orange-100 text-orange-700 border-orange-200",
};

const EXAM_LABELS: Record<string, string> = {
  NEET_PG: "NEET PG",
  INI_CET: "INI-CET",
  UPSC_CMO: "UPSC CMO",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  hard: "bg-red-100 text-red-600 border-red-200",
  medium: "bg-amber-100 text-amber-600 border-amber-200",
  easy: "bg-green-100 text-green-600 border-green-200",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

function QuestionCard({
  question,
  chapter,
  subject,
}: {
  question: Question;
  chapter?: ChapterMeta;
  subject?: SubjectMeta;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const correct = selected === question.correctAnswer;

  return (
    <div className="border rounded-xl bg-card overflow-hidden transition-all">
      {/* Question header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span
                className={cn(
                  "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
                  EXAM_COLORS[question.examType] ?? "bg-muted text-muted-foreground"
                )}
              >
                {EXAM_LABELS[question.examType] ?? question.examType}
              </span>
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                  DIFFICULTY_COLORS[question.difficulty] ?? "bg-muted text-muted-foreground"
                )}
              >
                {question.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">{question.year}</span>
              {chapter && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen size={10} />
                  {chapter.title}
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug line-clamp-2 sm:line-clamp-none">
              {question.question}
            </p>
          </div>
          <div className="shrink-0 mt-1 text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded options + explanation */}
      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/20">
          <div className="pt-3 space-y-2">
            {question.options.map((opt, idx) => {
              let optStyle = "border-border bg-background hover:bg-muted/50 text-foreground";
              if (answered) {
                if (idx === question.correctAnswer) {
                  optStyle = "border-green-500 bg-green-50 text-green-800";
                } else if (idx === selected) {
                  optStyle = "border-red-400 bg-red-50 text-red-800";
                } else {
                  optStyle = "border-border bg-muted/30 text-muted-foreground";
                }
              } else if (selected === idx) {
                optStyle = "border-primary bg-primary/10 text-primary";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !answered && setSelected(idx)}
                  disabled={answered}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors flex items-center gap-2",
                    optStyle,
                    !answered && "cursor-pointer"
                  )}
                >
                  <span className="font-semibold shrink-0 w-5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{opt}</span>
                  {answered && idx === question.correctAnswer && (
                    <CheckCircle2 size={14} className="ml-auto shrink-0 text-green-600" />
                  )}
                  {answered && idx === selected && idx !== question.correctAnswer && (
                    <XCircle size={14} className="ml-auto shrink-0 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                {correct ? "Correct!" : "Incorrect"} — Explanation
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">{question.explanation}</p>
            </div>
          )}

          {!answered && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Select an option to see the answer
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExpectedQuestions() {
  const [activeTab, setActiveTab] =
    useState<(typeof EXAM_TABS)[number]["key"]>("All");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/expected-questions`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const chapterMap = Object.fromEntries(
    (data?.chapters ?? []).map((c) => [c._id, c])
  );
  const subjectMap = Object.fromEntries(
    (data?.subjects ?? []).map((s) => [s._id, s])
  );

  const filtered =
    activeTab === "All"
      ? (data?.questions ?? [])
      : (data?.questions ?? []).filter((q) => q.examType === activeTab);

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold">Expected Questions This Year</h2>
        <span className="ml-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
          High Yield
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Hard-difficulty, recent-year questions from NEET PG, INI-CET &amp; UPSC CMO most likely to appear this year.
      </p>

      {/* Exam tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {EXAM_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {tab.label}
            {!loading && data && tab.key !== "All" && (
              <span className="ml-1.5 text-xs opacity-70">
                {data.questions.filter((q) => q.examType === tab.key).length}
              </span>
            )}
            {!loading && data && tab.key === "All" && (
              <span className="ml-1.5 text-xs opacity-70">{data.questions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No expected questions found. Add questions to the question bank to see them here.
        </div>
      )}

      {/* Question list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard
              key={q._id}
              question={q}
              chapter={chapterMap[q.chapterId]}
              subject={subjectMap[chapterMap[q.chapterId]?.subjectId ?? ""]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
