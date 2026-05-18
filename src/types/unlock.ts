export type UnlockSiteMessage = {
  type: "UNLOCK_SITE";
  payload: { domain: string; durationMinutes: number };
};

export type GetUnlockStateMessage = {
  type: "GET_UNLOCK_STATE";
  payload: { domain: string };
};

export type ClearUnlockStateMessage = {
  type: "CLEAR_UNLOCK_STATE";
  payload: { domain: string };
};
