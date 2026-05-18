import type { ExtensionSettings } from "../storage";

export type GetSettingsMessage = { type: "GET_SETTINGS" };

export type UpdateSettingsMessage = {
  type: "UPDATE_SETTINGS";
  payload: Partial<ExtensionSettings>;
};
