import type { Metadata } from "next";
import ChapterClient from "./ChapterClient";

export const metadata: Metadata = { title: "Chapter" };

export default function ChapterPage({ params }: { params: { chapterId: string } }) {
  return <ChapterClient chapterId={params.chapterId} />;
}
