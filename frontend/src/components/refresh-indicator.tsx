"use client";

import { useEffect, useState } from "react";

interface ProgressData {
  status: string;
  message: string;
  total?: number;
  validated?: number;
  success?: number;
}

export function RefreshIndicator() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    let eventSource: EventSource;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource("/api/events");

      eventSource.addEventListener("connected", () => {
        if (!progress) {
          setProgress({ status: "idle", message: "已连接，等待验证..." });
        }
      });

      eventSource.addEventListener("progress", (e) => {
        try {
          const data = JSON.parse(e.data) as ProgressData;
          setProgress(data);
          if (data.status === "done") {
            setLastUpdate(new Date().toLocaleTimeString("zh-CN"));
          }
        } catch {}
      });

      eventSource.onerror = () => {
        eventSource.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!progress) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
        连接中...
      </div>
    );
  }

  const isActive = ["fetching", "validating", "scoring"].includes(progress.status);

  return (
    <div className="flex items-center gap-2 text-sm">
      {isActive ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      <span className="text-muted-foreground">{progress.message}</span>
      {progress.total && progress.validated ? (
        <span className="text-muted-foreground">
          ({progress.validated}/{progress.total})
        </span>
      ) : null}
      {lastUpdate && (
        <span className="text-muted-foreground text-xs">
          上次更新: {lastUpdate}
        </span>
      )}
    </div>
  );
}
