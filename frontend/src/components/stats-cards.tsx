"use client";

import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-proxies";
import {
  formatDecimal,
  formatNumber,
  formatTimeAgo,
} from "@/lib/format";
import {
  CheckCircleIcon,
  ClockIcon,
  DatabaseIcon,
  GaugeIcon,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | undefined;
  description: string;
  icon: ComponentType<{ className?: string }>;
  loading: boolean;
}

function StatCard({ title, value, description, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
              {value}
            </p>
          )}
          {loading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data: stats, isLoading } = useStats();

  const protocolCount = Object.keys(stats?.protocol_distribution ?? {}).length;
  const activeRatio =
    stats && stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  const cards: StatCardProps[] = [
    {
      title: "总代理数",
      value: stats ? formatNumber(stats.total) : undefined,
      description: `来自 ${protocolCount} 种协议`,
      icon: DatabaseIcon,
      loading: isLoading || !stats,
    },
    {
      title: "可用代理",
      value: stats ? formatNumber(stats.active) : undefined,
      description: stats ? `占比 ${formatDecimal(activeRatio)}%` : "…",
      icon: CheckCircleIcon,
      loading: isLoading || !stats,
    },
    {
      title: "平均评分",
      value: stats ? formatDecimal(stats.avg_score, 1) : undefined,
      description: "综合评分 0-100",
      icon: GaugeIcon,
      loading: isLoading || !stats,
    },
    {
      title: "上次验证",
      value: stats?.last_validation_at
        ? formatTimeAgo(stats.last_validation_at)
        : "-",
      description: "每 15 分钟自动更新",
      icon: ClockIcon,
      loading: isLoading || !stats,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
