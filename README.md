# Opps

SSR opportunity browser over Merkl’s public API. Local BFF + shared Next.js data cache.

## Run

```bash
pnpm install
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

## What you get

- SSR list (`/`) and detail (`/opportunities/[id]`)
- BFF: `GET /api/opportunities`, `GET /api/opportunities/:id`
- Filters: chain, status, action, asset, token type, TVL / APR / daily ranges, search
- Sort: APR, TVL, Daily (Merkl `sort` / `order`)
- Desktop table + mobile cards; preview dialog on row/card click

## Architecture

```text
Browser
  ├─ SSR pages  → lib/merkl/client.ts → api.merkl.xyz/v4
  └─ /api/*     → lib/merkl/client.ts ─┘
                        │
                  "use cache" + cacheLife
```

Pages and route handlers share `getOpportunities` / `getOpportunity` / `getChains`, so the same cache keys cover SSR and the BFF.

`Cache-Control: s-maxage=60` on API responses is a CDN hint. Locally, caching is the Next data cache (`cacheLife("minutes")`).

## API examples

On the list page, **Open API JSON** (top right) opens the BFF for the current filters in a new tab. Same thing with curl:

```bash
curl "http://localhost:3000/api/opportunities?status=LIVE&items=5"
curl "http://localhost:3000/api/opportunities?status=LIVE&minimumTvl=1&sort=tvl&order=desc"
```

List query params: `page`, `items`, `chainId`, `status`, `action`, `minimumTvl`, `maximumTvl`, `minimumApr`, `maximumApr`, `minimumDailyRewards`, `maximumDailyRewards`, `asset`, `tokenTypes`, `search`, `sort`, `order`.

Merkl (`api.merkl.xyz`) is fetched only on the server. Browser Network shows `/api/...` when you hit the BFF, not Merkl directly.

## Layout

```text
app/page.tsx                      # list SSR
app/opportunities/[id]/page.tsx   # detail SSR
app/api/opportunities/            # BFF
lib/merkl/client.ts               # Merkl fetch + cache
lib/merkl/types.ts
lib/merkl/constants.ts
components/                       # UI
```

## Notes

- Merkl list responses don’t expose a total hit count; pagination uses “full page ⇒ maybe next”.
- Ends is display-only (no Merkl sort for campaign end).
- No Docker / CI / deploy in this repo.
