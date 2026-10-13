import { LEGACY_FOCUS_SESSION_KEY, STORAGE_KEYS } from "./keys";
import { storageGet, storageRemove, storageSet } from "./db";

export interface PomodoroSession {
  isActive: boolean;
  listId: string;
  listName: string;
  /** Snapshot of the selected list's domains taken when the session started. */
  domains: string[];
  /** Focus phase length in minutes. */
  focusDuration: number;
  /** Rest phase length in minutes. */
  restDuration: number;
  totalCycles: number;
  currentCycle: number;
  phase: "focus" | "rest";
  /** Epoch ms when the current phase ends. */
  phaseEndTime: number;
}

export const getPomodoroSession = (): Promise<PomodoroSession | null> =>
  storageGet(STORAGE_KEYS.POMODORO_SESSION).then(
    (r) => (r[STORAGE_KEYS.POMODORO_SESSION] as PomodoroSession) ?? null,
  );

export const setPomodoroSession = (session: PomodoroSession): Promise<void> =>
  storageSet({ [STORAGE_KEYS.POMODORO_SESSION]: session });

/** Removes the pre-pomodoro mock session (idempotent). */
export const clearLegacyFocusSession = (): Promise<void> =>
  storageRemove(LEGACY_FOCUS_SESSION_KEY);
