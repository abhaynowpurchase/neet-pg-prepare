"use client";

import { useState, useEffect } from "react";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { ISubject } from "@/types";

type SubjectData = ISubject & { chaptersCount: number; completedCount: number };

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function SubjectsClient() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose a subject to begin story-based learning
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No subjects available. Run the seed script:</p>
          <code className="mt-2 block text-xs bg-muted px-3 py-2 rounded-md font-mono">
            npm run seed
          </code>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              chaptersCount={subject.chaptersCount}
              completedCount={subject.completedCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
