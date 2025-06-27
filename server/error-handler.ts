import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface ErrorReport {
  id: string;
  userId?: number;
  sessionId?: number;
  forwardingPairId?: number;
  errorType: 'telegram_api' | 'database' | 'payment' | 'forwarding' | 'authentication' | 'validation' | 'system';
  errorCode: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
  autoRecoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReports: Map<string, ErrorReport> = new Map();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleError(error: Error, context: {
    userId?: number;
    sessionId?: number;
    forwardingPairId?: number;
    request?: Request;
    errorType?: ErrorReport['errorType'];
  }): Promise<string> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorReport: ErrorReport = {
      id: errorId,
      userId: context.userId,
      sessionId: context.sessionId,
      forwardingPairId: context.forwardingPairId,
      errorType: context.errorType || this.classifyError(error),
      errorCode: this.generateErrorCode(error),
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        userAgent: context.request?.headers['user-agent'],
        ip: context.request?.ip,
        url: context.request?.url,
        method: context.request?.method,
      },
      severity: this.determineSeverity(error, context),
      timestamp: new Date(),
      resolved: false,
      autoRecoverable: this.isAutoRecoverable(error),
    };

    // Store error report
    this.errorReports.set(errorId, errorReport);

    // Log to activity if user context available
    if (context.userId) {
      try {
        await storage.createActivityLog({
          userId: context.userId,
          type: 'error',
          action: 'error_occurred',
          message: `Error occurred: ${error.message}`,
          details: `Error ID: ${errorId}`,
          telegramSessionId: context.sessionId,
          forwardingPairId: context.forwardingPairId,
          metadata: {
            errorId,
            errorType: errorReport.errorType,
            severity: errorReport.severity,
            autoRecoverable: errorReport.autoRecoverable,
          },
        });
      } catch (logError) {
        console.error('Failed to log error to activity:', logError);
      }
    }

    // Log to console with structured format
    console.error(`[ERROR ${errorId}] ${errorReport.errorType.toUpperCase()}:`, {
      message: error.message,
      severity: errorReport.severity,
      userId: context.userId,
      sessionId: context.sessionId,
      forwardingPairId: context.forwardingPairId,
      autoRecoverable: errorReport.autoRecoverable,
    });

    // Attempt auto-recovery if possible
    if (errorReport.autoRecoverable) {
      await this.attemptAutoRecovery(errorReport);
    }

    // Send notifications for critical errors
    if (errorReport.severity === 'critical') {
      await this.notifyAdmins(errorReport);
    }

    return errorId;
  }

  private classifyError(error: Error): ErrorReport['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('telegram') || message.includes('api')) {
      return 'telegram_api';
    }
    if (message.includes('database') || message.includes('sql')) {
      return 'database';
    }
    if (message.includes('payment') || message.includes('paypal')) {
      return 'payment';
    }
    if (message.includes('forward') || message.includes('message')) {
      return 'forwarding';
    }
    if (message.includes('auth') || message.includes('token')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'system';
  }

  private generateErrorCode(error: Error): string {
    const hash = error.message.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `E${Math.abs(hash).toString(36).toUpperCase().substr(0, 8)}`;
  }

  private determineSeverity(error: Error, context: any): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    // Critical errors
    if (message.includes('database connection') || 
        message.includes('payment failed') ||
        message.includes('session expired') ||
        message.includes('unauthorized')) {
      return 'critical';
    }
    
    // High severity
    if (message.includes('telegram api') ||
        message.includes('forwarding failed') ||
        message.includes('authentication')) {
      return 'high';
    }
    
    // Medium severity
    if (message.includes('validation') ||
        message.includes('timeout') ||
        message.includes('rate limit')) {
      return 'medium';
    }
    
    return 'low';
  }

  private isAutoRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Auto-recoverable errors
    return message.includes('timeout') ||
           message.includes('rate limit') ||
           message.includes('network') ||
           message.includes('connection reset') ||
           message.includes('temporary');
  }

  private async attemptAutoRecovery(errorReport: ErrorReport): Promise<void> {
    try {
      console.log(`[AUTO RECOVERY] Attempting recovery for error ${errorReport.id}`);
      
      switch (errorReport.errorType) {
        case 'telegram_api':
          await this.recoverTelegramError(errorReport);
          break;
        case 'database':
          await this.recoverDatabaseError(errorReport);
          break;
        case 'forwarding':
          await this.recoverForwardingError(errorReport);
          break;
        default:
          console.log(`No auto-recovery method for error type: ${errorReport.errorType}`);
      }
    } catch (recoveryError) {
      console.error(`Auto-recovery failed for error ${errorReport.id}:`, recoveryError);
    }
  }

  private async recoverTelegramError(errorReport: ErrorReport): Promise<void> {
    if (errorReport.sessionId) {
      // Attempt to reconnect Telegram session
      console.log(`Attempting to recover Telegram session ${errorReport.sessionId}`);
      // Implementation would trigger session reconnection
    }
  }

  private async recoverDatabaseError(errorReport: ErrorReport): Promise<void> {
    // Attempt database reconnection
    console.log('Attempting database reconnection...');
    // Implementation would trigger database reconnection
  }

  private async recoverForwardingError(errorReport: ErrorReport): Promise<void> {
    if (errorReport.forwardingPairId) {
      // Retry forwarding operation
      console.log(`Retrying forwarding for pair ${errorReport.forwardingPairId}`);
      // Implementation would retry the forwarding operation
    }
  }

  private async notifyAdmins(errorReport: ErrorReport): Promise<void> {
    // Send notification to administrators
    console.log(`[CRITICAL ERROR] ${errorReport.id}: ${errorReport.message}`);
    // Implementation would send email/Telegram notification to admins
  }

  async resolveError(errorId: string, resolution: string, resolvedBy?: number): Promise<boolean> {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {
      return false;
    }

    errorReport.resolved = true;
    errorReport.resolution = resolution;
    errorReport.resolvedAt = new Date();

    // Log resolution
    if (errorReport.userId) {
      try {
        await storage.createActivityLog({
          userId: errorReport.userId,
          type: 'error_resolution',
          action: 'error_resolved',
          message: `Error resolved: ${errorReport.message}`,
          details: resolution,
          telegramSessionId: errorReport.sessionId,
          forwardingPairId: errorReport.forwardingPairId,
          metadata: {
            errorId,
            resolvedBy,
            resolution,
          },
        });
      } catch (logError) {
        console.error('Failed to log error resolution:', logError);
      }
    }

    console.log(`[RESOLVED] Error ${errorId} resolved: ${resolution}`);
    return true;
  }

  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  getErrorReports(filters?: {
    userId?: number;
    severity?: ErrorReport['severity'];
    errorType?: ErrorReport['errorType'];
    resolved?: boolean;
    limit?: number;
  }): ErrorReport[] {
    let reports = Array.from(this.errorReports.values());

    if (filters) {
      if (filters.userId) {
        reports = reports.filter(r => r.userId === filters.userId);
      }
      if (filters.severity) {
        reports = reports.filter(r => r.severity === filters.severity);
      }
      if (filters.errorType) {
        reports = reports.filter(r => r.errorType === filters.errorType);
      }
      if (filters.resolved !== undefined) {
        reports = reports.filter(r => r.resolved === filters.resolved);
      }
      if (filters.limit) {
        reports = reports.slice(0, filters.limit);
      }
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getErrorStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoRecoverable: number;
  } {
    const reports = Array.from(this.errorReports.values());
    
    return {
      total: reports.length,
      resolved: reports.filter(r => r.resolved).length,
      unresolved: reports.filter(r => !r.resolved).length,
      critical: reports.filter(r => r.severity === 'critical').length,
      high: reports.filter(r => r.severity === 'high').length,
      medium: reports.filter(r => r.severity === 'medium').length,
      low: reports.filter(r => r.severity === 'low').length,
      autoRecoverable: reports.filter(r => r.autoRecoverable).length,
    };
  }

  // Express middleware for error handling
  middleware() {
    return async (error: Error, req: Request, res: Response, next: NextFunction) => {
      const errorId = await this.handleError(error, {
        userId: (req as any).user?.id,
        request: req,
      });

      res.status(500).json({
        error: true,
        message: 'An error occurred while processing your request',
        errorId,
        timestamp: new Date().toISOString(),
      });
    };
  }
}

export const errorHandler = ErrorHandler.getInstance();