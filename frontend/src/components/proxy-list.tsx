"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProxyTable } from "@/components/proxy-table";
import { ProxyCards } from "@/components/proxy-cards";
import { ProxyPagination } from "@/components/proxy-pagination";
import { formatNumber } from "@/lib/format";
import type { ProxyItem } from "@/lib/api";
import type { SortOrder } from "@/hooks/use-proxy-filters";
import {
  ArrowDownWideNarrowIcon,
  ArrowUpWideNarrowIcon,
  CheckIcon,
  GlobeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "score", label: "评分" },
  { value: "response_time_ms", label: "响应时间" },
  { value: "success_rate", label: "成功率" },
  { value: "last_checked_at", label: "最后验证" },
  { value: "country", label: "国家" },
] as const;

interface ProxyListProps {
  proxies: ProxyItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

function SortMenu({
  sortBy,
  sortOrder,
  onSort,
}: {
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
}) {
  const activeLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "评分";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <span className="sr-only">选择排序方式</span>
            {sortOrder === "asc" ? (
              <ArrowUpWideNarrowIcon />
            ) : (
              <ArrowDownWideNarrowIcon />
            )}
            {activeLabel}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>排序方式</DropdownMenuLabel>
        </DropdownMenuGroup>
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onSort(opt.value)}
            data-active={sortBy === opt.value}
            className={cn(
              sortBy === opt.value && "bg-accent text-accent-foreground"
            )}
          >
            {opt.label}
            {sortBy === opt.value && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProxyList({
  proxies,
  total,
  page,
  totalPages,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
}: ProxyListProps) {
  const isEmpty = !isLoading && proxies.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          共{" "}
          <span className="font-mono tabular-nums text-foreground">
            {formatNumber(total)}
          </span>{" "}
          个代理
        </p>
        <div className="lg:hidden">
          <SortMenu sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </div>
      </div>

      {isEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GlobeIcon />
            </EmptyMedia>
            <EmptyTitle>暂无代理数据</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            当前筛选条件下没有匹配的代理，等待下一轮验证，或尝试调整筛选条件。
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="hidden lg:block">
            <ProxyTable
              proxies={proxies}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:hidden">
            <ProxyCards proxies={proxies} isLoading={isLoading} />
          </div>

          <ProxyPagination
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}
