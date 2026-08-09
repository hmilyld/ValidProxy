const API_BASE = "";

export interface ProxyItem {
  id: number;
  proxy: string;
  protocol: string;
  ip: string;
  port: number;
  country: string;
  city: string;
  anonymity: string;
  https: boolean;
  score: number;
  response_time_ms: number;
  success_rate: number;
  total_checks: number;
  success_checks: number;
  last_checked_at: string | null;
  last_success_at: string | null;
  created_at: string;
}

export interface PaginatedResponse {
  items: ProxyItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProxyStats {
  total: number;
  active: number;
  avg_score: number;
  last_fetch_at: string | null;
  last_validation_at: string | null;
  protocol_distribution: Record<string, number>;
  country_top10: { country: string; count: number }[];
}

export interface ProxyFilters {
  page?: number;
  page_size?: number;
  protocol?: string;
  country?: string;
  anonymity?: string;
  min_score?: number;
  sort_by?: string;
  sort_order?: string;
  search?: string;
}

export async function fetchProxies(
  filters: ProxyFilters = {}
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const res = await fetch(`${API_BASE}/api/proxies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch proxies");
  return res.json();
}

export async function fetchStats(): Promise<ProxyStats> {
  const res = await fetch(`${API_BASE}/api/proxies/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
