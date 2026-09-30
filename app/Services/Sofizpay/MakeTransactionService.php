<?php

declare(strict_types=1);

namespace App\Services\Sofizpay;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class MakeTransactionService
{
    public function __construct(
        protected ?string $account = null,
        protected string $baseUrl = 'https://sofizpay.com',
        protected bool $isSandbox = false,
        protected int $timeout = 15,
        protected int $connectTimeout = 5,
    ) {
        $this->account = config('services.sofizpay.account', $account);
        $this->baseUrl = rtrim((string) config('services.sofizpay.base_url', $baseUrl), '/');
        $this->isSandbox = (bool) config('services.sofizpay.sandbox', $isSandbox);
        $this->timeout = (int) config('services.sofizpay.timeout', $timeout);
        $this->connectTimeout = (int) config('services.sofizpay.connect_timeout', $connectTimeout);
    }

    /**
     * Create a CIB / Edahabiya transaction on Sofizpay.
     *
     * @param  array{
     *     amount: float|int|string,
     *     full_name: string,
     *     phone: string,
     *     email: string,
     *     account?: string|null,
     *     return_url?: string|null,
     *     webhook_url?: string|null,
     *     invoice_id?: string|null,
     *     language?: string|null,
     *     memo?: string|null,
     *     redirect?: 'yes'|'no',
     *     keep_return_url?: 'True'|'False',
     *     sandbox?: bool|null
     * }  $params
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException
     * @throws RequestException
     * @throws ConnectionException
     */
    public function handle(array $params): array
    {
        $account = $params['account'] ?? $this->account;

        if (empty($account)) {
            throw new InvalidArgumentException(
                'Sofizpay account is required. Set SOFIZPAY_ACCOUNT in .env or pass "account" in parameters.'
            );
        }

        if (empty($params['amount']) || (float) $params['amount'] <= 0) {
            throw new InvalidArgumentException('A valid payment amount is required.');
        }

        if (empty($params['full_name']) || empty($params['phone']) || empty($params['email'])) {
            throw new InvalidArgumentException('Customer full_name, phone, and email are required.');
        }

        $useSandbox = $params['sandbox'] ?? $this->isSandbox;
        $path = $useSandbox ? '/sandbox/make-cib-transaction/' : '/make-cib-transaction/';
        $endpoint = $this->baseUrl.$path;

        $queryParams = [
            'account' => $account,
            'amount' => (string) $params['amount'],
            'full_name' => $params['full_name'],
            'phone' => $params['phone'],
            'email' => $params['email'],
            'redirect' => $params['redirect'] ?? 'no',
            'keep_return_url' => $params['keep_return_url'] ?? 'True',
        ];

        if (! empty($params['return_url'])) {
            $queryParams['return_url'] = $params['return_url'];
        }

        if (! empty($params['webhook_url'])) {
            $queryParams['webhook_url'] = $params['webhook_url'];
        }

        if (! empty($params['invoice_id'])) {
            $queryParams['invoice_id'] = $params['invoice_id'];
        }

        if (! empty($params['language'])) {
            $queryParams['language'] = $params['language'];
        }

        if (! empty($params['memo'])) {
            // Truncated to 28 bytes per API specification
            $queryParams['memo'] = mb_strcut($params['memo'], 0, 28, 'UTF-8');
        }

        $response = Http::timeout($this->timeout)
            ->connectTimeout($this->connectTimeout)
            ->acceptJson()
            ->get($endpoint, $queryParams);

        if ($response->failed()) {
            $response->throw();
        }

        return $response->json();
    }
}
