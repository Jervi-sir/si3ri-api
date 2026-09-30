import { Link } from '@inertiajs/react';
import { ExternalLink, History, RefreshCw, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { history as goldHistory } from '@/actions/App/Http/Controllers/LiveRating/LiveRatingApiController';
import { Button } from '@/components/ui/button';
import { KARAT_DEFINITIONS, MetalRateItem } from './current-prices.section';

interface HistorySectionProps {
    selectedKarat: string;
    onSelectKarat: (karat: string) => void;
}

export function HistorySection({
    selectedKarat,
    onSelectKarat,
}: HistorySectionProps) {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
    const [history, setHistory] = useState<MetalRateItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Fetch history from backend API using Wayfinder
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const url = goldHistory.url({
            query: {
                karat: selectedKarat,
                range: timeRange,
            },
        });

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    setHistory(Array.isArray(data) ? data : []);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedKarat, timeRange]);

    const karatInfo = KARAT_DEFINITIONS[selectedKarat] || {
        title: selectedKarat,
        subtitle: '',
        purity: '',
    };

    return (
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
                {/* Header & Range Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <History className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-foreground">
                                Historique Récent : {karatInfo.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Snapshots périodiques enregistrés pour ce titrage
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                        {(['24h', '7d', '30d'] as const).map((range) => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                    timeRange === range
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table of snapshots */}
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b text-muted-foreground font-semibold">
                                <th className="pb-3">Date & Heure</th>
                                <th className="pb-3">Prix Réf (DZD/g)</th>
                                <th className="pb-3 font-bold text-amber-600 dark:text-amber-400">Vente Bijou</th>
                                <th className="pb-3 font-bold text-emerald-600 dark:text-emerald-400">Achat Casse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                                            Chargement des captures...
                                        </div>
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                        Aucun enregistrement historique disponible pour cette période.
                                    </td>
                                </tr>
                            ) : (
                                history
                                    .slice(-8)
                                    .reverse()
                                    .map((row, idx) => (
                                        <tr key={row.id || idx} className="hover:bg-muted/40 transition-colors">
                                            <td className="py-3 font-medium text-foreground whitespace-nowrap">
                                                {row.occurred_at
                                                    ? new Date(row.occurred_at).toLocaleString([], {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="py-3 font-mono font-semibold">
                                                {Number(row.rate).toLocaleString()} DZD
                                            </td>
                                            <td className="py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                                                {row.sell_price ? `${Number(row.sell_price).toLocaleString()} DZD` : '—'}
                                            </td>
                                            <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {row.buy_price ? `${Number(row.buy_price).toLocaleString()} DZD` : '—'}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer link to full histories */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    Captures automatiques enregistrées toutes les 10 minutes
                </span>
                <Link
                    href={`/dashboard/gold-histories?karat=${selectedKarat}&range=${timeRange}`}
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                    Journal complet <ExternalLink className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
