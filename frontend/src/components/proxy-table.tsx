"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBadge } from "./score-badge";
import { ProxyItem } from "@/lib/api";

interface ProxyTableProps {
  proxies: ProxyItem[];
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
}

function SortIndicator({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: string;
}) {
  if (field !== sortBy) return null;
  return (
    <span className="ml-1 text-primary">
      {sortOrder === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function ProxyTable({
  proxies,
  sortBy,
  sortOrder,
  onSort,
}: ProxyTableProps) {
  const columns = [
    { key: "proxy", label: "代理地址", sortable: false },
    { key: "protocol", label: "协议", sortable: true },
    { key: "country", label: "国家", sortable: true },
    { key: "anonymity", label: "匿名等级", sortable: true },
    { key: "response_time_ms", label: "响应时间", sortable: true },
    { key: "success_rate", label: "成功率", sortable: true },
    { key: "score", label: "评分", sortable: true },
    { key: "last_checked_at", label: "最后验证", sortable: true },
  ];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.sortable ? "cursor-pointer select-none" : ""}
                onClick={() => col.sortable && onSort(col.key)}
              >
                {col.label}
                <SortIndicator
                  field={col.key}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {proxies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                暂无数据，等待首次验证完成...
              </TableCell>
            </TableRow>
          ) : (
            proxies.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.proxy}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium uppercase">
                    {p.protocol}
                  </span>
                </TableCell>
                <TableCell>{p.country}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs ${
                      p.anonymity === "elite"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {p.anonymity}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {p.response_time_ms > 0 ? `${p.response_time_ms.toFixed(0)}ms` : "-"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {p.total_checks > 0
                    ? `${(p.success_rate * 100).toFixed(1)}%`
                    : "-"}
                </TableCell>
                <TableCell>
                  <ScoreBadge score={p.score} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.last_checked_at
                    ? new Date(p.last_checked_at).toLocaleString("zh-CN")
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
