/**
 * Logging Utility
 * Structured logging for API requests, errors, and events
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format log message with context
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    return logData;
  }

  /**
   * Log debug messages (only in development)
   */
  private prefix(emoji: string): string {
    return this.isDevelopment ? emoji : '';
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const log = this.formatLog('debug', message, context);
      console.debug(this.prefix('🔍'), message, context || '');
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext) {
    const log = this.formatLog('info', message, context);
    console.log(this.prefix('ℹ️'), message, context || '');
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    const log = this.formatLog('warn', message, context);
    console.warn(this.prefix('⚠️'), message, context || '');
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const log = this.formatLog('error', message, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    });

    console.error(this.prefix('❌'), message, log);

    // In production, send to error tracking service
    if (this.isProduction) {
      // TODO: Send to error tracking service when implemented
      // this.sendToErrorTracking(log);
    }
  }

  /**
   * Log API request
   */
  request(method: string, endpoint: string, context?: LogContext) {
    this.info(`${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      type: 'request',
    });
  }

  /**
   * Log API response
   */
  response(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this[level](`${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
      type: 'response',
    });
  }

  /**
   * Log cache hit/miss
   */
  cache(action: 'hit' | 'miss' | 'set' | 'del', key: string, context?: LogContext) {
    this.debug(`Cache ${action}: ${key}`, {
      ...context,
      cacheAction: action,
      cacheKey: key,
    });
  }

  /**
   * Log rate limit event
   */
  rateLimit(
    identifier: string,
    type: string,
    allowed: boolean,
    context?: LogContext
  ) {
    const message = `Rate limit ${allowed ? 'passed' : 'exceeded'} for ${identifier} (${type})`;
    
    if (allowed) {
      this.debug(message, context);
    } else {
      this.warn(message, context);
    }
  }

  /**
   * Log database operation
   */
  database(operation: string, collection: string, context?: LogContext) {
    this.debug(`DB ${operation}: ${collection}`, {
      ...context,
      dbOperation: operation,
      dbCollection: collection,
    });
  }

  /**
   * Log AI generation event
   */
  aiGeneration(
    type: string,
    model: string,
    tokens?: number,
    context?: LogContext
  ) {
    this.info(`AI Generation: ${type} with ${model}`, {
      ...context,
      aiType: type,
      aiModel: model,
      aiTokens: tokens,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Middleware wrapper for API routes with logging
 */
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const request = args[0] as Request;
    const method = request.method;

    // Generate request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log request
    logger.request(method, endpoint, { requestId });

    try {
      // Execute handler
      const response = await handler(...args);
      
      // Log response
      const duration = Date.now() - startTime;
      logger.response(method, endpoint, response.status, duration, { requestId });

      return response;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      logger.error(`${method} ${endpoint} failed`, error, {
        requestId,
        duration,
      });

      throw error;
    }
  }) as T;
}
