"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  FileQuestion,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn, formatExamType, examTypeBadgeColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type Chapter = { _id: string; title: string; subjectId: string };
type Subject = { _id: string; name: string };

interface Props {
  questions: Question[];
  chapters: Chapter[];
  subjects: Subject[];
}

const EXAM_TYPES = ["All", "NEET_PG", "INI_CET", "UPSC_CMO"] as const;
const DIFFICULTIES = ["All", "easy", "medium", "hard"] as const;

function QuestionCard({
  question,
  chapterTitle,
  index,
}: {
  question: Question;
  chapterTitle: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setExpanded(true);
  };

  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="border rounded-xl bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {index}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                  examTypeBadgeColor(question.examType)
                )}
              >
                {formatExamType(question.examType)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {question.year}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                {question.difficulty}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed">{question.question}</p>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <BookOpen size={11} />
              {chapterTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-5 pb-3 space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOpt = i === question.correctAnswer;
          let optClass =
            "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors";
          if (selected === null) {
            optClass += " hover:bg-muted/60 hover:border-primary/40";
          } else if (isCorrectOpt) {
            optClass += " bg-green-50 border-green-400 text-green-800 dark:bg-green-950/30 dark:border-green-700 dark:text-green-300";
          } else if (isSelected) {
            optClass += " bg-red-50 border-red-400 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300";
          } else {
            optClass += " opacity-60";
          }

          return (
            <button
              key={i}
              className={optClass}
              onClick={() => handleSelect(i)}
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-left">{opt}</span>
              {selected !== null && isCorrectOpt && (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              )}
              {isSelected && !isCorrectOpt && (
                <XCircle size={16} className="text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation toggle */}
      {selected !== null && (
        <div className="px-5 pb-4">
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-primary mt-1"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide" : "Show"} Explanation
          </button>
          {expanded && (
            <div className={cn(
              "mt-3 px-4 py-3 rounded-lg text-sm leading-relaxed border-l-4",
              isCorrect
                ? "bg-green-50 border-green-400 text-green-900 dark:bg-green-950/20 dark:text-green-200"
                : "bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
            )}>
              <p className="font-semibold mb-1">{isCorrect ? "Correct!" : `Correct answer: ${String.fromCharCode(65 + question.correctAnswer)}`}</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PYQClient({ questions, chapters, subjects }: Props) {
  const [examType, setExamType] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>("All");
  const [subjectFilter, setSubjectFilter] = useState<string>("All");

  const chapterMap = useMemo(() => {
    const m: Record<string, Chapter> = {};
    chapters.forEach((c) => { m[c._id] = c; });
    return m;
  }, [chapters]);

  const subjectMap = useMemo(() => {
    const m: Record<string, Subject> = {};
    subjects.forEach((s) => { m[s._id] = s; });
    return m;
  }, [subjects]);

  const years = useMemo(() => {
    const set = new Set(questions.map((q) => q.year));
    return ["All", ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [questions]);

  const subjectNames = useMemo(() => {
    const names = new Set<string>();
    chapters.forEach((c) => {
      const sub = subjectMap[c.subjectId];
      if (sub) names.add(sub.name);
    });
    return ["All", ...Array.from(names)];
  }, [chapters, subjectMap]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (examType !== "All" && q.examType !== examType) return false;
      if (difficulty !== "All" && q.difficulty !== difficulty) return false;
      if (yearFilter !== "All" && String(q.year) !== yearFilter) return false;
      if (subjectFilter !== "All") {
        const ch = chapterMap[q.chapterId];
        if (!ch) return false;
        const sub = subjectMap[ch.subjectId];
        if (!sub || sub.name !== subjectFilter) return false;
      }
      return true;
    });
  }, [questions, examType, difficulty, yearFilter, subjectFilter, chapterMap, subjectMap]);

  const stats = useMemo(() => {
    const byExam: Record<string, number> = {};
    questions.forEach((q) => {
      byExam[q.examType] = (byExam[q.examType] ?? 0) + 1;
    });
    return byExam;
  }, [questions]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileQuestion className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Last Year Question Papers</h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions across all subjects
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(stats).map(([type, count]) => (
            <div
              key={type}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                examTypeBadgeColor(type)
              )}
            >
              {formatExamType(type)}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
          <Filter size={14} />
          Filters
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Exam type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Exams" : formatExamType(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Levels" : d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === "All" ? "All Years" : y}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {subjectNames.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Subjects" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset */}
        {(examType !== "All" || difficulty !== "All" || yearFilter !== "All" || subjectFilter !== "All") && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs text-muted-foreground"
            onClick={() => {
              setExamType("All");
              setDifficulty("All");
              setYearFilter("All");
              setSubjectFilter("All");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filtered.length} question{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No questions match your filters</p>
          <p className="text-sm mt-1">Try adjusting the filters above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, i) => (
            <QuestionCard
              key={q._id}
              question={q}
              chapterTitle={chapterMap[q.chapterId]?.title ?? "Unknown Chapter"}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
