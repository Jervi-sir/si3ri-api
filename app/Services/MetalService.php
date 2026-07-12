<?php

namespace App\Services;

use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\Metal;

class MetalService
{
    /**
     * Get data for the dashboard.
     *
     * Returns the shape consumed by the Inertia dashboard page:
     * spot prices, currency rates, gold prices keyed by karat, and silver per gram.
     */
    public function getDashboardData(): array
    {
        $metals = Metal::with(['prices' => function ($q) {
            $q->orderBy('created_at', 'desc')->take(30);
        }])->get()->keyBy('code');

        $latestPrice = function (?Metal $metal): float {
            if (! $metal || $metal->prices->isEmpty()) {
                return 0.0;
            }

            return round((float) $metal->prices->first()->price, 2);
        };

        $gold24 = $latestPrice($metals->get('gold_24k'));
        $gold21 = $latestPrice($metals->get('gold_21k'));
        $gold18Local = $latestPrice($metals->get('gold_18k_local'));
        $gold18Italian = $latestPrice($metals->get('gold_18k_italian'));
        $silver = $latestPrice($metals->get('silver'));

        // 19K is not seeded; approximate it by linear interpolation between 18K and 21K.
        $interpolate = function (float $low, float $high): float {
            if ($low <= 0 || $high <= 0) {
                return 0.0;
            }

            return round($low + (1 / 3) * ($high - $low), 2);
        };

        $goldDzd = [
            '24k' => ['raw' => $gold24, 'local' => $gold24, 'italian' => $gold24],
            '21k' => ['raw' => $gold21, 'local' => $gold21, 'italian' => $gold21],
            '19k' => [
                'raw' => $interpolate($gold18Local, $gold21),
                'local' => $interpolate($gold18Local, $gold21),
                'italian' => $interpolate($gold18Italian, $gold21),
            ],
            '18k' => ['raw' => $gold18Local, 'local' => $gold18Local, 'italian' => $gold18Italian],
        ];

        // Currency rates from the parallel (black market) source, matching the UI label.
        $usdDzd = CurrencyRate::where('pair', 'USD/DZD')->where('source', 1)->latest()->first();
        $eurDzd = CurrencyRate::where('pair', 'EUR/DZD')->where('source', 1)->latest()->first();

        return [
            'spot' => [
                'gold' => $gold24,
                'silver' => $silver,
                'copper' => 0.0,
                'last_updated' => now()->toDateTimeString(),
            ],
            'rates' => [
                'usd_dzd' => $usdDzd ? (float) $usdDzd->rate : 220.00,
                'eur_dzd' => $eurDzd ? (float) $eurDzd->rate : 242.00,
            ],
            'gold_dzd' => $goldDzd,
            'silver_dzd' => [
                'gram' => $silver,
            ],
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
