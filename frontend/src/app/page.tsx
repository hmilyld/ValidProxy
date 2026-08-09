"use client";

import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { LiveStatus } from "@/components/live-status";
import { StatsCards } from "@/components/stats-cards";
import { OverviewCharts } from "@/components/overview-charts";
import { FilterBar } from "@/components/filter-bar";
import { ProxyList } from "@/components/proxy-list";
import { useProxies } from "@/hooks/use-proxies";
import { useProxyFilters, PAGE_SIZE } from "@/hooks/use-proxy-filters";
import { SiteFooter } from "@/components/site-footer";

function DashboardContent() {
  const {
    state,
    setFilters,
    setPage,
    handleSort,
    hasActiveFilters,
    clearFilters,
  } = useProxyFilters();

  const { data, isLoading } = useProxies({
    protocol: state.protocol || undefined,
    anonymity: state.anonymity || undefined,
    country: state.country || undefined,
    min_score: state.minScore ? Number(state.minScore) : undefined,
    search: state.search || undefined,
    page: state.page,
    page_size: PAGE_SIZE,
    sort_by: state.sortBy,
    sort_order: state.sortOrder,
  });

  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-6 pb-16 sm:px-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              代理监控
            </h1>
            <p className="text-sm text-muted-foreground">
              实时验证代理可用性，按综合评分排序挑选最优代理。
            </p>
          </div>

          <LiveStatus />

          <StatsCards />

          <OverviewCharts />

          <FilterBar
            filters={state}
            onProtocolChange={(v) => setFilters({ protocol: v })}
            onAnonymityChange={(v) => setFilters({ anonymity: v })}
            onCountryChange={(v) => setFilters({ country: v })}
            onMinScoreChange={(v) => setFilters({ minScore: v })}
            onSearchChange={(v) => setFilters({ search: v })}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <ProxyList
            proxies={data?.items ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? state.page}
            totalPages={data?.total_pages ?? 0}
            isLoading={isLoading}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            onSort={handleSort}
            onPageChange={setPage}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
