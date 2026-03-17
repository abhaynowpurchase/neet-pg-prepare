import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Question from "@/models/Question";
import { QuizMode } from "@/components/quiz/QuizMode";
import { IQuestion } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: { chapterId: string };
}

type LeanChapter = { _id: unknown; title: string };

type LeanQuestion = {
  _id: { toString(): string };
  chapterId: { toString(): string };
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: string;
  year: number;
  difficulty: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectToDatabase();
  const chapter = await Chapter.findById(params.chapterId)
    .select("title")
    .lean() as LeanChapter | null;
  return { title: chapter ? `${chapter.title} — Quiz` : "Quiz" };
}

export default async function QuizPage({ params }: Props) {
  await connectToDatabase();

  const chapter = await Chapter.findById(params.chapterId)
    .select("title")
    .lean() as LeanChapter | null;
  if (!chapter) notFound();

  const questions = await Question.find({ chapterId: params.chapterId })
    .sort({ year: -1 })
    .limit(30)
    .lean() as unknown as LeanQuestion[];

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <p className="text-lg font-medium mb-2">No questions yet</p>
        <p className="text-muted-foreground text-sm mb-6">
          Questions for this chapter haven&apos;t been added yet.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/chapters/${params.chapterId}`}>
            <ArrowLeft size={16} className="mr-2" /> Back to chapter
          </Link>
        </Button>
      </div>
    );
  }

  const questionsData: IQuestion[] = questions.map((q) => ({
    _id: q._id.toString(),
    chapterId: q.chapterId.toString(),
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    examType: q.examType as IQuestion["examType"],
    year: q.year,
    difficulty: q.difficulty as IQuestion["difficulty"],
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-6 md:px-8 pt-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 gap-1.5">
          <Link href={`/chapters/${params.chapterId}`}>
            <ArrowLeft size={16} /> Back to chapter
          </Link>
        </Button>
      </div>
      <QuizMode
        questions={questionsData}
        chapterId={params.chapterId}
        chapterTitle={chapter.title}
      />
    </div>
  );
}
