import {
  AuthError as IAuthError,
  AuthErrorCode,
  AuthProvider,
} from '../definitions';

export class AuthError extends Error implements IAuthError {
  code: string;
  details?: Record<string, unknown>;
  provider?: AuthProvider;

  constructor(
    code: string,
    message: string,
    provider?: AuthProvider,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.provider = provider;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  static fromError(error: unknown, provider?: AuthProvider): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    let code = AuthErrorCode.INTERNAL_ERROR;
    let message = 'An unknown error occurred';
    let details: Record<string, unknown> | undefined = error as Record<
      string,
      unknown
    >;

    if (error instanceof Error) {
      message = error.message;

      // Try to map common error patterns to specific error codes
      if (error.message.includes('network')) {
        code = AuthErrorCode.NETWORK_ERROR;
      } else if (
        error.message.includes('cancelled') ||
        error.message.includes('canceled')
      ) {
        code = AuthErrorCode.USER_CANCELLED;
      } else if (error.message.includes('timeout')) {
        code = AuthErrorCode.NETWORK_ERROR;
      }
    }

    // Handle provider-specific error codes
    const errorObj = error as { code?: string };
    if (errorObj?.code) {
      // Check if the code is a valid AuthErrorCode
      if (
        Object.values(AuthErrorCode).includes(errorObj.code as AuthErrorCode)
      ) {
        code = errorObj.code as AuthErrorCode;
      }
    }

    return new AuthError(code, message, provider, details);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      provider: this.provider,
      details: this.details,
    };
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof AuthError ||
    (typeof error === 'object' &&
      error !== null &&
      (error as { name?: string }).name === 'AuthError' &&
      (error as { code?: string }).code !== undefined)
  );
}
