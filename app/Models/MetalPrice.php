<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $metal_code
 * @property string|null $sub_name
 * @property string $price
 * @property string $currency
 * @property string|null $unit
 * @property Carbon|null $occurred_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Metal|null $metal
 */
#[Fillable([
    'metal_code',
    'sub_name',
    'price',
    'currency',
    'unit',
    'occurred_at',
])]
class MetalPrice extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:4',
            'occurred_at' => 'datetime',
        ];
    }

    /**
     * Get the metal associated with the price.
     */
    public function metal(): BelongsTo
    {
        return $this->belongsTo(Metal::class, 'metal_code', 'code');
    }
}
