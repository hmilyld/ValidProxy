"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStats } from "@/hooks/use-proxies";
import type { ProxyFiltersState } from "@/hooks/use-proxy-filters";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

const EMPTY_VALUE = "__all__";

const PROTOCOL_ITEMS = {
  [EMPTY_VALUE]: "全部协议",
  http: "HTTP",
  https: "HTTPS",
  socks5: "SOCKS5",
  socks4: "SOCKS4",
};

const ANONYMITY_ITEMS = {
  [EMPTY_VALUE]: "全部等级",
  elite: "Elite",
  transparent: "Transparent",
};

const SCORE_ITEMS = {
  [EMPTY_VALUE]: "不限评分",
  "80": "80+ 优",
  "60": "60+ 良",
  "40": "40+ 中",
  "20": "20+ 可用",
};

interface FilterBarProps {
  filters: ProxyFiltersState;
  onProtocolChange: (v: string) => void;
  onAnonymityChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onMinScoreChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

interface FilterFieldsProps {
  filters: ProxyFiltersState;
  onProtocolChange: (v: string) => void;
  onAnonymityChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onMinScoreChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

function DebouncedSearchInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <div className="relative flex-1">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <label htmlFor={id} className="sr-only">
        搜索代理地址
      </label>
      <Input
        id={id}
        name="search"
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="搜索 IP 或代理地址…"
        className="pl-8"
      />
    </div>
  );
}

function FilterSelects({
  filters,
  onProtocolChange,
  onAnonymityChange,
  onCountryChange,
  onMinScoreChange,
}: Omit<FilterFieldsProps, "onSearchChange">) {
  const { data: stats } = useStats();
  const countries = stats?.country_top10.map((c) => c.country) ?? [];

  return (
    <>
      <Select
        items={PROTOCOL_ITEMS}
        value={filters.protocol || EMPTY_VALUE}
        onValueChange={(v) =>
          onProtocolChange(!v || v === EMPTY_VALUE ? "" : v)
        }
      >
        <SelectTrigger className="w-[128px]" aria-label="协议筛选">
          <SelectValue placeholder="协议" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={EMPTY_VALUE} label="全部协议">全部协议</SelectItem>
            <SelectItem value="http" label="HTTP">HTTP</SelectItem>
            <SelectItem value="https" label="HTTPS">HTTPS</SelectItem>
            <SelectItem value="socks5" label="SOCKS5">SOCKS5</SelectItem>
            <SelectItem value="socks4" label="SOCKS4">SOCKS4</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        items={ANONYMITY_ITEMS}
        value={filters.anonymity || EMPTY_VALUE}
        onValueChange={(v) =>
          onAnonymityChange(!v || v === EMPTY_VALUE ? "" : v)
        }
      >
        <SelectTrigger className="w-[128px]" aria-label="匿名等级筛选">
          <SelectValue placeholder="匿名等级" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={EMPTY_VALUE} label="全部等级">全部等级</SelectItem>
            <SelectItem value="elite" label="Elite">Elite</SelectItem>
            <SelectItem value="transparent" label="Transparent">Transparent</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {countries.length > 0 && (
        <Select
          items={{
            [EMPTY_VALUE]: "全部国家",
            ...Object.fromEntries(countries.map((c) => [c, c])),
          }}
          value={filters.country || EMPTY_VALUE}
          onValueChange={(v) =>
            onCountryChange(!v || v === EMPTY_VALUE ? "" : v)
          }
        >
          <SelectTrigger className="w-[132px]" aria-label="国家筛选">
            <SelectValue placeholder="国家" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={EMPTY_VALUE} label="全部国家">全部国家</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country} label={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <Select
        items={SCORE_ITEMS}
        value={filters.minScore || EMPTY_VALUE}
        onValueChange={(v) =>
          onMinScoreChange(!v || v === EMPTY_VALUE ? "" : v)
        }
      >
        <SelectTrigger className="w-[120px]" aria-label="最低评分筛选">
          <SelectValue placeholder="最低评分" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={EMPTY_VALUE} label="不限评分">不限评分</SelectItem>
            <SelectItem value="80" label="80+ 优">80+ 优</SelectItem>
            <SelectItem value="60" label="60+ 良">60+ 良</SelectItem>
            <SelectItem value="40" label="40+ 中">40+ 中</SelectItem>
            <SelectItem value="20" label="20+ 可用">20+ 可用</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}

function ActiveFilterCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-medium text-primary-foreground">
      {count}
    </span>
  );
}

export function FilterBar({
  filters,
  onProtocolChange,
  onAnonymityChange,
  onCountryChange,
  onMinScoreChange,
  onSearchChange,
  onClear,
  hasActiveFilters,
}: FilterBarProps) {
  const activeCount = [
    filters.protocol,
    filters.anonymity,
    filters.country,
    filters.minScore,
    filters.search,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-3">
        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <DebouncedSearchInput
            id="proxy-search-desktop"
            value={filters.search}
            onChange={onSearchChange}
          />
          <FilterSelects
            filters={filters}
            onProtocolChange={onProtocolChange}
            onAnonymityChange={onAnonymityChange}
            onCountryChange={onCountryChange}
            onMinScoreChange={onMinScoreChange}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <XIcon />
              清除
            </Button>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <DebouncedSearchInput
            id="proxy-search-mobile"
            value={filters.search}
            onChange={onSearchChange}
          />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="shrink-0">
                  <span className="sr-only">打开筛选</span>
                  <SlidersHorizontalIcon />
                  <ActiveFilterCount count={activeCount} />
                </Button>
              }
            />
            <SheetContent
              side="bottom"
              className="max-h-[85dvh] pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <SheetHeader>
                <SheetTitle>筛选代理</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain p-4">
                <DebouncedSearchInput
                  id="proxy-search-sheet"
                  value={filters.search}
                  onChange={onSearchChange}
                />
                <FilterSelects
                  filters={filters}
                  onProtocolChange={onProtocolChange}
                  onAnonymityChange={onAnonymityChange}
                  onCountryChange={onCountryChange}
                  onMinScoreChange={onMinScoreChange}
                />
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={onClear}
                  disabled={!hasActiveFilters}
                >
                  <XIcon />
                  清除筛选
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between md:hidden">
            <Badge variant="outline" className="text-xs">
              已应用 {activeCount} 项筛选
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
