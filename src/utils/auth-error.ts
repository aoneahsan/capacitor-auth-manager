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
    this.details = AuthError.sanitizeDetails(details);

    // Maintains proper stack trace for where our error was thrown (only available on V8 engines:
    // Node.js and Chromium). Typed locally so the package does not depend on @types/node globals.
    const ErrorCtor = Error as ErrorConstructor & {
      captureStackTrace?(
        targetObject: object,
        constructorOpt?: new (...args: never[]) => unknown
      ): void;
    };
    if (ErrorCtor.captureStackTrace) {
      ErrorCtor.captureStackTrace(this, AuthError);
    }
  }

  private static readonly SENSITIVE_KEY =
    /(token|secret|password|authorization|code_verifier|client_secret|credential|api[-_]?key|cookie)/i;

  /**
   * Produces a safe, shallow `details` object: redacts sensitive keys and keeps only JSON-safe
   * primitives. Prevents tokens/PII embedded in a raw error or token-endpoint response body from
   * being captured into AuthError.details (and thus logged or serialized via toJSON()).
   */
  static sanitizeDetails(input?: unknown): Record<string, unknown> | undefined {
    if (input === null || typeof input !== 'object') {
      return undefined;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (AuthError.SENSITIVE_KEY.test(key)) {
        out[key] = '[redacted]';
      } else if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        out[key] = value;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  static fromError(error: unknown, provider?: AuthProvider): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    let code = AuthErrorCode.INTERNAL_ERROR;
    let message = 'An unknown error occurred';
    const details: Record<string, unknown> | undefined = error as Record<
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
