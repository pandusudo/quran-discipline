import { STORAGE_KEYS } from "./keys";

export interface FocusSession {
  isActive: boolean;
  focusDuration: number;
  restDuration: number;
  totalCycles: number;
  currentCycle: number;
  phase: "focus" | "rest";
  phaseEndTime: number;
}

export const getFocusSession = (): Promise<FocusSession | null> =>
  chrome.storage.sync
    .get(STORAGE_KEYS.FOCUS_SESSION)
    .then((r) => (r[STORAGE_KEYS.FOCUS_SESSION] as FocusSession) ?? null);

export const setFocusSession = (session: FocusSession): Promise<void> =>
  chrome.storage.sync.set({ [STORAGE_KEYS.FOCUS_SESSION]: session });
