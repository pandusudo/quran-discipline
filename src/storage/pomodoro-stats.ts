import { STORAGE_KEYS } from "./keys";
import { storageGet, storageSet } from "./db";

export interface PomodoroStats {
  /** Focus seconds credited since the stats started being tracked. */
  totalFocusSeconds: number;
  /** Focus seconds per local calendar day (`YYYY-MM-DD`). */
  daily: Record<string, number>;
}

/** Focus days older than this are dropped — the dashboard only filters 30 days. */
const KEEP_DAYS = 40;

const dayKey = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const emptyStats = (): PomodoroStats => ({ totalFocusSeconds: 0, daily: {} });

const sanitize = (value: unknown): PomodoroStats => {
  if (!value || typeof value !== "object") return emptyStats();

  const record = value as Partial<PomodoroStats>;
  const total =
    typeof record.totalFocusSeconds === "number" &&
    Number.isFinite(record.totalFocusSeconds) &&
    record.totalFocusSeconds > 0
      ? record.totalFocusSeconds
      : 0;

  const daily: Record<string, number> = {};
  const rawDaily =
    record.daily && typeof record.daily === "object" ? record.daily : {};
  const cutoff = dayKey(new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000));

  for (const [key, seconds] of Object.entries(rawDaily)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key < cutoff) continue;
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) continue;
    daily[key] = seconds;
  }

  return { totalFocusSeconds: total, daily };
};

export const getPomodoroStats = async (): Promise<PomodoroStats> => {
  const stored = await storageGet(STORAGE_KEYS.POMODORO_STATS);
  return sanitize(stored[STORAGE_KEYS.POMODORO_STATS]);
};

/** Credits focus time as whole seconds; values <= 0 are ignored. */
export const addFocusSeconds = async (seconds: number): Promise<void> => {
  if (!Number.isFinite(seconds) || seconds <= 0) return;

  const rounded = Math.round(seconds);
  const current = await getPomodoroStats();
  const key = dayKey(new Date());

  await storageSet({
    [STORAGE_KEYS.POMODORO_STATS]: {
      totalFocusSeconds: current.totalFocusSeconds + rounded,
      daily: {
        ...current.daily,
        [key]: (current.daily[key] ?? 0) + rounded,
      },
    },
  });
};
