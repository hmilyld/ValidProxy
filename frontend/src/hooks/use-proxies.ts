"use client";

import useSWR from "swr";
import {
  fetchProxies,
  fetchStats,
  ProxyFilters,
  PaginatedResponse,
  ProxyStats,
} from "@/lib/api";

export function useProxies(filters: ProxyFilters) {
  const key = `/api/proxies?${new URLSearchParams(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString()}`;

  return useSWR<PaginatedResponse>(key, () => fetchProxies(filters), {
    refreshInterval: 30000, // 30 秒自动刷新
  });
}

export function useStats() {
  return useSWR<ProxyStats>("/api/proxies/stats", fetchStats, {
    refreshInterval: 15000, // 15 秒刷新
  });
}
