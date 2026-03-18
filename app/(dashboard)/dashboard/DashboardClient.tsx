"use client";

import { useState, useEffect } from "react";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { ProgressStats } from "@/components/dashboard/ProgressStats";
import { ISubject } from "@/types";

type SubjectData = ISubject & { chaptersCount: number; completedCount: number };

type DashboardData = {
  userName: string;
  subjects: SubjectData[];
  stats: { totalChapters: number; completedChapters: number; avgScore: number };
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { userName, subjects, stats } = data;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Good day, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Continue your NEET PG preparation journey
        </p>
      </div>

      <div className="mb-8">
        <ProgressStats
          totalChapters={stats.totalChapters}
          completedChapters={stats.completedChapters}
          avgScore={stats.avgScore}
          streak={0}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your Subjects</h2>
        {subjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No subjects found. Run the seed script to get started!</p>
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
    </div>
  );
}
