"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, PauseCircle, PlayCircle, RefreshCw,
  Database, CheckCircle2, AlertCircle, Clock, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CrawlerLog = {
  _id: string;
  status: "running" | "idle" | "paused";
  passNumber: number;
  totalAdded: number;
  totalDuplicates: number;
  totalErrors: number;
  lastChapter: string | null;
  lastExamType: string | null;
  lastYear: number | null;
  messages: string[];
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  totalQuestions: number;
  byExamType: Record<string, number>;
  byYear: { year: number; count: number }[];
};

type Data = {
  state: { paused: boolean };
  logs: CrawlerLog[];
  stats: Stats;
};

const EXAM_LABELS: Record<string, string> = {
  NEET_PG: "NEET PG",
  INI_CET: "INI-CET",
  UPSC_CMO: "UPSC CMO",
};

const STATUS_COLOR: Record<string, string> = {
  running: "bg-green-100 text-green-700 border-green-200",
  idle: "bg-gray-100 text-gray-600 border-gray-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
};

function Stat({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function CommandBox() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          How to start the crawler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Run in a terminal:</p>
        <code className="block bg-muted px-3 py-2 rounded font-mono text-xs">
          npx tsx scripts/crawler-daemon.ts
        </code>
        <p className="font-semibold text-foreground mt-3">Options:</p>
        <ul className="space-y-1 font-mono">
          <li><span className="text-primary">--once</span> &nbsp;— single pass then exit</li>
          <li><span className="text-primary">--years 5</span> &nbsp;— only last 5 years</li>
          <li><span className="text-primary">--exam NEET_PG</span> &nbsp;— one exam type</li>
          <li><span className="text-primary">--chapter "Epidemiology"</span> &nbsp;— one chapter</li>
        </ul>
        <p className="mt-3">Use the <strong>Pause / Resume</strong> buttons above to control a running daemon.</p>
      </CardContent>
    </Card>
  );
}

export default function CrawlerDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/crawler");
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 8000); // auto-refresh every 8s
    return () => clearInterval(iv);
  }, [fetchData]);

  const sendAction = async (action: "pause" | "resume") => {
    setActionLoading(true);
    try {
      await fetch("/api/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-xl h-24" />
        ))}
      </div>
    );
  }

  const latest = data?.logs?.[0] ?? null;
  const isPaused = data?.state?.paused ?? false;
  const isRunning = latest?.status === "running";

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            PYQ Crawler Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            30-year NEET PG · INI-CET · UPSC CMO question bank builder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </Button>
          {isPaused ? (
            <Button
              size="sm"
              onClick={() => sendAction("resume")}
              disabled={actionLoading}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              <PlayCircle size={14} /> Resume
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendAction("pause")}
              disabled={actionLoading}
              className="gap-1.5 border-amber-400 text-amber-600 hover:bg-amber-50"
            >
              <PauseCircle size={14} /> Pause
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Total Questions"
          value={data?.stats?.totalQuestions ?? 0}
          icon={Database}
          color="bg-primary/10 text-primary"
        />
        <Stat
          label="Added (this pass)"
          value={latest?.totalAdded ?? 0}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <Stat
          label="Duplicates Skipped"
          value={latest?.totalDuplicates ?? 0}
          icon={Layers}
          color="bg-blue-100 text-blue-600"
        />
        <Stat
          label="Errors"
          value={latest?.totalErrors ?? 0}
          icon={AlertCircle}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* By exam type */}
      {data?.stats?.byExamType && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(data.stats.byExamType).map(([et, count]) => (
            <div
              key={et}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card text-sm"
            >
              <span className="font-semibold">{EXAM_LABELS[et] ?? et}</span>
              <span className="text-muted-foreground">{count.toLocaleString()} Qs</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Live log */}
        <div className="lg:col-span-2 space-y-4">
          {latest && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Current Pass #{latest.passNumber}</CardTitle>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border capitalize",
                    STATUS_COLOR[latest.status] ?? STATUS_COLOR.idle
                  )}>
                    {isPaused ? "paused" : latest.status}
                  </span>
                </div>
                {latest.lastChapter && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">{latest.lastExamType} {latest.lastYear}</span>
                    {" · "}{latest.lastChapter}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-gray-950 rounded-lg p-3 h-72 overflow-y-auto font-mono text-xs space-y-0.5">
                  {latest.messages.length === 0 ? (
                    <p className="text-gray-500">No log messages yet. Start the daemon in terminal.</p>
                  ) : (
                    [...latest.messages].reverse().map((msg, i) => (
                      <p
                        key={i}
                        className={cn(
                          "leading-relaxed",
                          msg.includes("✗") || msg.includes("ERROR") ? "text-red-400" :
                          msg.includes("+") ? "text-green-400" :
                          msg.includes("═") || msg.includes("PASS") ? "text-yellow-400 font-bold" :
                          "text-gray-300"
                        )}
                      >
                        {msg}
                      </p>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Year coverage chart */}
          {data?.stats?.byYear && data.stats.byYear.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock size={13} className="text-primary" /> Year Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {data.stats.byYear.map(({ year, count }) => (
                    <div
                      key={year}
                      title={`${year}: ${count} questions`}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium border",
                        count >= 10 ? "bg-green-100 text-green-700 border-green-200" :
                        count >= 5  ? "bg-blue-100 text-blue-700 border-blue-200" :
                                      "bg-muted text-muted-foreground"
                      )}
                    >
                      {year}
                      <span className="ml-1 opacity-60">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Green = 10+ questions · Blue = 5–9 · Gray = 1–4
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <CommandBox />

          {/* Recent passes */}
          {data && data.logs.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Passes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.logs.slice(1).map((l) => (
                  <div key={l._id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Pass #{l.passNumber} · {new Date(l.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-green-600">+{l.totalAdded}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
