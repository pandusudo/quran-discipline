import type { BlockedSite } from "../storage";

export type GetBlockedSitesMessage = { type: "GET_BLOCKED_SITES" };

export type AddSiteMessage = {
  type: "ADD_SITE";
  payload: {
    domain: string;
    category: string;
    blockMode?: "timer" | "audio" | "hard";
    timerSeconds?: number;
    unlockDurationMinutes?: number;
  };
};

export type ToggleSiteMessage = {
  type: "TOGGLE_SITE";
  payload: { id: string };
};

export type DeleteSiteMessage = {
  type: "DELETE_SITE";
  payload: { id: string };
};

export type UpdateSiteMessage = {
  type: "UPDATE_SITE";
  payload: { id: string; updates: Partial<BlockedSite> };
};

export type GetSiteConfigMessage = {
  type: "GET_SITE_CONFIG";
  payload: { domain: string };
};
