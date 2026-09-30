import { Coins, Flame, Sparkles } from 'lucide-react';

export interface MetalRateItem {
    id?: number;
    karat: string;
    rate: string | number;
    buy_price?: string | number | null;
    sell_price?: string | number | null;
    currency: string;
    unit: string;
    occurred_at?: string;
}

export interface SpotPrice {
    id: number;
    price: string | number;
    currency: string;
    unit: string;
    occurred_at?: string;
}

export interface CurrencyRateModel {
    id?: number;
    pair: string;
    source: number;
    rate: string | number;
    created_at?: string;
    updated_at?: string;
}

export const KARAT_DEFINITIONS: Record<
    string,
    { title: string; subtitle: string; purity: string; tagColor: string }
> = {
    '18k_italian': {
        title: '18K Or Italien',
        subtitle: 'Bijoux importés & finis',
        purity: '75.0%',
        tagColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    '18k': {
        title: '18K Local (Standard)',
        subtitle: 'Fabrication locale standard',
        purity: '75.0%',
        tagColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    },
    '18k_scrap': {
        title: '18K Casse (Achat)',
        subtitle: 'Rachat vieil or / déchet',
        purity: '75.0%',
        tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    '21k': {
        title: '21K Moyen-Orient',
        subtitle: 'Or traditionnel & pièces',
        purity: '87.5%',
        tagColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    '22k': {
        title: '22K Golfe & Monnaies',
        subtitle: 'Haute pureté & pièces',
        purity: '91.6%',
        tagColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    '24k': {
        title: '24K Lingot (Pur 999)',
        subtitle: "Lingotins & or d'investissement",
        purity: '100%',
        tagColor: 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30',
    },
    '16k': {
        title: '16K Commercial',
        subtitle: 'Alliage courant',
        purity: '66.7%',
        tagColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
    '14k': {
        title: '14K Économique',
        subtitle: 'Norme européenne / US',
        purity: '58.3%',
        tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    '9k': {
        title: '9K Basse Pureté',
        subtitle: 'Bijouterie grand public',
        purity: '37.5%',
        tagColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    },
};

interface CurrentPricesSectionProps {
    rates: Record<string, MetalRateItem>;
    selectedKarat: string;
    onSelectKarat: (karat: string) => void;
}

export function CurrentPricesSection({
    rates,
    selectedKarat,
    onSelectKarat,
}: CurrentPricesSectionProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Coins className="h-5 w-5 text-amber-500" />
                    Tarifs en Direct par Titrage (Prix au Gramme)
                </h2>
                <span className="text-xs text-muted-foreground">
                    Cliquez sur une carte pour calculer & consulter l'historique
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(KARAT_DEFINITIONS).map(([key, def]) => {
                    const item = rates[key];
                    const isSelected = selectedKarat === key;
                    const sellPrice = item?.sell_price ? Number(item.sell_price) : Number(item?.rate || 0);
                    const buyPrice = item?.buy_price ? Number(item.buy_price) : null;

                    return (
                        <div
                            key={key}
                            onClick={() => onSelectKarat(key)}
                            className={`relative group flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer shadow-sm ${
                                isSelected
                                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                                    : 'bg-card hover:border-border/80 hover:shadow'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-amber-500 transition-colors">
                                        {def.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{def.subtitle}</p>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${def.tagColor}`}>
                                    {def.purity}
                                </span>
                            </div>

                            <div className="mt-6 pt-4 border-t border-dashed border-border/60 space-y-1.5">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">Vente / Réf:</span>
                                    <span className="text-xl font-black text-foreground font-mono">
                                        {sellPrice > 0 ? sellPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}{' '}
                                        <span className="text-xs font-bold text-muted-foreground">DZD/g</span>
                                    </span>
                                </div>

                                {buyPrice !== null && (
                                    <div className="flex items-baseline justify-between text-xs">
                                        <span className="text-muted-foreground font-medium">Rachat (Casse):</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {buyPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD/g
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
