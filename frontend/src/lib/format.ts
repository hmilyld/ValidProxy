const numberFormat = new Intl.NumberFormat("zh-CN");

const percentFormat = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
});

const dateTimeFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatNumber(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return numberFormat.format(n);
}

export function formatDecimal(
  n: number | undefined | null,
  digits = 1
): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toLocaleString("zh-CN", { maximumFractionDigits: digits });
}

export function formatPercent(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return `${percentFormat.format(n * 100)}%`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateTimeFormat.format(date);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return timeFormat.format(date);
}

export function formatTimeAgo(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function formatLatency(ms: number | undefined | null): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "-";
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
