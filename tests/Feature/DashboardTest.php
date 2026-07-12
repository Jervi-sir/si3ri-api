<?php

use App\Models\User;
use App\Models\Metal;
use App\Models\MetalPrice;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard data matches the frontend contract', function () {
    // Seed the metals the dashboard expects.
    $metals = collect([
        ['code' => 'gold_24k', 'kara' => '24', 'en' => 'Gold 24K', 'fr' => 'Or 24K', 'ar' => 'ذهب 24'],
        ['code' => 'gold_21k', 'kara' => '21', 'en' => 'Gold 21K', 'fr' => 'Or 21K', 'ar' => 'ذهب 21'],
        ['code' => 'gold_18k_local', 'kara' => '18', 'en' => 'Local Gold 18K', 'fr' => 'Or 18K Local', 'ar' => 'ذهب محلي 18'],
        ['code' => 'gold_18k_italian', 'kara' => '18', 'en' => 'Italian Gold 18K', 'fr' => 'Or 18K Italien', 'ar' => 'ذهب إيطالي 18'],
        ['code' => 'silver', 'kara' => null, 'en' => 'Silver', 'fr' => 'Argent', 'ar' => 'فضة'],
    ])->each(fn ($data) => Metal::create($data));

    $prices = [
        'gold_24k' => 12500,
        'gold_21k' => 11000,
        'gold_18k_local' => 9500,
        'gold_18k_italian' => 11500,
        'silver' => 160,
    ];

    foreach ($metals as $metal) {
        MetalPrice::create([
            'metal_id' => $metal->id,
            'price' => $prices[$metal->code],
            'currency' => 'DZD',
            'unit' => 'gram',
        ]);
    }

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('isSubscribed', false)
            ->has('data.spot.gold')
            ->has('data.spot.silver')
            ->has('data.spot.last_updated')
            ->where('data.rates.usd_dzd', fn ($v) => is_numeric($v))
            ->where('data.rates.eur_dzd', fn ($v) => is_numeric($v))
            ->has('data.gold_dzd.18k.raw')
            ->has('data.gold_dzd.18k.local')
            ->has('data.gold_dzd.18k.italian')
            ->where('data.gold_dzd.18k.local', 9500)
            ->where('data.gold_dzd.18k.italian', 11500)
            ->has('data.silver_dzd.gram')
            ->where('data.silver_dzd.gram', 160),
        );
});
