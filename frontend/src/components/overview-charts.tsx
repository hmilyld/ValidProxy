"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle } from "@/components/ui/empty";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useStats } from "@/hooks/use-proxies";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const protocolConfig: ChartConfig = {
  count: { label: "数量" },
  http: { label: "HTTP", color: "var(--chart-1)" },
  https: { label: "HTTPS", color: "var(--chart-2)" },
  socks5: { label: "SOCKS5", color: "var(--chart-3)" },
  socks4: { label: "SOCKS4", color: "var(--chart-4)" },
};

const countryConfig: ChartConfig = {
  count: { label: "代理数", color: "var(--chart-2)" },
};

export function OverviewCharts() {
  const { data: stats, isLoading } = useStats();

  const protocolData = Object.entries(stats?.protocol_distribution ?? {})
    .map(([protocol, count]) => ({ protocol, count }))
    .sort((a, b) => b.count - a.count);

  const countryData = stats?.country_top10 ?? [];

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">协议分布</CardTitle>
          <CardDescription>当前代理库的协议构成</CardDescription>
        </CardHeader>
        <CardContent>
          {protocolData.length === 0 ? (
            <Empty>
              <EmptyTitle>暂无协议数据</EmptyTitle>
            </Empty>
          ) : (
            <ChartContainer
              config={protocolConfig}
              className="mx-auto aspect-square h-[220px] max-w-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="protocol" />}
                />
                <Pie
                  data={protocolData}
                  dataKey="count"
                  nameKey="protocol"
                  innerRadius={58}
                  outerRadius={82}
                  strokeWidth={4}
                >
                  {protocolData.map((entry) => (
                    <Cell
                      key={entry.protocol}
                      fill={
                        protocolConfig[entry.protocol]?.color
                          ? `var(--color-${entry.protocol})`
                          : "var(--chart-5)"
                      }
                    />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="protocol" />}
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">国家 Top 10</CardTitle>
          <CardDescription>代理来源国分布</CardDescription>
        </CardHeader>
        <CardContent>
          {countryData.length === 0 ? (
            <Empty>
              <EmptyTitle>暂无国家数据</EmptyTitle>
            </Empty>
          ) : (
            <ChartContainer
              config={countryConfig}
              className="h-[260px] w-full"
            >
              <BarChart
                data={countryData}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="country"
                  type="category"
                  width={104}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={4}>
                  {countryData.map((entry, i) => (
                    <Cell
                      key={entry.country}
                      fill={`var(--chart-${(i % 5) + 1})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
