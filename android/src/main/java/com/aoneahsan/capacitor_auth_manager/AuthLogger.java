package com.aoneahsan.capacitor_auth_manager;

import android.util.Log;

public class AuthLogger {
    private static final String PREFIX = "CapacitorAuthManager";
    
    public enum LogLevel {
        DEBUG(0, "D"),
        INFO(1, "I"),
        WARN(2, "W"),
        ERROR(3, "E");
        
        private final int value;
        private final String tag;
        
        LogLevel(int value, String tag) {
            this.value = value;
            this.tag = tag;
        }
        
        public int getValue() {
            return value;
        }
        
        public String getTag() {
            return tag;
        }
    }
    
    private boolean isEnabled = false;
    private LogLevel logLevel = LogLevel.INFO;
    private final String tag;
    
    public AuthLogger(String tag) {
        this.tag = tag != null ? tag : PREFIX;
    }
    
    public void setEnabled(boolean enabled) {
        this.isEnabled = enabled;
    }
    
    public void setLogLevel(String level) {
        if (level == null) return;
        
        switch (level.toLowerCase()) {
            case "debug":
                this.logLevel = LogLevel.DEBUG;
                break;
            case "info":
                this.logLevel = LogLevel.INFO;
                break;
            case "warn":
                this.logLevel = LogLevel.WARN;
                break;
            case "error":
                this.logLevel = LogLevel.ERROR;
                break;
            default:
                this.logLevel = LogLevel.INFO;
        }
    }
    
    public void debug(String message, Object... args) {
        log(LogLevel.DEBUG, message, args);
    }
    
    public void info(String message, Object... args) {
        log(LogLevel.INFO, message, args);
    }
    
    public void warn(String message, Object... args) {
        log(LogLevel.WARN, message, args);
    }
    
    public void error(String message, Throwable throwable) {
        if (!isEnabled || LogLevel.ERROR.getValue() < logLevel.getValue()) {
            return;
        }
        
        if (throwable != null) {
            Log.e(tag, formatMessage(message), throwable);
        } else {
            Log.e(tag, formatMessage(message));
        }
    }
    
    private void log(LogLevel level, String message, Object... args) {
        if (!isEnabled || level.getValue() < logLevel.getValue()) {
            return;
        }
        
        String formattedMessage = formatMessage(message);
        if (args.length > 0) {
            formattedMessage = String.format(formattedMessage, args);
        }
        
        switch (level) {
            case DEBUG:
                Log.d(tag, formattedMessage);
                break;
            case INFO:
                Log.i(tag, formattedMessage);
                break;
            case WARN:
                Log.w(tag, formattedMessage);
                break;
            case ERROR:
                Log.e(tag, formattedMessage);
                break;
        }
    }
    
    private String formatMessage(String message) {
        return "[" + PREFIX + "] " + message;
    }
}