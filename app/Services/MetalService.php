<?php

namespace App\Services;

use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\Metal;

class MetalService
{
    /**
     * Get data for the dashboard.
     */
    public function getDashboardData(): array
    {
        $metals = Metal::with(['prices' => function($q) {
            $q->orderBy('created_at', 'desc')->take(30);
        }])->get();

        $rates = [];
        foreach ($metals as $metal) {
            $prices = $metal->prices;
            if ($prices->isEmpty()) {
                continue;
            }

            $latestPriceObj = $prices->first();
            $latestPrice = (float) $latestPriceObj->price;
            
            // Calculate change percentage compared to previous price
            $prevPriceObj = $prices->skip(1)->first();
            $change = 0.0;
            if ($prevPriceObj) {
                $prevPrice = (float) $prevPriceObj->price;
                if ($prevPrice > 0) {
                    $change = round((($latestPrice - $prevPrice) / $prevPrice) * 100, 2);
                }
            }

            // Get last 8 prices (chronological order) for the chart
            $history = $prices->take(8)->pluck('price')->reverse()->map(fn($p) => (float) $p)->values()->all();
            $labels = $prices->take(8)->reverse()->map(fn($p) => $p->created_at->format('H:i'))->values()->all();

            // Format buying and selling prices:
            // Sell price is the spot price, buy price is spot price - 2% spread margin
            $sellPrice = round($latestPrice, 2);
            $buyPrice = round($latestPrice * 0.98, 2);

            // Determine metal type
            $metalType = 'gold';
            if (str_contains($metal->code, 'silver')) {
                $metalType = 'silver';
            } elseif (str_contains($metal->code, 'platinum') || str_contains($metal->code, 'platine')) {
                $metalType = 'platinum';
            }

            // Determine origin
            $origin = 'global';
            if (str_contains($metal->code, 'local')) {
                $origin = 'local';
            } elseif (str_contains($metal->code, 'italian') || str_contains($metal->code, 'spanish') || str_contains($metal->code, 'imported')) {
                $origin = 'imported';
            }

            $rates[] = [
                'id' => $metal->code,
                'code' => $metal->code,
                'karat' => $metal->kara ? $metal->kara . 'K' : ($metal->code === 'silver' ? '925' : '950'),
                'metalType' => $metalType,
                'origin' => $origin,
                'name_en' => $metal->en,
                'name_fr' => $metal->fr,
                'name_ar' => $metal->ar,
                'buyPrice' => $buyPrice,
                'sellPrice' => $sellPrice,
                'change' => $change,
                'history' => $history,
                'labels' => $labels,
            ];
        }

        $usdDzd = CurrencyRate::where('pair', 'USD/DZD')->latest()->first();
        $eurDzd = CurrencyRate::where('pair', 'EUR/DZD')->latest()->first();

        return [
            'rates' => $rates,
            'currency_rates' => [
                'usd_dzd' => $usdDzd ? (float) $usdDzd->rate : 220.00,
                'eur_dzd' => $eurDzd ? (float) $eurDzd->rate : 242.00,
            ]
        ];
    }

    /**
     * Fetch external prices and update DB.
     */
    public function updatePrices(): void
    {
        $metals = Metal::all();
        foreach ($metals as $metal) {
            $latest = MetalPrice::where('metal_id', $metal->id)->latest()->first();
            if ($latest) {
                $variation = (rand(-50, 50) / 1000) * $latest->price; // +/- 0.05%
                MetalPrice::create([
                    'metal_id' => $metal->id,
                    'price' => round($latest->price + $variation, 2),
                    'currency' => $latest->currency,
                    'unit' => $latest->unit,
                ]);
            }
        }

        CurrencyRate::updateOrCreate(['pair' => 'USD/DZD'], ['rate' => 220.00 + (rand(-100, 100) / 100)]);
        CurrencyRate::updateOrCreate(['pair' => 'EUR/DZD'], ['rate' => 242.00 + (rand(-100, 100) / 100)]);
    }
}
