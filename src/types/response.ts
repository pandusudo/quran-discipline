export type SuccessResponse<T = unknown> = { ok: true; data: T };
export type ErrorResponse = { ok: false; error: string };
export type ExtensionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
