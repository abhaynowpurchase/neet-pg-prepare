import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import { StoryReader } from "@/components/story/StoryReader";
import { IChapter } from "@/types";
import type { Metadata } from "next";

interface ChapterLean {
  _id: { toString(): string };
  subjectId: { toString(): string };
  title: string;
  description: string;
  storyContent: string;
  highYieldNotes: string;
  order: number;
  estimatedReadTime: number;
  createdAt: Date;
}

interface Props {
  params: { chapterId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectToDatabase();
  const chapter = await Chapter.findById(params.chapterId).select("title").lean() as { title?: string } | null;
  return { title: chapter ? `${chapter.title} — Story` : "Story" };
}

export default async function StoryPage({ params }: Props) {
  await connectToDatabase();

  const chapter = await Chapter.findById(params.chapterId).lean() as ChapterLean | null;
  if (!chapter) notFound();

  const chapterData: IChapter = {
    _id: chapter._id.toString(),
    subjectId: chapter.subjectId.toString(),
    title: chapter.title,
    description: chapter.description,
    storyContent: chapter.storyContent,
    highYieldNotes: chapter.highYieldNotes,
    order: chapter.order,
    estimatedReadTime: chapter.estimatedReadTime,
    createdAt: chapter.createdAt.toISOString(),
  };

  return <StoryReader chapter={chapterData} chapterId={params.chapterId} />;
}
