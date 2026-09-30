<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\Sofizpay\CheckTransactionService;
use App\Services\Sofizpay\MakeTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Predefined subscription plan (in DZD).
     *
     * @var array<string, array{name: string, price: float, months: int, description: string}>
     */
    protected const PLANS = [
        'pro' => [
            'name' => 'Accès Illimité Si3ri Pro',
            'price' => 100.00,
            'months' => 12,
            'description' => 'La solution tout-en-un pour les bijoutiers : cotations de l\'or en temps réel, devises du marché parallèle (Square), calculateur de marge & historiques.',
        ],
    ];

    public function __construct(
        protected MakeTransactionService $makeTransactionService,
        protected CheckTransactionService $checkTransactionService,
    ) {}

    /**
     * Render the Checkout & Subscription Selection page.
     */
    public function checkout(Request $request): Response
    {
        $user = $request->user();

        $currentSubscription = Subscription::where('user_id', $user->id)
            ->latest()
            ->first();

        $recentPayments = Payment::where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('payment/checkout', [
            'plans' => self::PLANS,
            'currentSubscription' => $currentSubscription,
            'recentPayments' => $recentPayments,
            'sofizpayConfigured' => ! empty(config('services.sofizpay.account')),
        ]);
    }

    /**
     * Render the Payment & Subscription History page.
     */
    public function history(Request $request): Response
    {
        $user = $request->user();

        $currentSubscription = Subscription::where('user_id', $user->id)
            ->latest()
            ->first();

        $payments = Payment::where('user_id', $user->id)
            ->with('subscription')
            ->latest()
            ->paginate(15);

        return Inertia::render('payment/history', [
            'currentSubscription' => $currentSubscription,
            'payments' => $payments,
        ]);
    }

    /**
     * Initiate a CIB / Edahabiya payment via Sofizpay.
     */
    public function initiate(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'plan_key' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $planKey = $validated['plan_key'] ?? 'pro';
        $plan = self::PLANS[$planKey] ?? array_values(self::PLANS)[0];
        $amount = (float) $plan['price'];
        $phone = $validated['phone'] ?? $user->phone ?? '+213555000000';

        try {
            return DB::transaction(function () use ($user, $plan, $amount, $phone) {
                // 1. Create a pending payment record
                $payment = Payment::create([
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'currency' => 'DZD',
                    'status' => 'pending',
                    'payment_method' => 'cib_edahabiya',
                ]);

                // 2. Prepare return & webhook URLs
                $returnUrl = route('payment.callback', [
                    'payment_id' => $payment->id,
                ]);

                $webhookUrl = route('webhooks.sofizpay');

                // 3. Call Sofizpay service to create transaction
                $response = $this->makeTransactionService->handle([
                    'amount' => $amount,
                    'full_name' => $user->name,
                    'phone' => $phone,
                    'email' => $user->email,
                    'return_url' => $returnUrl,
                    'webhook_url' => $webhookUrl,
                    'invoice_id' => 'INV-PAY-' . $payment->id,
                    'memo' => mb_strcut($plan['name'], 0, 28, 'UTF-8'),
                    'redirect' => 'no',
                    'keep_return_url' => 'True',
                ]);

                // 4. Record transaction IDs
                $transactionId = $response['transaction_id'] ?? null;
                $cibTransactionId = $response['cib_transaction_id'] ?? null;
                $paymentUrl = $response['payment_url'] ?? $response['cib_response']['formUrl'] ?? null;

                if (! empty($transactionId) || ! empty($cibTransactionId)) {
                    $payment->update([
                        'transaction_id' => (string) ($transactionId ?? $cibTransactionId),
                    ]);
                }

                if (empty($paymentUrl)) {
                    throw new \RuntimeException('No payment URL returned by Sofizpay gateway.');
                }

                if (request()->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'payment_id' => $payment->id,
                        'payment_url' => $paymentUrl,
                        'transaction_id' => $transactionId,
                        'cib_transaction_id' => $cibTransactionId,
                    ]);
                }

                return Inertia::location($paymentUrl);
            });
        } catch (\Throwable $e) {
            Log::error('Sofizpay payment initiation failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'initier le paiement CIB: ' . $e->getMessage(),
                ], 422);
            }

            return back()->with('error', 'Erreur lors de l\'initialisation du paiement: ' . $e->getMessage());
        }
    }

    /**
     * Handle user return callback after completing or cancelling CIB payment on SATIM.
     */
    public function callback(Request $request): Response
    {
        $user = $request->user();
        $paymentId = $request->query('payment_id');
        $orderNumber = $request->query('order_number') ?? $request->query('cib_transaction_id');

        $payment = null;
        if (! empty($paymentId)) {
            $payment = Payment::where('id', $paymentId)
                ->where('user_id', $user->id)
                ->first();
        }

        // If orderNumber is present, verify status via Sofizpay Check endpoint
        $verificationStatus = 'pending';
        $errorMessage = null;

        if (! empty($orderNumber)) {
            try {
                $check = $this->checkTransactionService->handle($orderNumber);
                $isSuccessful = $this->checkTransactionService->isSuccess($check);

                if ($isSuccessful) {
                    $verificationStatus = 'success';

                    if ($payment && $payment->status !== 'succeeded') {
                        DB::transaction(function () use ($payment, $user) {
                            $payment->update([
                                'status' => 'succeeded',
                            ]);

                            // Activate / extend subscription for 30 days
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
                        });
                    }
                } else {
                    $verificationStatus = 'failed';
                    $errorMessage = $check['errorMessage'] ?? $check['actionCodeDescription'] ?? 'Le paiement n\'a pas été validé par la banque.';

                    if ($payment && $payment->status === 'pending') {
                        $payment->update(['status' => 'failed']);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Payment callback verification check error', [
                    'order_number' => $orderNumber,
                    'error' => $e->getMessage(),
                ]);
            }
        } elseif ($payment && $payment->status === 'succeeded') {
            $verificationStatus = 'success';
        }

        return Inertia::render('payment/callback', [
            'status' => $verificationStatus,
            'payment' => $payment,
            'errorMessage' => $errorMessage,
        ]);
    }
}
