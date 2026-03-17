import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import HighYieldTopic from "@/models/HighYieldTopic";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "High Yield Topics" };

type LeanTopic = {
  _id: { toString(): string };
  chapterId: { toString(): string };
  title: string;
  description: string;
  keyPoints: string[];
  order: number;
};

type LeanChapter = {
  _id: { toString(): string };
  title: string;
  subjectId: { toString(): string };
};

type LeanSubject = {
  _id: { toString(): string };
  name: string;
};

export default async function HighYieldPage() {
  await connectToDatabase();

  const subjects = await Subject.find().sort({ order: 1 }).lean() as unknown as LeanSubject[];
  const chapters = await Chapter.find().select("_id title subjectId").lean() as unknown as LeanChapter[];
  const topics = await HighYieldTopic.find().sort({ order: 1 }).lean() as unknown as LeanTopic[];

  const subjectMap = Object.fromEntries(
    subjects.map((s) => [s._id.toString(), s.name])
  );

  const chapterMap = Object.fromEntries(
    chapters.map((c) => [
      c._id.toString(),
      { title: c.title, subjectId: c.subjectId.toString() },
    ])
  );

  // Group topics by chapter
  const topicsByChapter: Record<
    string,
    { chapterId: string; chapterTitle: string; subjectName: string; topics: LeanTopic[] }
  > = {};

  for (const topic of topics) {
    const cid = topic.chapterId.toString();
    if (!topicsByChapter[cid]) {
      const chapter = chapterMap[cid];
      topicsByChapter[cid] = {
        chapterId: cid,
        chapterTitle: chapter?.title ?? "Unknown Chapter",
        subjectName: chapter ? (subjectMap[chapter.subjectId] ?? "") : "",
        topics: [],
      };
    }
    topicsByChapter[cid].topics.push(topic);
  }

  const groups = Object.values(topicsByChapter);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Star className="w-5 h-5" />
          <span className="text-sm font-medium">Exam Focused</span>
        </div>
        <h1 className="text-2xl font-bold">High Yield Topics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Most frequently tested concepts across NEET PG, INI-CET and UPSC CMO
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No high-yield topics found.</p>
          <p className="text-xs mt-1">Run the seed script to add content.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.chapterId}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold">{group.chapterTitle}</h2>
                {group.subjectName && (
                  <Badge variant="outline" className="text-xs">
                    {group.subjectName}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {group.topics.map((topic) => (
                  <Card
                    key={topic._id.toString()}
                    className="hover:border-primary/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-start gap-2">
                        <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">
                        {topic.description}
                      </p>
                      {topic.keyPoints.length > 0 && (
                        <ul className="space-y-2">
                          {topic.keyPoints.map((point: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm"
                            >
                              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
