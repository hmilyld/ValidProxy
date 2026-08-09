"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBadge } from "@/components/score-badge";
import { ProtocolBadge } from "@/components/badges";
import { CopyProxyButton } from "@/components/copy-proxy-button";
import { TestProxyButton } from "@/components/test-proxy-button";
import { formatLatency, formatPercent, formatTimeAgo } from "@/lib/format";
import type { ProxyItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProxyCardsProps {
  proxies: ProxyItem[];
  isLoading: boolean;
  className?: string;
}

export function ProxyCards({ proxies, isLoading, className }: ProxyCardsProps) {
  if (isLoading && proxies.length === 0) {
    return (
      <div className={cn("grid grid-cols-1 gap-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3", className)}>
      {proxies.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate font-mono text-sm font-medium">
                    {p.proxy}
                  </p>
                  <CopyProxyButton value={p.proxy} />
                  <TestProxyButton value={p.proxy} />
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <ProtocolBadge protocol={p.protocol} https={p.https} />
                  <span className="truncate">{p.country || "-"}</span>
                </div>
              </div>
              <ScoreBadge score={p.score} className="shrink-0" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
              <div className="min-w-0">
                <p className="text-muted-foreground">响应时间</p>
                <p className="mt-0.5 truncate font-mono tabular-nums">
                  {formatLatency(p.response_time_ms)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">成功率</p>
                <p className="mt-0.5 truncate font-mono tabular-nums">
                  {p.total_checks > 0 ? formatPercent(p.success_rate) : "-"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">最后验证</p>
                <p className="mt-0.5 truncate">
                  {p.last_checked_at ? formatTimeAgo(p.last_checked_at) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
