<?php

declare(strict_types=1);

namespace App\Services\GoldApi;

use App\Services\GoldApi\Data\PriceData;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class GetPrice
{
    public function __construct(
        protected string $baseUrl = 'https://api.gold-api.com',
        protected int $timeout = 10,
        protected int $connectTimeout = 3,
        protected int $cacheTtlSeconds = 30,
    ) {
        $this->baseUrl = config('services.gold_api.base_url', $baseUrl);
        $this->timeout = (int) config('services.gold_api.timeout', $timeout);
        $this->connectTimeout = (int) config('services.gold_api.connect_timeout', $connectTimeout);
        $this->cacheTtlSeconds = (int) config('services.gold_api.price_cache_ttl', $cacheTtlSeconds);
    }

    /**
     * Retrieves the current price for a specific asset and optional currency.
     * Caches responses for 30 seconds to respect Gold API rate-limiting recommendations.
     */
    public function handle(string $symbol, ?string $currency = null, bool $ignoreCache = false): PriceData
    {
        $normalizedSymbol = strtoupper(trim($symbol));
        $normalizedCurrency = $currency !== null ? strtoupper(trim($currency)) : null;

        $cacheKey = "gold_api:price:{$normalizedSymbol}:".($normalizedCurrency ?? 'default');

        if (! $ignoreCache && $cached = Cache::get($cacheKey)) {
            return PriceData::fromArray($cached);
        }

        $path = "/price/{$normalizedSymbol}";
        if ($normalizedCurrency !== null && $normalizedCurrency !== '') {
            $path .= "/{$normalizedCurrency}";
        }

        $response = Http::baseUrl($this->baseUrl)
            ->connectTimeout($this->connectTimeout)
            ->timeout($this->timeout)
            ->acceptJson()
            ->retry([100, 500, 1000], 0, function (Throwable $exception): bool {
                return $exception instanceof ConnectionException
                    || ($exception instanceof RequestException && ($exception->response->serverError() || $exception->response->status() === 429));
            })
            ->get($path)
            ->throw()
            ->json();

        Cache::put($cacheKey, $response, now()->addSeconds($this->cacheTtlSeconds));

        return PriceData::fromArray($response);
    }

    /**
     * Static helper for quick invocation.
     */
    public static function run(string $symbol, ?string $currency = null, bool $ignoreCache = false): PriceData
    {
        return app(static::class)->handle($symbol, $currency, $ignoreCache);
    }
}
