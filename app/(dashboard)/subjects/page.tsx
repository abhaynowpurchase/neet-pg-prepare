import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import UserProgress from "@/models/UserProgress";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { ISubject } from "@/types";

export const metadata: Metadata = { title: "Subjects" };

type LeanSubject = {
  _id: { toString(): string };
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
};

type LeanChapter = {
  _id: { toString(): string };
  subjectId: { toString(): string };
};

type LeanProgress = {
  chapterId: { toString(): string };
};

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  await connectToDatabase();

  const subjects = await Subject.find().sort({ order: 1 }).lean() as unknown as LeanSubject[];
  const chapters = await Chapter.find().select("_id subjectId").lean() as unknown as LeanChapter[];
  const progressRecords = await UserProgress.find({ userId, storyCompleted: true }).lean() as unknown as LeanProgress[];

  const chaptersBySubject: Record<string, number> = {};
  for (const ch of chapters) {
    const sid = ch.subjectId.toString();
    chaptersBySubject[sid] = (chaptersBySubject[sid] ?? 0) + 1;
  }

  const completedChapterIds = new Set(
    progressRecords.map((p) => p.chapterId.toString())
  );

  const completedBySubject: Record<string, number> = {};
  for (const ch of chapters) {
    if (completedChapterIds.has(ch._id.toString())) {
      const sid = ch.subjectId.toString();
      completedBySubject[sid] = (completedBySubject[sid] ?? 0) + 1;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose a subject to begin story-based learning
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No subjects available. Run the seed script:</p>
          <code className="mt-2 block text-xs bg-muted px-3 py-2 rounded-md font-mono">
            npm run seed
          </code>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const sid = subject._id.toString();
            return (
              <SubjectCard
                key={sid}
                subject={{
                  _id: sid,
                  name: subject.name,
                  description: subject.description,
                  icon: subject.icon,
                  color: subject.color,
                  createdAt: subject.createdAt.toISOString(),
                } as ISubject}
                chaptersCount={chaptersBySubject[sid] ?? 0}
                completedCount={completedBySubject[sid] ?? 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
