<?php

use App\Models\User;

test('demo gold display page can be rendered without login', function () {
    $response = $this->get(route('gold.display.demo'));
    $response->assertOk();
});

test('authenticated subscribed user can visit the dashboard gold display page', function () {
    $user = User::factory()->create([
        'is_subscribed' => true,
    ]);
    $this->actingAs($user);

    $response = $this->get(route('gold.display'));
    $response->assertOk();
});
