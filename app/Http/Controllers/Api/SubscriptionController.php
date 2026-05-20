<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        return response()->json([
            [
                'id' => 'weekly',
                'name' => 'Premium Gold Weekly',
                'price' => '500 DZD',
                'amount' => 500.00,
                'duration' => '7 Days',
            ],
            [
                'id' => 'monthly',
                'name' => 'Premium Gold Monthly',
                'price' => '1,500 DZD',
                'amount' => 1500.00,
                'duration' => '30 Days',
            ],
            [
                'id' => 'yearly',
                'name' => 'Premium Gold Yearly',
                'price' => '12,000 DZD',
                'amount' => 12000.00,
                'duration' => '365 Days',
            ],
        ]);
    }

    public function submitPayment(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => 'required',
            'planId' => 'required',
            'paymentMethod' => 'required',
            'transactionId' => 'required',
        ]);

        $user = User::findOrFail($request->userId);
        
        $plans = [
            'weekly' => ['name' => 'Premium Gold Weekly', 'amount' => 500.00, 'days' => 7],
            'monthly' => ['name' => 'Premium Gold Monthly', 'amount' => 1500.00, 'days' => 30],
            'yearly' => ['name' => 'Premium Gold Yearly', 'amount' => 12000.00, 'days' => 365],
        ];

        $plan = $plans[$request->planId] ?? $plans['monthly'];

        // Create a pending subscription
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_name' => $plan['name'],
            'status' => 'pending',
            'starts_at' => now(),
            'ends_at' => now()->addDays($plan['days']),
        ]);

        // Create a pending payment proof
        $payment = Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'amount' => $plan['amount'],
            'currency' => 'DZD',
            'status' => 'pending',
            'payment_method' => $request->paymentMethod,
            'transaction_id' => $request->transactionId,
        ]);

        return response()->json([
            'message' => 'Payment submitted successfully. Awaiting administrator verification.',
            'subscription' => 'starter', // Return mock starter tier for instant UI updates
        ]);
    }
}
