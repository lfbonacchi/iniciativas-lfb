export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<T = never>(code: ErrorCode, message: string): Result<T> {
  return { success: false, error: { code, message } };
}
