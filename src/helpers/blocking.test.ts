import { describe, expect, it } from "vitest";
import type { BlockRule, TemporaryUnlock } from "../storage";
import { evaluateBlocking } from "./blocking";

const makeRule = (overrides: Partial<BlockRule> = {}): BlockRule => ({
  id: overrides.id ?? "rule-1",
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

const baseInput = {
  hostname: "example.com",
  isEnabled: true,
  isFocusBlocking: false,
  matchingRules: [] as BlockRule[],
  activeUnlocks: [] as TemporaryUnlock[],
  isInPomodoroList: false,
  isInHaramList: false,
};

describe("evaluateBlocking — standard mode", () => {
  it("blocks when a matching rule is not unlocked", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      matchingRules: [makeRule()],
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.context).toBe("standard");
    expect(decision.governing?.id).toBe("rule-1");
  });

  it("does not block when the master toggle is off", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isEnabled: false,
      matchingRules: [makeRule()],
    });
    expect(decision.shouldBlock).toBe(false);
  });

  it("does not block when every matching rule is unlocked", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      matchingRules: [makeRule()],
      activeUnlocks: [
        {
          domain: "example.com",
          expiresAt: Date.now() + 60_000,
          ruleId: "rule-1",
        },
      ],
    });
    expect(decision.shouldBlock).toBe(false);
  });

  it("stays blocked while any one matching rule remains locked", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      matchingRules: [makeRule({ id: "rule-1" }), makeRule({ id: "rule-2" })],
      activeUnlocks: [
        {
          domain: "example.com",
          expiresAt: Date.now() + 60_000,
          ruleId: "rule-1",
        },
      ],
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.ruleBlockers.map((r) => r.id)).toEqual(["rule-2"]);
    expect(decision.governing?.id).toBe("rule-2");
  });

  it("always blocks haram hosts and never unlocks them", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isInHaramList: true,
      activeUnlocks: [
        { domain: "example.com", expiresAt: Date.now() + 60_000 },
      ],
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.governing).toBeNull();
  });
});

describe("evaluateBlocking — focus (Pomodoro) mode", () => {
  it("ignores the master toggle", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isEnabled: false,
      isFocusBlocking: true,
      matchingRules: [makeRule()],
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.context).toBe("focus");
  });

  it("ignores temporary unlocks", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isFocusBlocking: true,
      matchingRules: [makeRule()],
      activeUnlocks: [
        {
          domain: "example.com",
          expiresAt: Date.now() + 60_000,
          ruleId: "rule-1",
        },
      ],
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.governing?.id).toBe("rule-1");
  });

  it("blocks Pomodoro-list sites that match no rule", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isFocusBlocking: true,
      isInPomodoroList: true,
    });
    expect(decision.shouldBlock).toBe(true);
    expect(decision.governing).toBeNull();
  });

  it("blocks haram hosts during focus even with no matching rules", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isFocusBlocking: true,
      isInHaramList: true,
    });
    expect(decision.shouldBlock).toBe(true);
  });

  it("does not block unrelated sites during focus", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isFocusBlocking: true,
    });
    expect(decision.shouldBlock).toBe(false);
  });

  it("governs with the strictest matching rule during focus", () => {
    const decision = evaluateBlocking({
      ...baseInput,
      isFocusBlocking: true,
      matchingRules: [
        makeRule({ id: "timer", blockMode: "timer" }),
        makeRule({ id: "hard", blockMode: "hard" }),
      ],
    });
    expect(decision.governing?.id).toBe("hard");
  });
});
