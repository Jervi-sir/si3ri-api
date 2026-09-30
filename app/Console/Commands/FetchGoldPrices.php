<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\MetalPrice;
use App\Services\GoldApi\GetPrice;
use Illuminate\Console\Command;
use Throwable;

class FetchGoldPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gold-api:fetch-prices {--symbols=XAU : Comma-separated symbols to fetch} {--currency=USD : Target currency}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch live spot price for gold (XAU) from Gold API and store/update in the database';

    /**
     * Execute the console command.
     */
    public function handle(GetPrice $getPrice): int
    {
        $symbolsInput = (string) $this->option('symbols');
        $currency = (string) $this->option('currency');
        $symbols = array_filter(array_map('trim', explode(',', $symbolsInput)));

        $this->info('Fetching prices for: '.implode(', ', $symbols)." in {$currency}...");

        $hasError = false;

        foreach ($symbols as $symbol) {
            try {
                // Fetch fresh price bypassing local cache
                $priceData = $getPrice->handle($symbol, $currency, ignoreCache: true);

                $this->line("  ✓ {$priceData->name} ({$priceData->symbol}): {$priceData->currencySymbol}{$priceData->price} ({$priceData->currency})");

                // Store in database if MetalPrice model is available
                MetalPrice::query()->create([
                    'metal_code' => $priceData->symbol,
                    'sub_name' => $priceData->name,
                    'price' => $priceData->price,
                    'currency' => $priceData->currency,
                    'unit' => 'oz_t', // troy ounce
                    'occurred_at' => $priceData->updatedAt,
                ]);
            } catch (Throwable $e) {
                $hasError = true;
                $this->error("  ✗ Failed to fetch price for {$symbol}: {$e->getMessage()}");
            }
        }

        $this->info('Price update complete.');

        return $hasError ? self::FAILURE : self::SUCCESS;
    }
}
