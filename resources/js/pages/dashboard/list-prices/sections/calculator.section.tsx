import { Calculator, RefreshCw, Scale, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { calculate } from '@/actions/App/Http/Controllers/LiveRating/LiveRatingApiController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KARAT_DEFINITIONS, MetalRateItem } from './current-prices.section';

interface CalculatorSectionProps {
    selectedKarat: string;
    onSelectKarat: (karat: string) => void;
    rates: Record<string, MetalRateItem>;
}

interface BackendCalculationResult {
    karat: string;
    weight: number;
    mode: 'sell' | 'buy';
    base_rate: number;
    unit_price: number;
    making_fee: number;
    margin_percent: number;
    total: number;
    currency: string;
}

export function CalculatorSection({
    selectedKarat,
    onSelectKarat,
    rates,
}: CalculatorSectionProps) {
    const [calcWeight, setCalcWeight] = useState<number>(10);
    const [calcMode, setCalcMode] = useState<'sell' | 'buy'>('sell');
    const [calcMakingFee, setCalcMakingFee] = useState<number>(1200);
    const [calcMarginPercent, setCalcMarginPercent] = useState<number>(0);

    const [backendResult, setBackendResult] = useState<BackendCalculationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    // Fetch backend calculation with debounce using Wayfinder
    useEffect(() => {
        let isMounted = true;
        setIsCalculating(true);

        const debounceTimer = setTimeout(() => {
            fetch(calculate.url(), {
                method: calculate().method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    karat: selectedKarat,
                    weight: Number(calcWeight) || 0.01,
                    mode: calcMode,
                    making_fee: Number(calcMakingFee) || 0,
                    margin_percent: Number(calcMarginPercent) || 0,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (isMounted) {
                        setBackendResult(data);
                        setIsCalculating(false);
                    }
                })
                .catch(() => {
                    if (isMounted) setIsCalculating(false);
                });
        }, 150);

        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
    }, [selectedKarat, calcWeight, calcMode, calcMakingFee, calcMarginPercent]);

    // Local fallback calculation
    const activeKaratRate = rates[selectedKarat];
    const baseSellingPrice = Number(activeKaratRate?.sell_price || activeKaratRate?.rate || 0);
    const baseBuyingPrice = Number(activeKaratRate?.buy_price || (baseSellingPrice * 0.95));

    const computedTotal = useMemo(() => {
        if (backendResult?.total !== undefined) {
            return backendResult.total;
        }
        const weight = Math.max(0, calcWeight || 0);
        if (calcMode === 'buy') {
            const unit = baseBuyingPrice * (1 - (calcMarginPercent || 0) / 100);
            return unit * weight;
        } else {
            const unit = (baseSellingPrice + (calcMakingFee || 0)) * (1 + (calcMarginPercent || 0) / 100);
            return unit * weight;
        }
    }, [backendResult, calcWeight, calcMode, baseBuyingPrice, baseSellingPrice, calcMakingFee, calcMarginPercent]);

    const unitPrice = useMemo(() => {
        if (backendResult?.unit_price !== undefined) {
            return backendResult.unit_price;
        }
        return calcMode === 'buy'
            ? baseBuyingPrice * (1 - (calcMarginPercent || 0) / 100)
            : (baseSellingPrice + (calcMakingFee || 0)) * (1 + (calcMarginPercent || 0) / 100);
    }, [backendResult, calcMode, baseBuyingPrice, baseSellingPrice, calcMakingFee, calcMarginPercent]);

    return (
        <div className="rounded-2xl border-2 border-amber-500/20 bg-card p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
                {/* Header & Mode Switch */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-foreground">Calculateur Bijouterie</h3>
                            <p className="text-xs text-muted-foreground">Calcul instantané synchronisé au serveur</p>
                        </div>
                    </div>

                    <div className="flex items-center bg-muted/60 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setCalcMode('sell')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                calcMode === 'sell'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Vente
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalcMode('buy')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                calcMode === 'buy'
                                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Rachat
                        </button>
                    </div>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Karat select */}
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Titrage Sélectionné
                        </label>
                        <select
                            value={selectedKarat}
                            onChange={(e) => onSelectKarat(e.target.value)}
                            className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                            {Object.entries(KARAT_DEFINITIONS).map(([key, def]) => (
                                <option key={key} value={key}>
                                    {def.title} ({def.purity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Weight Input */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center justify-between">
                            <span>Poids du Bijou</span>
                            <span className="text-[10px] text-amber-600 font-bold">Grammes</span>
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
                            <span className="absolute right-3 top-2 text-xs text-muted-foreground font-bold">g</span>
                        </div>
                    </div>

                    {/* Making fee or margin */}
                    {calcMode === 'sell' ? (
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                Façon / Fabrication (DZD/g)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={calcMakingFee}
                                    onChange={(e) => setCalcMakingFee(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 pr-12"
                                />
                                <span className="absolute right-3 top-2 text-xs text-muted-foreground font-bold">DZD</span>
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
                                <span className="absolute right-3 top-2 text-xs text-muted-foreground font-bold">%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gram presets */}
                <div className="flex items-center gap-1.5 pt-1">
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

            {/* Results card */}
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Prix Total Estimé Client :</span>
                    <span className="text-foreground">
                        {unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD/g
                    </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
                        {computedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                        <span className="text-sm font-bold text-foreground">DZD</span>
                        {isCalculating && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </div>
                    <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                        {calcMode === 'sell' ? 'Prix Vente' : 'Rachat Casse'}
                    </Badge>
                </div>
            </div>
        </div>
    );
}
