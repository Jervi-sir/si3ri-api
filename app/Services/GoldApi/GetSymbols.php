<?php

declare(strict_types=1);

namespace App\Services\GoldApi;

use App\Services\GoldApi\Data\SymbolData;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class GetSymbols
{
    public function __construct(
        protected string $baseUrl = 'https://api.gold-api.com',
        protected int $timeout = 10,
        protected int $connectTimeout = 3,
    ) {
        $this->baseUrl = config('services.gold_api.base_url', $baseUrl);
        $this->timeout = (int) config('services.gold_api.timeout', $timeout);
        $this->connectTimeout = (int) config('services.gold_api.connect_timeout', $connectTimeout);
    }

    /**
     * Retrieves all available symbols from Gold API.
     *
     * @return array<SymbolData>
     */
    public function handle(): array
    {
        $response = Http::baseUrl($this->baseUrl)
            ->connectTimeout($this->connectTimeout)
            ->timeout($this->timeout)
            ->acceptJson()
            ->retry([100, 500, 1000], 0, function (Throwable $exception): bool {
                return $exception instanceof ConnectionException
                    || ($exception instanceof RequestException && ($exception->response->serverError() || $exception->response->status() === 429));
            })
            ->get('/symbols')
            ->throw()
            ->json();

        return array_map(
            fn (array $item): SymbolData => SymbolData::fromArray($item),
            $response
        );
    }

    /**
     * Static helper for quick invocation.
     *
     * @return array<SymbolData>
     */
    public static function run(): array
    {
        return app(static::class)->handle();
    }
}
