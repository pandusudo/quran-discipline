export const STORAGE_KEYS = {
  BLOCK_RULES: "blockRules",
  POMODORO_SESSION: "pomodoroSession",
  SITE_LISTS: "siteLists",
  BLOCK_HISTORY: "blockHistory",
  TEMPORARY_UNLOCKS: "temporaryUnlocks",
  SETTINGS: "extensionSettings",
} as const;

/** Pre-pomodoro mock session data — removed on startup. */
export const LEGACY_FOCUS_SESSION_KEY = "focusSession";

export const ALARM_NAMES = {
  FOCUS_PHASE_END: "focus-phase-end",
  REST_PHASE_END: "rest-phase-end",
} as const;
