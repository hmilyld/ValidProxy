"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { testProxy } from "@/lib/api";
import { formatLatency } from "@/lib/format";
import {
  CheckIcon,
  CircleAlertIcon,
  LoaderCircleIcon,
  ZapIcon,
} from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function TestProxyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  async function handleTest() {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus("loading");
    setLatency(null);
    setError(null);
    try {
      const result = await testProxy(value);
      if (result.success) {
        setStatus("success");
        setLatency(result.response_time_ms);
      } else {
        setStatus("error");
        setError(result.error ?? "代理不可用");
      }
    } catch {
      setStatus("error");
      setError("测试请求失败");
    } finally {
      runningRef.current = false;
    }
  }

  const resultLabel =
    status === "loading"
      ? "测试中…"
      : status === "success"
        ? `可用 · ${formatLatency(latency)}`
        : status === "error"
          ? `不可用${error ? ` · ${error}` : ""}`
          : "测试可用性";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={resultLabel}
            disabled={status === "loading"}
            onClick={handleTest}
          >
            {status === "loading" ? (
              <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : status === "success" ? (
              <CheckIcon className="size-3.5 text-[var(--status-success)]" />
            ) : status === "error" ? (
              <CircleAlertIcon className="size-3.5 text-[var(--status-danger)]" />
            ) : (
              <ZapIcon className="size-3.5" />
            )}
          </Button>
        }
      />
      <TooltipContent>{resultLabel}</TooltipContent>
    </Tooltip>
  );
}
