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
            $table->id();
            $table->string('code');  // gold, silver, copper
            $table->string('kara')->nullable();
            $table->string('en')->nullable();
            $table->string('fr')->nullable();
            $table->string('ar')->nullable();
            $table->timestamps();
        });

        Schema::create('metal_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('metal_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('price', 14, 4);
            $table->string('currency')->default('USD');
            $table->string('unit')->default('ounce');
            $table->timestamps();

            $table->index(['metal_id', 'created_at']);
        });
     }
 
     /**
      * Reverse the migrations.
      */
     public function down(): void
     {
         Schema::dropIfExists('metal_prices');
         Schema::dropIfExists('metals');
     }
 };
