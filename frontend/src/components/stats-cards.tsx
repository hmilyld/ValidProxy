"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStats } from "@/hooks/use-proxies";
import { Activity, CheckCircle, Globe, TrendingUp } from "lucide-react";

export function StatsCards() {
  const { data: stats } = useStats();

  const cards = [
    {
      title: "总代理数",
      value: stats?.total ?? "-",
      icon: Globe,
      description: `来自 ${Object.keys(stats?.protocol_distribution ?? {}).length} 种协议`,
    },
    {
      title: "可用代理",
      value: stats?.active ?? "-",
      icon: CheckCircle,
      description: `占比 ${stats && stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%`,
    },
    {
      title: "平均评分",
      value: stats?.avg_score?.toFixed(1) ?? "-",
      icon: TrendingUp,
      description: "综合评分 0-100",
    },
    {
      title: "运行状态",
      value: "运行中",
      icon: Activity,
      description: "每 15 分钟更新",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
