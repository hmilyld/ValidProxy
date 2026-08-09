"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterBarProps {
  protocol: string;
  anonymity: string;
  minScore: string;
  search: string;
  onProtocolChange: (v: string) => void;
  onAnonymityChange: (v: string) => void;
  onMinScoreChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

export function FilterBar({
  protocol,
  anonymity,
  minScore,
  search,
  onProtocolChange,
  onAnonymityChange,
  onMinScoreChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索 IP 或代理地址..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={protocol || "__all__"}
        onValueChange={(v) => onProtocolChange(v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="协议" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部协议</SelectItem>
          <SelectItem value="http">HTTP</SelectItem>
          <SelectItem value="socks5">SOCKS5</SelectItem>
          <SelectItem value="socks4">SOCKS4</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={anonymity || "__all__"}
        onValueChange={(v) => onAnonymityChange(v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="匿名等级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部等级</SelectItem>
          <SelectItem value="elite">Elite</SelectItem>
          <SelectItem value="transparent">Transparent</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={minScore || "__all__"}
        onValueChange={(v) => onMinScoreChange(v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="最低评分" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">不限评分</SelectItem>
          <SelectItem value="80">80+ 优</SelectItem>
          <SelectItem value="60">60+ 良</SelectItem>
          <SelectItem value="40">40+ 中</SelectItem>
          <SelectItem value="20">20+ 可用</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
