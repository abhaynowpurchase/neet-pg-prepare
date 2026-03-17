"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PYQClient } from "./PYQClient";

type Question = {
  _id: string; chapterId: string; question: string; options: string[];
  correctAnswer: number; explanation: string; examType: string; year: number; difficulty: string;
};
type Chapter = { _id: string; title: string; subjectId: string };
type Subject = { _id: string; name: string };

type Filters = {
  examType: string;
  difficulty: string;
  year: string;
  subjectId: string;
};

const PAGE_SIZE = 5;

export default function PYQPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    examType: "All",
    difficulty: "All",
    year: "All",
    subjectId: "All",
  });
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (p: number, f: Filters) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
          ...(f.examType !== "All" && { examType: f.examType }),
          ...(f.difficulty !== "All" && { difficulty: f.difficulty }),
          ...(f.year !== "All" && { year: f.year }),
          ...(f.subjectId !== "All" && { subjectId: f.subjectId }),
        });

        const res = await fetch(`/api/pyq?${params}`, {
          signal: abortRef.current.signal,
        });
        const data = await res.json();

        setQuestions(data.questions ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.pages ?? 1);
        setPage(data.page ?? 1);
        // Chapters/subjects don't change — only update if not yet loaded
        if (data.chapters?.length) setChapters(data.chapters);
        if (data.subjects?.length) setSubjects(data.subjects);
      } catch (e: any) {
        if (e?.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (p: number) => {
    fetchData(p, filters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (next: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  return (
    <PYQClient
      questions={questions}
      chapters={chapters}
      subjects={subjects}
      total={total}
      page={page}
      totalPages={totalPages}
      loading={loading}
      filters={filters}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
    />
  );
}
