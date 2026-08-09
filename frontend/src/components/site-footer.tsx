import { GithubIcon } from "@/components/github-icon";

export const REPO_URL = "https://github.com/hmilyld/ValidProxy";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center sm:text-left">
          <span translate="no">ValidProxy</span>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()}</span>
          <span aria-hidden>·</span>
          <span>每小时自动验证更新</span>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <GithubIcon aria-hidden className="size-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
