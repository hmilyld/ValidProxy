import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter, REPO_URL } from "@/components/site-footer";
import { GithubIcon } from "@/components/github-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BugIcon,
  DatabaseIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  RadioIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "关于 - ValidProxy",
  description: "了解 ValidProxy：实时代理验证监控工具",
};

const FEATURES = [
  {
    icon: RefreshCwIcon,
    title: "定时获取",
    description: "每小时自动从远程数据源同步最新代理列表，保持数据新鲜。",
  },
  {
    icon: ShieldCheckIcon,
    title: "批量验证",
    description: "100 并发异步验证代理可用性，内置验证 URL 故障切换。",
  },
  {
    icon: GaugeIcon,
    title: "综合评分",
    description: "基于响应时间、成功率、匿名等级、协议与稳定性加权计算 0-100 分。",
  },
  {
    icon: Trash2Icon,
    title: "失效清理",
    description: "连续失败达到阈值（默认 3 次）的代理自动删除，避免堆积。",
  },
  {
    icon: RadioIcon,
    title: "实时推送",
    description: "通过 SSE 实时推送获取 / 验证 / 评分进度到 Web 界面。",
  },
  {
    icon: LayoutDashboardIcon,
    title: "便捷界面",
    description: "支持筛选、排序、分页、一键复制与服务器连通性测试、深色模式。",
  },
];

const SCORE_TABLE = [
  { dimension: "响应时间", weight: "30%", method: "<500ms 满分，500-2000ms 线性衰减，>2000ms 为 0" },
  { dimension: "历史成功率", weight: "25%", method: "success_checks / total_checks" },
  { dimension: "匿名等级", weight: "20%", method: "elite=100，transparent=30" },
  { dimension: "协议类型", weight: "15%", method: "https/http=100，socks5=70，socks4=50" },
  { dimension: "历史稳定性", weight: "10%", method: "连续成功次数越多，得分越高" },
];

const GITHUB_LINKS = [
  {
    icon: GithubIcon,
    href: REPO_URL,
    label: "仓库主页",
    description: "浏览源码、Star、Fork 本仓库",
  },
  {
    icon: StarIcon,
    href: `${REPO_URL}/stargazers`,
    label: "Star 列表",
    description: "查看为本项目点过 Star 的开发者",
  },
  {
    icon: BugIcon,
    href: `${REPO_URL}/issues/new`,
    label: "提交 Issue",
    description: "报告 Bug、反馈问题或提功能建议",
  },
  {
    icon: TagIcon,
    href: `${REPO_URL}/releases`,
    label: "版本发布",
    description: "查看 Release 与更新日志",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: (typeof FEATURES)[number]) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-8 pb-16 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GithubIcon aria-hidden className="size-5" />
              </div>
              <Badge variant="outline" className="gap-1">
                <DatabaseIcon aria-hidden className="size-3" />
                Open Source
              </Badge>
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              关于 ValidProxy
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              ValidProxy 是一个开源代理验证与监控工具。它每小时自动从公共数据源同步免费代理列表，
              并以高并发异步验证每个代理的可用性，最终通过综合评分（0-100）帮助你快速筛选出最优代理。
              本项目完全开源，欢迎参与贡献。
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              功能特性
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              评分算法
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>综合评分（0-100）</CardTitle>
                <CardDescription>
                  各维度加权求和，权重反映了对代理质量的影响程度。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2.5">
                  {SCORE_TABLE.map((row) => (
                    <li
                      key={row.dimension}
                      className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium sm:w-32 sm:shrink-0">
                        {row.dimension}
                        <Badge variant="secondary">{row.weight}</Badge>
                      </span>
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        {row.method}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              技术栈
            </h2>
            <Card>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Python 3.13",
                    "FastAPI",
                    "SQLAlchemy 2 (async)",
                    "httpx",
                    "APScheduler",
                    "SQLite",
                    "Next.js 16",
                    "React 19",
                    "TypeScript",
                    "Tailwind CSS v4",
                    "shadcn/ui",
                    "SWR",
                    "Recharts",
                    "Docker",
                  ].map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              GitHub 链接
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GITHUB_LINKS.map(({ icon: Icon, href, label, description }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Card className="transition-colors group-hover:bg-muted/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon aria-hidden className="size-4" />
                        {label}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              本项目数据来源于{" "}
              <a
                href="https://github.com/proxifly/free-proxy-list"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                proxifly/free-proxy-list
              </a>
              。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
