<?php

declare(strict_types=1);

namespace App\Services\GoldApi\Data;

readonly class HistoryPointData
{
    public function __construct(
        public string $period,
        public float $price,
        public string $groupBy,
        public string $aggregation,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, string $groupBy = 'year', string $aggregation = 'max'): self
    {
        // Period key matches groupBy (e.g., 'year', 'month', 'week', 'day', 'hour', 'minute')
        $period = (string) ($data[$groupBy] ?? $data['period'] ?? $data['date'] ?? array_key_first($data) ?? '');

        // Price key matches {aggregation}_price (e.g., 'max_price', 'min_price', 'avg_price', 'price')
        $priceKey = "{$aggregation}_price";
        $price = (float) ($data[$priceKey] ?? $data['price'] ?? $data['max_price'] ?? $data['min_price'] ?? $data['avg_price'] ?? 0.0);

        return new self(
            period: $period,
            price: $price,
            groupBy: $groupBy,
            aggregation: $aggregation,
        );
    }

    /**
     * @return array{period: string, price: float, groupBy: string, aggregation: string}
     */
    public function toArray(): array
    {
        return [
            'period' => $this->period,
            'price' => $this->price,
            'groupBy' => $this->groupBy,
            'aggregation' => $this->aggregation,
        ];
    }
}
