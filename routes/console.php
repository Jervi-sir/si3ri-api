<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('gold-api:fetch-prices')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();
