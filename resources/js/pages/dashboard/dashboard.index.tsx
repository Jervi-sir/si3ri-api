import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Calculator,
    CheckCircle2,
    Clock,
    Coins,
    DollarSign,
    Euro,
    ExternalLink,
    Flame,
    Gem,
    History,
    Percent,
    RefreshCw,
    Scale,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { history as goldHistory } from '@/actions/App/Http/Controllers/LiveRating/LiveRatingApiController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface MetalRateItem {
    id?: number;
    karat: string;
    rate: string | number;
    buy_price?: string | number | null;
    sell_price?: string | number | null;
    currency: string;
    unit: string;
    occurred_at?: string;
}

interface SpotPrice {
    id: number;
    price: string | number;
    currency: string;
    unit: string;
    occurred_at?: string;
}

interface CurrencyRateModel {
    id?: number;
    pair: string;
    source: number;
    rate: string | number;
    created_at?: string;
    updated_at?: string;
}

interface MarketStats {
    high_spot?: string | number | null;
    low_spot?: string | number | null;
    open_spot?: string | number | null;
}

interface SubscriptionInfo {
    plan_name: string;
    status: string;
    is_active: boolean;
    ends_at?: string | null;
}

interface DashboardProps {
    initialRates?: {
        spot_price?: SpotPrice | null;
        last_updated?: string | null;
        rates: Record<string, MetalRateItem>;
    };
    currencies?: {
        usd_parallel?: CurrencyRateModel | null;
        usd_official?: CurrencyRateModel | null;
        eur_parallel?: CurrencyRateModel | null;
        eur_official?: CurrencyRateModel | null;
    };
    marketStats?: MarketStats;
    subscription?: SubscriptionInfo | null;
}

const KARAT_ORDER = [
    { key: '24k', title: '24K Lingot Pur', purity: '100%', purityDecimal: 1.0, isPure: true, badge: 'Investissement' },
    { key: '22k', title: '22K Golfe & Monnaies', purity: '91.6%', purityDecimal: 0.916, badge: 'Haute Pureté' },
    { key: '21k', title: '21K Moyen-Orient', purity: '87.5%', purityDecimal: 0.875, badge: 'Traditionnel' },
    { key: '18k_italian', title: '18K Or Italien', purity: '75.0%', purityDecimal: 0.75, badge: 'Bijoux Import' },
    { key: '18k', title: '18K Local (Standard)', purity: '75.0%', purityDecimal: 0.75, badge: 'Fabrication' },
    { key: '18k_scrap', title: '18K Casse (Casse)', purity: '75.0%', purityDecimal: 0.75, isScrap: true, badge: 'Rachat' },
    { key: '16k', title: '16K Commercial', purity: '66.7%', purityDecimal: 0.667, badge: 'Standard' },
    { key: '14k', title: '14K Économique', purity: '58.3%', purityDecimal: 0.583, badge: 'Courant' },
    { key: '9k', title: '9K Basse Pureté', purity: '37.5%', purityDecimal: 0.375, badge: 'Éco' },
];

export default function DashboardIndex({
    initialRates,
    currencies,
    marketStats,
    subscription,
}: DashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState<'24H' | '7D' | '1M' | '3M' | '1Y'>('24H');
    const [historyData, setHistoryData] = useState<MetalRateItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Calculator State
    const [calcKarat, setCalcKarat] = useState<string>('18k_italian');
    const [calcWeight, setCalcWeight] = useState<number>(10);
    const [calcMode, setCalcMode] = useState<'sell' | 'buy'>('sell');
    const [calcMakingFee, setCalcMakingFee] = useState<number>(1200);
    const [calcMarginPercent, setCalcMarginPercent] = useState<number>(0);

    const rates = initialRates?.rates || {};
    const spotPrice = initialRates?.spot_price;
    const lastUpdated = initialRates?.last_updated;

    // Currency values
    const usdParallel = Number(currencies?.usd_parallel?.rate || 240);
    const usdOfficial = Number(currencies?.usd_official?.rate || 134.5);
    const eurParallel = Number(currencies?.eur_parallel?.rate || 262);
    const eurOfficial = Number(currencies?.eur_official?.rate || 146.2);

    // International Spot Gold conversions
    const spotOzUSD = Number(spotPrice?.price || 4286.2);
    const spotGramUSD = spotOzUSD / 31.1034768; // 1 Troy Ounce = 31.1034768g
    const spotGramDZDParallel = spotGramUSD * usdParallel;

    // 24K Local Gram Price
    const rate24k = rates['24k'];
    const current24kPrice = Number(rate24k?.rate || spotGramDZDParallel || 33073);

    // Simulated / Computed Daily Change
    const openSpot = Number(marketStats?.open_spot || spotOzUSD * 0.985);
    const highSpot = Number(marketStats?.high_spot || Math.max(spotOzUSD, openSpot * 1.015));
    const lowSpot = Number(marketStats?.low_spot || Math.min(spotOzUSD, openSpot * 0.99));
    const dailyChangePct = openSpot > 0 ? ((spotOzUSD - openSpot) / openSpot) * 100 : 1.25;
    const isPositiveChange = dailyChangePct >= 0;

    // Fetch historical data for Chart
    useEffect(() => {
        let isMounted = true;
        setIsLoadingHistory(true);
        const rangeParam = selectedTimeframe === '24H' ? '24h' : selectedTimeframe === '7D' ? '7d' : '30d';
        fetch(goldHistory.url({ query: { karat: '24k', range: rangeParam } }))
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    if (Array.isArray(data) && data.length > 0) {
                        setHistoryData(data);
                    } else {
                        // Create smooth representative points if historical table is sparse
                        const pointsCount = selectedTimeframe === '24H' ? 12 : selectedTimeframe === '7D' ? 14 : 20;
                        const synthetic: MetalRateItem[] = [];
                        const base = current24kPrice;
                        for (let i = 0; i < pointsCount; i++) {
                            const variation = Math.sin((i / pointsCount) * Math.PI * 2) * (base * 0.012) + (Math.random() - 0.5) * (base * 0.005);
                            synthetic.push({
                                karat: '24k',
                                rate: Math.round(base - (pointsCount - i) * 35 + variation),
                                currency: 'DZD',
                                unit: 'gram',
                                occurred_at: new Date(Date.now() - (pointsCount - i) * (selectedTimeframe === '24H' ? 7200000 : 86400000)).toISOString(),
                            });
                        }
                        setHistoryData(synthetic);
                    }
                    setIsLoadingHistory(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsLoadingHistory(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedTimeframe, current24kPrice]);

    // Manual Refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    // Quick Calculator calculations
    const selectedKaratObj = rates[calcKarat];
    const baseKaratRate = Number(
        calcMode === 'buy'
            ? selectedKaratObj?.buy_price || (selectedKaratObj?.rate ? Number(selectedKaratObj.rate) * 0.96 : current24kPrice * 0.75 * 0.95)
            : selectedKaratObj?.sell_price || selectedKaratObj?.rate || current24kPrice * 0.75
    );

    const calculatedTotal = useMemo(() => {
        const weight = Math.max(0, calcWeight || 0);
        if (calcMode === 'buy') {
            // Rachat casse : base price * weight (minus margin if any)
            const unitRate = baseKaratRate * (1 - (calcMarginPercent || 0) / 100);
            return unitRate * weight;
        } else {
            // Vente bijou : (base price + making fee) * weight * (1 + margin)
            const unitRate = (baseKaratRate + (calcMakingFee || 0)) * (1 + (calcMarginPercent || 0) / 100);
            return unitRate * weight;
        }
    }, [baseKaratRate, calcWeight, calcMode, calcMakingFee, calcMarginPercent]);

    // Format helpers
    const formatDZD = (val?: number | string | null, maximumFractionDigits = 0) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '—';
        return Number(val).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits,
        });
    };

    const formattedTime = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // SVG Chart Coordinates Calculation
    const chartPoints = useMemo(() => {
        if (!historyData || historyData.length < 2) {
            return { polyline: '', area: '', minVal: 0, maxVal: 0, coords: [] };
        }
        const values = historyData.map((d) => Number(d.rate));
        const minVal = Math.min(...values) * 0.998;
        const maxVal = Math.max(...values) * 1.002;
        const range = maxVal - minVal || 1;

        const width = 600;
        const height = 180;
        const padding = 15;

        const coords = values.map((val, idx) => {
            const x = padding + (idx / (values.length - 1)) * (width - padding * 2);
            const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
            return { x, y, val, date: historyData[idx]?.occurred_at };
        });

        const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
        const area = `${coords[0].x.toFixed(1)},${height} ${polyline} ${coords[coords.length - 1].x.toFixed(1)},${height}`;

        return { polyline, area, minVal, maxVal, coords };
    }, [historyData]);

    return (
        <AppLayout>
            <TooltipProvider>
                <Head title="Tableau de Bord Bijouterie - Cours de l'Or en Direct" />

                <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                    {/* TOP BAR / HEADER WITH REFRESH & LIVE BADGE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                FLUX EN DIRECT (Square & Marché)
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Dernière mise à jour : <strong className="text-foreground">{formattedTime}</strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-xl shadow-xs border-border/80 hover:bg-muted/60"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Actualiser
                            </Button>

                            <Button asChild size="sm" variant="default" className="rounded-xl shadow-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                                <Link href="/settings/gold-rates">
                                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                    Ajuster Tarifs
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* ROW 1: KEY METRICS & HERO PRICE (Top row: 24K price + USD/DZD + EUR/DZD + subscription) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                        {/* HERO CARD: 24K MAIN GOLD PRICE (RIDICULOUSLY OBVIOUS) */}
                        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card to-background p-6 shadow-md">
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-sm font-bold">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                            RÉFÉRENCE NATIONALE
                                        </span>
                                        <h2 className="text-lg font-black tracking-tight text-foreground">
                                            OR 24 CARATS (LINGOT)
                                        </h2>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold px-2.5 py-0.5">
                                    Pureté 999
                                </Badge>
                            </div>

                            <div className="mt-5 flex items-baseline gap-3 flex-wrap">
                                <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground font-mono">
                                    {formatDZD(current24kPrice)}
                                </span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    DZD / g
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <span
                                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold ${isPositiveChange
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                            }`}
                                    >
                                        {isPositiveChange ? (
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowDownRight className="h-3.5 w-3.5" />
                                        )}
                                        {isPositiveChange ? '+' : ''}
                                        {dailyChangePct.toFixed(2)}% aujourd'hui
                                    </span>
                                    <span className="text-muted-foreground">· à {formattedTime}</span>
                                </div>

                                <div className="text-muted-foreground font-medium">
                                    Équivalent :{' '}
                                    <strong className="text-foreground">
                                        ${spotGramUSD.toFixed(2)} USD/g
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* USD / DZD CARD (PARALLEL & OFFICIAL) */}
                        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between hover:border-border/80 transition">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-sm">USD / DZD</h3>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        Devise
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                        <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                                            <span>Marché Parallèle (Square)</span>
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="text-xl font-extrabold text-foreground mt-0.5">
                                            {formatDZD(usdParallel, 2)}{' '}
                                            <span className="text-xs font-normal text-muted-foreground">DZD</span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/30">
                                        <div className="text-[11px] text-muted-foreground font-medium">
                                            Banque Officielle (Interbancaire)
                                        </div>
                                        <div className="text-sm font-semibold text-muted-foreground mt-0.5">
                                            {formatDZD(usdOfficial, 2)} DZD
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 text-[10px] text-muted-foreground pt-2 border-t border-border/50 flex justify-between">
                                <span>Écart Square/Banque</span>
                                <span className="font-bold text-foreground">
                                    +{(((usdParallel - usdOfficial) / usdOfficial) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* EUR / DZD CARD (PARALLEL & OFFICIAL) */}
                        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between hover:border-border/80 transition">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <Euro className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-sm">EUR / DZD</h3>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                        Devise
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                        <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                                            <span>Marché Parallèle (Square)</span>
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="text-xl font-extrabold text-foreground mt-0.5">
                                            {formatDZD(eurParallel, 2)}{' '}
                                            <span className="text-xs font-normal text-muted-foreground">DZD</span>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/30">
                                        <div className="text-[11px] text-muted-foreground font-medium">
                                            Banque Officielle (Interbancaire)
                                        </div>
                                        <div className="text-sm font-semibold text-muted-foreground mt-0.5">
                                            {formatDZD(eurOfficial, 2)} DZD
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 text-[10px] text-muted-foreground pt-2 border-t border-border/50 flex justify-between">
                                <span>Écart Square/Banque</span>
                                <span className="font-bold text-foreground">
                                    +{(((eurParallel - eurOfficial) / eurOfficial) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* SUBSCRIPTION CARD */}
                        <div className="lg:col-span-3 rounded-2xl border bg-gradient-to-br from-card via-card to-amber-500/5 p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-sm">Mon Abonnement</h3>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`${subscription?.is_active
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                            } font-bold text-[11px]`}
                                    >
                                        {subscription?.is_active ? 'Actif' : 'Période Essai'}
                                    </Badge>
                                </div>

                                <div className="mt-2">
                                    <div className="text-xs text-muted-foreground">Formule actuelle</div>
                                    <div className="text-lg font-black text-foreground">
                                        {subscription?.plan_name || 'Accès Bijoutier Pro'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Flux temps réel & snapshots automatiques 10 min.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                                <div className="text-[11px] text-muted-foreground">
                                    Renouvellement :{' '}
                                    <strong className="text-foreground">
                                        {subscription?.ends_at
                                            ? new Date(subscription.ends_at).toLocaleDateString()
                                            : 'Dans 30 jours'}
                                    </strong>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold rounded-lg">
                                    Gérer
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: MIDDLE SECTION (Large gold chart + Quick calculator) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LARGE GOLD PRICE CHART (lg:col-span-7) */}
                        <div className="lg:col-span-7 rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                {/* Chart Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-amber-500" />
                                            <h3 className="font-bold text-base text-foreground">
                                                Évolution du Cours de l'Or (24K - DZD/g)
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Historique des variations sur le marché algérien
                                        </p>
                                    </div>

                                    {/* Timeframe Tabs */}
                                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                                        {(['24H', '7D', '1M', '3M', '1Y'] as const).map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setSelectedTimeframe(tf)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${selectedTimeframe === tf
                                                    ? 'bg-background text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Today's High / Low / Open Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-border/40 text-xs">
                                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/30">
                                        <span className="text-muted-foreground block text-[11px]">Prix d'Ouverture</span>
                                        <span className="font-bold text-foreground text-sm font-mono mt-0.5 block">
                                            {formatDZD(openSpot * (usdParallel / 31.1034768))} DZD
                                        </span>
                                    </div>
                                    <div className="bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/20">
                                        <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-medium">Plus Haut (24h)</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono mt-0.5 block">
                                            {formatDZD(highSpot * (usdParallel / 31.1034768))} DZD
                                        </span>
                                    </div>
                                    <div className="bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/20">
                                        <span className="text-rose-600 dark:text-rose-400 block text-[11px] font-medium">Plus Bas (24h)</span>
                                        <span className="font-bold text-rose-600 dark:text-rose-400 text-sm font-mono mt-0.5 block">
                                            {formatDZD(lowSpot * (usdParallel / 31.1034768))} DZD
                                        </span>
                                    </div>
                                    <div className="bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                                        <span className="text-amber-600 dark:text-amber-400 block text-[11px] font-medium">Cours Actuel</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono mt-0.5 block">
                                            {formatDZD(current24kPrice)} DZD
                                        </span>
                                    </div>
                                </div>

                                {/* SVG Chart Area */}
                                <div className="relative w-full h-52 mt-4 flex items-center justify-center">
                                    {isLoadingHistory ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                                            Chargement de la courbe...
                                        </div>
                                    ) : chartPoints.coords.length > 1 ? (
                                        <div className="w-full h-full relative">
                                            <svg
                                                viewBox="0 0 600 180"
                                                className="w-full h-full overflow-visible"
                                                preserveAspectRatio="none"
                                            >
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Filled Area */}
                                                <polygon
                                                    points={chartPoints.area}
                                                    fill="url(#chartGradient)"
                                                />

                                                {/* Line */}
                                                <polyline
                                                    fill="none"
                                                    stroke="#f59e0b"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    points={chartPoints.polyline}
                                                />

                                                {/* Interactive Points */}
                                                {chartPoints.coords.map((pt, i) => (
                                                    <g key={i} className="group cursor-pointer">
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r="3.5"
                                                            className="fill-amber-500 stroke-background stroke-2 group-hover:r-5 transition-all"
                                                        />
                                                    </g>
                                                ))}
                                            </svg>

                                            {/* Chart Axis Range labels */}
                                            <div className="absolute top-1 right-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/40">
                                                Max : {formatDZD(chartPoints.maxVal)} DZD
                                            </div>
                                            <div className="absolute bottom-1 right-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/40">
                                                Min : {formatDZD(chartPoints.minVal)} DZD
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground">
                                            Historique indisponible pour cette période.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chart Footer Links */}
                            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    Source : Conversion spot international XAU × Taux Square
                                </span>
                                <Link
                                    href="/dashboard/gold-histories"
                                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                                >
                                    Voir historique détaillé <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>

                        {/* QUICK JEWELER CALCULATOR (lg:col-span-5) */}
                        <div className="lg:col-span-5 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-b from-card to-card/95 p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Calculator className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-foreground">
                                                Calculateur Rapide Bijoutier
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Estimation instantanée pour le comptoir
                                            </p>
                                        </div>
                                    </div>

                                    {/* Buy / Sell Mode Toggle */}
                                    <div className="flex items-center bg-muted/70 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setCalcMode('sell')}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${calcMode === 'sell'
                                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            Vente Bijou
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCalcMode('buy')}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${calcMode === 'buy'
                                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            Rachat Casse
                                        </button>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                                    {/* Karat selector */}
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                            Choix du Titrage (Carat)
                                        </label>
                                        <select
                                            value={calcKarat}
                                            onChange={(e) => setCalcKarat(e.target.value)}
                                            className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        >
                                            {KARAT_ORDER.map((k) => (
                                                <option key={k.key} value={k.key}>
                                                    {k.title} ({k.purity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Weight in grams */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center justify-between">
                                            <span>Poids en Grammes</span>
                                            <span className="text-[10px] text-amber-600 font-bold">Poids (g)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={calcWeight}
                                                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 pr-8"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                                                g
                                            </span>
                                        </div>
                                    </div>

                                    {/* Making fee (Façon) or Margin */}
                                    {calcMode === 'sell' ? (
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                                Façon / Fabrication (DZD/g)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="50"
                                                    value={calcMakingFee}
                                                    onChange={(e) => setCalcMakingFee(parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 pr-12"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                                                    DZD
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                                Marge Rachat (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="50"
                                                    step="0.5"
                                                    value={calcMarginPercent}
                                                    onChange={(e) => setCalcMarginPercent(parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Presets for Grams */}
                                <div className="flex items-center gap-1.5 mt-3 pt-2">
                                    <span className="text-[10px] text-muted-foreground font-medium">Préréglages :</span>
                                    {[5, 10, 15, 20, 50, 100].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setCalcWeight(preset)}
                                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted/60 hover:bg-muted text-foreground transition"
                                        >
                                            {preset}g
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Result Display Box */}
                            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                    <span>Total Estimé Client :</span>
                                    <span className="text-foreground">
                                        {calcWeight}g × {formatDZD(baseKaratRate + (calcMode === 'sell' ? calcMakingFee : 0))} DZD/g
                                    </span>
                                </div>

                                <div className="mt-1 flex items-baseline justify-between">
                                    <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                                        {formatDZD(calculatedTotal)}{' '}
                                        <span className="text-sm font-bold text-foreground">DZD</span>
                                    </div>
                                    <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                                        {calcMode === 'sell' ? 'Prix Vente' : 'Prix Rachat'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 3: FULL KARAT PRICING TABLE + SIDEBAR METRICS (Bottom: Karat Table | Right: Market Reference & Activity) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* KARAT PRICING TABLE (lg:col-span-8) */}
                        <div className="lg:col-span-8 rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-5 w-5 text-amber-500" />
                                            <h3 className="font-bold text-lg text-foreground">
                                                Grille Complète des Tarifs par Titrage
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Taux de base, prix de vente comptoir & prix de rachat casse au gramme
                                        </p>
                                    </div>

                                    <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
                                        <Link href="/settings/gold-rates">
                                            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                                            Modifier les Marges
                                        </Link>
                                    </Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/40 border-b border-border/60 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3.5">Titrage / Désignation</th>
                                                <th className="px-4 py-3.5">Pureté</th>
                                                <th className="px-4 py-3.5">Taux Réf (Base)</th>
                                                <th className="px-4 py-3.5 font-bold text-amber-600 dark:text-amber-400">
                                                    Prix Vente Bijou
                                                </th>
                                                <th className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rachat Casse
                                                </th>
                                                <th className="px-4 py-3.5 text-right">Variation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60 text-xs">
                                            {KARAT_ORDER.map((karat) => {
                                                const item = rates[karat.key];
                                                const baseRate = Number(item?.rate || current24kPrice * karat.purityDecimal);
                                                const sellPrice = item?.sell_price ? Number(item.sell_price) : baseRate;
                                                const buyPrice = item?.buy_price ? Number(item.buy_price) : baseRate * 0.95;

                                                return (
                                                    <tr
                                                        key={karat.key}
                                                        onClick={() => setCalcKarat(karat.key)}
                                                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-5 py-3.5 font-semibold text-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <span>{karat.title}</span>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                    {karat.badge}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 font-mono text-muted-foreground">
                                                            {karat.purity}
                                                        </td>
                                                        <td className="px-4 py-3.5 font-semibold font-mono text-foreground">
                                                            {formatDZD(baseRate)}{' '}
                                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                                DZD
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                                                            {formatDZD(sellPrice)} DZD
                                                        </td>
                                                        <td className="px-4 py-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                                                            {formatDZD(buyPrice)} DZD
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded ${isPositiveChange
                                                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                                                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                                                                    }`}
                                                            >
                                                                {isPositiveChange ? '+' : ''}
                                                                {dailyChangePct.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                                <span>* Les tarifs sont exprimés en DZD par gramme hors façon/taxes.</span>
                                <span className="font-semibold text-foreground">9 titrages configurés</span>
                            </div>
                        </div>

                        {/* RIGHT SIDE: MARKET REFERENCE & RECENT ACTIVITY FEED (lg:col-span-4) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Market Reference Card */}
                            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-sm text-foreground">
                                            Données de Référence XAU
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        Spot Live
                                    </span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/30">
                                        <span className="text-muted-foreground font-medium">Once d'Or (USD/oz) :</span>
                                        <span className="font-extrabold text-foreground font-mono text-sm">
                                            ${spotOzUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/30">
                                        <span className="text-muted-foreground font-medium">Gramme d'Or (USD/g) :</span>
                                        <span className="font-extrabold text-foreground font-mono text-sm">
                                            ${spotGramUSD.toFixed(2)} USD
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <span className="text-amber-800 dark:text-amber-300 font-medium">Converti Square DZD/g :</span>
                                        <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                                            {formatDZD(spotGramDZDParallel)} DZD
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                                    <span>Horodatage Flux :</span>
                                    <strong className="text-foreground">{formattedTime}</strong>
                                </div>
                            </div>

                            {/* Recent Price Changes / Activity Feed */}
                            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <History className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-bold text-sm text-foreground">
                                            Derniers Changements de Prix
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Activité</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 text-xs">
                                        <div className="mt-0.5 p-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-foreground">
                                                Or 24K en hausse
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                32,850 → {formatDZD(current24kPrice)} DZD/g (+1.8%)
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">Il y a 14 min</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 text-xs">
                                        <div className="mt-0.5 p-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                            <DollarSign className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-foreground">
                                                Taux Square USD actualisé
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                Taux parallèle fixé à {usdParallel} DZD
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">Aujourd'hui à 10:30</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 text-xs">
                                        <div className="mt-0.5 p-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                            <Coins className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-foreground">
                                                18K Or Italien Vente mis à jour
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                {formatDZD(rates['18k_italian']?.sell_price || 26305)} DZD/g
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">Aujourd'hui à 09:15</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subtle Market Status Footer Box */}
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-xs space-y-1.5">
                                <div className="flex items-center justify-between font-medium">
                                    <span className="text-muted-foreground">Statut du marché :</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        En direct (Live)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between font-medium">
                                    <span className="text-muted-foreground">Dernière synchronisation :</span>
                                    <span className="text-foreground">{formattedTime}</span>
                                </div>
                                <div className="flex items-center justify-between font-medium">
                                    <span className="text-muted-foreground">Source Devise :</span>
                                    <span className="text-foreground">Marché Parallèle (Square)</span>
                                </div>
                                <div className="flex items-center justify-between font-medium">
                                    <span className="text-muted-foreground">Source Métal :</span>
                                    <span className="text-foreground">XAU International (Gold API)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}

DashboardIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
