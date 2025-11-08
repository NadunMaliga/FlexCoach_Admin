/**
 * Centralized Logger Utility for FlexCoach Admin
 * 
 * Provides conditional logging that only outputs in development mode.
 * In production, errors can be sent to error tracking services.
 */

class Logger {
  /**
   * Log general information (only in development)
   */
  static log(message, data) {
    if (__DEV__) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Log warnings (only in development)
   */
  static warn(message, data) {
    if (__DEV__) {
      if (data !== undefined) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  }

  /**
   * Log errors (always logged, can be sent to tracking service)
   */
  static error(message, error) {
    if (__DEV__) {
      if (error !== undefined) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    } else {
      // TODO: Send to error tracking service (Sentry, etc.)
      // Example: Sentry.captureException(error, { extra: { message } });
    }
  }

  /**
   * Log debug information (only in development)
   */
  static debug(message, data) {
    if (__DEV__) {
      if (data !== undefined) {
        console.debug(message, data);
      } else {
        console.debug(message);
      }
    }
  }

  /**
   * Log with emoji prefix for better visibility
   */
  static success(message, data) {
    if (__DEV__) {
      const msg = `✅ ${message}`;
      if (data !== undefined) {
        console.log(msg, data);
      } else {
        console.log(msg);
      }
    }
  }

  static info(message, data) {
    if (__DEV__) {
      const msg = `ℹ️ ${message}`;
      if (data !== undefined) {
        console.log(msg, data);
      } else {
        console.log(msg);
      }
    }
  }

  static warning(message, data) {
    if (__DEV__) {
      const msg = `⚠️ ${message}`;
      if (data !== undefined) {
        console.warn(msg, data);
      } else {
        console.warn(msg);
      }
    }
  }

  static failure(message, error) {
    if (__DEV__) {
      const msg = `❌ ${message}`;
      if (error !== undefined) {
        console.error(msg, error);
      } else {
        console.error(msg);
      }
    } else {
      // TODO: Send to error tracking service
    }
  }
}

export default Logger;
