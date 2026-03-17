"use client";

import { useState, useEffect } from "react";
import { PYQClient } from "./PYQClient";

type Question = {
  _id: string; chapterId: string; question: string; options: string[];
  correctAnswer: number; explanation: string; examType: string; year: number; difficulty: string;
};
type Chapter = { _id: string; title: string; subjectId: string };
type Subject = { _id: string; name: string };

export default function PYQPage() {
  const [data, setData] = useState<{ questions: Question[]; chapters: Chapter[]; subjects: Subject[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pyq")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-lg w-64" />
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-24 bg-muted rounded-xl mt-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PYQClient
      questions={data.questions}
      chapters={data.chapters}
      subjects={data.subjects}
    />
  );
}
