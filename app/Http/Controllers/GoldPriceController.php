<?php

namespace App\Http\Controllers;

use App\Models\CurrencyRate;
use App\Models\MetalPrice;
use App\Models\MetalRate;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoldPriceController extends Controller
{
    /**
     * Render the Main Jewelry Shop Dashboard
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        // 1. Currency rates
        $currencies = [
            'usd_parallel' => CurrencyRate::where('pair', 'USD/DZD')->where('source', 1)->latest()->first(),
            'usd_official' => CurrencyRate::where('pair', 'USD/DZD')->where('source', 0)->latest()->first(),
            'eur_parallel' => CurrencyRate::where('pair', 'EUR/DZD')->where('source', 1)->latest()->first(),
            'eur_official' => CurrencyRate::where('pair', 'EUR/DZD')->where('source', 0)->latest()->first(),
        ];

        // 2. High/Low / Open stats (past 24 hours or last records)
        $pastSpotPrices = MetalPrice::where('metal_code', 'XAU')
            ->where('occurred_at', '>=', now()->subDay())
            ->orderBy('occurred_at', 'asc')
            ->pluck('price');

        if ($pastSpotPrices->isEmpty()) {
            $pastSpotPrices = MetalPrice::where('metal_code', 'XAU')
                ->latest('occurred_at')
                ->take(24)
                ->pluck('price')
                ->reverse()
                ->values();
        }

        $highSpot = $pastSpotPrices->isNotEmpty() ? $pastSpotPrices->max() : null;
        $lowSpot = $pastSpotPrices->isNotEmpty() ? $pastSpotPrices->min() : null;
        $openSpot = $pastSpotPrices->isNotEmpty() ? $pastSpotPrices->first() : null;

        // 3. User subscription status
        $subscription = null;
        if ($user) {
            $subModel = Subscription::where('user_id', $user->id)->latest()->first();
            $subscription = [
                'plan_name' => $subModel?->plan_name ?? 'Gratuit / Essai',
                'status' => $subModel?->status ?? ($user->is_subscribed ? 'active' : 'trial'),
                'is_active' => (bool) ($user->is_subscribed || ($subModel && $subModel->status === 'active')),
                'ends_at' => $subModel?->ends_at ?? now()->addDays(14)->toIso8601String(),
            ];
        }

        return Inertia::render('dashboard/dashboard.index', [
            'initialRates' => $this->getLatestRatesData(),
            'currencies' => $currencies,
            'marketStats' => [
                'high_spot' => $highSpot,
                'low_spot' => $lowSpot,
                'open_spot' => $openSpot,
            ],
            'subscription' => $subscription,
        ]);
    }

    /**
     * Render the Live Gold Dashboard
     */
    public function index(): Response
    {
        return Inertia::render('dashboard/list-prices/list.gold.prices.index', [
            'initialRates' => $this->getLatestRatesData(),
            'currencyRate' => CurrencyRate::where('pair', 'USD/DZD')
                ->where('source', 1)
                ->latest()
                ->first(),
        ]);
    }

    /**
     * Render the Gold Historical Price & Snapshots Page
     */
    public function histories(Request $request): Response
    {
        $selectedKarat = $request->query('karat', '18k_italian');
        $range = $request->query('range', '7d');

        $query = MetalRate::where('metal_code', 'XAU')
            ->where('karat', $selectedKarat);

        if ($range === '24h') {
            $query->where('occurred_at', '>=', now()->subDay());
        } elseif ($range === '7d') {
            $query->where('occurred_at', '>=', now()->subDays(7));
        } elseif ($range === '30d') {
            $query->where('occurred_at', '>=', now()->subDays(30));
        }

        $histories = $query->orderBy('occurred_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('dashboard/list.gold.histories.index', [
            'histories' => $histories,
            'selectedKarat' => $selectedKarat,
            'range' => $range,
            'currencyRate' => CurrencyRate::where('pair', 'USD/DZD')->latest()->first(),
        ]);
    }

    /**
     * Render the Gold Rates Settings Page
     */
    public function settings(): Response
    {
        return Inertia::render('settings/gold-rates.index', [
            'initialRates' => $this->getLatestRatesData(),
            'currencyRate' => CurrencyRate::where('pair', 'USD/DZD')
                ->where('source', 1)
                ->latest()
                ->first(),
        ]);
    }

    /**
     * Update/Override manual rates and premiums
     */
    public function updateRates(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rates' => 'required|array',
            'rates.*.karat' => 'required|string',
            'rates.*.rate' => 'required|numeric|min:0',
            'rates.*.buy_price' => 'nullable|numeric|min:0',
            'rates.*.sell_price' => 'nullable|numeric|min:0',
            'currency_rate' => 'nullable|numeric|min:0',
        ]);

        $now = now();

        // 1. Update or record parallel exchange rate if provided
        if (! empty($validated['currency_rate'])) {
            CurrencyRate::create([
                'pair' => 'USD/DZD',
                'source' => 1, // parallel
                'rate' => $validated['currency_rate'],
            ]);
        }

        // 2. Insert new manual rate snapshots for each karat
        $ratesToInsert = [];
        foreach ($validated['rates'] as $rateItem) {
            $ratesToInsert[] = [
                'metal_code' => 'XAU',
                'karat' => $rateItem['karat'],
                'rate' => $rateItem['rate'],
                'buy_price' => $rateItem['buy_price'] ?? null,
                'sell_price' => $rateItem['sell_price'] ?? null,
                'currency' => 'DZD',
                'unit' => 'gram',
                'occurred_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($ratesToInsert)) {
            MetalRate::insert($ratesToInsert);
        }

        return back()->with('success', 'Les tarifs de l\'or ont été mis à jour avec succès.');
    }

    /**
     * API: Get current live rates for all karats
     */
    public function currentRates(): JsonResponse
    {
        return response()->json($this->getLatestRatesData());
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
            ->get(['id', 'karat', 'rate', 'buy_price', 'sell_price', 'occurred_at']);

        return response()->json($history);
    }

    /**
     * Helper to retrieve latest rates payload
     *
     * @return array<string, mixed>
     */
    private function getLatestRatesData(): array
    {
        $latestOccurredAt = MetalRate::max('occurred_at');

        $rates = MetalRate::where('metal_code', 'XAU')
            ->when($latestOccurredAt, fn ($q) => $q->where('occurred_at', $latestOccurredAt))
            ->get()
            ->keyBy('karat');

        $rawSpot = MetalPrice::where('metal_code', 'XAU')
            ->latest('occurred_at')
            ->first();

        return [
            'spot_price' => $rawSpot,
            'last_updated' => $latestOccurredAt,
            'rates' => $rates,
        ];
    }
}
