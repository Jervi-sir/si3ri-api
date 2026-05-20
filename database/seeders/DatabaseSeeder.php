<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Global variables for record counts, easy to edit
    public static int $usersCount = 100;

    public static int $metalPricesCountPerMetal = 1000;

    public static int $currencyRatesCountPerPair = 1000;

    public static int $subscriptionsCount = 200;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $adminRole = \App\Models\Role::firstOrCreate(['name' => 'admin'], [
            'description' => 'Administrator with full access',
        ]);

        $userRole = \App\Models\Role::firstOrCreate(['name' => 'user'], [
            'description' => 'Regular user',
        ]);

        // 2. Seed Admin User
        $adminUser = \App\Models\User::firstOrCreate(
            ['email' => 'admin@goldery.com'],
            [
                'name' => 'Goldery Admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role_id' => $adminRole->id,
                'is_subscribed' => true,
            ]
        );

        // 3. Seed Regular Users
        $regularUsersToCreate = max(0, self::$usersCount - 1);
        if ($regularUsersToCreate > 0) {
            \App\Models\User::factory()->count($regularUsersToCreate)->create([
                'role_id' => $userRole->id,
                'is_subscribed' => false,
            ]);
        }

        // 4. Seed Metals
        $metalsData = [
            [
                'code' => 'gold_24k',
                'kara' => '24',
                'en' => 'Gold 24K',
                'fr' => 'Or 24K',
                'ar' => 'ذهب عيار 24',
            ],
            [
                'code' => 'gold_21k',
                'kara' => '21',
                'en' => 'Gold 21K',
                'fr' => 'Or 21K',
                'ar' => 'ذهب عيار 21',
            ],
            [
                'code' => 'gold_18k_local',
                'kara' => '18',
                'en' => 'Local Gold 18K',
                'fr' => 'Or 18K Local',
                'ar' => 'ذهب محلي عيار 18',
            ],
            [
                'code' => 'gold_18k_italian',
                'kara' => '18',
                'en' => 'Italian Gold 18K',
                'fr' => 'Or 18K Italien',
                'ar' => 'ذهب إيطالي عيار 18',
            ],
            [
                'code' => 'gold_18k_spanish',
                'kara' => '18',
                'en' => 'Spanish Gold 18K',
                'fr' => 'Or 18K Espagnol',
                'ar' => 'ذهب إسباني عيار 18',
            ],
            [
                'code' => 'silver',
                'kara' => null,
                'en' => 'Silver',
                'fr' => 'Argent',
                'ar' => 'فضة',
            ],
        ];

        $metals = [];
        foreach ($metalsData as $metalData) {
            $metals[] = \App\Models\Metal::firstOrCreate(['code' => $metalData['code']], $metalData);
        }

        // 5. Seed Metal Prices (Historical)
        $basePrices = [
            'gold_24k' => ['price' => 12500, 'currency' => 'DZD', 'unit' => 'gram'],
            'gold_21k' => ['price' => 11000, 'currency' => 'DZD', 'unit' => 'gram'],
            'gold_18k_local' => ['price' => 9500, 'currency' => 'DZD', 'unit' => 'gram'],
            'gold_18k_italian' => ['price' => 11500, 'currency' => 'DZD', 'unit' => 'gram'],
            'gold_18k_spanish' => ['price' => 11200, 'currency' => 'DZD', 'unit' => 'gram'],
            'silver' => ['price' => 160, 'currency' => 'DZD', 'unit' => 'gram'],
        ];

        foreach ($metals as $metal) {
            $base = $basePrices[$metal->code] ?? ['price' => 1000, 'currency' => 'DZD', 'unit' => 'gram'];

            for ($i = self::$metalPricesCountPerMetal - 1; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $variation = (rand(-150, 150) / 100) * ($base['price'] / 100); // +/- 1.5%
                $priceValue = $base['price'] + $variation;

                \App\Models\MetalPrice::create([
                    'metal_id' => $metal->id,
                    'price' => round($priceValue, 2),
                    'currency' => $base['currency'],
                    'unit' => $base['unit'],
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
        }

        // 6. Seed Currency Rates (Historical, official and parallel)
        $currencyPairs = [
            ['pair' => 'EUR/DZD', 'source' => 0, 'base' => 145.50],
            ['pair' => 'EUR/DZD', 'source' => 1, 'base' => 242.00],
            ['pair' => 'USD/DZD', 'source' => 0, 'base' => 134.20],
            ['pair' => 'USD/DZD', 'source' => 1, 'base' => 224.50],
        ];

        foreach ($currencyPairs as $currency) {
            for ($i = self::$currencyRatesCountPerPair - 1; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $variation = (rand(-100, 100) / 100) * ($currency['base'] / 100); // +/- 1%
                $rateValue = $currency['base'] + $variation;

                \App\Models\CurrencyRate::create([
                    'pair' => $currency['pair'],
                    'source' => $currency['source'],
                    'rate' => round($rateValue, 4),
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
        }

        // 7. Seed Subscriptions and Payments
        $faker = \Faker\Factory::create();
        $users = \App\Models\User::where('role_id', $userRole->id)->get();

        if ($users->isNotEmpty() && self::$subscriptionsCount > 0) {
            $plans = [
                ['name' => 'Premium Gold Weekly', 'amount' => 500.00, 'days' => 7],
                ['name' => 'Premium Gold Monthly', 'amount' => 1500.00, 'days' => 30],
                ['name' => 'Premium Gold Yearly', 'amount' => 12000.00, 'days' => 365],
            ];

            for ($i = 0; $i < self::$subscriptionsCount; $i++) {
                $user = $users[$i % $users->count()];
                $plan = $faker->randomElement($plans);
                $status = $faker->randomElement(['active', 'expired', 'pending', 'cancelled']);

                $startsAt = now()->subDays(rand(1, 60));
                $endsAt = (clone $startsAt)->addDays($plan['days']);
                $cancelledAt = $status === 'cancelled' ? (clone $startsAt)->addDays(rand(1, $plan['days'] - 1)) : null;

                if ($status === 'expired') {
                    $startsAt = now()->subDays($plan['days'] + rand(1, 30));
                    $endsAt = (clone $startsAt)->addDays($plan['days']);
                }

                $subscription = \App\Models\Subscription::create([
                    'user_id' => $user->id,
                    'plan_name' => $plan['name'],
                    'status' => $status,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'cancelled_at' => $cancelledAt,
                ]);

                if ($status === 'active') {
                    $user->update(['is_subscribed' => true]);
                }

                $paymentMethod = $faker->randomElement(['baridimob', 'ccp', 'stripe']);
                $paymentStatus = 'succeeded';
                if ($status === 'pending') {
                    $paymentStatus = 'pending';
                } elseif ($status === 'expired' && rand(0, 1) === 1) {
                    $paymentStatus = 'succeeded';
                }

                \App\Models\Payment::create([
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'amount' => $plan['amount'],
                    'currency' => 'DZD',
                    'status' => $paymentStatus,
                    'payment_method' => $paymentMethod,
                    'transaction_id' => $paymentMethod === 'stripe' ? 'ch_'.\Illuminate\Support\Str::random(20) : 'tx_'.rand(10000000, 99999999),
                    'receipt_path' => in_array($paymentMethod, ['ccp', 'baridimob']) ? 'receipts/dummy_receipt_'.rand(1, 5).'.jpg' : null,
                    'created_at' => $startsAt,
                    'updated_at' => $startsAt,
                ]);
            }
        }
    }
}
