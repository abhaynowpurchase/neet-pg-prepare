import { BookOpen, CheckCircle2, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface Props {
  totalChapters: number;
  completedChapters: number;
  avgScore: number;
  streak: number;
}

export function ProgressStats({ totalChapters, completedChapters, avgScore, streak }: Props) {
  const stats: Stat[] = [
    {
      label: "Chapters Read",
      value: `${completedChapters}/${totalChapters}`,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Completed",
      value: totalChapters > 0 ? `${Math.round((completedChapters / totalChapters) * 100)}%` : "0%",
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/5",
    },
    {
      label: "Avg Quiz Score",
      value: avgScore > 0 ? `${avgScore}%` : "—",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Day Streak",
      value: streak,
      icon: Trophy,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor} mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
