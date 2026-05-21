<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed standard roles required by the application constraints
    Role::firstOrCreate(['id' => 1], ['name' => 'admin']);
    Role::firstOrCreate(['id' => 2], ['name' => 'user']);
});

test('api login returns token and user details', function () {
    $user = User::factory()->create([
        'email' => 'test@goldery.com',
        'password' => Hash::make('password123'),
        'role_id' => 2,
        'store_name' => 'Test Store',
        'phone' => '0555112233',
        'wilaya' => 'Algiers',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@goldery.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'name',
                'email',
                'storeName',
                'phone',
                'wilaya',
            ],
            'subscription',
        ])
        ->assertJsonPath('user.email', 'test@goldery.com')
        ->assertJsonPath('user.storeName', 'Test Store');

    $this->assertNotEmpty($response->json('token'));
});

test('api register creates user and returns token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@goldery.com',
        'password' => 'password123',
        'storeName' => 'Jane Store',
        'phone' => '0555667788',
        'wilaya' => 'Oran',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'name',
                'email',
                'storeName',
                'phone',
                'wilaya',
            ],
            'subscription',
        ])
        ->assertJsonPath('user.email', 'jane@goldery.com')
        ->assertJsonPath('subscription', 'none');

    $this->assertDatabaseHas('users', [
        'email' => 'jane@goldery.com',
        'store_name' => 'Jane Store',
    ]);
});

test('api me returns current authenticated user details', function () {
    $user = User::factory()->create([
        'email' => 'me@goldery.com',
        'role_id' => 2,
        'store_name' => 'My Gold Shop',
    ]);

    // Unauthenticated request should fail
    $this->getJson('/api/me')
        ->assertUnauthorized();

    // Authenticated request should succeed
    $token = $user->createToken('test_token')->plainTextToken;

    $this->getJson('/api/me', [
        'Authorization' => 'Bearer ' . $token,
    ])
    ->assertOk()
    ->assertJsonPath('user.email', 'me@goldery.com')
    ->assertJsonPath('user.storeName', 'My Gold Shop');
});
