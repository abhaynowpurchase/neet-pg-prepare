import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";
import { PYQClient } from "./PYQClient";

type LeanQuestion = {
  _id: string;
  chapterId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: string;
  year: number;
  difficulty: string;
};

type LeanChapter = {
  _id: string;
  title: string;
  subjectId: string;
};

type LeanSubject = {
  _id: string;
  name: string;
};

export default async function PYQPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  await connectToDatabase();

  const [rawQuestions, rawChapters, rawSubjects] = await Promise.all([
    Question.find({}).sort({ year: -1, examType: 1 }).lean(),
    Chapter.find({}).lean(),
    Subject.find({}).lean(),
  ]);

  const questions: LeanQuestion[] = (rawQuestions as unknown as Array<Record<string, unknown>>).map((q) => ({
    _id: String(q._id),
    chapterId: String(q.chapterId),
    question: String(q.question ?? ""),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correctAnswer: Number(q.correctAnswer ?? 0),
    explanation: String(q.explanation ?? ""),
    examType: String(q.examType ?? ""),
    year: Number(q.year ?? 0),
    difficulty: String(q.difficulty ?? "medium"),
  }));

  const chapters: LeanChapter[] = (rawChapters as unknown as Array<Record<string, unknown>>).map((c) => ({
    _id: String(c._id),
    title: String(c.title ?? ""),
    subjectId: String(c.subjectId),
  }));

  const subjects: LeanSubject[] = (rawSubjects as unknown as Array<Record<string, unknown>>).map((s) => ({
    _id: String(s._id),
    name: String(s.name ?? ""),
  }));

  return (
    <PYQClient
      questions={questions}
      chapters={chapters}
      subjects={subjects}
    />
  );
}
