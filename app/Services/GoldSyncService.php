<?php

namespace App\Services;

use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\MetalRate;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GoldSyncService
{
    public const TROY_OUNCE_TO_GRAM = 31.1034768;

    public function syncPricesAndRates(float $rawSpotPriceOunce, ?string $timestamp = null): void
    {
        DB::transaction(function () use ($rawSpotPriceOunce, $timestamp) {
            $occurredAt = $timestamp ? Carbon::parse($timestamp) : now();

            // 1. SAVE RAW SOURCE OF TRUTH
            $metalPrice = MetalPrice::create([
                'metal_code' => 'XAU',
                'sub_name' => 'Gold 24K Spot',
                'price' => $rawSpotPriceOunce,
                'currency' => 'USD',
                'unit' => 'oz',
                'occurred_at' => $occurredAt,
            ]);

            // 2. GET EXCHANGE RATE (e.g. Parallel Market USD -> DZD)
            $exchangeRate = CurrencyRate::where('pair', 'USD/DZD')
                ->where('source', 1) // parallel/black market
                ->latest()
                ->value('rate') ?? 240.0;

            // 24k price in DZD per gram
            $price24kPerGram = ($rawSpotPriceOunce / self::TROY_OUNCE_TO_GRAM) * $exchangeRate;

            // 3. DEFINE KARAT MULTIPLIERS & SPECIAL RATES
            $karatConfigs = [
                '24k' => ['purity' => 24 / 24, 'buy_pct' => 0.98, 'sell_premium' => 0],
                '22k' => ['purity' => 22 / 24, 'buy_pct' => 0.97, 'sell_premium' => 0],
                '21k' => ['purity' => 21 / 24, 'buy_pct' => 0.97, 'sell_premium' => 0],
                '18k' => ['purity' => 18 / 24, 'buy_pct' => 0.97, 'sell_premium' => 0],
                '18k_italian' => ['purity' => 18 / 24, 'buy_pct' => 0.96, 'sell_premium' => 1500], // +1500 DZD/g craft markup
                '18k_scrap' => ['purity' => 18 / 24, 'buy_pct' => 0.95, 'sell_premium' => 0],
                '16k' => ['purity' => 16 / 24, 'buy_pct' => 0.96, 'sell_premium' => 0],
                '14k' => ['purity' => 14 / 24, 'buy_pct' => 0.95, 'sell_premium' => 0],
                '9k' => ['purity' => 9 / 24,  'buy_pct' => 0.94, 'sell_premium' => 0],
            ];

            // 4. BULK INSERT ALL CALCULATED RATES
            $ratesToInsert = [];
            foreach ($karatConfigs as $karat => $cfg) {
                $baseRate = $price24kPerGram * $cfg['purity'];

                $ratesToInsert[] = [
                    'metal_code' => 'XAU',
                    'metal_price_id' => $metalPrice->id,
                    'karat' => $karat,
                    'rate' => round($baseRate, 4),
                    'buy_price' => round($baseRate * $cfg['buy_pct'], 4),
                    'sell_price' => round($baseRate + $cfg['sell_premium'], 4),
                    'currency' => 'DZD',
                    'unit' => 'gram',
                    'occurred_at' => $occurredAt,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            MetalRate::insert($ratesToInsert);
        });
    }
}
