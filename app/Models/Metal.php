<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Metal extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'kara',
        'en',
        'fr',
        'ar',
    ];

    public function prices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MetalPrice::class);
    }

    public function latestPrice(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(MetalPrice::class)->latestOfMany();
    }
}
