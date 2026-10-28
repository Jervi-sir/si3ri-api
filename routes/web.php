<?php

use App\Http\Controllers\GoldPriceController;
use App\Http\Controllers\LiveRating\LiveRatingApiController;
use App\Http\Controllers\LiveRating\LiveRatingPageController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Payment\SofizpayWebhookController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('demo/gold-display', [LiveRatingPageController::class, 'display'])->name('gold.display.demo');

Route::middleware(['auth', 'verified'])->group(function () {
    // Payment and Subscriptions checkout & callback (accessible to un-subscribed authenticated users)
    Route::get('subscription/checkout', [PaymentController::class, 'checkout'])->name('payment.checkout');
    Route::get('subscription/history', [PaymentController::class, 'history'])->name('payment.history');
    Route::post('subscription/pay', [PaymentController::class, 'initiate'])->name('payment.initiate');
    Route::get('subscription/callback', [PaymentController::class, 'callback'])->name('payment.callback');

    // Features protected by active subscription
    Route::middleware('subscribed')->group(function () {
        Route::get('dashboard', [GoldPriceController::class, 'dashboard'])->name('dashboard');
        Route::get('dashboard/gold-prices', [LiveRatingPageController::class, 'index'])->name('gold.prices');
        Route::get('dashboard/gold-display', [LiveRatingPageController::class, 'display'])->name('gold.display');
        Route::get('dashboard/gold-histories', [GoldPriceController::class, 'histories'])->name('gold.histories');
        Route::get('settings/gold-rates', [GoldPriceController::class, 'settings'])->name('gold-rates.settings');
        Route::post('settings/gold-rates', [GoldPriceController::class, 'updateRates'])->name('gold-rates.update');

        // Live rating API endpoints
        Route::get('api/gold/current-rates', [LiveRatingApiController::class, 'currentRates'])->name('api.gold.current');
        Route::get('api/gold/history', [LiveRatingApiController::class, 'history'])->name('api.gold.history');
        Route::post('api/gold/calculate', [LiveRatingApiController::class, 'calculate'])->name('api.gold.calculate');
    });
});

// Asynchronous Sofizpay CIB/Edahabiya Webhook endpoint (CSRF-exempt)
Route::post('webhooks/sofizpay', [SofizpayWebhookController::class, 'handle'])
    ->name('webhooks.sofizpay');

require __DIR__.'/settings.php';
