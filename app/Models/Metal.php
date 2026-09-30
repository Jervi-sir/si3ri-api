<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $code
 * @property string|null $kara
 * @property string|null $en
 * @property string|null $fr
 * @property string|null $ar
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, MetalPrice> $prices
 */
#[Fillable([
    'code',
    'kara',
    'en',
    'fr',
    'ar',
])]
class Metal extends Model
{
    use HasFactory;

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'code';

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Get the prices associated with the metal.
     */
    public function prices(): HasMany
    {
        return $this->hasMany(MetalPrice::class, 'metal_code', 'code');
    }
}
