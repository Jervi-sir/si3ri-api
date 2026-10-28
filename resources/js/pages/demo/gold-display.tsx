import { Head } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Check,
    Clock,
    Coins,
    Crown,
    DollarSign,
    Edit3,
    ExternalLink,
    Eye,
    Flame,
    Globe,
    HelpCircle,
    Lock,
    Maximize,
    Minimize,
    Percent,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Scale,
    ShieldCheck,
    Sliders,
    Sparkles,
    Store,
    TrendingUp,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

export interface MetalRateItem {
    id?: number;
    karat: string;
    rate: string | number;
    buy_price?: string | number | null;
    sell_price?: string | number | null;
    currency?: string;
    unit?: string;
    occurred_at?: string;
}

export interface SpotPrice {
    id?: number;
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

interface PageProps {
    initialRates?: {
        spot_price?: SpotPrice | null;
        last_updated?: string | null;
        rates?: Record<string, MetalRateItem>;
    };
    currencies?: {
        usd_parallel?: CurrencyRateModel | null;
        usd_official?: CurrencyRateModel | null;
        eur_parallel?: CurrencyRateModel | null;
        eur_official?: CurrencyRateModel | null;
    };
    currencyRate?: CurrencyRateModel | null;
}

// Karats displayed on the showcase board
interface KaratRowConfig {
    karatNumber: number;
    purityPercent: string;
    fineness: number; // e.g. 999, 916, 875, 750, 585
    backendKey: string;
    italianKey: string;
    purityFactor: number;
    title: string;
}

const KARAT_ROWS: KaratRowConfig[] = [
    {
        karatNumber: 24,
        purityPercent: '99.9%',
        fineness: 999,
        backendKey: '24k',
        italianKey: '24k',
        purityFactor: 0.999,
        title: 'عيار 24 قيراط (ذهب خالص 999)',
    },
    {
        karatNumber: 22,
        purityPercent: '91.6%',
        fineness: 916,
        backendKey: '22k',
        italianKey: '22k',
        purityFactor: 0.9167,
        title: 'عيار 22 قيراط (خليجي وعملات)',
    },
    {
        karatNumber: 21,
        purityPercent: '87.5%',
        fineness: 875,
        backendKey: '21k',
        italianKey: '21k',
        purityFactor: 0.875,
        title: 'عيار 21 قيراط (عربي تقليدي)',
    },
    {
        karatNumber: 18,
        purityPercent: '75%',
        fineness: 750,
        backendKey: '18k',
        italianKey: '18k_italian',
        purityFactor: 0.75,
        title: 'عيار 18 قيراط (المعيار الأكثر تداولاً)',
    },
    {
        karatNumber: 14,
        purityPercent: '58.5%',
        fineness: 585,
        backendKey: '14k',
        italianKey: '14k',
        purityFactor: 0.585,
        title: 'عيار 14 قيراط (اقتصادي أوروبي)',
    },
];

// Benefit modifier structure per karat and condition
// NOTE: "New" prices (جديد) come strictly from the backend and are LOCKED from modification!
export interface KaratCustomBenefit {
    italian: {
        oldBuyDelta: number;
        oldSellDelta: number;
        usedBuyDelta: number;
        usedSellDelta: number;
    };
    local: {
        oldBuyDelta: number;
        oldSellDelta: number;
        usedBuyDelta: number;
        usedSellDelta: number;
    };
}

export interface BenefitConfig {
    shopBenefitDzd: number; // General shop margin
    scrapPriceAdjustment: number;
    // Per-karat customized benefits for old (قديم) and used (مستعمل) gold
    karats: Record<number, KaratCustomBenefit>;
}

// Default initial deltas matching real Algerian market board conventions
const DEFAULT_KARAT_BENEFITS: Record<number, KaratCustomBenefit> = {
    24: {
        italian: {
            oldBuyDelta: 650,
            oldSellDelta: 650,
            usedBuyDelta: 1130,
            usedSellDelta: 1380,
        },
        local: {
            oldBuyDelta: 750,
            oldSellDelta: 750,
            usedBuyDelta: 1220,
            usedSellDelta: 100,
        },
    },
    22: {
        italian: {
            oldBuyDelta: 550,
            oldSellDelta: 550,
            usedBuyDelta: 970,
            usedSellDelta: 1200,
        },
        local: {
            oldBuyDelta: 650,
            oldSellDelta: 680,
            usedBuyDelta: 1110,
            usedSellDelta: 200,
        },
    },
    21: {
        italian: {
            oldBuyDelta: 500,
            oldSellDelta: 500,
            usedBuyDelta: 880,
            usedSellDelta: 1120,
        },
        local: {
            oldBuyDelta: 520,
            oldSellDelta: 550,
            usedBuyDelta: 920,
            usedSellDelta: 250,
        },
    },
    18: {
        italian: {
            oldBuyDelta: 550,
            oldSellDelta: 550,
            usedBuyDelta: 850,
            usedSellDelta: 1100,
        },
        local: {
            oldBuyDelta: 350,
            oldSellDelta: 380,
            usedBuyDelta: 700,
            usedSellDelta: 200,
        },
    },
    14: {
        italian: {
            oldBuyDelta: 530,
            oldSellDelta: 530,
            usedBuyDelta: 800,
            usedSellDelta: 1030,
        },
        local: {
            oldBuyDelta: 300,
            oldSellDelta: 270,
            usedBuyDelta: 660,
            usedSellDelta: 100,
        },
    },
};

const DEFAULT_BENEFITS: BenefitConfig = {
    shopBenefitDzd: 600,
    scrapPriceAdjustment: 0,
    karats: DEFAULT_KARAT_BENEFITS,
};

export default function GoldDisplayShowcase({
    initialRates,
    currencies,
    currencyRate,
}: PageProps) {
    const rawSpot = Number(initialRates?.spot_price?.price || 4286.2);
    const ratesMap = initialRates?.rates || {};

    // Live Parallel Euro & USD
    const eurParallel = Number(currencies?.eur_parallel?.rate || 262);
    const usdParallel = Number(
        currencies?.usd_parallel?.rate || currencyRate?.rate || 240
    );

    // Current Time in Arabic / Algiers Timezone
    const [currentTime, setCurrentTime] = useState<{
        time: string;
        date: string;
        dayName: string;
    }>({
        time: '16:32',
        date: '2026-10-28',
        dayName: 'الأربعاء',
    });

    const [isFullscreen, setIsFullscreen] = useState(false);

    // Edit Mode Toggle: Default is FALSE as requested (clean showcase display mode)
    const [isEditMode, setIsEditMode] = useState(false);

    // Right Side Sheet state and currently selected karat for editing
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedKaratNumber, setSelectedKaratNumber] = useState<number>(24);

    // Dynamic Benefit Configuration State with localStorage persistence
    const [benefits, setBenefits] = useState<BenefitConfig>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('si3ri_demo_benefits_v3');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return {
                        shopBenefitDzd: Number(parsed.shopBenefitDzd) || 600,
                        scrapPriceAdjustment: Number(parsed.scrapPriceAdjustment) || 0,
                        karats: {
                            ...DEFAULT_KARAT_BENEFITS,
                            ...(parsed.karats || {}),
                        },
                    };
                } catch {
                    // ignore
                }
            }
        }
        return DEFAULT_BENEFITS;
    });

    // Save benefits to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('si3ri_demo_benefits_v3', JSON.stringify(benefits));
        } catch {
            // ignore
        }
    }, [benefits]);

    // Update real clock every second
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const daysArabic = [
                'الأحد',
                'الإثنين',
                'الثلاثاء',
                'الأربعاء',
                'الخميس',
                'الجمعة',
                'السبت',
            ];
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            setCurrentTime({
                time: `${hours}:${minutes}`,
                date: `${year}-${month}-${day}`,
                dayName: daysArabic[now.getDay()],
            });
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            setIsFullscreen(false);
        }
    };

    // Calculate Base 24k Gram in DZD from Spot Price and USD Parallel
    const spot24kGramDZD = useMemo(() => {
        return (rawSpot / 31.1034768) * usdParallel;
    }, [rawSpot, usdParallel]);

    // Scrap 18k base price (casse) directly from backend
    const scrapBaseRate = useMemo(() => {
        const scrapFromBackend = Number(ratesMap['18k_scrap']?.buy_price || 0);
        if (scrapFromBackend > 0) return scrapFromBackend;
        return Math.round(spot24kGramDZD * 0.75 * 0.95);
    }, [ratesMap, spot24kGramDZD]);

    const activeScrapPrice = Math.round(
        scrapBaseRate + benefits.scrapPriceAdjustment
    );

    // Compute prices for each row (Italian and Local)
    // CRITICAL: The NEW price (جديد) is STRICTLY from the backend stored in MetalRate!
    const tableData = useMemo(() => {
        return KARAT_ROWS.map((row) => {
            const backendItem = ratesMap[row.backendKey];
            const italianItem = ratesMap[row.italianKey];

            // Specific benefit config for this karat
            const karatBenefit =
                benefits.karats[row.karatNumber] ||
                DEFAULT_KARAT_BENEFITS[row.karatNumber] ||
                DEFAULT_KARAT_BENEFITS[24];

            // 1. BASE PRICE FROM BACKEND
            const baseGram =
                backendItem && Number(backendItem.rate) > 0
                    ? Number(backendItem.rate)
                    : Math.round(spot24kGramDZD * row.purityFactor);

            // 2. NEW PRICES (جديد) - STRICTLY FROM BACKEND STORAGE, IMMUTABLE IN SHEET
            // Italian New Sell comes from backend sell_price (e.g. 18k_italian has sell_price with imported markup)
            const italianNewSell =
                italianItem && Number(italianItem.sell_price) > 0
                    ? Number(italianItem.sell_price)
                    : baseGram + 380;

            // Italian New Buy comes from backend buy_price or base rate
            const italianNewBuy =
                italianItem && Number(italianItem.buy_price) > 0
                    ? Number(italianItem.buy_price)
                    : baseGram;

            // Local New Sell comes from backend sell_price (or base rate)
            const localNewSell =
                backendItem && Number(backendItem.sell_price) > 0
                    ? Number(backendItem.sell_price)
                    : baseGram;

            // Local New Buy comes from backend buy_price (or base rate with scrap discount)
            const localNewBuy =
                backendItem && Number(backendItem.buy_price) > 0
                    ? Number(backendItem.buy_price)
                    : Math.round(baseGram * 0.97);

            // 3. OLD (قديم) & USED (مستعمل) PRICES - COMPUTED WITH JEWELER'S CUSTOM BENEFIT
            const itDeltas = karatBenefit.italian;
            const italianPrices = {
                // NEW: Strict backend stored values
                newBuy: Math.round(italianNewBuy),
                newSell: Math.round(italianNewSell),
                // OLD & USED: Calculated using Jeweler's benefit margin
                oldBuy: Math.round(baseGram + itDeltas.oldBuyDelta),
                oldSell: Math.round(
                    baseGram + benefits.shopBenefitDzd + itDeltas.oldSellDelta
                ),
                usedBuy: Math.round(baseGram + itDeltas.usedBuyDelta),
                usedSell: Math.round(
                    baseGram + benefits.shopBenefitDzd + itDeltas.usedSellDelta
                ),
            };

            const locDeltas = karatBenefit.local;
            const localPrices = {
                // NEW: Strict backend stored values
                newBuy: Math.round(localNewBuy),
                newSell: Math.round(localNewSell),
                // OLD & USED: Calculated using Jeweler's benefit margin
                oldBuy: Math.round(baseGram + locDeltas.oldBuyDelta),
                oldSell: Math.round(
                    baseGram + benefits.shopBenefitDzd + locDeltas.oldSellDelta
                ),
                usedBuy: Math.round(baseGram + locDeltas.usedBuyDelta),
                usedSell: Math.round(
                    baseGram + benefits.shopBenefitDzd + locDeltas.usedSellDelta
                ),
            };

            return {
                ...row,
                baseGram,
                backendItem,
                italianItem,
                karatBenefit,
                italian: italianPrices,
                local: localPrices,
            };
        });
    }, [ratesMap, spot24kGramDZD, benefits]);

    // Active Karat being inspected/edited
    const activeKaratConfig = useMemo(() => {
        return (
            KARAT_ROWS.find((k) => k.karatNumber === selectedKaratNumber) ||
            KARAT_ROWS[0]
        );
    }, [selectedKaratNumber]);

    const activeKaratBenefits = useMemo(() => {
        return (
            benefits.karats[selectedKaratNumber] ||
            DEFAULT_KARAT_BENEFITS[selectedKaratNumber] ||
            DEFAULT_KARAT_BENEFITS[24]
        );
    }, [benefits, selectedKaratNumber]);

    // Active row data for the selected karat
    const activeRowData = useMemo(() => {
        return tableData.find((r) => r.karatNumber === selectedKaratNumber);
    }, [tableData, selectedKaratNumber]);

    // Handle clicking a target karat to open the side sheet
    const handleTargetKaratClick = (karatNumber: number) => {
        setSelectedKaratNumber(karatNumber);
        setIsSheetOpen(true);
    };

    // Update specific field for currently edited karat (only old and used, not new!)
    const updateKaratDelta = (
        category: 'italian' | 'local',
        field: 'oldBuyDelta' | 'oldSellDelta' | 'usedBuyDelta' | 'usedSellDelta',
        value: number
    ) => {
        setBenefits((prev) => {
            const currentKarat =
                prev.karats[selectedKaratNumber] ||
                DEFAULT_KARAT_BENEFITS[selectedKaratNumber];
            return {
                ...prev,
                karats: {
                    ...prev.karats,
                    [selectedKaratNumber]: {
                        ...currentKarat,
                        [category]: {
                            ...currentKarat[category],
                            [field]: value,
                        },
                    },
                },
            };
        });
    };

    // Ounce calculations in DZD
    const ounceNewPriceDZD = useMemo(() => {
        return Math.round(rawSpot * usdParallel);
    }, [rawSpot, usdParallel]);

    const ounceUsedPriceDZD = useMemo(() => {
        return Math.round(rawSpot * usdParallel * 0.96);
    }, [rawSpot, usdParallel]);

    return (
        <div
            dir="rtl"
            className="relative min-h-screen w-full bg-[#07090d] text-[#e8eaed] font-['Cairo',sans-serif] selection:bg-amber-500/30 overflow-x-hidden p-3 md:p-6 lg:p-8 flex flex-col justify-between"
            style={{
                backgroundImage:
                    'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(184, 134, 11, 0.08) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(218, 165, 32, 0.08) 0%, transparent 50%)',
            }}
        >
            <Head title="Si3ri Gold Price - شاشة عرض أسعار الذهب الفاخرة" />

            {/* TOP FLOATING ACTION BAR */}
            <header className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-[#0c1017]/95 px-4 py-2.5 backdrop-blur-md shadow-lg shadow-black/60">
                <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                    <span className="text-xs md:text-sm font-semibold tracking-wide text-amber-200/90">
                        شاشة العرض المباشر للذهب (وضع المتجر / DEMO)
                    </span>
                    <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-300 font-bold"
                    >
                        حي ومباشر
                    </Badge>

                    {/* Active Edit Mode Status */}
                    {isEditMode ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                            <Edit3 className="h-3 w-3 text-amber-400" />
                            وضع التعديل مفعل: انقر على أي عيار للتعديل
                        </span>
                    ) : (
                        <span className="hidden sm:inline-block text-[11px] text-zinc-400">
                            وضع العرض الصافي (شاشة المتجر)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Edit Mode Button (Default is OFF) */}
                    <Button
                        size="sm"
                        variant={isEditMode ? 'default' : 'outline'}
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`h-9 gap-1.5 rounded-xl font-bold transition-all shadow-sm ${
                            isEditMode
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-500/30'
                                : 'border-amber-500/40 bg-black/40 text-amber-300 hover:bg-amber-500/20'
                        }`}
                    >
                        {isEditMode ? (
                            <>
                                <Eye className="h-4 w-4" />
                                <span>إخفاء أزرار التعديل</span>
                            </>
                        ) : (
                            <>
                                <Edit3 className="h-4 w-4" />
                                <span>تفعيل التعديل على العيارات</span>
                            </>
                        )}
                    </Button>

                    {/* Quick Karats Selector Chips (When Edit Mode is Active) */}
                    {isEditMode && (
                        <div className="hidden xl:flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-zinc-800">
                            <span className="text-[11px] font-bold text-zinc-400 px-2">
                                اختر العيار:
                            </span>
                            {KARAT_ROWS.map((k) => (
                                <button
                                    key={`chip-${k.karatNumber}`}
                                    onClick={() => handleTargetKaratClick(k.karatNumber)}
                                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                                        selectedKaratNumber === k.karatNumber && isSheetOpen
                                            ? 'bg-amber-500 text-slate-950 shadow-md'
                                            : 'bg-zinc-900 text-amber-300 hover:bg-zinc-800 border border-amber-500/20'
                                    }`}
                                >
                                    {k.karatNumber}K
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Right-Side Sheet Trigger Button */}
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                size="sm"
                                className="h-9 gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all"
                            >
                                <Sliders className="h-4 w-4" />
                                <span>تعديل الفائدة ({selectedKaratNumber}K)</span>
                                {benefits.shopBenefitDzd > 0 && (
                                    <span className="rounded-full bg-slate-950/20 px-1.5 py-0.2 text-[11px] font-black text-slate-950">
                                        +{benefits.shopBenefitDzd} دج
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>

                        {/* RIGHT SIDE DRAWER / SHEET CONTENT */}
                        <SheetContent
                            side="right"
                            dir="rtl"
                            className="w-full sm:max-w-xl border-amber-500/30 bg-[#0c1017] text-white p-6 overflow-y-auto font-['Cairo',sans-serif]"
                        >
                            <SheetHeader className="text-right border-b border-amber-500/20 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-lg">
                                            {selectedKaratNumber}K
                                        </div>
                                        <div>
                                            <SheetTitle className="text-lg font-black text-amber-300">
                                                تعديل عيار {selectedKaratNumber} قيراط
                                            </SheetTitle>
                                            <SheetDescription className="text-xs text-zinc-400">
                                                {activeKaratConfig.title}
                                            </SheetDescription>
                                        </div>
                                    </div>

                                    {/* Karat switcher within sheet */}
                                    <div className="flex gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800">
                                        {KARAT_ROWS.map((k) => (
                                            <button
                                                key={`sheet-k-${k.karatNumber}`}
                                                onClick={() =>
                                                    setSelectedKaratNumber(k.karatNumber)
                                                }
                                                className={`h-7 px-2 text-xs font-black rounded-lg transition-all ${
                                                    selectedKaratNumber === k.karatNumber
                                                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                                                        : 'text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {k.karatNumber}K
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-6 py-5">
                                {/* 1. NEW GOLD PRICING (LOCKED - Sourced directly from Backend storage) */}
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-amber-400" />
                                            <Label className="text-xs font-bold text-amber-300">
                                                أسعار الذهب الجديد (جديد - مخزنة في الباك إند)
                                            </Label>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]"
                                        >
                                            غير قابلة للتعديل
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {/* Italian New */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-3 space-y-1">
                                            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                                                <span>🇮🇹</span> إيطالي جديد
                                            </span>
                                            <div className="flex justify-between font-mono pt-1">
                                                <span className="text-zinc-500">شراء:</span>
                                                <span className="font-bold text-emerald-400">
                                                    {activeRowData?.italian.newBuy.toLocaleString()}{' '}
                                                    دج
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-mono">
                                                <span className="text-zinc-500">بيع:</span>
                                                <span className="font-bold text-red-400">
                                                    {activeRowData?.italian.newSell.toLocaleString()}{' '}
                                                    دج
                                                </span>
                                            </div>
                                        </div>

                                        {/* Local New */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-3 space-y-1">
                                            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                                                <span>🇩🇿</span> محلي جديد
                                            </span>
                                            <div className="flex justify-between font-mono pt-1">
                                                <span className="text-zinc-500">شراء:</span>
                                                <span className="font-bold text-emerald-400">
                                                    {activeRowData?.local.newBuy.toLocaleString()}{' '}
                                                    دج
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-mono">
                                                <span className="text-zinc-500">بيع:</span>
                                                <span className="font-bold text-red-400">
                                                    {activeRowData?.local.newSell.toLocaleString()}{' '}
                                                    دج
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                                        سعر الذهب الجديد يأتي مباشرة من قاعدة بيانات الباك إند
                                        ولا يتغير إلا بتحديث أسعار المتجر الرسمية.
                                    </p>
                                </div>

                                {/* 2. Italian Gold Modifiers for this Karat (Old & Used) */}
                                <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                            <span>🇮🇹</span> الذهب الإيطالي (فوارق القديم
                                            والمستعمل عيار {selectedKaratNumber}K)
                                        </h4>
                                        <span className="text-[10px] text-zinc-500">
                                            فارق الشراء / البيع (دج)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                                        {/* Old */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-2.5 space-y-2">
                                            <div className="text-[11px] font-bold text-amber-300">
                                                قديم (Old)
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-emerald-400 block mb-0.5">
                                                    شراء (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.italian.oldBuyDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'italian',
                                                            'oldBuyDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-red-400 block mb-0.5">
                                                    بيع (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.italian.oldSellDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'italian',
                                                            'oldSellDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-red-400"
                                                />
                                            </div>
                                        </div>

                                        {/* Used */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-2.5 space-y-2">
                                            <div className="text-[11px] font-bold text-amber-300">
                                                مستعمل (Used)
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-emerald-400 block mb-0.5">
                                                    شراء (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.italian.usedBuyDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'italian',
                                                            'usedBuyDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-red-400 block mb-0.5">
                                                    بيع (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.italian
                                                            .usedSellDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'italian',
                                                            'usedSellDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-red-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Local Gold Modifiers for this Karat (Old & Used) */}
                                <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                            <span>🇩🇿</span> الذهب المحلي (فوارق القديم
                                            والمستعمل عيار {selectedKaratNumber}K)
                                        </h4>
                                        <span className="text-[10px] text-zinc-500">
                                            فارق الشراء / البيع (دج)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                                        {/* Old */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-2.5 space-y-2">
                                            <div className="text-[11px] font-bold text-amber-300">
                                                قديم (Old)
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-emerald-400 block mb-0.5">
                                                    شراء (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.local.oldBuyDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'local',
                                                            'oldBuyDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-red-400 block mb-0.5">
                                                    بيع (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.local.oldSellDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'local',
                                                            'oldSellDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-red-400"
                                                />
                                            </div>
                                        </div>

                                        {/* Used */}
                                        <div className="rounded-xl border border-zinc-800 bg-black/50 p-2.5 space-y-2">
                                            <div className="text-[11px] font-bold text-amber-300">
                                                مستعمل (Used)
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-emerald-400 block mb-0.5">
                                                    شراء (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.local.usedBuyDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'local',
                                                            'usedBuyDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-red-400 block mb-0.5">
                                                    بيع (+/- دج)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="10"
                                                    value={
                                                        activeKaratBenefits.local.usedSellDelta
                                                    }
                                                    onChange={(e) =>
                                                        updateKaratDelta(
                                                            'local',
                                                            'usedSellDelta',
                                                            Number(e.target.value) || 0
                                                        )
                                                    }
                                                    className="h-7 text-center text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-red-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Global Margins (Shop benefit + Scrap adjustment) */}
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-amber-400" />
                                            فائدة المحل العامة (تُضاف لأسعار بيع المستعمل والقديم)
                                        </Label>
                                        <span className="font-mono text-xs text-amber-400 font-bold">
                                            {benefits.shopBenefitDzd} دج/غ
                                        </span>
                                    </div>
                                    <Input
                                        type="number"
                                        step="50"
                                        value={benefits.shopBenefitDzd}
                                        onChange={(e) =>
                                            setBenefits((prev) => ({
                                                ...prev,
                                                shopBenefitDzd:
                                                    Number(e.target.value) || 0,
                                            }))
                                        }
                                        className="h-10 rounded-xl border-zinc-700 bg-black/60 pr-4 pl-12 font-bold text-amber-300"
                                    />
                                </div>

                                {/* Reset & Close actions */}
                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setBenefits((prev) => ({
                                                ...prev,
                                                karats: {
                                                    ...prev.karats,
                                                    [selectedKaratNumber]:
                                                        DEFAULT_KARAT_BENEFITS[
                                                            selectedKaratNumber
                                                        ],
                                                },
                                            }));
                                        }}
                                        className="flex-1 gap-1.5 rounded-xl border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 text-xs"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        إعادة ضبط عيار {selectedKaratNumber}K
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => setIsSheetOpen(false)}
                                        className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        تطبيق والإغلاق
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Fullscreen Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-9 gap-1.5 rounded-xl border-amber-500/30 bg-black/40 text-amber-300 hover:bg-amber-500/20"
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize className="h-4 w-4" />
                                <span className="hidden sm:inline">إنهاء ملء الشاشة</span>
                            </>
                        ) : (
                            <>
                                <Maximize className="h-4 w-4" />
                                <span className="hidden sm:inline">ملء الشاشة</span>
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* MAIN LUXURY DISPLAY FRAME */}
            <main className="relative mx-auto w-full max-w-[1550px] rounded-[26px] border-[3px] border-[#cda24d] bg-gradient-to-b from-[#0e131b] via-[#090c12] to-[#06080c] p-4 md:p-6 lg:p-7 shadow-[0_0_50px_rgba(205,162,77,0.25),inset_0_0_30px_rgba(0,0,0,0.85)] flex flex-col gap-5">
                {/* Metallic Gold Bevel Highlights */}
                <div className="pointer-events-none absolute inset-0 rounded-[23px] border border-amber-300/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />

                {/* 1. TOP HEADER SECTION */}
                <header className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 border-b border-amber-500/20 pb-4">
                    {/* Left Brand: Si3ri GOLD PRICE with Crown */}
                    <div className="md:col-span-3 flex items-center gap-3.5">
                        <div className="flex flex-col items-center justify-center">
                            <Crown className="h-9 w-9 text-[#f6d365] drop-shadow-[0_2px_8px_rgba(246,211,101,0.6)]" />
                            <div className="flex items-baseline gap-1">
                                <span className="font-['Outfit',sans-serif] text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#ffe082] via-[#ffd54f] to-[#ffb300] bg-clip-text text-transparent drop-shadow-sm">
                                    Si3ri
                                </span>
                            </div>
                            <span className="font-['Outfit',sans-serif] text-[11px] font-bold tracking-[0.25em] text-[#d4af37] uppercase">
                                GOLD PRICE
                            </span>
                            <span className="text-[10px] text-zinc-400 tracking-tight mt-0.5">
                                أسعار الذهب .. من بورصة العالمية
                            </span>
                        </div>
                    </div>

                    {/* Middle: Golden Globe Graphic + Digital Time & Date + Live USD Spot Price */}
                    <div className="md:col-span-5 flex flex-wrap items-center justify-center gap-4 lg:gap-6">
                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 via-black to-amber-900/30 border border-amber-500/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                            <Globe className="h-10 w-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <div className="absolute inset-0 rounded-full border border-amber-300/20 animate-spin-slow" />
                        </div>

                        {/* Clock & Date Display */}
                        <div className="text-right">
                            <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5 justify-end">
                                <span>{currentTime.dayName}</span>
                                <span className="font-mono text-zinc-300">
                                    {currentTime.date}
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-2 text-3xl md:text-4xl font-black font-['Outfit',sans-serif] tracking-wider text-amber-100 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                                <span>{currentTime.time}</span>
                                <Clock className="h-5 w-5 text-amber-400/80" />
                            </div>
                        </div>

                        {/* Real International Gold Spot Price in USD (from Database / gold-api) */}
                        <div className="flex flex-col text-right border-r border-amber-500/30 pr-3.5 pl-1 py-1 rounded-xl bg-amber-500/5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                                <span>سعر الذهب العالمي (USD)</span>
                            </div>
                            <div className="font-mono font-black text-xl lg:text-2xl text-amber-200 mt-0.5 flex items-baseline gap-1">
                                <span>${rawSpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-zinc-400 font-sans font-normal">/ أونصة</span>
                            </div>
                            <span className="text-[9px] text-zinc-400">
                                Gold-API مباشر • XAU/USD
                            </span>
                        </div>
                    </div>

                    {/* Right: Golden Ingots Graphics + Trust Badges */}
                    <div className="md:col-span-4 flex items-center justify-end gap-4">
                        <div className="relative flex items-center justify-center px-4 py-2 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-950/20 to-black shadow-inner">
                            <div className="flex flex-col items-center">
                                <div className="h-7 w-12 rounded bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 shadow-md border border-amber-200/50 transform -rotate-6" />
                                <div className="h-7 w-12 rounded bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 shadow-lg border border-amber-200/50 -mt-4 mr-3" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 border-r border-amber-500/30 pr-3 text-right">
                            <ShieldCheck className="h-7 w-7 text-amber-400 shrink-0" />
                            <div className="text-[11px] font-bold leading-tight text-zinc-300">
                                <div>مصداقية</div>
                                <div>شفافية</div>
                                <div>ثقة</div>
                                <div className="text-amber-400">حلال</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. MAIN TABLES SECTION (Italian Gold & Local Gold) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* LEFT TABLE: الذهب الإيطالي (Italian Gold) */}
                    <section className="relative rounded-2xl border-2 border-[#b8860b]/60 bg-[#090d14]/90 p-3.5 md:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        {/* Header with Italian Flag & Badge */}
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-10 items-center justify-center overflow-hidden rounded border border-white/20 shadow-xs">
                                    <div className="h-full w-1/3 bg-[#009246]" />
                                    <div className="h-full w-1/3 bg-[#ffffff]" />
                                    <div className="h-full w-1/3 bg-[#ce2b37]" />
                                </div>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-amber-300 tracking-wide">
                                        الذهب الإيطالي
                                    </h2>
                                    <p className="text-[11px] text-zinc-400">
                                        تصاميم عالمية .. جودة عالية
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center justify-center rounded-md border border-amber-500/40 bg-black/60 px-2 py-0.5">
                                    <span className="text-[9px] font-black text-amber-400 tracking-widest">
                                        ITALY
                                    </span>
                                    <span className="text-[8px] text-zinc-400">
                                        MADE IN ITALY
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-[11px] font-semibold text-zinc-400 mb-2">
                            السعر / غرام (دج)
                        </div>

                        {/* Subdivided Column Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="text-xs text-amber-200/90 font-bold border-b border-amber-500/30">
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 w-16 text-center"
                                        >
                                            العيار
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 text-center text-[10px] w-14"
                                        >
                                            نسبة الذهب
                                            <br />
                                            الخالص
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 text-center text-[10px] w-12"
                                        >
                                            الدمغة
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 bg-amber-500/10 text-amber-300 font-black"
                                        >
                                            جديد (الرسمي)
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 bg-amber-500/5 text-amber-300"
                                        >
                                            قديم
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 bg-amber-500/5 text-amber-300"
                                        >
                                            مستعمل
                                        </th>
                                    </tr>
                                    <tr className="text-[11px] font-bold border-b border-amber-500/30">
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/30">
                                            شراء
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-red-400 bg-red-950/30">
                                            بيع
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/15">
                                            شراء
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-red-400 bg-red-950/15">
                                            بيع
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/15">
                                            شراء
                                        </th>
                                        <th className="p-1 text-red-400 bg-red-950/15">
                                            بيع
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-500/15 font-mono text-xs md:text-sm">
                                    {tableData.map((row) => (
                                        <tr
                                            key={`it-${row.karatNumber}`}
                                            onClick={() =>
                                                isEditMode &&
                                                handleTargetKaratClick(row.karatNumber)
                                            }
                                            className={`transition-all ${
                                                isEditMode
                                                    ? 'cursor-pointer hover:bg-amber-500/10 hover:ring-1 hover:ring-amber-500/40'
                                                    : 'hover:bg-amber-500/5'
                                            }`}
                                        >
                                            {/* Karat Target Cell with Edit Trigger */}
                                            <td className="p-2 border-l border-amber-500/20 font-black text-amber-300 text-base">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>{row.karatNumber}</span>
                                                    {isEditMode && (
                                                        <Edit3 className="h-3 w-3 text-amber-400 opacity-60 hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Purity % */}
                                            <td className="p-2 border-l border-amber-500/20 text-zinc-300 text-[11px]">
                                                {row.purityPercent}
                                            </td>
                                            {/* Fineness / Damgha */}
                                            <td className="p-2 border-l border-amber-500/20 text-zinc-400 text-xs">
                                                {row.fineness}
                                            </td>

                                            {/* New Buy / Sell (STRICTLY FROM BACKEND) */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/20">
                                                {row.italian.newBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-red-400 bg-red-950/20">
                                                {row.italian.newSell.toLocaleString()}
                                            </td>

                                            {/* Old Buy / Sell */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/10">
                                                {row.italian.oldBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-red-400 bg-red-950/10">
                                                {row.italian.oldSell.toLocaleString()}
                                            </td>

                                            {/* Used Buy / Sell */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/10">
                                                {row.italian.usedBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 font-bold text-red-400 bg-red-950/10">
                                                {row.italian.usedSell.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* RIGHT TABLE: الذهب المحلي (Local Algerian Gold) */}
                    <section className="relative rounded-2xl border-2 border-[#b8860b]/60 bg-[#090d14]/90 p-3.5 md:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        {/* Header with Algerian Flag & Monument */}
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-7 w-10 items-center justify-center overflow-hidden rounded border border-white/20 shadow-xs">
                                    <div className="h-full w-1/2 bg-[#006233]" />
                                    <div className="h-full w-1/2 bg-[#ffffff]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-3 w-3 rounded-full border border-[#d21034] flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#d21034]" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-amber-300 tracking-wide">
                                        الذهب المحلي
                                    </h2>
                                    <p className="text-[11px] text-zinc-400">
                                        جودة مضمونة .. متداول في السوق الجزائرية
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center justify-center rounded-md border border-amber-500/40 bg-black/60 p-1.5">
                                    <Store className="h-5 w-5 text-amber-400" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-[11px] font-semibold text-zinc-400 mb-2">
                            السعر / غرام (دج)
                        </div>

                        {/* Subdivided Column Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="text-xs text-amber-200/90 font-bold border-b border-amber-500/30">
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 w-16 text-center"
                                        >
                                            العيار
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 text-center text-[10px] w-14"
                                        >
                                            نسبة الذهب
                                            <br />
                                            الخالص
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 text-center text-[10px] w-12"
                                        >
                                            الدمغة
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 bg-amber-500/10 text-amber-300 font-black"
                                        >
                                            جديد (الرسمي)
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 border-l border-amber-500/20 bg-amber-500/5 text-amber-300"
                                        >
                                            قديم
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="p-1.5 bg-amber-500/5 text-amber-300"
                                        >
                                            مستعمل
                                        </th>
                                    </tr>
                                    <tr className="text-[11px] font-bold border-b border-amber-500/30">
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/30">
                                            شراء
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-red-400 bg-red-950/30">
                                            بيع
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/15">
                                            شراء
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-red-400 bg-red-950/15">
                                            بيع
                                        </th>
                                        <th className="p-1 border-l border-amber-500/20 text-emerald-400 bg-emerald-950/15">
                                            شراء
                                        </th>
                                        <th className="p-1 text-red-400 bg-red-950/15">
                                            بيع
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-500/15 font-mono text-xs md:text-sm">
                                    {tableData.map((row) => (
                                        <tr
                                            key={`loc-${row.karatNumber}`}
                                            onClick={() =>
                                                isEditMode &&
                                                handleTargetKaratClick(row.karatNumber)
                                            }
                                            className={`transition-all ${
                                                isEditMode
                                                    ? 'cursor-pointer hover:bg-amber-500/10 hover:ring-1 hover:ring-amber-500/40'
                                                    : 'hover:bg-amber-500/5'
                                            }`}
                                        >
                                            {/* Karat Target Cell with Edit Trigger */}
                                            <td className="p-2 border-l border-amber-500/20 font-black text-amber-300 text-base">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>{row.karatNumber}</span>
                                                    {isEditMode && (
                                                        <Edit3 className="h-3 w-3 text-amber-400 opacity-60 hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Purity % */}
                                            <td className="p-2 border-l border-amber-500/20 text-zinc-300 text-[11px]">
                                                {row.purityPercent}
                                            </td>
                                            {/* Fineness / Damgha */}
                                            <td className="p-2 border-l border-amber-500/20 text-zinc-400 text-xs">
                                                {row.fineness}
                                            </td>

                                            {/* New Buy / Sell (STRICTLY FROM BACKEND) */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/20">
                                                {row.local.newBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-red-400 bg-red-950/20">
                                                {row.local.newSell.toLocaleString()}
                                            </td>

                                            {/* Old Buy / Sell */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/10">
                                                {row.local.oldBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-red-400 bg-red-950/10">
                                                {row.local.oldSell.toLocaleString()}
                                            </td>

                                            {/* Used Buy / Sell */}
                                            <td className="p-2 border-l border-amber-500/20 font-bold text-emerald-400 bg-emerald-950/10">
                                                {row.local.usedBuy.toLocaleString()}
                                            </td>
                                            <td className="p-2 font-bold text-red-400 bg-red-950/10">
                                                {row.local.usedSell.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* 3. BOTTOM CARDS SECTION */}
                <footer className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                    {/* BOTTOM LEFT: Notice & Warranty Badges */}
                    <div className="md:col-span-4 rounded-2xl border-2 border-[#b8860b]/50 bg-[#0c1017]/95 p-4 flex flex-col justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <Coins className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-amber-300">
                                    الأسعار تشمل فقط سعر الذهب
                                </h3>
                                <p className="text-xs text-zinc-400">(لا تشمل المصنعية)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-amber-500/20 pt-3 mt-3 text-center">
                            <div className="space-y-0.5">
                                <ShieldCheck className="h-4 w-4 text-amber-400 mx-auto" />
                                <div className="text-[10px] text-zinc-400">ضمان</div>
                                <div className="text-[10px] font-bold text-zinc-200">
                                    دقة في الأسعار
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <Clock className="h-4 w-4 text-amber-400 mx-auto" />
                                <div className="text-[10px] text-zinc-400">تحديث</div>
                                <div className="text-[10px] font-bold text-zinc-200">
                                    كل دقيقة
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <Globe className="h-4 w-4 text-amber-400 mx-auto" />
                                <div className="text-[10px] text-zinc-400">
                                    مصدر الأسعار
                                </div>
                                <div className="text-[10px] font-bold text-zinc-200">
                                    بورصة الذهب
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM MIDDLE: Euro & Scrap Gold & Shop Benefit Widget */}
                    <div className="md:col-span-5 rounded-2xl border-2 border-[#b8860b]/50 bg-[#0c1017]/95 p-4 flex flex-col justify-between shadow-md">
                        {/* Euro Currency Indicator */}
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-8 items-center justify-center rounded bg-[#003399] border border-white/20">
                                    <span className="text-[10px] text-yellow-300">★</span>
                                </div>
                                <span className="text-xs font-bold text-zinc-300">
                                    سعر الأورو مقابل الدينار الجزائري
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-black text-amber-300">
                                    1 € = {eurParallel.toFixed(2)}
                                </span>
                                <Badge className="bg-emerald-950/80 text-emerald-400 text-[10px] border border-emerald-500/30 px-1 py-0 flex items-center gap-0.5">
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span>+0.45</span>
                                </Badge>
                            </div>
                        </div>

                        {/* Scrap Gold & Shop Margin Cards */}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            {/* Scrap Gold (ذهب خردة مكسور) */}
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
                                    <Coins className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-zinc-400">
                                        ذهب خردة مكسور
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                        سعر الغرام
                                    </div>
                                    <div className="text-sm font-black font-mono text-amber-300">
                                        {activeScrapPrice.toLocaleString()}{' '}
                                        <span className="text-[10px]">دج</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shop Benefit (فائدة المحل) */}
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
                                    <Store className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-zinc-400">
                                        فائدة المحل
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                        لكل غرام
                                    </div>
                                    <div className="text-sm font-black font-mono text-emerald-400">
                                        {benefits.shopBenefitDzd.toLocaleString()}{' '}
                                        <span className="text-[10px]">دج</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM RIGHT: Extra Information */}
                    <div className="md:col-span-3 rounded-2xl border-2 border-[#b8860b]/50 bg-[#0c1017]/95 p-4 flex flex-col justify-between shadow-md">
                        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                            <HelpCircle className="h-4 w-4 text-amber-400" />
                            <h3 className="text-xs font-bold text-amber-300">
                                معلومات إضافية
                            </h3>
                        </div>

                        <div className="space-y-1.5 text-xs text-zinc-300 pt-2 font-mono">
                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400 flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-amber-400" />
                                    أونصة الذهب (عالمي USD)
                                </span>
                                <span className="font-bold text-amber-300">
                                    ${rawSpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    غرام 24K خالص (عالمي USD)
                                </span>
                                <span className="font-bold text-amber-200">
                                    ${(rawSpot / 31.1034768).toFixed(2)} / g
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    سعر الأونصة (ذهب جديد بالدينار)
                                </span>
                                <span className="font-bold text-amber-300">
                                    {ounceNewPriceDZD.toLocaleString()} دج
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    سعر الأونصة (ذهب مستعمل)
                                </span>
                                <span className="font-bold text-amber-300">
                                    {ounceUsedPriceDZD.toLocaleString()} دج
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    سعر الأورو
                                </span>
                                <span className="font-bold text-zinc-200">
                                    {eurParallel.toFixed(2)} دج
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    سعر الغرام المكسور
                                </span>
                                <span className="font-bold text-zinc-200">
                                    {activeScrapPrice.toLocaleString()} دج
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-['Cairo',sans-serif] text-zinc-400">
                                    هامش ربح المحل
                                </span>
                                <span className="font-bold text-emerald-400">
                                    {benefits.shopBenefitDzd.toLocaleString()} دج
                                </span>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
