<?php

declare(strict_types=1);

namespace App\Services\GoldApi\Data;

readonly class PriceData
{
    public function __construct(
        public string $currency,
        public string $currencySymbol,
        public float $exchangeRate,
        public string $name,
        public float $price,
        public string $symbol,
        public string $updatedAt,
        public string $updatedAtReadable,
    ) {}

    /**
     * @param  array{
     *     currency: string,
     *     currencySymbol: string,
     *     exchangeRate: float|int,
     *     name: string,
     *     price: float|int,
     *     symbol: string,
     *     updatedAt: string,
     *     updatedAtReadable: string
     * }  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            currency: $data['currency'],
            currencySymbol: $data['currencySymbol'],
            exchangeRate: (float) $data['exchangeRate'],
            name: $data['name'],
            price: (float) $data['price'],
            symbol: $data['symbol'],
            updatedAt: $data['updatedAt'],
            updatedAtReadable: $data['updatedAtReadable'],
        );
    }

    /**
     * @return array{
     *     currency: string,
     *     currencySymbol: string,
     *     exchangeRate: float,
     *     name: string,
     *     price: float,
     *     symbol: string,
     *     updatedAt: string,
     *     updatedAtReadable: string
     * }
     */
    public function toArray(): array
    {
        return [
            'currency' => $this->currency,
            'currencySymbol' => $this->currencySymbol,
            'exchangeRate' => $this->exchangeRate,
            'name' => $this->name,
            'price' => $this->price,
            'symbol' => $this->symbol,
            'updatedAt' => $this->updatedAt,
            'updatedAtReadable' => $this->updatedAtReadable,
        ];
    }
}
