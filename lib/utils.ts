import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatReadTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min read`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m read` : `${hours}h read`;
}

export function formatScore(correct: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreBg(percentage: number): string {
  if (percentage >= 80) return "bg-green-50 border-green-200";
  if (percentage >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

export function formatExamType(examType: string): string {
  const map: Record<string, string> = {
    NEET_PG: "NEET PG",
    INI_CET: "INI-CET",
    UPSC_CMO: "UPSC CMO",
  };
  return map[examType] ?? examType;
}

export function examTypeBadgeColor(examType: string): string {
  const map: Record<string, string> = {
    NEET_PG: "bg-blue-100 text-blue-800 border-blue-200",
    INI_CET: "bg-purple-100 text-purple-800 border-purple-200",
    UPSC_CMO: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return map[examType] ?? "bg-gray-100 text-gray-800";
}
