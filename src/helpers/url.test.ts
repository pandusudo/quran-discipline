import { describe, expect, it } from "vitest";
import { matchesDomainList, matchesHost, normalizeDomain } from "./url";

describe("normalizeDomain", () => {
  it("strips the scheme", () => {
    expect(normalizeDomain("https://example.com")).toBe("example.com");
    expect(normalizeDomain("http://example.com")).toBe("example.com");
  });

  it("strips a leading www.", () => {
    expect(normalizeDomain("www.example.com")).toBe("example.com");
  });

  it("drops path, query and hash", () => {
    expect(normalizeDomain("example.com/path/to?q=1#frag")).toBe("example.com");
  });

  it("lowercases the hostname", () => {
    expect(normalizeDomain("HTTPS://WWW.Example.COM/Path")).toBe("example.com");
  });

  it("combines scheme, www and path", () => {
    expect(normalizeDomain("https://www.YouTube.com/watch?v=x")).toBe(
      "youtube.com",
    );
  });
});

describe("matchesHost", () => {
  it("matches the exact domain", () => {
    expect(matchesHost("example.com", "example.com")).toBe(true);
  });

  it("matches subdomains", () => {
    expect(matchesHost("m.example.com", "example.com")).toBe(true);
    expect(matchesHost("a.b.example.com", "example.com")).toBe(true);
  });

  it("does not match a mere suffix", () => {
    expect(matchesHost("notexample.com", "example.com")).toBe(false);
    expect(matchesHost("example.com.evil.net", "example.com")).toBe(false);
  });
});

describe("matchesDomainList", () => {
  it("matches when any domain covers the hostname", () => {
    expect(matchesDomainList(["a.com", "b.com"], "sub.b.com")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesDomainList(["a.com", "b.com"], "c.com")).toBe(false);
    expect(matchesDomainList([], "a.com")).toBe(false);
  });
});
