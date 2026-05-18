import type { ErrorResponse, SuccessResponse } from "../types";

export const ok = <T>(data: T): SuccessResponse<T> => ({ ok: true, data });
export const err = (error: string): ErrorResponse => ({ ok: false, error });
