<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Get subscription status
        $subscription = 'none';
        if ($user->is_subscribed) {
            $subRecord = $user->subscriptions()->where('status', 'active')->latest()->first();
            if ($subRecord) {
                // weekly, monthly, yearly -> map to starter, pro, enterprise
                $name = strtolower($subRecord->plan_name);
                if (str_contains($name, 'weekly') || str_contains($name, 'starter')) {
                    $subscription = 'starter';
                } elseif (str_contains($name, 'monthly') || str_contains($name, 'pro')) {
                    $subscription = 'pro';
                } else {
                    $subscription = 'enterprise';
                }
            } else {
                $subscription = 'starter'; // Default fallback
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'storeName' => $user->store_name ?? $user->name . ' Store',
                'phone' => $user->phone ?? '0555000000',
                'wilaya' => $user->wilaya ?? 'Algiers',
            ],
            'subscription' => $subscription,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'storeName' => 'required|string',
            'phone' => 'required|string',
            'wilaya' => 'required|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => 2, // regular user
            'is_subscribed' => false,
            'store_name' => $request->storeName,
            'phone' => $request->phone,
            'wilaya' => $request->wilaya,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'storeName' => $user->store_name,
                'phone' => $user->phone,
                'wilaya' => $user->wilaya,
            ],
            'subscription' => 'none',
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => 'required',
            'name' => 'sometimes|string',
            'storeName' => 'sometimes|string',
            'phone' => 'sometimes|string',
            'wilaya' => 'sometimes|string',
        ]);

        $user = User::findOrFail($request->userId);
        $user->update([
            'name' => $request->name ?? $user->name,
            'store_name' => $request->storeName ?? $user->store_name,
            'phone' => $request->phone ?? $user->phone,
            'wilaya' => $request->wilaya ?? $user->wilaya,
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'storeName' => $user->store_name,
                'phone' => $user->phone,
                'wilaya' => $user->wilaya,
            ]
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get subscription status
        $subscription = 'none';
        if ($user->is_subscribed) {
            $subRecord = $user->subscriptions()->where('status', 'active')->latest()->first();
            if ($subRecord) {
                // weekly, monthly, yearly -> map to starter, pro, enterprise
                $name = strtolower($subRecord->plan_name);
                if (str_contains($name, 'weekly') || str_contains($name, 'starter')) {
                    $subscription = 'starter';
                } elseif (str_contains($name, 'monthly') || str_contains($name, 'pro')) {
                    $subscription = 'pro';
                } else {
                    $subscription = 'enterprise';
                }
            } else {
                $subscription = 'starter'; // Default fallback
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'storeName' => $user->store_name ?? $user->name . ' Store',
                'phone' => $user->phone ?? '0555000000',
                'wilaya' => $user->wilaya ?? 'Algiers',
            ],
            'subscription' => $subscription,
        ]);
    }
}
