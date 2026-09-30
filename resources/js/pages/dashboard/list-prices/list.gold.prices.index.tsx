import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Coins,
    DollarSign,
    Flame,
    Gem,
    History,
    RefreshCw,
    Scale,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CalculatorSection } from './sections/calculator.section';
import { CurrentPricesSection, type CurrencyRateModel, type MetalRateItem, type SpotPrice } from './sections/current-prices.section';
import { HistorySection } from './sections/history.section';

interface Props {
    initialRates: {
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
    currencyRate?: CurrencyRateModel | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: "Prix de l'Or & Tarifs",
        href: '/dashboard/gold-prices',
    },
];

export default function ListGoldPrices({ initialRates, currencies, currencyRate }: Props) {
    const [selectedKarat, setSelectedKarat] = useState<string>('18k_italian');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const rates = initialRates?.rates || {};
    const spotPrice = initialRates?.spot_price;
    const lastUpdated = initialRates?.last_updated;

    const parallelRate = Number(
        currencies?.usd_parallel?.rate || currencyRate?.rate || 240
    );

    // Refresh handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['initialRates', 'currencies', 'currencyRate'],
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Prix de l'Or en Direct & Tarifs Bijoutiers" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 w-full">
                {/* Top Banner: Market Status */}
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/10 via-card to-background p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Flux Marché 10 min
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                Cours de l'Or & Tarification Bijouterie
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Taux de référence instantanés convertis en DZD (Parallèle / Square: {parallelRate} DZD)
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="rounded-xl border bg-background/80 backdrop-blur px-4 py-3 shadow-sm">
                                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                                    Spot International (24K)
                                </div>
                                <div className="text-xl font-bold text-foreground mt-0.5">
                                    ${spotPrice ? Number(spotPrice.price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '4,286.20'}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">USD/oz</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold shadow transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Rafraîchir
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Section 1: Current Live Prices Grid */}
                <CurrentPricesSection
                    rates={rates}
                    selectedKarat={selectedKarat}
                    onSelectKarat={setSelectedKarat}
                />

                {/* Section 2 & 3: Jeweler Calculator & Karat History */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                        <CalculatorSection
                            selectedKarat={selectedKarat}
                            onSelectKarat={setSelectedKarat}
                            rates={rates}
                        />
                    </div>

                    <div className="lg:col-span-7">
                        <HistorySection
                            selectedKarat={selectedKarat}
                            onSelectKarat={setSelectedKarat}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

ListGoldPrices.layout = {
    breadcrumbs,
};
