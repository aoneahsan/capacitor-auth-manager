import { AuthError as IAuthError, AuthErrorCode, AuthProvider } from '../definitions';

export class AuthError extends Error implements IAuthError {
  code: string;
  details?: any;
  provider?: AuthProvider;

  constructor(code: string, message: string, provider?: AuthProvider, details?: any) {
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

  static fromError(error: any, provider?: AuthProvider): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    let code = AuthErrorCode.INTERNAL_ERROR;
    let message = 'An unknown error occurred';
    let details = error;

    if (error instanceof Error) {
      message = error.message;
      
      // Try to map common error patterns to specific error codes
      if (error.message.includes('network')) {
        code = AuthErrorCode.NETWORK_ERROR;
      } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
        code = AuthErrorCode.USER_CANCELLED;
      } else if (error.message.includes('timeout')) {
        code = AuthErrorCode.NETWORK_ERROR;
      }
    }

    // Handle provider-specific error codes
    if (error?.code) {
      code = error.code;
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

export function isAuthError(error: any): error is AuthError {
  return error instanceof AuthError || (error?.name === 'AuthError' && error?.code);
}