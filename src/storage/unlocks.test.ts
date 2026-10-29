import { describe, expect, it } from "vitest";
import type { TemporaryUnlock } from "./unlocks";
import { getCoveringUnlockExpiry, isRuleSatisfied } from "./unlocks";

const unlock = (
  domain: string,
  expiresAt: number,
  ruleId?: string,
): TemporaryUnlock => ({
  domain,
  expiresAt,
  ...(ruleId ? { ruleId } : {}),
});

describe("isRuleSatisfied", () => {
  it("is satisfied by an unlock for exactly this rule", () => {
    const unlocks = [unlock("example.com", Date.now() + 60_000, "rule-1")];
    expect(isRuleSatisfied(unlocks, "rule-1", "example.com")).toBe(true);
    expect(isRuleSatisfied(unlocks, "rule-2", "example.com")).toBe(false);
  });

  it("treats a ruleless unlock as satisfying every rule", () => {
    const unlocks = [unlock("example.com", Date.now() + 60_000)];
    expect(isRuleSatisfied(unlocks, "rule-1", "example.com")).toBe(true);
    expect(isRuleSatisfied(unlocks, "rule-2", "example.com")).toBe(true);
  });

  it("matches subdomains of the unlocked domain", () => {
    const unlocks = [unlock("example.com", Date.now() + 60_000, "rule-1")];
    expect(isRuleSatisfied(unlocks, "rule-1", "m.example.com")).toBe(true);
  });

  it("does not match unrelated hosts", () => {
    const unlocks = [unlock("example.com", Date.now() + 60_000)];
    expect(isRuleSatisfied(unlocks, "rule-1", "other.com")).toBe(false);
  });

  it("returns false with no unlocks", () => {
    expect(isRuleSatisfied([], "rule-1", "example.com")).toBe(false);
  });
});

describe("getCoveringUnlockExpiry", () => {
  it("returns the earliest expiry among unlocks covering the hostname", () => {
    const unlocks = [
      unlock("example.com", 200),
      unlock("m.example.com", 100),
      unlock("other.com", 50),
    ];
    // A subdomain unlock does not cover the parent domain.
    expect(getCoveringUnlockExpiry(unlocks, "example.com")).toBe(200);
    // The parent unlock does cover the subdomain, so both apply there.
    expect(getCoveringUnlockExpiry(unlocks, "m.example.com")).toBe(100);
  });

  it("returns null when nothing covers the hostname", () => {
    expect(getCoveringUnlockExpiry([], "example.com")).toBeNull();
    expect(
      getCoveringUnlockExpiry([unlock("other.com", 100)], "example.com"),
    ).toBeNull();
  });
});
