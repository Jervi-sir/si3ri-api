<?php

declare(strict_types=1);

namespace App\Services\GoldApi\Data;

readonly class SymbolData
{
    public function __construct(
        public string $name,
        public string $symbol,
    ) {}

    /**
     * @param  array{name: string, symbol: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            symbol: $data['symbol'],
        );
    }

    /**
     * @return array{name: string, symbol: string}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'symbol' => $this->symbol,
        ];
    }
}
