import { describe, expect, it } from "vitest";
import {
  dailyRewardsPer1k,
  displayApr,
  formatRemainingDays,
  remainingCampaignDays,
} from "@/lib/format";

describe("displayApr", () => {
  it("prefers total, then native, then incentive", () => {
    expect(displayApr({ apr: 1, nativeApr: 2, totalApr: 3 })).toBe(3);
    expect(displayApr({ apr: 1, nativeApr: 2 })).toBe(2);
    expect(displayApr({ apr: 1 })).toBe(1);
    expect(displayApr({})).toBeNull();
  });
});

describe("dailyRewardsPer1k", () => {
  it("uses the live pool rate when there are rewards and TVL", () => {
    expect(dailyRewardsPer1k({ dailyRewards: 100, tvl: 10_000, apr: 5 })).toBe(10);
  });

  it("estimates from APR without a daily pool", () => {
    expect(dailyRewardsPer1k({ dailyRewards: 0, tvl: 10_000, apr: 36.5 })).toBeCloseTo(1);
  });

  it("estimates from APR without TVL", () => {
    expect(dailyRewardsPer1k({ dailyRewards: 100, tvl: 0, apr: 36.5 })).toBeCloseTo(1);
  });

  it("is null with nothing to go on", () => {
    expect(dailyRewardsPer1k({ dailyRewards: 0, tvl: 0, apr: 0 })).toBeNull();
  });
});

describe("remainingCampaignDays", () => {
  const now = 1_700_000_000_000;

  it("rounds up to whole days from a unix-seconds end", () => {
    expect(remainingCampaignDays(now / 1000 + 86_400 * 1.5, now)).toBe(2);
    expect(remainingCampaignDays(String(now / 1000 + 86_400), now)).toBe(1);
  });

  it("is unknown before the client has a time, or without an end", () => {
    expect(remainingCampaignDays(now / 1000, null)).toBeNull();
    expect(remainingCampaignDays(null, now)).toBeNull();
  });

  it("formats unknown and ended campaigns", () => {
    expect(formatRemainingDays(null)).toBe("—");
    expect(formatRemainingDays(-1)).toBe("Ended");
    expect(formatRemainingDays(0)).toBe("<1d");
  });
});
