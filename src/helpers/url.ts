export const normalizeDomain = (raw: string): string =>
  raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();

/** Exact or suffix match, e.g. "youtube.com" matches "m.youtube.com". */
export const matchesHost = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`);

/** Exact or suffix match, e.g. "youtube.com" matches "m.youtube.com". */
export const matchesDomainList = (
  domains: string[],
  hostname: string,
): boolean => domains.some((domain) => matchesHost(hostname, domain));
