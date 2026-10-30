import { describe, expect, it } from "vitest";
import type { BlockRule } from "../storage";
import { buildImportResult, sanitizeImportedSiteLists } from "./import";

const rawRule = (overrides: Record<string, unknown> = {}) => ({
  id: "rule-1",
  blockMode: "timer",
  timerSeconds: 30,
  unlockDurationMinutes: 5,
  sites: [{ domain: "example.com" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("buildImportResult", () => {
  it("returns null for a non-array payload", () => {
    expect(buildImportResult("nope", "replace", [])).toBeNull();
    expect(buildImportResult(null, "merge", [])).toBeNull();
  });

  it("replace mode discards existing rules", () => {
    const existing: BlockRule[] = [
      {
        ...rawRule({ id: "existing" }),
        sites: [
          { domain: "old.com", addedAt: "", enabled: true, blockedCount: 0 },
        ],
      } as BlockRule,
    ];
    const result = buildImportResult([rawRule()], "replace", existing);
    expect(result?.rules.map((r) => r.id)).toEqual(["rule-1"]);
    expect(result?.summary.addedRules).toBe(1);
  });

  it("merge mode keeps existing rules and skips duplicate ids", () => {
    const existing = [
      { ...rawRule({ id: "rule-1" }), sites: [] } as unknown as BlockRule,
    ];
    const result = buildImportResult(
      [rawRule(), rawRule({ id: "rule-2" })],
      "merge",
      existing,
    );
    expect(result?.rules.map((r) => r.id)).toEqual(["rule-1", "rule-2"]);
    expect(result?.summary.skippedRules).toBe(1);
    expect(result?.summary.addedRules).toBe(1);
  });

  it("drops invalid modes and normalizes legacy 'full' to 'hard'", () => {
    const result = buildImportResult(
      [
        rawRule({ id: "a", blockMode: "bogus" }),
        rawRule({ id: "b", blockMode: "full" }),
      ],
      "replace",
      [],
    );
    expect(result?.rules.map((r) => r.id)).toEqual(["b"]);
    expect(result?.rules[0].blockMode).toBe("hard");
    expect(result?.summary.skippedRules).toBe(1);
  });

  it("removes duplicate and invalid sites inside a rule", () => {
    const result = buildImportResult(
      [
        rawRule({
          sites: [
            { domain: "example.com" },
            { domain: "https://www.example.com/path" },
            { domain: "" },
            { notADomain: true },
          ],
        }),
      ],
      "replace",
      [],
    );
    expect(result?.rules[0].sites).toHaveLength(1);
    expect(result?.rules[0].sites[0].domain).toBe("example.com");
    expect(result?.summary.skippedSites).toBe(3);
  });

  it("returns null when no rule survives sanitization", () => {
    expect(
      buildImportResult([{ blockMode: "bogus" }], "replace", []),
    ).toBeNull();
  });
});

describe("sanitizeImportedSiteLists", () => {
  it("accepts well-formed lists and fills defaults", () => {
    const { lists, skipped } = sanitizeImportedSiteLists([
      {
        name: "  Social  ",
        sites: ["https://www.Twitter.com/x", "twitter.com"],
      },
    ]);
    expect(skipped).toBe(0);
    expect(lists[0].name).toBe("Social");
    expect(lists[0].sites).toEqual(["twitter.com"]);
    expect(lists[0].id).toMatch(/^list-import-/);
    expect(lists[0].createdAt).toBeTruthy();
  });

  it("skips lists without a valid name", () => {
    const { lists, skipped } = sanitizeImportedSiteLists([
      { name: "", sites: ["a.com"] },
      { name: "x".repeat(61), sites: [] },
      { sites: ["a.com"] },
    ]);
    expect(lists).toHaveLength(0);
    expect(skipped).toBe(3);
  });

  it("ignores non-string site entries", () => {
    const { lists } = sanitizeImportedSiteLists([
      { name: "ok", sites: ["a.com", 42, null, ""] },
    ]);
    expect(lists[0].sites).toEqual(["a.com"]);
  });

  it("returns empty for non-array payloads", () => {
    expect(sanitizeImportedSiteLists(undefined)).toEqual({
      lists: [],
      skipped: 0,
    });
  });
});
