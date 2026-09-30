<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('metal_rates', function (Blueprint $table) {
            $table->id();

            $table->string('metal_code')->default('XAU');
            $table->foreign('metal_code')->references('code')->on('metals')->cascadeOnDelete();
            // Link back to the raw source snapshot (nullable if set manually)
            $table->foreignId('metal_price_id')->nullable()->constrained('metal_prices')->nullOnDelete();
            $table->string('karat', 30); // '24k', '22k', '21k', '18k', '18k_italian', '16k', '14k', '18k_scrap'
            $table->decimal('rate', 14, 4); // Fair/Reference market price per unit
            $table->decimal('buy_price', 14, 4)->nullable();  // Jeweler buying price (scrap)
            $table->decimal('sell_price', 14, 4)->nullable(); // Jeweler selling price (finished)
            $table->string('currency', 10)->default('DZD');
            $table->string('unit', 10)->default('gram');
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
            // Fast indexed queries for historical charts & latest rates
            $table->index(['metal_code', 'karat', 'occurred_at']);
            $table->index(['metal_code', 'karat', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metal_rates');
    }
};
