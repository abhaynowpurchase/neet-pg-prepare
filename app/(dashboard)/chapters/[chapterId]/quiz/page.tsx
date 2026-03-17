import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage({ params }: { params: { chapterId: string } }) {
  return <QuizClient chapterId={params.chapterId} />;
}
