# Opps

SSR opportunity browser over Merkl’s public API, with its own JSON API and a shared server cache.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test
pnpm lint
```

## What you get

- SSR list (`/`) and detail (`/opportunities/[id]`)
- API: `GET /api/opportunities`, `GET /api/opportunities/:id`
- Filters: chain, status, action, asset, token type, TVL / APR / daily ranges, search
- Sort: APR, TVL, Daily
- Desktop table + mobile cards; preview dialog on row/card click

Focus beyond the baseline: filter UX and URL-driven state.

## Architecture

```text
Browser
  ├─ SSR pages  ─┐
  └─ /api/*     ─┴→ lib/merkl/query.ts → lib/merkl/client.ts → api.merkl.xyz/v4
                    parse + canonicalize  "use cache" + cacheLife
```

```text
app/page.tsx                      # list SSR
app/opportunities/[id]/page.tsx   # detail SSR
app/api/opportunities/            # JSON API
app/error.tsx, global-error.tsx   # error boundaries (detail has its own)
lib/merkl/query.ts                # filter schema, URL ↔ query ↔ Merkl params
lib/merkl/client.ts               # Merkl fetch + cache
components/                       # UI
```

## Design decisions

**Opportunities as the resource.** The brief’s filters map directly onto Merkl’s params, and one record has enough for both a dense list row and a detail page. Campaigns would need extra fetches and decimal handling.

**One filter schema.** `lib/merkl/query.ts` defines each filter once, with its validation. The page, the API, the UI’s links and the Merkl request all go through it, so adding a filter is one line there plus its control. Invalid values are dropped rather than forwarded, so junk params can’t reach Merkl.

**The canonical query string is the cache key.** Requests are parsed and reduced to one string: fixed param order, sorted lists, defaults omitted. Cached functions take only that string, so the page and the API share an entry, and `sort=apr` and `sort=apr&order=desc&status=LIVE` count as the same query. The total count is cached on filters alone, so paging and re-sorting don’t refetch it.

| Layer | Mechanism | Job |
| --- | --- | --- |
| Server data | `"use cache"` + `cacheLife("minutes")` (`"hours"` for chains) | Prevent repeat Merkl calls across pages and the API. In-memory, per process |
| HTTP | `Cache-Control: s-maxage=60, stale-while-revalidate=300` on `/api/*` | Hint for a CDN, if one is added |

`next dev` labels every logged Merkl call `(cache skip)`. That describes the `fetch` itself, which isn’t cached; `"use cache"` sits above it, so a cache hit runs no `fetch` and logs no Merkl line.

**The URL owns list state.** Filters, sort and page are all query params, so views are shareable and render on the server. Client state is limited to drafts (search and slider debounce) and overlays, which is why there’s no React Query or SWR: a client cache would be a second source of truth. Navigation runs in a transition, so current results stay visible and dim while the next ones load.

**The frontend doesn’t call its own API.** Server components call `lib/merkl/client.ts` directly, since an HTTP round trip to the same process adds latency and nothing else. The API exposes the same queries as JSON, and **Open API JSON** on the list page opens it for the current filters. Merkl is only ever called from the server.

**Errors stay close to where they happen.** `app/error.tsx` covers the list, `app/opportunities/[id]/error.tsx` keeps a way back to it, and `app/global-error.tsx` covers the root layout. A failed count doesn’t fail the list; pagination falls back to “a full page may have more”.

**Asset type is single-choice.** Merkl ignores `tokens` when `stablecoin` is set, so a multi-select would silently drop one of the choices.

**Range filters use discrete steps.** TVL and APR span many orders of magnitude, so a linear slider would be unusable.

## API

Takes the same params as the list page, and returns `{ data, meta }`. `meta.total` is the number of matches.

```bash
curl "http://localhost:3000/api/opportunities?items=5"
curl "http://localhost:3000/api/opportunities?minimumTvl=1&sort=tvl&order=desc"
```

Params: `page`, `items`, `chainId`, `status`, `action`, `minimumTvl`, `maximumTvl`, `minimumApr`, `maximumApr`, `minimumDailyRewards`, `maximumDailyRewards`, `asset`, `tokenTypes`, `search`, `sort`, `order`.

Status defaults to `LIVE`. Unknown or invalid values fall back to the default. Upstream failures return 502; an unknown or malformed id returns 404.

## Known limits

- **APR differs between the column and the filter.** The column shows `totalApr` (incentives + protocol yield), as Merkl’s app does. `minimumApr` / `maximumApr` filter on incentive-only `apr`, so a row can show more than a slider’s maximum.
- **Default list is wider than Merkl’s.** Merkl’s app opens on its Tokens tab; this list includes Points and Pre-TGE campaigns unless filtered.
- **Merkl’s ordering isn’t strict.** It occasionally returns a row out of place. Each page is re-sorted by the value shown, which can’t fix order across pages.
- **Ends is display-only.** Merkl has no campaign-end sort, and sorting one page would look like a global order.
- **Errors arrive with HTTP 200.** Pages stream, so the status is sent before data fails or an id turns out to be missing. The API returns real status codes.
- **The full Merkl record reaches the client.** Results aren’t trimmed to the fields the UI uses, which makes the list page heavier than it needs to be.
- No Docker / CI / deploy in this repo.
