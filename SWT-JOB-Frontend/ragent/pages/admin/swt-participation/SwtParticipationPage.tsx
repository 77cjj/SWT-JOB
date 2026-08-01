import { useEffect, useMemo, useState } from "react";
import { Globe2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getSwtParticipationStats,
  type SwtParticipationRankItem,
  type SwtParticipationYear,
} from "@/services/swtParticipationService";
import { getErrorMessage } from "@/utils/error";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDelta(current: number, previous: number): string {
  const delta = current - previous;
  const pct = previous === 0 ? 0 : (delta / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatCount(delta)} (${sign}${pct.toFixed(1)}%)`;
}

function RankTable({
  title,
  rows,
  compareRows,
}: {
  title: string;
  rows: SwtParticipationRankItem[];
  compareRows?: SwtParticipationRankItem[];
}) {
  const compareByName = useMemo(() => {
    const map = new Map<string, SwtParticipationRankItem>();
    compareRows?.forEach((item) => map.set(item.name, item));
    return map;
  }, [compareRows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">排名</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="text-right">人数</TableHead>
              {compareRows ? <TableHead className="text-right">同比变化</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const prev = compareByName.get(row.name);
              const delta =
                prev != null ? row.count - prev.count : null;
              return (
                <TableRow key={`${row.rank}-${row.name}`}>
                  <TableCell className="font-medium text-muted-foreground">{row.rank}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.count)}</TableCell>
                  {compareRows ? (
                    <TableCell
                      className={cn(
                        "text-right tabular-nums text-sm",
                        delta == null
                          ? "text-muted-foreground"
                          : delta > 0
                            ? "text-emerald-600"
                            : delta < 0
                              ? "text-rose-600"
                              : "text-muted-foreground",
                      )}
                    >
                      {delta == null
                        ? "—"
                        : `${delta >= 0 ? "+" : ""}${formatCount(delta)}`}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function SwtParticipationPage() {
  const [years, setYears] = useState<SwtParticipationYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getSwtParticipationStats();
      const sorted = [...data.years].sort((a, b) => b.year - a.year);
      setYears(sorted);
      setSelectedYear((current) => current ?? sorted[0]?.year ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, "加载 SWT 参与统计失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(
    () => years.find((item) => item.year === selectedYear) ?? null,
    [years, selectedYear],
  );

  const previous = useMemo(() => {
    if (!selected) return null;
    return years.find((item) => item.year === selected.year - 1) ?? null;
  }, [years, selected]);

  const overviewRows = useMemo(() => {
    return [...years]
      .sort((a, b) => a.year - b.year)
      .map((item, index, arr) => {
        const prev = index > 0 ? arr[index - 1] : null;
        return {
          year: item.year,
          total: item.totalVisitors,
          delta: prev ? formatDelta(item.totalVisitors, prev.totalVisitors) : "—",
        };
      });
  }, [years]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">SWT 参与统计</h1>
          <p className="admin-page-subtitle">
            BridgeUSA Summer Work Travel 年度总体参与人数与 Top 20 来源国 / 美国目的地
          </p>
        </div>
        <div className="admin-page-actions">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>

      {loading && years.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          加载中…
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {years.map((item) => (
              <Card key={item.year}>
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.year} 总参与人数</p>
                    <p className="text-2xl font-bold tabular-nums">{formatCount(item.totalVisitors)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {years.length >= 2 ? (
              <Card>
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">最新年度同比</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatDelta(years[0].totalVisitors, years[1].totalVisitors)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">年度总体参与人数</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>年份</TableHead>
                    <TableHead className="text-right">总参与人数</TableHead>
                    <TableHead className="text-right">较上年变化</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviewRows.map((row) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCount(row.total)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {row.delta}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mb-4 flex flex-wrap gap-2">
            {years.map((item) => (
              <Button
                key={item.year}
                size="sm"
                variant={selectedYear === item.year ? "default" : "outline"}
                className={selectedYear === item.year ? "admin-primary-gradient" : undefined}
                onClick={() => setSelectedYear(item.year)}
              >
                {item.year}
              </Button>
            ))}
          </div>

          {selected ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                数据来源：{selected.source}
              </p>
              <div className="grid gap-6 xl:grid-cols-2">
                <RankTable
                  title={`${selected.year} Top 20 来源国`}
                  rows={selected.sendingCountries}
                  compareRows={previous?.sendingCountries}
                />
                <RankTable
                  title={`${selected.year} Top 20 美国目的地（州）`}
                  rows={selected.usDestinations}
                  compareRows={previous?.usDestinations}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
