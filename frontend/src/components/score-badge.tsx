import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  let color = "bg-red-500/20 text-red-400 border-red-500/30";
  let label = "差";

  if (score >= 80) {
    color = "bg-green-500/20 text-green-400 border-green-500/30";
    label = "优";
  } else if (score >= 60) {
    color = "bg-blue-500/20 text-blue-400 border-blue-500/30";
    label = "良";
  } else if (score >= 40) {
    color = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    label = "中";
  } else if (score > 0) {
    color = "bg-orange-500/20 text-orange-400 border-orange-500/30";
    label = "差";
  } else {
    color = "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    label = "未验证";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs px-2 py-0.5 gap-1",
        color,
        className
      )}
    >
      {score > 0 ? score.toFixed(1) : "-"} {label}
    </Badge>
  );
}
