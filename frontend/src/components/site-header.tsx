import { ThemeToggle } from "@/components/theme-toggle";
import { LiveStatusBadge } from "@/components/live-status";
import { RadarIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <RadarIcon aria-hidden className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              translate="no"
              className="font-heading truncate text-sm font-semibold tracking-tight"
            >
              ValidProxy
            </span>
            <span className="hidden text-[0.7rem] text-muted-foreground md:block">
              代理验证 · 实时监控
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LiveStatusBadge />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
