export type {
  GetBlockedSitesMessage,
  AddSiteMessage,
  ToggleSiteMessage,
  DeleteSiteMessage,
  UpdateSiteMessage,
  GetSiteConfigMessage,
} from "./site";

export type {
  UnlockSiteMessage,
  GetUnlockStateMessage,
  ClearUnlockStateMessage,
} from "./unlock";

export type {
  GetBlockHistoryMessage,
  ClearBlockHistoryMessage,
} from "./history";

export type { GetSettingsMessage, UpdateSettingsMessage } from "./settings";

export type { BlockContext, GetFocusSessionMessage } from "./session";

export type {
  SuccessResponse,
  ErrorResponse,
  ExtensionResponse,
} from "./response";

import type {
  GetBlockedSitesMessage,
  AddSiteMessage,
  ToggleSiteMessage,
  DeleteSiteMessage,
  UpdateSiteMessage,
  GetSiteConfigMessage,
} from "./site";
import type {
  UnlockSiteMessage,
  GetUnlockStateMessage,
  ClearUnlockStateMessage,
} from "./unlock";
import type {
  GetBlockHistoryMessage,
  ClearBlockHistoryMessage,
} from "./history";
import type { GetSettingsMessage, UpdateSettingsMessage } from "./settings";
import type { GetFocusSessionMessage } from "./session";

export type ExternalMessage =
  | GetBlockedSitesMessage
  | AddSiteMessage
  | ToggleSiteMessage
  | DeleteSiteMessage
  | UpdateSiteMessage
  | GetBlockHistoryMessage
  | ClearBlockHistoryMessage
  | UnlockSiteMessage
  | GetUnlockStateMessage
  | ClearUnlockStateMessage
  | GetSiteConfigMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | GetFocusSessionMessage;
