<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $metal_code
 * @property int|null $metal_price_id
 * @property string $karat
 * @property string $rate
 * @property string|null $buy_price
 * @property string|null $sell_price
 * @property string $currency
 * @property string $unit
 * @property Carbon|null $occurred_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'metal_code',
    'metal_price_id',
    'karat',
    'rate',
    'buy_price',
    'sell_price',
    'currency',
    'unit',
    'occurred_at',
])]
class MetalRate extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:4',
            'buy_price' => 'decimal:4',
            'sell_price' => 'decimal:4',
            'occurred_at' => 'datetime',
        ];
    }

    public function metal(): BelongsTo
    {
        return $this->belongsTo(Metal::class, 'metal_code', 'code');
    }

    public function metalPrice(): BelongsTo
    {
        return $this->belongsTo(MetalPrice::class);
    }
}
