<?php

declare(strict_types=1);

namespace App\Services\Sofizpay;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ListenWebhookService
{
    public function __construct(
        protected CheckTransactionService $checkTransactionService,
    ) {}

    /**
     * Process and validate incoming Sofizpay Webhook Payload.
     *
     * @param  array<string, mixed>|Request  $payloadOrRequest
     * @return array{
     *     is_valid: bool,
     *     payment_status: string,
     *     transaction_id: string|null,
     *     order_number: string|int|null,
     *     amount_dzd: float,
     *     raw: array<string, mixed>
     * }
     */
    public function handle(array|Request $payloadOrRequest): array
    {
        $payload = $payloadOrRequest instanceof Request
            ? $payloadOrRequest->all()
            : $payloadOrRequest;

        Log::info('Sofizpay Webhook received', ['payload' => $payload]);

        $event = (string) ($payload['event'] ?? '');
        $paymentStatus = (string) ($payload['payment_status'] ?? '');
        $transactionId = isset($payload['transaction_id']) ? (string) $payload['transaction_id'] : null;
        $orderNumber = $payload['order_number'] ?? $payload['cib_transaction_id'] ?? null;

        // Amount in cents / centimes (150000 = 1500.00 DZD)
        $rawAmount = (float) ($payload['amount'] ?? 0);
        $amountDzd = $rawAmount > 0 ? round($rawAmount / 100, 2) : 0.0;

        $isValid = ($event === 'cib.payment.updated') && ! empty($transactionId) && ! empty($orderNumber);
        $isSuccess = $isValid && ($paymentStatus === 'success');

        return [
            'is_valid' => $isValid,
            'is_success' => $isSuccess,
            'payment_status' => $paymentStatus,
            'transaction_id' => $transactionId,
            'order_number' => $orderNumber,
            'amount_dzd' => $amountDzd,
            'error_code' => $payload['error_code'] ?? null,
            'error_message' => $payload['error_message'] ?? null,
            'resp_code' => $payload['resp_code'] ?? null,
            'raw' => $payload,
        ];
    }

    /**
     * Optional double-check with the gateway API to confirm transaction validity.
     */
    public function verifyAgainstApi(string|int $orderNumber, ?bool $sandbox = null): bool
    {
        try {
            $checkResult = $this->checkTransactionService->handle($orderNumber, $sandbox);

            return $this->checkTransactionService->isSuccess($checkResult);
        } catch (\Throwable $e) {
            Log::error('Sofizpay webhook double-check error', [
                'order_number' => $orderNumber,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
