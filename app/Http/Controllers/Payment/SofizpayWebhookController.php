<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\Sofizpay\ListenWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SofizpayWebhookController extends Controller
{
    public function __construct(
        protected ListenWebhookService $listenWebhookService,
    ) {}

    /**
     * Handle incoming asynchronous CIB/Edahabiya webhooks from Sofizpay.
     */
    public function handle(Request $request): JsonResponse
    {
        $parsed = $this->listenWebhookService->handle($request);

        if (! $parsed['is_valid']) {
            Log::warning('Sofizpay Webhook ignored: invalid payload structure', ['payload' => $request->all()]);

            return response()->json([
                'status' => 'ignored',
                'message' => 'Invalid or unrecognized webhook event.',
            ], 400);
        }

        $transactionId = $parsed['transaction_id'];
        $orderNumber = $parsed['order_number'];
        $isSuccess = $parsed['is_success'];
        $amountDzd = $parsed['amount_dzd'];

        // Find existing payment record by transaction_id or fallback
        $payment = Payment::where('transaction_id', $transactionId)
            ->orWhere('transaction_id', (string) $orderNumber)
            ->first();

        if (! $payment) {
            Log::info('Payment record not found for webhook; creating placeholder', [
                'transaction_id' => $transactionId,
                'order_number' => $orderNumber,
            ]);
        }

        if ($isSuccess) {
            DB::transaction(function () use ($payment, $transactionId, $orderNumber) {
                if ($payment) {
                    if ($payment->status === 'succeeded') {
                        Log::info('Payment already marked succeeded (idempotent)', ['payment_id' => $payment->id]);

                        return;
                    }

                    $payment->update([
                        'status' => 'succeeded',
                        'transaction_id' => $transactionId ?? (string) $orderNumber,
                    ]);

                    $user = $payment->user;
                    if ($user) {
                        // Grant / Extend 30-day subscription
                        $startsAt = now();
                        $endsAt = now()->addDays(30);

                        $subscription = Subscription::create([
                            'user_id' => $user->id,
                            'plan_name' => 'Abonnement CIB Pro',
                            'status' => 'active',
                            'starts_at' => $startsAt,
                            'ends_at' => $endsAt,
                        ]);

                        $payment->update([
                            'subscription_id' => $subscription->id,
                        ]);

                        $user->update([
                            'is_subscribed' => true,
                        ]);

                        Log::info('User subscription activated via webhook', [
                            'user_id' => $user->id,
                            'subscription_id' => $subscription->id,
                        ]);
                    }
                }
            });
        } else {
            // Payment declined or failed
            if ($payment && $payment->status === 'pending') {
                $payment->update([
                    'status' => 'failed',
                ]);
            }

            Log::warning('Sofizpay payment marked as failed from webhook', [
                'order_number' => $orderNumber,
                'error_code' => $parsed['error_code'],
                'error_message' => $parsed['error_message'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Webhook processed successfully.',
        ], 200);
    }
}
