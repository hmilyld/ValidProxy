"use client";

import { useState } from "react";
import { StatsCards } from "@/components/stats-cards";
import { FilterBar } from "@/components/filter-bar";
import { ProxyTable } from "@/components/proxy-table";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { useProxies } from "@/hooks/use-proxies";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const [protocol, setProtocol] = useState("");
  const [anonymity, setAnonymity] = useState("");
  const [minScore, setMinScore] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data, isLoading } = useProxies({
    protocol: protocol || undefined,
    anonymity: anonymity || undefined,
    min_score: minScore ? Number(minScore) : undefined,
    search: search || undefined,
    page,
    page_size: 20,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ValidProxy</h1>
            <p className="text-muted-foreground mt-1">
              代理验证工具 - 实时监控代理可用性与评分
            </p>
          </div>
          <RefreshIndicator />
        </div>

        <Separator />

        {/* Stats */}
        <StatsCards />

        {/* Filters */}
        <FilterBar
          protocol={protocol}
          anonymity={anonymity}
          minScore={minScore}
          search={search}
          onProtocolChange={(v) => {
            setProtocol(v);
            setPage(1);
          }}
          onAnonymityChange={(v) => {
            setAnonymity(v);
            setPage(1);
          }}
          onMinScoreChange={(v) => {
            setMinScore(v);
            setPage(1);
          }}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />

        {/* Table */}
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              加载中...
            </div>
          </div>
        ) : (
          <>
            <ProxyTable
              proxies={data?.items ?? []}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            {/* Pagination */}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  共 {data.total} 个代理，第 {data.page}/{data.total_pages} 页
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm rounded-md border bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() =>
                      setPage(Math.min(data.total_pages, page + 1))
                    }
                    disabled={page >= data.total_pages}
                    className="px-3 py-1 text-sm rounded-md border bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
