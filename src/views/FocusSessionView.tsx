import { useState, useEffect, useRef } from "react";
import {
  ALARM_NAMES,
  STORAGE_KEYS,
  getFocusSession,
  setFocusSession,
  type FocusSession,
} from "../storage";
import { ActiveSession } from "../components/focus/ActiveSession";
import {
  SessionConfigPanel,
  type SessionConfig,
} from "../components/focus/SessionConfigPanel";

export type { FocusSession };

const DEFAULT_CONFIG: SessionConfig = {
  focusDuration: 25,
  restDuration: 5,
  cycles: 2,
};

const FocusSessionView = () => {
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const wasActiveRef = useRef(false);

  // Load session from storage on mount
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    getFocusSession().then((s) => {
      if (!s) return;
      setSession(s);
      wasActiveRef.current = s.isActive;
      if (s.isActive) {
        setConfig({
          focusDuration: s.focusDuration,
          restDuration: s.restDuration,
          cycles: s.totalCycles,
        });
      }
    });
  }, []);

  // Listen for phase transitions triggered by background alarms
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (!changes[STORAGE_KEYS.FOCUS_SESSION]) return;

      const next = changes[STORAGE_KEYS.FOCUS_SESSION].newValue as FocusSession;
      setSession(next);

      if (wasActiveRef.current && !next.isActive) {
        setShowComplete(true);
        setTimeout(() => setShowComplete(false), 4000);
      }
      wasActiveRef.current = next.isActive;
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!session?.isActive) {
      setTimeLeft(0);
      return;
    }

    const tick = () =>
      setTimeLeft(Math.max(0, session.phaseEndTime - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [session]);

  const handleStart = () => {
    const newSession: FocusSession = {
      isActive: true,
      focusDuration: config.focusDuration,
      restDuration: config.restDuration,
      totalCycles: config.cycles,
      currentCycle: 1,
      phase: "focus",
      phaseEndTime: Date.now() + config.focusDuration * 60 * 1000,
    };

    setSession(newSession);
    wasActiveRef.current = true;

    if (typeof chrome !== "undefined" && chrome.storage) {
      setFocusSession(newSession);
      if (chrome.alarms) {
        chrome.alarms.clear(ALARM_NAMES.FOCUS_PHASE_END);
        chrome.alarms.clear(ALARM_NAMES.REST_PHASE_END);
        chrome.alarms.create(ALARM_NAMES.FOCUS_PHASE_END, {
          delayInMinutes: config.focusDuration,
        });
      }
    }
  };

  const handleStop = () => {
    if (!session) return;

    const stopped: FocusSession = { ...session, isActive: false };
    setSession(stopped);
    wasActiveRef.current = false;

    if (typeof chrome !== "undefined" && chrome.storage) {
      setFocusSession(stopped);
      if (chrome.alarms) {
        chrome.alarms.clear(ALARM_NAMES.FOCUS_PHASE_END);
        chrome.alarms.clear(ALARM_NAMES.REST_PHASE_END);
      }
    }
  };

  const handleAdjust = (
    key: keyof SessionConfig,
    delta: number,
    min: number,
    max: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: Math.min(max, Math.max(min, prev[key] + delta)),
    }));
  };

  if (session?.isActive) {
    return (
      <ActiveSession
        session={session}
        timeLeft={timeLeft}
        isFocus={session.phase === "focus"}
        onStop={handleStop}
      />
    );
  }

  const totalMinutes =
    config.focusDuration * config.cycles +
    config.restDuration * (config.cycles - 1);

  return (
    <SessionConfigPanel
      config={config}
      showComplete={showComplete}
      totalMinutes={totalMinutes}
      onAdjust={handleAdjust}
      onStart={handleStart}
    />
  );
};

export default FocusSessionView;
