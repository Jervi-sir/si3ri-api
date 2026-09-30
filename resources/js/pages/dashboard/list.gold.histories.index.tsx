import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  DollarSign,
  Filter,
  History,
  LayoutGrid,
  RefreshCw,
  Table as TableIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { histories as historiesRoute } from '@/actions/App/Http/Controllers/GoldPriceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface MetalRateRecord {
  id: number;
  karat: string;
  rate: string | number;
  buy_price?: string | number | null;
  sell_price?: string | number | null;
  currency: string;
  unit: string;
  occurred_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  prev_page_url: string | null;
  next_page_url: string | null;
  links: PaginationLink[];
}

interface Props {
  histories: PaginatedData<MetalRateRecord>;
  selectedKarat: string;
  range: string;
  currencyRate?: {
    rate: string | number;
    pair: string;
  } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: "Prix de l'Or",
    href: '/dashboard/gold-prices',
  },
  {
    title: 'Historique des Cours',
    href: '/dashboard/gold-histories',
  },
];

const KARAT_OPTIONS = [
  { value: '18k_italian', label: '18K Or Italien (75.0%)', purity: '75.0%' },
  { value: '18k', label: '18K Local Standard (75.0%)', purity: '75.0%' },
  { value: '18k_scrap', label: '18K Casse / Rachat (75.0%)', purity: '75.0%' },
  { value: '21k', label: '21K Moyen-Orient (87.5%)', purity: '87.5%' },
  { value: '22k', label: '22K Golfe (91.6%)', purity: '91.6%' },
  { value: '24k', label: '24K Lingot Pur (100%)', purity: '100%' },
  { value: '16k', label: '16K Commercial (66.7%)', purity: '66.7%' },
  { value: '14k', label: '14K Économique (58.3%)', purity: '58.3%' },
  { value: '9k', label: '9K Basse Pureté (37.5%)', purity: '37.5%' },
];

const chartConfig = {
  rate: {
    label: 'Prix Référence (Base)',
    color: 'var(--color-rate, #f59e0b)',
  },
  sell_price: {
    label: 'Vente Boutique',
    color: 'var(--color-sell, #d97706)',
  },
  buy_price: {
    label: 'Rachat Casse',
    color: 'var(--color-buy, #10b981)',
  },
} satisfies ChartConfig;

export default function ListGoldHistories({
  histories,
  selectedKarat,
  range,
  currencyRate,
}: Props) {
  const [karat, setKarat] = useState(selectedKarat);
  const [timeRange, setTimeRange] = useState(range);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'both'>('chart');

  const handleFilterChange = (newKarat: string, newRange: string) => {
    setKarat(newKarat);
    setTimeRange(newRange);
    router.get(
      historiesRoute.url({
        query: {
          karat: newKarat,
          range: newRange,
        },
      }),
      {},
      { preserveState: true }
    );
  };

  // Format and sort chronological records for Recharts
  const chartData = useMemo(() => {
    return [...histories.data]
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .map((d) => ({
        date: d.occurred_at,
        rate: Number(d.rate),
        sell_price: d.sell_price ? Number(d.sell_price) : Number(d.rate),
        buy_price: d.buy_price ? Number(d.buy_price) : Number(d.rate) * 0.95,
      }));
  }, [histories.data]);

  // Statistics
  const latestRecord = chartData[chartData.length - 1];
  const firstRecord = chartData[0];
  const highRate = chartData.length > 0 ? Math.max(...chartData.map((d) => d.rate)) : 0;
  const lowRate = chartData.length > 0 ? Math.min(...chartData.map((d) => d.rate)) : 0;
  const changePct = firstRecord && latestRecord && firstRecord.rate > 0
    ? ((latestRecord.rate - firstRecord.rate) / firstRecord.rate) * 100
    : 0;
  const isPositive = changePct >= 0;

  const currentKaratInfo = KARAT_OPTIONS.find((k) => k.value === karat) || KARAT_OPTIONS[0];

  return (
    <AppLayout>
      <Head title="Historique & Snapshots des Cours de l'Or" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
              <History className="h-3.5 w-3.5" />
              Journal des Snapshots & Graphiques
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Historique des Prix & Tarifs de l'Or
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visualisez les tendances interactives et le journal complet des captures toutes les 10 minutes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" asChild size="sm" className="rounded-xl shadow-xs font-semibold">
              <Link href="/dashboard/gold-prices">
                <Coins className="h-4 w-4 mr-1.5 text-amber-500" />
                Voir Direct Marché
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Karat selector */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground">Titrage :</span>
            </div>
            <select
              value={karat}
              onChange={(e) => handleFilterChange(e.target.value, timeRange)}
              className="rounded-xl border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-xs"
            >
              {KARAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              {(['24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleFilterChange(karat, r)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${timeRange === r
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* View Mode Toggle (Chart / Table / Both) */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${viewMode === 'chart'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Courbe
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Tableau
              </button>
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${viewMode === 'both'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Les Deux
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Dernier Cours Enregistré</span>
            <div className="text-xl font-black text-foreground font-mono mt-1">
              {latestRecord ? latestRecord.rate.toLocaleString() : '—'}{' '}
              <span className="text-xs font-normal text-muted-foreground">DZD/g</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Plus Haut ({timeRange.toUpperCase()})</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {highRate > 0 ? highRate.toLocaleString() : '—'}{' '}
              <span className="text-xs font-normal text-muted-foreground">DZD/g</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Plus Bas ({timeRange.toUpperCase()})</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {lowRate > 0 ? lowRate.toLocaleString() : '—'}{' '}
              <span className="text-xs font-normal text-muted-foreground">DZD/g</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Variation Période</span>
            <div className={`text-xl font-black font-mono mt-1 flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* SECTION 1: INTERACTIVE RECHARTS AREA CHART */}
        {(viewMode === 'chart' || viewMode === 'both') && (
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Courbe Interactive : {currentKaratInfo.label}
                </CardTitle>
                <CardDescription>
                  Évolution des cours de référence, de vente et de rachat (DZD/g) sur la période {timeRange.toUpperCase()}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-3 py-1">
                  {chartData.length} Captures
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {chartData.length < 2 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Pas assez de données pour afficher le graphique sur cette période.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillSell" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="fillBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />

                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: timeRange === '24h' ? '2-digit' : undefined,
                        });
                      }}
                    />

                    <YAxis
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(val) => `${val.toLocaleString()} DZD`}
                      hide={false}
                      width={85}
                    />

                    <ChartTooltip
                      cursor={{ stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            if (!value) return '';
                            return new Date(String(value)).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          }}
                          indicator="dot"
                        />
                      }
                    />

                    <Area
                      dataKey="buy_price"
                      type="natural"
                      fill="url(#fillBuy)"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Rachat Casse"
                    />

                    <Area
                      dataKey="sell_price"
                      type="natural"
                      fill="url(#fillSell)"
                      stroke="#d97706"
                      strokeWidth={2}
                      name="Vente Boutique"
                    />

                    <Area
                      dataKey="rate"
                      type="natural"
                      fill="url(#fillRate)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      name="Prix Réf (Base)"
                    />

                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION 2: HISTORY TABLE (Rendered when mode is 'table' or 'both') */}
        {(viewMode === 'table' || viewMode === 'both') && (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <TableIcon className="h-4 w-4 text-amber-500" />
                Journal des Enregistrements ({histories.total} snapshots)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Titrage</th>
                    <th className="px-6 py-4">Prix Réf (Base)</th>
                    <th className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">Vente Bijoutier</th>
                    <th className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">Achat Casse (Rachat)</th>
                    <th className="px-6 py-4">Devise / Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {histories.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        Aucun enregistrement historique trouvé pour ce critère.
                      </td>
                    </tr>
                  ) : (
                    histories.data.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                          {row.occurred_at
                            ? new Date(row.occurred_at).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {row.karat}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold font-mono">
                          {Number(row.rate).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          <span className="text-xs font-normal text-muted-foreground">DZD</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {row.sell_price
                            ? `${Number(row.sell_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} DZD`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {row.buy_price
                            ? `${Number(row.buy_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} DZD`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                          {row.currency} / {row.unit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {histories.total > histories.per_page && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  Affichage de{' '}
                  <strong>
                    {(histories.current_page - 1) * histories.per_page + 1}-
                    {Math.min(histories.current_page * histories.per_page, histories.total)}
                  </strong>{' '}
                  sur <strong>{histories.total}</strong> snapshots
                </div>

                <div className="flex items-center gap-1.5">
                  {histories.links.map((link, idx) => {
                    if (!link.url) {
                      return (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs text-muted-foreground opacity-50 select-none"
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    }
                    return (
                      <Link
                        key={idx}
                        href={link.url}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${link.active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

ListGoldHistories.layout = {
  breadcrumbs,
};
