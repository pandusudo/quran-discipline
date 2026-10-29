import { describe, expect, it } from "vitest";
import type { BlockRule } from "../storage";
import {
  findGoverningRule,
  getMatchingRules,
  isRuleActiveNow,
  pickStrictestRule,
} from "./sites";

const makeRule = (overrides: Partial<BlockRule> = {}): BlockRule => ({
  id: overrides.id ?? `rule-${Math.random()}`,
  blockMode: "timer",
  timerSeconds: 30,
  unlockDurationMinutes: 5,
  schedule: null,
  sites: [
    {
      domain: "example.com",
      addedAt: "2026-01-01T00:00:00.000Z",
      enabled: true,
      blockedCount: 0,
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

// 2026-01-04 is a Sunday (getDay() === 0).
const SUNDAY_NOON = new Date("2026-01-04T12:00:00");

describe("isRuleActiveNow", () => {
  it("is active all the time when schedule is null", () => {
    expect(isRuleActiveNow({ schedule: null }, SUNDAY_NOON)).toBe(true);
  });

  it("is inactive on days outside the schedule", () => {
    const rule = {
      schedule: { days: [1], startTime: "00:00", endTime: "23:59" },
    };
    expect(isRuleActiveNow(rule, SUNDAY_NOON)).toBe(false);
    expect(isRuleActiveNow(rule, new Date("2026-01-05T12:00:00"))).toBe(true);
  });

  it("is active inside a same-day window", () => {
    const rule = {
      schedule: { days: [0], startTime: "09:00", endTime: "17:00" },
    };
    expect(isRuleActiveNow(rule, SUNDAY_NOON)).toBe(true);
    expect(isRuleActiveNow(rule, new Date("2026-01-04T08:00:00"))).toBe(false);
    expect(isRuleActiveNow(rule, new Date("2026-01-04T18:00:00"))).toBe(false);
  });

  it("handles overnight windows", () => {
    const rule = {
      schedule: { days: [6], startTime: "22:00", endTime: "06:00" },
    };
    // Saturday 23:00
    expect(isRuleActiveNow(rule, new Date("2026-01-03T23:00:00"))).toBe(true);
    // Saturday 03:00 (still inside the window that started Friday? no —
    // day must be Saturday; 03:00 Sat is inside 22:00→06:00)
    expect(isRuleActiveNow(rule, new Date("2026-01-03T03:00:00"))).toBe(true);
    // Saturday 12:00 — outside
    expect(isRuleActiveNow(rule, new Date("2026-01-03T12:00:00"))).toBe(false);
  });

  it("treats an empty day list as never active", () => {
    const rule = {
      schedule: { days: [], startTime: "00:00", endTime: "23:59" },
    };
    expect(isRuleActiveNow(rule, SUNDAY_NOON)).toBe(false);
  });

  it("treats start === end as always active on that day", () => {
    const rule = {
      schedule: { days: [0], startTime: "12:00", endTime: "12:00" },
    };
    expect(isRuleActiveNow(rule, SUNDAY_NOON)).toBe(true);
  });

  it("rejects unparsable times", () => {
    const rule = { schedule: { days: [0], startTime: "aa", endTime: "bb" } };
    expect(isRuleActiveNow(rule, SUNDAY_NOON)).toBe(false);
  });
});

describe("getMatchingRules", () => {
  it("returns rules whose enabled site covers the hostname", () => {
    const rule = makeRule();
    expect(getMatchingRules([rule], "example.com")).toEqual([rule]);
    expect(getMatchingRules([rule], "sub.example.com")).toEqual([rule]);
    expect(getMatchingRules([rule], "other.com")).toEqual([]);
  });

  it("skips disabled site entries by default", () => {
    const rule = makeRule();
    rule.sites[0].enabled = false;
    expect(getMatchingRules([rule], "example.com")).toEqual([]);
    expect(
      getMatchingRules([rule], "example.com", { enabledOnly: false }),
    ).toEqual([rule]);
  });

  it("skips schedule-inactive rules by default", () => {
    const rule = makeRule({
      schedule: { days: [1], startTime: "00:00", endTime: "23:59" },
    });
    expect(getMatchingRules([rule], "example.com", {})).toEqual([]);
    expect(
      getMatchingRules([rule], "example.com", { activeOnly: false }),
    ).toEqual([rule]);
  });

  it("can return several rules covering one hostname", () => {
    const a = makeRule({ id: "a" });
    const b = makeRule({ id: "b", blockMode: "hard" });
    const other = makeRule({
      id: "c",
      sites: [{ ...a.sites[0], domain: "other.com" }],
    });
    expect(getMatchingRules([a, b, other], "example.com")).toEqual([a, b]);
  });
});

describe("findGoverningRule", () => {
  it("picks the most recently created matching rule", () => {
    const old = makeRule({ id: "old", createdAt: "2026-01-01T00:00:00.000Z" });
    const recent = makeRule({
      id: "recent",
      createdAt: "2026-02-01T00:00:00.000Z",
    });
    expect(findGoverningRule([old, recent], "example.com")?.id).toBe("recent");
  });

  it("falls back to array order on identical timestamps", () => {
    const a = makeRule({ id: "a" });
    const b = makeRule({ id: "b" });
    expect(findGoverningRule([a, b], "example.com")?.id).toBe("b");
  });

  it("returns null when nothing matches", () => {
    expect(findGoverningRule([makeRule()], "other.com")).toBeNull();
  });
});

describe("pickStrictestRule", () => {
  it("prefers hard over audio over timer", () => {
    const timer = makeRule({ id: "timer", blockMode: "timer" });
    const audio = makeRule({ id: "audio", blockMode: "audio" });
    const hard = makeRule({ id: "hard", blockMode: "hard" });
    expect(pickStrictestRule([timer, audio, hard])?.id).toBe("hard");
    expect(pickStrictestRule([timer, audio])?.id).toBe("audio");
    expect(pickStrictestRule([timer])?.id).toBe("timer");
  });

  it("prefers the longer timer when modes tie", () => {
    const short = makeRule({ id: "short", timerSeconds: 10 });
    const long = makeRule({ id: "long", timerSeconds: 60 });
    expect(pickStrictestRule([short, long])?.id).toBe("long");
  });

  it("prefers the newer rule when mode and timer tie", () => {
    const old = makeRule({ id: "old", createdAt: "2026-01-01T00:00:00.000Z" });
    const recent = makeRule({
      id: "recent",
      createdAt: "2026-02-01T00:00:00.000Z",
    });
    expect(pickStrictestRule([old, recent])?.id).toBe("recent");
  });

  it("returns null for an empty candidate list", () => {
    expect(pickStrictestRule([])).toBeNull();
  });
});
