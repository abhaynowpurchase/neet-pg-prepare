import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ISubject } from "@/types";

interface Props {
  subject: ISubject;
  chaptersCount?: number;
  completedCount?: number;
}

export function SubjectCard({ subject, chaptersCount = 0, completedCount = 0 }: Props) {
  const progress = chaptersCount > 0 ? Math.round((completedCount / chaptersCount) * 100) : 0;

  return (
    <Link href={`/subjects/${subject._id}`}>
      <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
          </div>

          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
            {subject.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {subject.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {chaptersCount} chapters
            </div>
            {progress > 0 && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                {progress}% done
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {chaptersCount > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
