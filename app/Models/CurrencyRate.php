<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CurrencyRate extends Model
{
    /** @use HasFactory<\Database\Factories\CurrencyRateFactory> */
    use HasFactory;

    protected $fillable = [
        'pair',
        'rate',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:4',
            'source' => 'integer',
        ];
    }
}
