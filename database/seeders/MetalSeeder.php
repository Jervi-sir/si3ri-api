<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Metal;
use Illuminate\Database\Seeder;

class MetalSeeder extends Seeder
{
    /**
     * Seed the metals table with assets supported by Gold API.
     */
    public function run(): void
    {
        $metals = [
            [
                'code' => 'XAU',
                'kara' => '24k',
                'en' => 'Gold',
                'fr' => 'Or',
                'ar' => 'ذهب',
            ],
            [
                'code' => 'XAG',
                'kara' => null,
                'en' => 'Silver',
                'fr' => 'Argent',
                'ar' => 'فضة',
            ],
            [
                'code' => 'BTC',
                'kara' => null,
                'en' => 'Bitcoin',
                'fr' => 'Bitcoin',
                'ar' => 'بيتكوين',
            ],
            [
                'code' => 'ETH',
                'kara' => null,
                'en' => 'Ethereum',
                'fr' => 'Ethereum',
                'ar' => 'إيثريوم',
            ],
            [
                'code' => 'XPD',
                'kara' => null,
                'en' => 'Palladium',
                'fr' => 'Palladium',
                'ar' => 'بلاديوم',
            ],
            [
                'code' => 'HG',
                'kara' => null,
                'en' => 'Copper',
                'fr' => 'Cuivre',
                'ar' => 'نحاس',
            ],
            [
                'code' => 'XPT',
                'kara' => null,
                'en' => 'Platinum',
                'fr' => 'Platine',
                'ar' => 'بلاتين',
            ],
        ];

        foreach ($metals as $metal) {
            Metal::query()->updateOrCreate(
                ['code' => $metal['code']],
                $metal
            );
        }
    }
}
