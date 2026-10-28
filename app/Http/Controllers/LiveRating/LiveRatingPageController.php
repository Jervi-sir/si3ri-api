<?php

namespace App\Http\Controllers\LiveRating;

use App\Http\Controllers\Controller;
use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\MetalRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveRatingPageController extends Controller
{
    /**
     * Render the Live Gold Prices Page with Modular Sections
     */
    public function index(Request $request): Response
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

        return Inertia::render('dashboard/list-prices/list.gold.prices.index', [
            'initialRates' => [
                'spot_price' => $rawSpot,
                'last_updated' => $latestOccurredAt,
                'rates' => $rates,
            ],
            'currencies' => $currencies,
            'currencyRate' => $currencies['usd_parallel'] ?? null,
        ]);
    }

    /**
     * Render the Luxury Gold Price Display Screen (Showcase / In-Store Demo Board)
     */
    public function display(Request $request): Response
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

        return Inertia::render('demo/gold-display', [
            'initialRates' => [
                'spot_price' => $rawSpot,
                'last_updated' => $latestOccurredAt,
                'rates' => $rates,
            ],
            'currencies' => $currencies,
            'currencyRate' => $currencies['usd_parallel'] ?? null,
        ]);
    }
}
