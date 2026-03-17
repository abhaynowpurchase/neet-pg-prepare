import Link from "next/link";
import { BookOpen, Clock, CheckCircle2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IChapter, IUserProgress } from "@/types";
import { formatReadTime } from "@/lib/utils";

interface Props {
  chapter: IChapter;
  subjectId: string;
  progress?: IUserProgress;
  order: number;
}

export function ChapterCard({ chapter, subjectId, progress, order }: Props) {
  const isCompleted = progress?.storyCompleted;
  const quizScore = progress?.quizScore;

  return (
    <Link href={`/chapters/${chapter._id}`}>
      <Card
        className={`group hover:shadow-md transition-all cursor-pointer ${
          isCompleted ? "border-primary/30 bg-primary/[0.02]" : ""
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Number badge */}
            <div
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                order
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {chapter.title}
                </h3>
                {quizScore !== undefined && (
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 text-xs border-primary/30 text-primary"
                  >
                    {quizScore}%
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {chapter.description}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  {formatReadTime(chapter.estimatedReadTime)}
                </span>
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 size={12} />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <PlayCircle size={12} />
                    Start reading
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
