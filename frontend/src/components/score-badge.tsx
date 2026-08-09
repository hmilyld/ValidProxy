import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  let variant: "success" | "info" | "warning" | "danger" | "secondary" =
    "secondary";
  let label = "未验证";

  if (score >= 80) {
    variant = "success";
    label = "优";
  } else if (score >= 60) {
    variant = "info";
    label = "良";
  } else if (score >= 40) {
    variant = "warning";
    label = "中";
  } else if (score > 0) {
    variant = "danger";
    label = "差";
  }

  return (
    <Badge
      variant={variant}
      className={cn("font-mono text-xs tabular-nums", className)}
    >
      {score > 0 ? score.toFixed(1) : "-"} {label}
    </Badge>
  );
}
