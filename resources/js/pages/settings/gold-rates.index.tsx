import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Coins,
    DollarSign,
    Flame,
    Info,
    RefreshCw,
    Save,
    Sliders,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { updateRates } from '@/actions/App/Http/Controllers/GoldPriceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

interface Props {
    initialRates: {
        spot_price?: SpotPrice | null;
        last_updated?: string | null;
        rates: Record<string, MetalRateItem>;
    };
    currencyRate?: {
        rate: string | number;
        pair: string;
        source: number;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: "Configuration des Tarifs de l'Or",
        href: '/settings/gold-rates',
    },
];

const KARAT_CONFIG_LIST = [
    {
        key: '24k',
        title: '24K Lingot Pur (999)',
        description: "Lingotins d'investissement pur 999",
        purity: 1.0,
        purityLabel: '100%',
        defaultBuyPct: 0.98,
        defaultSellMarkup: 0,
        badgeColor: 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30',
    },
    {
        key: '22k',
        title: '22K Golfe & Monnaies',
        description: 'Haute pureté & pièces souverain',
        purity: 0.9167,
        purityLabel: '91.6%',
        defaultBuyPct: 0.97,
        defaultSellMarkup: 0,
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
        key: '21k',
        title: '21K Moyen-Orient',
        description: 'Or traditionnel & pièces',
        purity: 0.875,
        purityLabel: '87.5%',
        defaultBuyPct: 0.97,
        defaultSellMarkup: 0,
        badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    {
        key: '18k_italian',
        title: '18K Or Italien',
        description: 'Bijoux importés & finis avec poinçon',
        purity: 0.75,
        purityLabel: '75.0%',
        defaultBuyPct: 0.96,
        defaultSellMarkup: 1500,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
        key: '18k',
        title: '18K Local (Standard)',
        description: 'Fabrication locale standard',
        purity: 0.75,
        purityLabel: '75.0%',
        defaultBuyPct: 0.97,
        defaultSellMarkup: 0,
        badgeColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    },
    {
        key: '18k_scrap',
        title: '18K Casse (Achat / Rachat)',
        description: 'Rachat bijoutier (vieil or & casse)',
        purity: 0.75,
        purityLabel: '75.0%',
        defaultBuyPct: 0.95,
        defaultSellMarkup: 0,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
        key: '16k',
        title: '16K Commercial',
        description: 'Alliage bijouterie spécifique',
        purity: 0.6667,
        purityLabel: '66.7%',
        defaultBuyPct: 0.96,
        defaultSellMarkup: 0,
        badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
    {
        key: '14k',
        title: '14K Économique',
        description: 'Norme européenne / US',
        purity: 0.5833,
        purityLabel: '58.3%',
        defaultBuyPct: 0.95,
        defaultSellMarkup: 0,
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
        key: '9k',
        title: '9K Basse Pureté',
        description: 'Bijouterie grand public',
        purity: 0.375,
        purityLabel: '37.5%',
        defaultBuyPct: 0.94,
        defaultSellMarkup: 0,
        badgeColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    },
];

export default function GoldRatesSettings({ initialRates, currencyRate }: Props) {
    const existingRates = initialRates?.rates || {};
    const rawSpotOunce = Number(initialRates?.spot_price?.price || 4286.2);

    const [parallelRateInput, setParallelRateInput] = useState<number>(
        Number(currencyRate?.rate || 240)
    );

    // Prepare initial form data
    const initialFormRates = KARAT_CONFIG_LIST.map((cfg) => {
        const current = existingRates[cfg.key];
        return {
            karat: cfg.key,
            rate: current ? Number(current.rate) : 0,
            buy_price: current?.buy_price ? Number(current.buy_price) : 0,
            sell_price: current?.sell_price ? Number(current.sell_price) : 0,
        };
    });

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        currency_rate: parallelRateInput,
        rates: initialFormRates,
    });

    // Auto-calculate from Spot & Parallel rate
    const handleAutoRecalculate = () => {
        const spot24kGramDZD = (rawSpotOunce / 31.1034768) * parallelRateInput;

        const recalculated = KARAT_CONFIG_LIST.map((cfg) => {
            const baseGram = spot24kGramDZD * cfg.purity;
            return {
                karat: cfg.key,
                rate: Math.round(baseGram),
                buy_price: Math.round(baseGram * cfg.defaultBuyPct),
                sell_price: Math.round(baseGram + cfg.defaultSellMarkup),
            };
        });

        setData({
            currency_rate: parallelRateInput,
            rates: recalculated,
        });
    };

    const updateRateField = (index: number, field: 'rate' | 'buy_price' | 'sell_price', val: number) => {
        const updated = [...data.rates];
        updated[index] = { ...updated[index], [field]: val };
        setData('rates', updated);
    };

    const handleCurrencyRateChange = (newRate: number) => {
        setParallelRateInput(newRate);
        setData('currency_rate', newRate);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(updateRates.url());
    };

    return (
        <AppLayout>
            <Head title="Configuration des Tarifs de l'Or" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 w-full">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                            <Sliders className="h-3.5 w-3.5" />
                            Paramètres de Tarification
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            Configuration des Tarifs & Marges
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Ajustez le taux de conversion parallèle et personnalisez la grille tarifaire de vente et de rachat au gramme.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoRecalculate}
                            className="gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs font-semibold"
                        >
                            <Sparkles className="h-4 w-4" />
                            Recalculer Tout (Auto)
                        </Button>
                    </div>
                </div>

                {/* Success Notification */}
                {recentlySuccessful && (
                    <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs">
                        <Check className="h-5 w-5 shrink-0" />
                        Les tarifs et marges de l'or ont été enregistrés avec succès !
                    </div>
                )}

                {/* Currency Rate Top Card */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-base text-foreground">
                                <DollarSign className="h-4.5 w-4.5 text-amber-500" />
                                Taux de Change Parallèle (USD / DZD)
                            </div>
                            <p className="text-xs text-muted-foreground max-w-xl">
                                Ce taux (Square) sert de multiplicateur de conversion directe pour convertir le cours spot international de l'once d'or en Dinars Algériens (DZD).
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-48">
                                <Input
                                    type="number"
                                    min="1"
                                    step="0.5"
                                    value={parallelRateInput}
                                    onChange={(e) => handleCurrencyRateChange(parseFloat(e.target.value) || 0)}
                                    className="pr-12 text-right font-mono font-bold text-base h-11 rounded-xl"
                                />
                                <span className="absolute right-3.5 top-3 text-xs font-bold text-muted-foreground pointer-events-none">
                                    DZD
                                </span>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleAutoRecalculate}
                                className="whitespace-nowrap h-11 rounded-xl font-semibold text-xs"
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Appliquer
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Pricing Configuration Form (TABLE VIEW) */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                            <div>
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-500" />
                                    Tableau de Configuration des Tarifs par Titrage
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Définissez le prix de référence, le prix de vente boutique et le prix de rachat casse (DZD / gramme)
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 h-10 rounded-xl shadow-xs"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                {processing ? 'Enregistrement...' : 'Enregistrer les Tarifs'}
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-muted/50 border-b border-border/60 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4 w-1/4">Titrage & Description</th>
                                        <th className="px-4 py-4 w-28">Pureté</th>
                                        <th className="px-4 py-4 w-1/4">Prix Référence (Base DZD/g)</th>
                                        <th className="px-4 py-4 w-1/4 font-bold text-amber-600 dark:text-amber-400">
                                            Prix Vente Boutique (DZD/g)
                                        </th>
                                        <th className="px-4 py-4 w-1/4 font-bold text-emerald-600 dark:text-emerald-400">
                                            Prix Rachat Casse (DZD/g)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {KARAT_CONFIG_LIST.map((cfg, idx) => {
                                        const formItem = data.rates[idx] || { rate: 0, buy_price: 0, sell_price: 0 };

                                        return (
                                            <tr key={cfg.key} className="hover:bg-muted/30 transition-colors">
                                                {/* Karat Name & Details */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-foreground text-sm">
                                                                {cfg.title}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeColor}`}>
                                                                {cfg.purityLabel}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{cfg.description}</p>
                                                    </div>
                                                </td>

                                                {/* Purity ratio */}
                                                <td className="px-4 py-4 font-mono text-xs font-semibold text-muted-foreground">
                                                    {(cfg.purity * 1000).toFixed(0)} / 1000
                                                </td>

                                                {/* Reference Base Rate */}
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={formItem.rate || ''}
                                                            onChange={(e) =>
                                                                updateRateField(idx, 'rate', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="pr-12 font-mono font-bold h-10 rounded-xl"
                                                        />
                                                        <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-bold pointer-events-none">
                                                            DZD
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Boutique Selling Price */}
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={formItem.sell_price || ''}
                                                            onChange={(e) =>
                                                                updateRateField(idx, 'sell_price', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="pr-12 font-mono font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 focus:border-amber-500 h-10 rounded-xl bg-amber-500/5"
                                                        />
                                                        <span className="absolute right-3.5 top-2.5 text-xs text-amber-600/70 font-bold pointer-events-none">
                                                            DZD
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Scrap Buying Price */}
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={formItem.buy_price || ''}
                                                            onChange={(e) =>
                                                                updateRateField(idx, 'buy_price', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="pr-12 font-mono font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 focus:border-emerald-500 h-10 rounded-xl bg-emerald-500/5"
                                                        />
                                                        <span className="absolute right-3.5 top-2.5 text-xs text-emerald-600/70 font-bold pointer-events-none">
                                                            DZD
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer action bar */}
                        <div className="p-4 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Info className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>
                                    Les modifications enregistrées mettent immédiatement à jour le tableau de bord, les calculs de comptoir et le journal des snapshots.
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 h-11 rounded-xl shadow-md w-full sm:w-auto"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                {processing ? 'Enregistrement...' : 'Enregistrer Tous les Tarifs'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

GoldRatesSettings.layout = {
    breadcrumbs,
};
