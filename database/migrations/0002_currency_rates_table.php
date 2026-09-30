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
        Schema::create('currency_rates', function (Blueprint $table) {
            $table->id();
            $table->string('pair'); // e.g., EUR/DZD, USD/DZD
            $table->smallInteger('source')->default(0)->comment('0: official, 1: parallel (black market)');
            $table->decimal('rate', 14, 4);
            $table->timestamps();

            $table->index(['pair', 'source', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currency_rates');
    }
};
