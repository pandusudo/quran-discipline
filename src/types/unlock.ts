export type UnlockSiteMessage = {
  type: "UNLOCK_SITE";
  payload: { domain: string; durationMinutes: number; ruleId?: string };
};

export type GetUnlockStateMessage = {
  type: "GET_UNLOCK_STATE";
  payload: { domain: string };
};

export type GetUnlockStatesMessage = {
  type: "GET_UNLOCK_STATES";
};

export type ClearUnlockStateMessage = {
  type: "CLEAR_UNLOCK_STATE";
  payload: { domain: string };
};
