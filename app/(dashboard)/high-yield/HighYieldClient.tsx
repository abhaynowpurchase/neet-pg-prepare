"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Topic = {
  _id: string;
  title: string;
  description: string;
  keyPoints: string[];
};

type Group = {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  topics: Topic[];
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

export default function HighYieldClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/high-yield")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Star className="w-5 h-5" />
          <span className="text-sm font-medium">Exam Focused</span>
        </div>
        <h1 className="text-2xl font-bold">High Yield Topics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Most frequently tested concepts across NEET PG, INI-CET and UPSC CMO
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => <Skeleton key={j} className="h-40" />)}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No high-yield topics found.</p>
          <p className="text-xs mt-1">Run the seed script to add content.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.chapterId}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold">{group.chapterTitle}</h2>
                {group.subjectName && (
                  <Badge variant="outline" className="text-xs">{group.subjectName}</Badge>
                )}
              </div>
              <div className="space-y-3">
                {group.topics.map((topic) => (
                  <Card key={topic._id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-start gap-2">
                        <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
                      {topic.keyPoints.length > 0 && (
                        <ul className="space-y-2">
                          {topic.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
