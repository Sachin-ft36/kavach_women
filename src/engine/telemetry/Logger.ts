export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogPayload {
  message: string;
  context?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  deviceId?: string;
  tenantId?: string;
  error?: Error | any;
}

export class Logger {
  private static environment: string = import.meta.env.MODE || 'development';

  public static setEnvironment(env: string): void {
    this.environment = env;
  }

  /**
   * Primary logging function passing to console in dev, or telemetry adaptors in production
   */
  private static log(severity: LogSeverity, payload: LogPayload): void {
    const formattedLog = {
      severity,
      message: payload.message,
      context: payload.context || {},
      timestamp: payload.timestamp || Date.now(),
      userId: payload.userId,
      deviceId: payload.deviceId,
      tenantId: payload.tenantId,
      error: payload.error ? {
        name: payload.error.name,
        message: payload.error.message,
        stack: payload.error.stack,
      } : undefined,
    };

    if (this.environment === 'development') {
      const colorMap = {
        DEBUG: '\x1b[36m', // Cyan
        INFO: '\x1b[32m',  // Green
        WARN: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m', // Red
        CRITICAL: '\x1b[41m\x1b[37m', // Red bg, White text
      };
      const reset = '\x1b[0m';
      const color = colorMap[severity] || reset;

      console.log(
        `${color}[${severity}] [${new Date(formattedLog.timestamp).toISOString()}]${reset} ${formattedLog.message}`,
        Object.keys(formattedLog.context).length ? formattedLog.context : '',
        formattedLog.error ? formattedLog.error : ''
      );
    } else {
      // In production mode, forward to Cloud Monitoring, Sentry, or Crashlytics adapters
      // (Future: TelemetryService.send(formattedLog))
    }
  }

  public static debug(message: string, context?: Record<string, any>, extra?: Partial<LogPayload>): void {
    this.log('DEBUG', { message, context, ...extra });
  }

  public static info(message: string, context?: Record<string, any>, extra?: Partial<LogPayload>): void {
    this.log('INFO', { message, context, ...extra });
  }

  public static warn(message: string, context?: Record<string, any>, extra?: Partial<LogPayload>): void {
    this.log('WARN', { message, context, ...extra });
  }

  public static error(message: string, error?: Error | any, context?: Record<string, any>, extra?: Partial<LogPayload>): void {
    this.log('ERROR', { message, error, context, ...extra });
  }

  public static critical(message: string, error?: Error | any, context?: Record<string, any>, extra?: Partial<LogPayload>): void {
    this.log('CRITICAL', { message, error, context, ...extra });
  }
}
