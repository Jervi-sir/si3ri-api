<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SubscriptionController;

// Dashboard rates endpoint
Route::get('/metals', [DashboardController::class, 'index']);

// Authentication & Profile endpoints
Route::post('/login', [UserController::class, 'login']);
Route::post('/register', [UserController::class, 'register']);
Route::post('/user/update', [UserController::class, 'update']);
Route::middleware('auth:sanctum')->get('/me', [UserController::class, 'me']);

// Subscription plans & payment submission
Route::get('/subscriptions/plans', [SubscriptionController::class, 'plans']);
Route::post('/subscriptions/payment', [SubscriptionController::class, 'submitPayment']);
