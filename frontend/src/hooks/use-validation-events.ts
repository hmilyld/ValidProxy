"use client";

import { useSyncExternalStore } from "react";

export interface ValidationProgress {
  status: string;
  message: string;
  total?: number;
  validated?: number;
  success?: number;
  timestamp?: string;
}

type Listener = () => void;

let eventSource: EventSource | null = null;
let connected = false;
let current: ValidationProgress | null = null;
let lastCompletedAt: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function connect() {
  if (eventSource) return;
  eventSource = new EventSource("/api/events");

  eventSource.addEventListener("connected", () => {
    connected = true;
    if (!current) {
      current = { status: "idle", message: "已连接，等待验证…" };
    }
    emit();
  });

  eventSource.addEventListener("progress", (event) => {
    try {
      const data = JSON.parse(event.data) as ValidationProgress;
      current = data;
      if (data.status === "done") {
        lastCompletedAt = data.timestamp ?? new Date().toISOString();
      }
      emit();
    } catch {}
  });

  eventSource.onerror = () => {
    close();
    connected = false;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 3000);
  };
}

function close() {
  clearTimeout(reconnectTimer);
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      close();
      connected = false;
    }
  };
}

function getSnapshot() {
  return current;
}

function getConnectionSnapshot() {
  return connected;
}

function getLastCompletedSnapshot() {
  return lastCompletedAt;
}

export function useValidationEvents() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const isConnected = useSyncExternalStore(
    subscribe,
    getConnectionSnapshot,
    () => false
  );
  const lastCompletedAt = useSyncExternalStore(
    subscribe,
    getLastCompletedSnapshot,
    () => null
  );

  return { progress, isConnected, lastCompletedAt };
}
