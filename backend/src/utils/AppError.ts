/**
 * Custom application error class for consistent error handling.
 * Replaces raw { status, message } throws throughout the codebase.
 */
export class AppError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
