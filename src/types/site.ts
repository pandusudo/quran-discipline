import type {
  BlockRule,
  BlockMode,
  RuleSchedule,
  SiteList,
} from "../storage";

export type GetBlockRulesMessage = { type: "GET_BLOCK_RULES" };

export type CreateRuleMessage = {
  type: "CREATE_RULE";
  payload: {
    blockMode: BlockMode;
    timerSeconds?: number;
    unlockDurationMinutes?: number;
    name?: string;
    schedule?: RuleSchedule | null;
  };
};

export type AddSiteToRuleMessage = {
  type: "ADD_SITE_TO_RULE";
  payload: { ruleId: string; domain: string };
};

export type RemoveSiteFromRuleMessage = {
  type: "REMOVE_SITE_FROM_RULE";
  payload: { ruleId: string; domain: string };
};

export type ToggleSiteMessage = {
  type: "TOGGLE_SITE";
  payload: { ruleId: string; domain: string };
};

export type DeleteRuleMessage = {
  type: "DELETE_RULE";
  payload: { ruleId: string };
};

export type UpdateRuleMessage = {
  type: "UPDATE_RULE";
  payload: {
    ruleId: string;
    updates: Partial<
      Pick<
        BlockRule,
        | "name"
        | "blockMode"
        | "timerSeconds"
        | "unlockDurationMinutes"
        | "schedule"
      >
    >;
  };
};

export type GetSiteConfigMessage = {
  type: "GET_SITE_CONFIG";
  payload: { domain: string };
};

export type ImportMode = "replace" | "merge";

export type ImportDataMessage = {
  type: "IMPORT_DATA";
  payload: {
    mode: ImportMode;
    rules: BlockRule[];
    siteLists?: SiteList[];
  };
};

export type GetSiteListsMessage = { type: "GET_SITE_LISTS" };

export type CreateSiteListMessage = {
  type: "CREATE_SITE_LIST";
  payload: { name: string; sites: string[] };
};

export type UpdateSiteListMessage = {
  type: "UPDATE_SITE_LIST";
  payload: { listId: string; name?: string; sites?: string[] };
};

export type DeleteSiteListMessage = {
  type: "DELETE_SITE_LIST";
  payload: { listId: string };
};
