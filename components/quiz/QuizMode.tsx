"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IQuestion } from "@/types";
import { cn, formatExamType, examTypeBadgeColor } from "@/lib/utils";

interface Props {
  questions: IQuestion[];
  chapterId: string;
  chapterTitle: string;
}

type Phase = "intro" | "quiz" | "result";

const SECONDS_PER_QUESTION = 90;

export function QuizMode({ questions, chapterId, chapterTitle }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [answers, setAnswers] = useState<
    { questionId: string; selected: number; correct: boolean }[]
  >([]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      setAnswers((prev) => [
        ...prev,
        { questionId: currentQuestion._id, selected: -1, correct: false },
      ]);
    }
  }, [isAnswered, currentQuestion]);

  useEffect(() => {
    if (phase !== "quiz" || isAnswered) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft, isAnswered, handleTimeUp]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    const correct = index === currentQuestion.correctAnswer;
    if (correct) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      { questionId: currentQuestion._id, selected: index, correct },
    ]);
  };

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(SECONDS_PER_QUESTION);
    } else {
      // Save progress
      const finalScore = Math.round((score / totalQuestions) * 100);
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId,
            quizScore: finalScore,
            questionsAttempted: totalQuestions,
            questionsCorrect: score,
          }),
        });
      } catch {
        // silent
      }
      setPhase("result");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const timePercent = (timeLeft / SECONDS_PER_QUESTION) * 100;

  if (phase === "intro") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-6 px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Quiz: {chapterTitle}</h2>
            <p className="text-muted-foreground text-sm">
              {totalQuestions} questions • {SECONDS_PER_QUESTION}s per question
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Read each question carefully</p>
            <p>• Explanation shown after each answer</p>
            <p>• Score tracked to your progress</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
            <Button className="flex-1" onClick={() => setPhase("quiz")}>
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const pct = Math.round((score / totalQuestions) * 100);
    const passed = pct >= 60;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-6 px-4">
          <div
            className={`flex items-center justify-center w-20 h-20 rounded-full mx-auto ${
              passed ? "bg-primary/10" : "bg-red-50"
            }`}
          >
            {passed ? (
              <CheckCircle2 className="w-10 h-10 text-primary" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>

          <div>
            <p className="text-5xl font-bold">{pct}%</p>
            <p className="text-muted-foreground mt-1">
              {score} / {totalQuestions} correct
            </p>
            <p
              className={`mt-2 font-medium ${
                passed ? "text-primary" : "text-red-500"
              }`}
            >
              {passed ? "Great work!" : "Keep practicing!"}
            </p>
          </div>

          {/* Per-question review */}
          <div className="text-left space-y-2 max-h-60 overflow-y-auto">
            {questions.map((q, i) => {
              const ans = answers[i];
              const correct = ans?.correct;
              return (
                <div
                  key={q._id}
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    correct
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-red-50 border border-red-100"
                  }`}
                >
                  {correct ? (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="line-clamp-2">{q.question}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPhase("intro");
                setCurrentIndex(0);
                setScore(0);
                setAnswers([]);
                setSelectedAnswer(null);
                setIsAnswered(false);
                setTimeLeft(SECONDS_PER_QUESTION);
              }}
            >
              Retry
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push(`/chapters/${chapterId}`)}
            >
              Back to Chapter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${
            timeLeft <= 15 ? "text-red-500" : "text-muted-foreground"
          }`}
        >
          <Clock size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Timer progress */}
      <Progress
        value={timePercent}
        className={`h-1 mb-6 ${timeLeft <= 15 ? "[&>div]:bg-red-500" : ""}`}
      />

      {/* Question */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn("text-xs border", examTypeBadgeColor(currentQuestion.examType))}>
            {formatExamType(currentQuestion.examType)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentQuestion.year}
          </Badge>
        </div>
        <p className="text-base font-medium leading-relaxed">
          {currentQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === currentQuestion.correctAnswer;
          let variant = "default";
          if (isAnswered) {
            if (isCorrect) variant = "correct";
            else if (isSelected && !isCorrect) variant = "wrong";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={isAnswered}
              className={cn(
                "quiz-option w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                !isAnswered &&
                  "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                isAnswered && isCorrect &&
                  "border-green-400 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300",
                isAnswered && isSelected && !isCorrect &&
                  "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
                isAnswered && !isSelected && !isCorrect &&
                  "opacity-50 border-border",
                !isAnswered && "border-border bg-card"
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold",
                    isAnswered && isCorrect
                      ? "bg-green-500 border-green-500 text-white"
                      : isAnswered && isSelected && !isCorrect
                      ? "bg-red-500 border-red-500 text-white"
                      : "border-current"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && (
        <div
          className={cn(
            "p-4 rounded-lg border text-sm mb-6",
            selectedAnswer === currentQuestion.correctAnswer
              ? "bg-green-50 border-green-200 dark:bg-green-950/20"
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
          )}
        >
          <p className="font-semibold mb-1">
            {selectedAnswer === currentQuestion.correctAnswer
              ? "✓ Correct!"
              : `✗ The correct answer was ${String.fromCharCode(65 + currentQuestion.correctAnswer)}`}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {isAnswered && (
        <Button onClick={handleNext} className="w-full gap-2">
          {currentIndex < totalQuestions - 1 ? (
            <>
              Next Question <ChevronRight size={16} />
            </>
          ) : (
            "See Results"
          )}
        </Button>
      )}
    </div>
  );
}
