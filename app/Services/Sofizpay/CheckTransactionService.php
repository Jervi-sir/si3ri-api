<?php

declare(strict_types=1);

namespace App\Services\Sofizpay;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class CheckTransactionService
{
    public function __construct(
        protected string $baseUrl = 'https://sofizpay.com',
        protected bool $isSandbox = false,
        protected int $timeout = 15,
        protected int $connectTimeout = 5,
    ) {
        $this->baseUrl = rtrim((string) config('services.sofizpay.base_url', $baseUrl), '/');
        $this->isSandbox = (bool) config('services.sofizpay.sandbox', $isSandbox);
        $this->timeout = (int) config('services.sofizpay.timeout', $timeout);
        $this->connectTimeout = (int) config('services.sofizpay.connect_timeout', $connectTimeout);
    }

    /**
     * Check transaction status by SATIM / Sofizpay order number.
     *
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException
     * @throws RequestException
     * @throws ConnectionException
     */
    public function handle(string|int $orderNumber, ?bool $sandbox = null): array
    {
        $orderNumber = trim((string) $orderNumber);

        if (empty($orderNumber)) {
            throw new InvalidArgumentException('Order number parameter is required to check transaction.');
        }

        $useSandbox = $sandbox ?? $this->isSandbox;
        $path = $useSandbox ? '/sandbox/cib-transaction-check/' : '/cib-transaction-check/';
        $endpoint = $this->baseUrl.$path;

        $response = Http::timeout($this->timeout)
            ->connectTimeout($this->connectTimeout)
            ->acceptJson()
            ->get($endpoint, [
                'order_number' => $orderNumber,
            ]);

        if ($response->failed()) {
            $response->throw();
        }

        return $response->json();
    }

    /**
     * Helper to verify if the check result represents a successful transaction.
     *
     * @param  array<string, mixed>  $checkResult
     */
    public function isSuccess(array $checkResult): bool
    {
        $orderStatus = (int) ($checkResult['orderStatus'] ?? $checkResult['order_status'] ?? 0);
        $respCode = (string) ($checkResult['respCode'] ?? $checkResult['resp_code'] ?? '');
        $errorCode = (int) ($checkResult['errorCode'] ?? $checkResult['error_code'] ?? -1);

        return $orderStatus === 2 && $respCode === '00' && $errorCode === 0;
    }
}
