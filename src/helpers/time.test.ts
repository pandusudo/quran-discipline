import { describe, expect, it } from "vitest";
import { formatMs } from "./time";

describe("formatMs", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatMs(90_000)).toBe("01:30");
    expect(formatMs(60_000)).toBe("01:00");
    expect(formatMs(0)).toBe("00:00");
  });

  it("pads single digits", () => {
    expect(formatMs(9_000)).toBe("00:09");
    expect(formatMs(59_000)).toBe("00:59");
  });

  it("rounds partial seconds up", () => {
    expect(formatMs(1)).toBe("00:01");
    expect(formatMs(1_500)).toBe("00:02");
  });
});
