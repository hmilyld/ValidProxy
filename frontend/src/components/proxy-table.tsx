"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBadge } from "@/components/score-badge";
import { ProtocolBadge, AnonymityBadge } from "@/components/badges";
import { formatLatency, formatPercent, formatTimeAgo } from "@/lib/format";
import type { ProxyItem } from "@/lib/api";
import type { SortOrder } from "@/hooks/use-proxy-filters";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

const SORTABLE = new Set([
  "country",
  "response_time_ms",
  "success_rate",
  "score",
  "last_checked_at",
]);

const COLUMNS = [
  { key: "proxy", label: "代理地址" },
  { key: "protocol", label: "协议" },
  { key: "country", label: "国家" },
  { key: "anonymity", label: "匿名等级" },
  { key: "response_time_ms", label: "响应时间" },
  { key: "success_rate", label: "成功率" },
  { key: "score", label: "评分" },
  { key: "last_checked_at", label: "最后验证" },
] as const;

interface ProxyTableProps {
  proxies: ProxyItem[];
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
  isLoading: boolean;
}

function SortableHead({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = sortBy === field;
  return (
    <TableHead
      aria-sort={
        active ? (sortOrder === "asc" ? "ascending" : "descending") : undefined
      }
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {label}
        <span aria-hidden>
          {active &&
            (sortOrder === "asc" ? (
              <ArrowUpIcon className="size-3" />
            ) : (
              <ArrowDownIcon className="size-3" />
            ))}
        </span>
      </button>
    </TableHead>
  );
}

export function ProxyTable({
  proxies,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
}: ProxyTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) =>
              SORTABLE.has(col.key) ? (
                <SortableHead
                  key={col.key}
                  label={col.label}
                  field={col.key}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              ) : (
                <TableHead key={col.key}>{col.label}</TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && proxies.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : proxies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="block max-w-[220px] truncate font-mono text-xs">
                      {p.proxy}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ProtocolBadge protocol={p.protocol} https={p.https} />
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-sm">
                    {p.country || "-"}
                  </TableCell>
                  <TableCell>
                    <AnonymityBadge anonymity={p.anonymity} />
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {formatLatency(p.response_time_ms)}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {p.total_checks > 0 ? formatPercent(p.success_rate) : "-"}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={p.score} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.last_checked_at ? (
                      <span title={p.last_checked_at}>
                        {formatTimeAgo(p.last_checked_at)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
