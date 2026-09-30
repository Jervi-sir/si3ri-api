---
name: gold-api
description: "These are the LLM Instructions for integrating with the gold price api. The base URL for the api is https://api.gold-api.com."
license: MIT
metadata:
    author: "gold api"
---

## Endpoints

### GET /symbols

Returns the list of supported asset symbols. This is a free endpoint with no authentication or rate limits.

**Response:** Array of objects with `name` and `symbol` fields.

**Example response:**

```json
[
    { "name": "Gold", "symbol": "XAU" },
    { "name": "Silver", "symbol": "XAG" },
    { "name": "Platinum", "symbol": "XPT" },
    { "name": "Palladium", "symbol": "XPD" },
    { "name": "Copper", "symbol": "HG" },
    { "name": "Bitcoin", "symbol": "BTC" },
    { "name": "Ethereum", "symbol": "ETH" }
]
```

### GET /price/{symbol}

### GET /price/{symbol}/{currency}

Returns the current price for a given asset, optionally in a specific currency. If no currency is provided, defaults to USD. This is a free endpoint with no authentication or rate limits. Please cache the response for 30 seconds. The cache-control header will return the number of seconds until the next update.

**Path parameters:**

- `symbol` - asset symbol (e.g. `XAU`, `BTC`)
- `currency` - optional currency code (e.g. `EUR`, `GBP`)

**Example response:**

```json
{
    "currency": "USD",
    "currencySymbol": "$",
    "exchangeRate": 1,
    "name": "Gold",
    "price": 4165.200195,
    "symbol": "XAU",
    "updatedAt": "2026-07-03T16:08:54Z",
    "updatedAtReadable": "a few seconds ago"
}
```

### GET /history

Returns aggregated price history for a specific asset within a timeframe. **Requires an API key** via the `x-api-key` header. Free tier is rate-limited to 10 requests per hour.

**Query parameters:**

- `symbol` - (required) asset symbol (e.g. `XAU`)
- `startTimestamp` - (required) start of range as Unix timestamp
- `endTimestamp` - (required) end of range as Unix timestamp
- `groupBy` - (optional) time grouping: `year` (default), `month`, `week`, `day`, `hour` (premium only), `minute` (premium only)
- `aggregation` - (optional) price aggregation: `max` (default), `min`, or `avg`
- `orderBy` - (optional) sort order: `asc` or `desc` (default is `desc`, newest first)

**Response:** Array of objects containing a time period field (e.g. `year`, `month`, `day`) and a price aggregation field (e.g. `max_price`, `min_price`, `avg_price`).

**Example response:**

```json
[
    { "day": "2026-07-01", "max_price": 4200.5 },
    { "day": "2026-06-30", "max_price": 4185.0 }
]
```

### GET /ohlc/{symbol}

Returns the Open/High/Low/Close price for a timeframe or all time. **Requires an API key** via the `x-api-key` header. Free tier is rate-limited to 10 requests per hour.

**Path parameters:**

- `symbol` - asset symbol (e.g. `XAU`)

**Query parameters:**

- `startTimestamp` - (optional) start of range as Unix timestamp (defaults to year 1800)
- `endTimestamp` - (optional) end of range as Unix timestamp (defaults to current time)

**Response fields:**

- `open` - price at the open of the segment
- `high` - highest price during the segment
- `low` - lowest price during the segment
- `close` - price at the close of the segment
- `highLowChangePercent` - percent change between the high and low price
- `openCloseChangePercent` - percent change between the open and close
- `startTimestamp` - the starting Unix timestamp used for the query
- `endTimestamp` - the ending Unix timestamp used for the query

**Example response:**

```json
{
    "open": 4100.0,
    "high": 4210.5,
    "low": 4050.25,
    "close": 4165.2,
    "highLowChangePercent": 3.95,
    "openCloseChangePercent": 1.59,
    "startTimestamp": 1771053764,
    "endTimestamp": 1771485764
}
```

## Supported Assets

| Symbol | Name      |
| ------ | --------- |
| XAU    | Gold      |
| XAG    | Silver    |
| XPT    | Platinum  |
| XPD    | Palladium |
| HG     | Copper    |
| BTC    | Bitcoin   |
| ETH    | Ethereum  |

## Supported Currencies

| Code | Symbol | Name               |
| ---- | ------ | ------------------ |
| USD  | $      | US Dollar          |
| EUR  | €      | Euro               |
| GBP  | £      | British Pound      |
| JPY  | ¥      | Japanese Yen       |
| CAD  | CA$    | Canadian Dollar    |
| AUD  | A$     | Australian Dollar  |
| CHF  | Fr     | Swiss Franc        |
| CNY  | ¥      | Chinese Yuan       |
| HKD  | HK$    | Hong Kong Dollar   |
| SGD  | S$     | Singapore Dollar   |
| SEK  | kr     | Swedish Krona      |
| NOK  | kr     | Norwegian Krone    |
| DKK  | kr     | Danish Krone       |
| NZD  | NZ$    | New Zealand Dollar |
| MXN  | $      | Mexican Peso       |
| INR  | ₹      | Indian Rupee       |
| BRL  | R$     | Brazilian Real     |
| ZAR  | R      | South African Rand |
| KRW  | ₩      | South Korean Won   |
