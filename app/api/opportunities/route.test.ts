import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getOne } from "@/app/api/opportunities/[id]/route";
import { GET as getList } from "@/app/api/opportunities/route";

vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const row = (id: string, tvl: number) => ({ id, name: id, tvl, apr: 0, dailyRewards: 0 });

/** Answers Merkl paths with the given handler and records the requested URLs. */
function mockMerkl(handler: (url: URL) => Response) {
  const urls: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL) => {
      urls.push(input);
      return handler(input);
    }),
  );
  return urls;
}

function list(query = "") {
  return getList(new NextRequest(`http://test/api/opportunities?${query}`));
}

function one(id: string) {
  return getOne(new Request("http://test"), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/opportunities", () => {
  it("returns the page with the total and forwards validated params", async () => {
    const urls = mockMerkl((url) =>
      url.pathname.endsWith("/count")
        ? Response.json(42)
        : Response.json([row("small", 1), row("big", 2)]),
    );

    const response = await list("chainId=1&sort=tvl&asset=eth&bogus=1&status=NOPE");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60");
    expect(body.data.map((o: { id: string }) => o.id)).toEqual(["big", "small"]);
    expect(body.meta).toMatchObject({ count: 2, total: 42, page: 0, items: 20 });

    const listUrl = urls.find((url) => url.pathname.endsWith("/opportunities"))!;
    expect(Object.fromEntries(listUrl.searchParams)).toEqual({
      page: "0",
      items: "20",
      chainId: "1",
      status: "LIVE",
      tokens: "ETH,WETH",
      sort: "tvl",
      order: "desc",
    });
  });

  it("still returns the list when only the count fails", async () => {
    mockMerkl((url) =>
      url.pathname.endsWith("/count")
        ? new Response("{}", { status: 503 })
        : Response.json([row("a", 1)]),
    );

    const response = await list();
    expect(response.status).toBe(200);
    expect((await response.json()).meta.total).toBeNull();
  });

  it("maps a Merkl failure to 502 without leaking upstream details", async () => {
    mockMerkl(() => new Response("{}", { status: 503 }));

    const response = await list();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Failed to fetch opportunities from Merkl",
    });
  });
});

describe("GET /api/opportunities/:id", () => {
  it("returns the opportunity", async () => {
    mockMerkl(() => Response.json(row("123", 1)));

    const response = await one("123");
    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe("123");
  });

  it.each([
    ["unknown id", 404],
    ["malformed id", 400],
  ])("answers 404 for a Merkl %s (%i)", async (_name, status) => {
    mockMerkl(() => new Response("{}", { status }));
    expect((await one("x")).status).toBe(404);
  });

  it("maps other Merkl failures to 502", async () => {
    mockMerkl(() => new Response("{}", { status: 503 }));
    expect((await one("123")).status).toBe(502);
  });
});
