"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type SortOrder = "asc" | "desc";

export interface ProxyFiltersState {
  protocol: string;
  anonymity: string;
  country: string;
  minScore: string;
  search: string;
  page: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export const DEFAULT_SORT_BY = "score";
export const PAGE_SIZE = 20;

const paramKeys = {
  protocol: "protocol",
  anonymity: "anonymity",
  country: "country",
  minScore: "min_score",
  search: "search",
  page: "page",
  sortBy: "sort_by",
  sortOrder: "sort_order",
} as const;

function readInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

function readSortOrder(value: string | null): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

export function useProxyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo<ProxyFiltersState>(
    () => ({
      protocol: searchParams.get(paramKeys.protocol) ?? "",
      anonymity: searchParams.get(paramKeys.anonymity) ?? "",
      country: searchParams.get(paramKeys.country) ?? "",
      minScore: searchParams.get(paramKeys.minScore) ?? "",
      search: searchParams.get(paramKeys.search) ?? "",
      page: readInt(searchParams.get(paramKeys.page), 1),
      sortBy: searchParams.get(paramKeys.sortBy) ?? DEFAULT_SORT_BY,
      sortOrder: readSortOrder(searchParams.get(paramKeys.sortOrder)),
    }),
    [searchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<Omit<ProxyFiltersState, "page">>) => {
      const next = new URLSearchParams(searchParams.toString());
      (Object.entries(patch) as [keyof ProxyFiltersState, string][]).forEach(
        ([key, value]) => {
          const paramKey = paramKeys[key as keyof typeof paramKeys];
          if (!value) {
            next.delete(paramKey);
          } else {
            next.set(paramKey, String(value));
          }
        }
      );
      next.delete(paramKeys.page);
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        next.delete(paramKeys.page);
      } else {
        next.set(paramKeys.page, String(page));
      }
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: true });
    },
    [router, searchParams]
  );

  const handleSort = useCallback(
    (field: string) => {
      const nextOrder: SortOrder =
        state.sortBy === field && state.sortOrder === "desc" ? "asc" : "desc";
      setFilters({ sortBy: field, sortOrder: nextOrder });
    },
    [state.sortBy, state.sortOrder, setFilters]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        state.protocol ||
          state.anonymity ||
          state.country ||
          state.minScore ||
          state.search
      ),
    [state.protocol, state.anonymity, state.country, state.minScore, state.search]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      protocol: "",
      anonymity: "",
      country: "",
      minScore: "",
      search: "",
    });
  }, [setFilters]);

  return { state, setFilters, setPage, handleSort, hasActiveFilters, clearFilters };
}
