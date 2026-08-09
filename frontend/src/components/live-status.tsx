"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { useValidationEvents } from "@/hooks/use-validation-events";
import { formatTime } from "@/lib/format";
import { CheckIcon, CircleAlertIcon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "fetching", label: "获取" },
  { key: "validating", label: "验证" },
  { key: "scoring", label: "评分" },
];

function getStageIndex(status: string | undefined): number {
  switch (status) {
    case "fetching":
    case "fetching_done":
      return 0;
    case "validating":
      return 1;
    case "scoring":
      return 2;
    case "done":
      return 3;
    default:
      return -1;
  }
}

const ACTIVE_STATUSES = ["fetching", "validating", "scoring"];

function statusMessage(status: string | undefined, message?: string): string {
  if (message) return message;
  switch (status) {
    case "idle":
      return "监控就绪，等待下一轮验证…";
    case "fetching":
      return "正在获取代理列表…";
    case "validating":
      return "正在验证代理可用性…";
    case "scoring":
      return "正在计算评分…";
    case "done":
      return "本轮验证完成";
    case "error":
      return "本轮验证出错";
    default:
      return "连接事件服务…";
  }
}

function StageBadge({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  if (state === "done") {
    return (
      <Badge variant="success">
        <CheckIcon />
        {label}
      </Badge>
    );
  }
  if (state === "active") {
    return (
      <Badge variant="outline" className="gap-1.5">
        <LoaderCircleIcon className="size-3 animate-spin motion-reduce:animate-none" />
        {label}
      </Badge>
    );
  }
  return <Badge variant="secondary">{label}</Badge>;
}

export function LiveStatus() {
  const { progress, isConnected, lastCompletedAt } = useValidationEvents();

  const status = progress?.status ?? (isConnected ? "idle" : "connecting");
  const isActive = ACTIVE_STATUSES.includes(status);
  const stageIdx = getStageIndex(status);
  const isDone = status === "done";

  const percent = useMemo(() => {
    if (!progress) return 0;
    if (isDone) return 100;
    if (progress.total && progress.validated != null) {
      return Math.min(
        100,
        Math.round((progress.validated / progress.total) * 100)
      );
    }
    return 0;
  }, [progress, isDone]);

  const dotState =
    status === "error"
      ? "error"
      : isActive
        ? "active"
        : status === "connecting"
          ? "connecting"
          : "idle";

  const dotClass = {
    idle: "bg-[var(--status-success)]",
    active: "bg-[var(--status-info)]",
    connecting: "bg-[var(--status-warning)]",
    error: "bg-[var(--status-danger)]",
  }[dotState];

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2" aria-hidden>
                {isActive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-info)] opacity-75 motion-reduce:hidden" />
                )}
                <span
                  className={cn("relative inline-flex size-2 rounded-full", dotClass)}
                />
              </span>
              <h2 className="text-sm font-medium tracking-tight">实时验证</h2>
            </div>
            <div className="flex items-center gap-1.5">
              {STAGES.map((stage, i) => {
                const done = isDone || i < stageIdx || (status === "fetching_done" && i === 0);
                const active = !done && i === stageIdx && isActive;
                return (
                  <StageBadge
                    key={stage.key}
                    label={stage.label}
                    state={done ? "done" : active ? "active" : "pending"}
                  />
                );
              })}
              {status === "error" && (
                <Badge variant="danger">
                  <CircleAlertIcon />
                  出错
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {isActive && progress?.success != null && (
              <span className="hidden sm:inline">
                成功{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {progress.success}
                </span>
              </span>
            )}
            {lastCompletedAt && (
              <span>上次更新 {formatTime(lastCompletedAt)}</span>
            )}
          </div>
        </div>

        <div aria-live="polite">
          <Progress value={percent} aria-label="验证进度">
            <ProgressLabel>{statusMessage(status, progress?.message)}</ProgressLabel>
            <ProgressValue>
              {(formattedValue, value) =>
                progress?.validated != null && progress?.total
                  ? `${progress.validated}/${progress.total}`
                  : (formattedValue ??
                    `${Math.round(value ?? 0)}%`)
              }
            </ProgressValue>
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveStatusBadge() {
  const { progress, isConnected } = useValidationEvents();

  const status = progress?.status ?? (isConnected ? "idle" : "connecting");
  const isActive = ACTIVE_STATUSES.includes(status);

  let label = "连接中…";
  let dotClass = "bg-[var(--status-warning)]";
  if (status === "idle") {
    label = "监控中";
    dotClass = "bg-[var(--status-success)]";
  } else if (status === "done") {
    label = "已完成";
    dotClass = "bg-[var(--status-success)]";
  } else if (status === "error") {
    label = "出错";
    dotClass = "bg-[var(--status-danger)]";
  } else if (isActive) {
    if (progress?.total) {
      label = `验证中 ${progress.validated ?? 0}/${progress.total}`;
    } else {
      label = "验证中…";
    }
    dotClass = "bg-[var(--status-info)]";
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5 px-2.5 py-1"
      aria-label={`验证状态：${label}`}
    >
      <span className="relative flex size-2" aria-hidden>
        {isActive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-info)] opacity-75 motion-reduce:hidden" />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", dotClass)} />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}
