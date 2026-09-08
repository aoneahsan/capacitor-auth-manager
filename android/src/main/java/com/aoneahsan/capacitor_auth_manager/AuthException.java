package com.aoneahsan.capacitor_auth_manager;

/**
 * An {@link Exception} that carries a stable {@link AuthErrorCodes} value.
 *
 * <p>Before this existed every native failure crossed the bridge as a bare message and the JS side
 * guessed the code by substring-matching ({@code AuthError.fromError}), so anything that did not
 * literally contain "cancelled"/"network"/"timeout" surfaced as {@code auth/internal-error}. The
 * plugin now rejects with {@code call.reject(message, code)}; Capacitor puts that code on the
 * rejected error and {@code AuthError.fromError} adopts it verbatim.
 */
public class AuthException extends Exception {

    private final String code;

    public AuthException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AuthException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /** The code carried by {@code error}, or {@code fallback} for a plain exception. */
    public static String codeOf(Throwable error, String fallback) {
        return error instanceof AuthException ? ((AuthException) error).getCode() : fallback;
    }
}
