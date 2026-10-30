import { describe, expect, it } from "vitest";
import {
  ALL_STATUSES,
  hasNextPage,
  listHref,
  parseListQuery,
  serializeFilters,
  serializeListQuery,
  stabilizePageOrder,
  toMerklFilters,
  toMerklListParams,
} from "@/lib/merkl/query";
import type { Opportunity } from "@/lib/merkl/types";

function canonical(raw: string) {
  return serializeListQuery(parseListQuery(new URLSearchParams(raw)));
}

describe("parseListQuery", () => {
  it("applies defaults, including LIVE status", () => {
    expect(parseListQuery({})).toEqual({
      status: "LIVE",
      sort: "tvl",
      order: "desc",
      page: 0,
      items: 20,
    });
  });

  it("reads URLSearchParams and page-style records the same way", () => {
    const fromUrl = parseListQuery(new URLSearchParams("chainId=1&page=2"));
    const fromPage = parseListQuery({ chainId: ["1", "137"], page: "2" });
    expect(fromPage).toEqual(fromUrl);
  });

  it("drops invalid values instead of forwarding them", () => {
    const query = parseListQuery(
      new URLSearchParams(
        "status=NOPE&action=LEND,NOPE&chainId=abc,1&minimumTvl=-5&maximumApr=1e9&asset=doge&tokenTypes=X&order=up&sort=endsIn&page=-1&items=9999",
      ),
    );
    expect(query).toEqual({
      status: "LIVE",
      action: "LEND",
      chainId: "1",
      sort: "tvl",
      order: "desc",
      page: 0,
      items: 100,
    });
  });

  it("keeps a single asset, because Merkl can't combine them", () => {
    expect(parseListQuery({ asset: "eth,stablecoin" }).asset).toBe("eth");
  });

  it("falls back to the first page on a non-numeric page", () => {
    expect(parseListQuery({ page: "abc" }).page).toBe(0);
  });
});

describe("serializeListQuery (the cache key)", () => {
  it.each([
    ["param order", "status=LIVE&sort=apr&order=desc", "order=desc&sort=apr&status=LIVE"],
    ["explicit defaults", "sort=apr", "sort=apr&order=desc&status=LIVE&items=20&page=0"],
    ["csv order and duplicates", "chainId=1,137", "chainId=137,1,1"],
    ["sort alias", "sort=dailyRewards", "sort=rewards"],
    ["surrounding whitespace", "search=usdc", "search=%20usdc%20"],
    ["dropped junk", "sort=apr", "sort=apr&utm=x&status=NOPE"],
  ])("treats %s as one query", (_name, a, b) => {
    expect(canonical(a)).toBe(canonical(b));
  });

  it("keeps different queries apart", () => {
    expect(canonical("sort=apr")).not.toBe(canonical("sort=tvl"));
    expect(canonical("page=1")).not.toBe(canonical(""));
    expect(canonical(`status=${ALL_STATUSES}`)).not.toBe(canonical(""));
  });

  it("round-trips", () => {
    const query = parseListQuery(
      new URLSearchParams("search=usdc&chainId=1,137&asset=btc&sort=apr&order=asc&page=3&items=5"),
    );
    expect(parseListQuery(new URLSearchParams(serializeListQuery(query)))).toEqual(query);
  });

  it("ignores paging and sort for the shared count key", () => {
    const a = parseListQuery({ chainId: "1", sort: "apr", page: "4" });
    const b = parseListQuery({ chainId: "1", order: "asc", items: "5" });
    expect(serializeFilters(a)).toBe(serializeFilters(b));
  });
});

describe("listHref", () => {
  it("is the bare path for the default query", () => {
    expect(listHref({})).toBe("/");
    expect(listHref({ status: "LIVE", sort: "tvl", order: "desc", page: 0 })).toBe("/");
  });

  it("keeps non-default filters", () => {
    expect(listHref({ chainId: "1", page: 2 })).toBe("/?chainId=1&page=2");
  });
});

describe("Merkl params", () => {
  it("maps asset choices to Merkl params", () => {
    expect(toMerklFilters(parseListQuery({ asset: "stablecoin" }))).toMatchObject({
      stablecoin: "true",
    });
    const eth = toMerklFilters(parseListQuery({ asset: "eth" }));
    expect(eth.tokens).toBe("ETH,WETH");
    expect(eth).not.toHaveProperty("stablecoin");
    expect(eth).not.toHaveProperty("asset");
  });

  it("maps the daily rewards column to Merkl's sort name", () => {
    expect(toMerklListParams(parseListQuery({ sort: "dailyRewards" })).sort).toBe("rewards");
  });
});

describe("stabilizePageOrder", () => {
  const row = (name: string, apr: number, totalApr: number) =>
    ({ id: name, name, apr, totalApr, tvl: 0, dailyRewards: 0 }) as Opportunity;

  it("sorts APR by the shown total, not the incentive-only field", () => {
    const data = [
      row("high incentive", 27172, 27172),
      row("mostly protocol yield", 4337, 226346),
      row("protocol only", 0, 2142),
    ];
    const names = stabilizePageOrder(data, "apr", "desc").map((o) => o.name);
    expect(names).toEqual(["mostly protocol yield", "high incentive", "protocol only"]);
  });

  it("moves a row Merkl returned out of place", () => {
    const data = [row("a", 322, 322), row("misplaced", 15, 15), row("b", 5, 264)];
    const names = stabilizePageOrder(data, "apr", "desc").map((o) => o.name);
    expect(names).toEqual(["a", "b", "misplaced"]);
  });

  it("respects ascending order and does not mutate its input", () => {
    const data = [row("big", 9, 9), row("small", 1, 1)];
    expect(stabilizePageOrder(data, "apr", "asc").map((o) => o.name)).toEqual(["small", "big"]);
    expect(data[0].name).toBe("big");
  });
});

describe("hasNextPage", () => {
  it("uses the total when known", () => {
    expect(hasNextPage({ page: 0, pageSize: 20, count: 20, total: 21 })).toBe(true);
    expect(hasNextPage({ page: 0, pageSize: 20, count: 20, total: 20 })).toBe(false);
    expect(hasNextPage({ page: 43, pageSize: 20, count: 20, total: 880 })).toBe(false);
  });

  it("falls back to a full page when the count call failed", () => {
    expect(hasNextPage({ page: 0, pageSize: 20, count: 20, total: null })).toBe(true);
    expect(hasNextPage({ page: 0, pageSize: 20, count: 7, total: null })).toBe(false);
  });
});
