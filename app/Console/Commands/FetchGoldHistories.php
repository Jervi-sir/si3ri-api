<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\MetalPrice;
use App\Services\GoldApi\GetHistory;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Throwable;

class FetchGoldHistories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gold-api:fetch-history
                            {--symbol=XAU : Asset symbol}
                            {--start=1771053764 : Start timestamp}
                            {--end=1790458143 : End timestamp}
                            {--groupBy=day : Grouping (day, month, year, etc.)}
                            {--aggregation=max : Aggregation function (max, min, avg)}
                            {--key=70ed96a5313f9f9f6fff356eb625c3d3 : Gold API key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch historical price records from Gold API and store them in the database';

    /**
     * Execute the console command.
     */
    public function handle(GetHistory $getHistory): int
    {
        $symbol = (string) $this->option('symbol');
        $start = (int) $this->option('start');
        $end = (int) $this->option('end');
        $groupBy = (string) $this->option('groupBy');
        $aggregation = (string) $this->option('aggregation');
        $apiKey = (string) $this->option('key');

        $this->info("Fetching history for {$symbol} (from {$start} to {$end}, grouped by {$groupBy})...");

        try {
            $history = $getHistory->handle(
                symbol: $symbol,
                startTimestamp: $start,
                endTimestamp: $end,
                groupBy: $groupBy,
                aggregation: $aggregation,
                orderBy: 'asc',
                apiKey: $apiKey,
            );

            $this->info('Fetched '.count($history).' historical records.');

            $savedCount = 0;

            foreach ($history as $point) {
                // Parse period as occurred_at timestamp/date
                $occurredAt = null;
                try {
                    $occurredAt = Carbon::parse($point->period);
                } catch (Throwable) {
                    $occurredAt = null;
                }

                // Avoid duplicating records if identical symbol and period/occurred_at exists
                MetalPrice::query()->updateOrCreate(
                    [
                        'metal_code' => $symbol,
                        'occurred_at' => $occurredAt,
                        'currency' => 'USD',
                        'unit' => 'oz_t',
                    ],
                    [
                        'sub_name' => 'Gold',
                        'price' => $point->price,
                    ]
                );

                $savedCount++;
                $this->line("  ✓ {$point->period}: \${$point->price}");
            }

            $this->info("Successfully stored/updated {$savedCount} historical price records.");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error("Failed to fetch history: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
