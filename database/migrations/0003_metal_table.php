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
        Schema::create('metals', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('kara')->nullable();
            $table->string('en')->nullable();
            $table->string('fr')->nullable();
            $table->string('ar')->nullable();
            $table->timestamps();
        });

        Schema::create('metal_prices', function (Blueprint $table) {
            $table->id();
            $table->string('metal_code')->nullable();
            $table->foreign('metal_code')->references('code')->on('metals')->nullOnDelete();

            $table->string('sub_name')->nullable();

            $table->decimal('price', 14, 4);
            $table->string('currency')->default('USD');
            $table->string('unit')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['metal_code', 'occurred_at']);
            $table->index(['metal_code', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metals');
        Schema::dropIfExists('metal_prices');
    }
};
