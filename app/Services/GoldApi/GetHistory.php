<?php

declare(strict_types=1);

namespace App\Services\GoldApi;

use App\Services\GoldApi\Data\HistoryPointData;
use DateTimeInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Throwable;

class GetHistory
{
    public function __construct(
        protected string $baseUrl = 'https://api.gold-api.com',
        protected ?string $apiKey = null,
        protected int $timeout = 10,
        protected int $connectTimeout = 3,
    ) {
        $this->baseUrl = config('services.gold_api.base_url', $baseUrl);
        $this->apiKey = config('services.gold_api.key', $apiKey);
        $this->timeout = (int) config('services.gold_api.timeout', $timeout);
        $this->connectTimeout = (int) config('services.gold_api.connect_timeout', $connectTimeout);
    }

    /**
     * Request aggregated price history for a specific asset within a specific timeframe.
     *
     * @param  string  $symbol  Asset symbol (e.g., XAU)
     * @param  int|DateTimeInterface  $startTimestamp  Unix timestamp or DateTime
     * @param  int|DateTimeInterface  $endTimestamp  Unix timestamp or DateTime
     * @param  string  $groupBy  Time grouping: year, month, week, day, hour, minute (default: year)
     * @param  string  $aggregation  Price aggregation: max, min, avg (default: max)
     * @param  string  $orderBy  Sort order: asc, desc (default: desc)
     * @param  string|null  $apiKey  Override configured API key
     * @return array<HistoryPointData>
     */
    public function handle(
        string $symbol,
        int|DateTimeInterface $startTimestamp,
        int|DateTimeInterface $endTimestamp,
        string $groupBy = 'year',
        string $aggregation = 'max',
        string $orderBy = 'desc',
        ?string $apiKey = null,
    ): array {
        $key = $apiKey ?? $this->apiKey;

        if (empty($key)) {
            throw new InvalidArgumentException(
                'Gold API key is required for history endpoint. Set GOLD_API_KEY in .env or pass as parameter.'
            );
        }

        $start = $startTimestamp instanceof DateTimeInterface
            ? $startTimestamp->getTimestamp()
            : $startTimestamp;

        $end = $endTimestamp instanceof DateTimeInterface
            ? $endTimestamp->getTimestamp()
            : $endTimestamp;

        $normalizedSymbol = strtoupper(trim($symbol));
        $normalizedGroupBy = strtolower(trim($groupBy));
        $normalizedAggregation = strtolower(trim($aggregation));
        $normalizedOrderBy = strtolower(trim($orderBy));

        $response = Http::baseUrl($this->baseUrl)
            ->withHeaders(['x-api-key' => $key])
            ->connectTimeout($this->connectTimeout)
            ->timeout($this->timeout)
            ->acceptJson()
            ->retry([100, 500, 1000], 0, function (Throwable $exception): bool {
                return $exception instanceof ConnectionException
                    || ($exception instanceof RequestException && ($exception->response->serverError() || $exception->response->status() === 429));
            })
            ->get('/history', [
                'symbol' => $normalizedSymbol,
                'startTimestamp' => $start,
                'endTimestamp' => $end,
                'groupBy' => $normalizedGroupBy,
                'aggregation' => $normalizedAggregation,
                'orderBy' => $normalizedOrderBy,
            ])
            ->throw()
            ->json();

        return array_map(
            fn (array $item): HistoryPointData => HistoryPointData::fromArray(
                $item,
                $normalizedGroupBy,
                $normalizedAggregation
            ),
            $response
        );
    }

    /**
     * Static helper for quick invocation.
     *
     * @return array<HistoryPointData>
     */
    public static function run(
        string $symbol,
        int|DateTimeInterface $startTimestamp,
        int|DateTimeInterface $endTimestamp,
        string $groupBy = 'year',
        string $aggregation = 'max',
        string $orderBy = 'desc',
        ?string $apiKey = null,
    ): array {
        return app(static::class)->handle(
            symbol: $symbol,
            startTimestamp: $startTimestamp,
            endTimestamp: $endTimestamp,
            groupBy: $groupBy,
            aggregation: $aggregation,
            orderBy: $orderBy,
            apiKey: $apiKey,
        );
    }
}
