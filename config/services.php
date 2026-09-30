<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'gold_api' => [
        'base_url' => env('GOLD_API_BASE_URL', 'https://api.gold-api.com'),
        'key' => env('GOLD_API_KEY'),
        'timeout' => env('GOLD_API_TIMEOUT', 10),
        'connect_timeout' => env('GOLD_API_CONNECT_TIMEOUT', 3),
    ],

    'sofizpay' => [
        'account' => env('SOFIZPAY_ACCOUNT'),
        'base_url' => env('SOFIZPAY_BASE_URL', 'https://sofizpay.com'),
        'sandbox' => env('SOFIZPAY_SANDBOX', false),
        'timeout' => env('SOFIZPAY_TIMEOUT', 15),
        'connect_timeout' => env('SOFIZPAY_CONNECT_TIMEOUT', 5),
    ],

];
