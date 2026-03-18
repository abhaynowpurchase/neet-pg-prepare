"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IAnatomyScene as AnatomyScene } from "@/types";
import type { ViewPhase } from "@/components/3d/AnatomyViewer";

const AnatomyViewer = dynamic(() => import("@/components/3d/AnatomyViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading 3D model...</p>
      </div>
    </div>
  ),
});

type ChapterData = { _id: string; subjectId: string; title: string; description: string };

export default function ThreeDClient({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState<AnatomyScene | null>(null);
  const [viewPhase, setViewPhase] = useState<ViewPhase>("overview");
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/chapters/${chapterId}`)
      .then((r) => r.json())
      .then(async (d) => {
        const ch = d.chapter ?? null;
        setChapter(ch);
        if (ch?.title) {
          const res = await fetch(`/api/anatomy-scene?title=${encodeURIComponent(ch.title)}`);
          const data = await res.json();
          setScene(data.scene ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  // Auto-open sidebar when entering detail mode
  useEffect(() => {
    if (viewPhase === "detail") setSidebarOpen(false);
    if (viewPhase === "overview") setSidebarOpen(false);
  }, [viewPhase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading anatomy data...</p>
        </div>
      </div>
    );
  }

  if (!chapter) return <div className="p-8 text-center text-muted-foreground">Chapter not found.</div>;

  if (!scene) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-6xl mb-2">🧬</div>
        <h2 className="text-white text-xl font-bold">3D Model Coming Soon</h2>
        <p className="text-gray-400 text-center max-w-sm">
          A 3D interactive model for <strong className="text-white">{chapter.title}</strong> is being built.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href={`/chapters/${chapterId}`}>
            <ArrowLeft size={16} className="mr-2" />
            Back to chapter
          </Link>
        </Button>
      </div>
    );
  }

  const showSidebar = viewPhase === "detail";

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-white/10 bg-gray-900/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white shrink-0 px-2">
            <Link href={`/chapters/${chapterId}`}>
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-xs sm:text-sm truncate">{scene.title}</h1>
            <p className="text-gray-400 text-xs truncate hidden sm:block">{scene.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs hidden sm:flex">
            <Zap size={10} className="mr-1" />
            3D Interactive
          </Badge>
          <Button variant="outline" size="sm" asChild className="text-xs border-white/20 text-gray-300 hover:text-white px-2 sm:px-3">
            <Link href={`/chapters/${chapterId}/story`}>
              <BookOpen size={13} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Read Story</span>
            </Link>
          </Button>
          {/* Mobile sidebar toggle */}
          {showSidebar && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex sm:hidden items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 text-white text-xs"
            >
              <Info size={13} />
              {sidebarOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">

        {/* 3D viewer */}
        <div className={`relative transition-all duration-300 ${
          showSidebar && sidebarOpen
            ? "h-[55vw] sm:h-auto sm:flex-1"
            : "flex-1"
        }`}>
          <AnatomyViewer scene={scene} onPhaseChange={setViewPhase} />
        </div>

        {/* ── Desktop sidebar (hidden on mobile, shown inline on sm+) ── */}
        {showSidebar && (
          <div className="hidden sm:flex w-64 lg:w-72 bg-gray-900 border-l border-white/10 flex-col overflow-hidden shrink-0">
            <SidebarContent
              scene={scene}
              activeHighlight={activeHighlight}
              setActiveHighlight={setActiveHighlight}
            />
          </div>
        )}

        {/* ── Mobile bottom sheet sidebar ── */}
        {showSidebar && (
          <div className={`sm:hidden bg-gray-900 border-t border-white/10 overflow-hidden transition-all duration-300 shrink-0 ${
            sidebarOpen ? "max-h-[45vh] overflow-y-auto" : "max-h-0"
          }`}>
            <SidebarContent
              scene={scene}
              activeHighlight={activeHighlight}
              setActiveHighlight={setActiveHighlight}
            />
          </div>
        )}

        {/* Mobile tab bar when sidebar is closed in detail mode */}
        {showSidebar && !sidebarOpen && (
          <div className="sm:hidden shrink-0 border-t border-white/10 bg-gray-900 px-4 py-2 flex items-center justify-between">
            <span className="text-gray-400 text-xs">{scene.parts.length} structures • {scene.highlights?.length ?? 0} high-yield</span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1 text-indigo-400 text-xs font-medium"
            >
              <Info size={12} /> Show details <ChevronUp size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sidebar content ──────────────────────────────────────────────────
function SidebarContent({
  scene,
  activeHighlight,
  setActiveHighlight,
}: {
  scene: AnatomyScene;
  activeHighlight: number | null;
  setActiveHighlight: (i: number | null) => void;
}) {
  return (
    <>
      {/* How to use */}
      <div className="p-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-gray-300 text-xs mb-1.5">
          <Info size={13} className="text-primary" />
          <span className="font-semibold">How to use</span>
        </div>
        <ul className="text-gray-400 text-xs space-y-0.5">
          <li>• <strong className="text-gray-200">Click</strong> any structure for info</li>
          <li>• <strong className="text-gray-200">Drag</strong> to rotate • <strong className="text-gray-200">Scroll</strong> to zoom</li>
        </ul>
      </div>

      {/* Structures list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 border-b border-white/10">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Structures ({scene.parts.length})
          </span>
        </div>
        <div className="p-2 space-y-0.5">
          {scene.parts.map((part) => (
            <div
              key={part.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: part.color }} />
              <div className="min-w-0">
                <p className="text-gray-200 text-xs font-medium leading-tight">{part.label}</p>
                <p className="text-gray-500 text-xs leading-tight mt-0.5 line-clamp-1 group-hover:text-gray-400">
                  {part.info.slice(0, 70)}…
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High-yield points */}
      {scene.highlights && scene.highlights.length > 0 && (
        <div className="border-t border-white/10 p-3 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">High-Yield</span>
          </div>
          <div className="space-y-1">
            {scene.highlights.map((h, i) => (
              <button
                key={i}
                onClick={() => setActiveHighlight(activeHighlight === i ? null : i)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  activeHighlight === i
                    ? "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <span className="text-yellow-400 font-bold mr-1">{i + 1}.</span>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
