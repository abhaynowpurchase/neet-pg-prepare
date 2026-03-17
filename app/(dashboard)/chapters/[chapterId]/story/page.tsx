import type { Metadata } from "next";
import StoryClient from "./StoryClient";

export const metadata: Metadata = { title: "Story" };

export default function StoryPage({ params }: { params: { chapterId: string } }) {
  return <StoryClient chapterId={params.chapterId} />;
}
