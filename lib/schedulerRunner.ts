import connectDB from "@/lib/mongodb";
import { searchWeb, buildSearchContext } from "@/lib/webSearch";
import { processChapterContent } from "@/lib/contentProcessor";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";
import Question from "@/models/Question";
import HighYieldTopic from "@/models/HighYieldTopic";
import SchedulerLog from "@/models/SchedulerLog";

const CHAPTERS_PER_RUN = 10;

export interface RunResult {
  chaptersProcessed: number;
  questionsAdded: number;
  highYieldTopicsAdded: number;
  errorMessages: string[];
  durationMs: number;
}

export async function runScheduler(): Promise<RunResult> {
  const startTime = Date.now();
  await connectDB();

  const log = await SchedulerLog.create({ runAt: new Date(), status: "running" });

  let chaptersProcessed = 0;
  let questionsAdded = 0;
  let highYieldTopicsAdded = 0;
  const errorMessages: string[] = [];

  try {
    // Pick oldest-updated chapters to process this run (rotates through all 173 over time)
    const chapters = await Chapter.find({})
      .sort({ updatedAt: 1 })
      .limit(CHAPTERS_PER_RUN)
      .lean();

    const subjectIds = Array.from(new Set(chapters.map((c) => String(c.subjectId))));
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
    const subjectMap = Object.fromEntries(subjects.map((s) => [String(s._id), s.name as string]));

    for (const chapter of chapters) {
      const chapterId = chapter._id;
      const subjectName = subjectMap[String(chapter.subjectId)] ?? "Medicine";
      const chapterTitle = chapter.title as string;

      try {
        const [qResults, hyResults] = await Promise.all([
          searchWeb(`${chapterTitle} ${subjectName} NEET PG MCQ questions 2024`, 5),
          searchWeb(`${chapterTitle} ${subjectName} high yield notes NEET PG`, 5),
        ]);

        const context = [
          buildSearchContext(qResults),
          buildSearchContext(hyResults),
        ].join("\n\n---\n\n");

        const content = await processChapterContent(chapterTitle, subjectName, context);

        const currentYear = new Date().getFullYear();

        for (const q of content.questions) {
          const exists = await Question.findOne({ chapterId, question: q.question }).lean();
          if (!exists) {
            await Question.create({
              chapterId,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              examType: q.examType,
              year: currentYear,
              difficulty: q.difficulty,
            });
            questionsAdded++;
          }
        }

        const existingCount = await HighYieldTopic.countDocuments({ chapterId });
        for (let i = 0; i < content.highYieldTopics.length; i++) {
          const topic = content.highYieldTopics[i];
          const exists = await HighYieldTopic.findOne({ chapterId, title: topic.title }).lean();
          if (!exists) {
            await HighYieldTopic.create({
              chapterId,
              title: topic.title,
              description: topic.description,
              keyPoints: topic.keyPoints,
              order: existingCount + i + 1,
            });
            highYieldTopicsAdded++;
          }
        }

        await Chapter.findByIdAndUpdate(chapterId, { $set: { updatedAt: new Date() } });
        chaptersProcessed++;
      } catch (err) {
        const msg = `"${chapterTitle}": ${String(err)}`;
        errorMessages.push(msg);
        console.error(`[Scheduler] ${msg}`);
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    const durationMs = Date.now() - startTime;
    await SchedulerLog.findByIdAndUpdate(log._id, {
      status: "completed",
      chaptersProcessed,
      questionsAdded,
      highYieldTopicsAdded,
      errorMessages,
      durationMs,
    });

    return { chaptersProcessed, questionsAdded, highYieldTopicsAdded, errorMessages, durationMs };
  } catch (err) {
    await SchedulerLog.findByIdAndUpdate(log._id, {
      status: "failed",
      errorMessages: [String(err)],
      durationMs: Date.now() - startTime,
    });
    throw err;
  }
}
