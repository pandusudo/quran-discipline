export type BlockContext = "standard" | "focus";

export type GetPomodoroSessionMessage = { type: "GET_POMODORO_SESSION" };

export type StartPomodoroSessionMessage = {
  type: "START_POMODORO_SESSION";
  payload: {
    listId: string;
    focusDuration: number;
    restDuration: number;
    totalCycles: number;
  };
};

export type StopPomodoroSessionMessage = { type: "STOP_POMODORO_SESSION" };
