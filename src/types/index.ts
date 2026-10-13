export type {
  GetBlockRulesMessage,
  CreateRuleMessage,
  AddSiteToRuleMessage,
  RemoveSiteFromRuleMessage,
  ToggleSiteMessage,
  DeleteRuleMessage,
  UpdateRuleMessage,
  GetSiteConfigMessage,
  ImportDataMessage,
  ImportMode,
  GetSiteListsMessage,
  CreateSiteListMessage,
  UpdateSiteListMessage,
  DeleteSiteListMessage,
} from "./site";

export type {
  UnlockSiteMessage,
  GetUnlockStateMessage,
  GetUnlockStatesMessage,
  ClearUnlockStateMessage,
} from "./unlock";

export type {
  GetBlockHistoryMessage,
  ClearBlockHistoryMessage,
} from "./history";

export type { GetSettingsMessage, UpdateSettingsMessage } from "./settings";

export type {
  BlockContext,
  GetPomodoroSessionMessage,
  GetPomodoroStatsMessage,
  StartPomodoroSessionMessage,
  StopPomodoroSessionMessage,
} from "./session";

export type {
  SuccessResponse,
  ErrorResponse,
  ExtensionResponse,
} from "./response";

import type {
  GetBlockRulesMessage,
  CreateRuleMessage,
  AddSiteToRuleMessage,
  RemoveSiteFromRuleMessage,
  ToggleSiteMessage,
  DeleteRuleMessage,
  UpdateRuleMessage,
  GetSiteConfigMessage,
  ImportDataMessage,
  GetSiteListsMessage,
  CreateSiteListMessage,
  UpdateSiteListMessage,
  DeleteSiteListMessage,
} from "./site";
import type {
  UnlockSiteMessage,
  GetUnlockStateMessage,
  GetUnlockStatesMessage,
  ClearUnlockStateMessage,
} from "./unlock";
import type {
  GetBlockHistoryMessage,
  ClearBlockHistoryMessage,
} from "./history";
import type { GetSettingsMessage, UpdateSettingsMessage } from "./settings";
import type {
  GetPomodoroSessionMessage,
  GetPomodoroStatsMessage,
  StartPomodoroSessionMessage,
  StopPomodoroSessionMessage,
} from "./session";

export type ExternalMessage =
  | GetBlockRulesMessage
  | CreateRuleMessage
  | AddSiteToRuleMessage
  | RemoveSiteFromRuleMessage
  | ToggleSiteMessage
  | DeleteRuleMessage
  | UpdateRuleMessage
  | GetBlockHistoryMessage
  | ClearBlockHistoryMessage
  | UnlockSiteMessage
  | GetUnlockStateMessage
  | GetUnlockStatesMessage
  | ClearUnlockStateMessage
  | GetSiteConfigMessage
  | ImportDataMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | GetSiteListsMessage
  | CreateSiteListMessage
  | UpdateSiteListMessage
  | DeleteSiteListMessage
  | GetPomodoroSessionMessage
  | GetPomodoroStatsMessage
  | StartPomodoroSessionMessage
  | StopPomodoroSessionMessage;
