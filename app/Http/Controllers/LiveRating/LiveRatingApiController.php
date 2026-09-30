<?php

namespace App\Http\Controllers\LiveRating;

use App\Http\Controllers\Controller;
use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\MetalRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiveRatingApiController extends Controller
{
    /**
     * API: Get all live ratings and currency exchange rates
     */
    public function currentRates(): JsonResponse
    {
        $latestOccurredAt = MetalRate::max('occurred_at');

        $rates = MetalRate::where('metal_code', 'XAU')
            ->when($latestOccurredAt, fn ($q) => $q->where('occurred_at', $latestOccurredAt))
            ->get()
            ->keyBy('karat');

        $rawSpot = MetalPrice::where('metal_code', 'XAU')
            ->latest('occurred_at')
            ->first();

        $currencies = [
            'usd_parallel' => CurrencyRate::where('pair', 'USD/DZD')->where('source', 1)->latest()->first(),
            'usd_official' => CurrencyRate::where('pair', 'USD/DZD')->where('source', 0)->latest()->first(),
            'eur_parallel' => CurrencyRate::where('pair', 'EUR/DZD')->where('source', 1)->latest()->first(),
            'eur_official' => CurrencyRate::where('pair', 'EUR/DZD')->where('source', 0)->latest()->first(),
        ];

        return response()->json([
            'spot_price' => $rawSpot,
            'last_updated' => $latestOccurredAt,
            'rates' => $rates,
            'currencies' => $currencies,
        ]);
    }

    /**
     * API: Get historical rate data for charts (by karat & timeframe)
     */
    public function history(Request $request): JsonResponse
    {
        $karat = $request->query('karat', '18k_italian');
        $range = $request->query('range', '24h');

        $query = MetalRate::where('metal_code', 'XAU')
            ->where('karat', $karat);

        if ($range === '24h') {
            $query->where('occurred_at', '>=', now()->subDay());
        } elseif ($range === '7d') {
            $query->where('occurred_at', '>=', now()->subDays(7));
        } elseif ($range === '30d') {
            $query->where('occurred_at', '>=', now()->subDays(30));
        }

        $history = $query->orderBy('occurred_at', 'asc')
            ->get(['id', 'karat', 'rate', 'buy_price', 'sell_price', 'currency', 'unit', 'occurred_at']);

        return response()->json($history);
    }

    /**
     * API: Calculate price on the backend based on chosen karat, weight, mode, making fee and margin
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'karat' => 'required|string',
            'weight' => 'required|numeric|min:0.01',
            'mode' => 'required|in:sell,buy',
            'making_fee' => 'nullable|numeric|min:0',
            'margin_percent' => 'nullable|numeric|min:-100|max:100',
        ]);

        $karat = $validated['karat'];
        $weight = (float) $validated['weight'];
        $mode = $validated['mode'];
        $makingFee = (float) ($validated['making_fee'] ?? 0);
        $marginPercent = (float) ($validated['margin_percent'] ?? 0);

        // Fetch latest rate for the karat
        $latestOccurredAt = MetalRate::max('occurred_at');
        $rateRecord = MetalRate::where('metal_code', 'XAU')
            ->where('karat', $karat)
            ->when($latestOccurredAt, fn ($q) => $q->where('occurred_at', $latestOccurredAt))
            ->latest('occurred_at')
            ->first();

        // Fallback default calculation if record not yet populated
        $baseRate = 0.0;
        $sellPrice = 0.0;
        $buyPrice = 0.0;

        if ($rateRecord) {
            $baseRate = (float) $rateRecord->rate;
            $sellPrice = $rateRecord->sell_price !== null ? (float) $rateRecord->sell_price : $baseRate;
            $buyPrice = $rateRecord->buy_price !== null ? (float) $rateRecord->buy_price : ($baseRate * 0.95);
        }

        if ($mode === 'buy') {
            // Rachat casse
            $unitRate = $buyPrice * (1 - ($marginPercent / 100));
            $total = $unitRate * $weight;
        } else {
            // Vente bijoutier
            $unitRate = ($sellPrice + $makingFee) * (1 + ($marginPercent / 100));
            $total = $unitRate * $weight;
        }

        return response()->json([
            'karat' => $karat,
            'weight' => $weight,
            'mode' => $mode,
            'base_rate' => $baseRate,
            'unit_price' => round($unitRate, 2),
            'making_fee' => $makingFee,
            'margin_percent' => $marginPercent,
            'total' => round($total, 2),
            'currency' => 'DZD',
        ]);
    }
}
