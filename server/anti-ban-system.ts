import { storage } from "./storage";
import { errorHandler } from "./error-handler";
import { queueManager } from "./queue-manager";
import { sessionManager } from "./session-manager";

export interface RateLimitStatus {
  userId: number;
  sessionId: number;
  currentLevel: 'safe' | 'warning' | 'critical' | 'banned';
  messagesPerMinute: number;
  messagesPerHour: number;
  lastMessageTime: Date;
  throttleMultiplier: number;
  warningCount: number;
  lastWarningTime?: Date;
  detectedPatterns: string[];
}

export interface TelegramError {
  code: number;
  message: string;
  timestamp: Date;
  sessionId: number;
  isRateLimitRelated: boolean;
}

export interface SafetySettings {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  warningThreshold: number;
  criticalThreshold: number;
  autoThrottleEnabled: boolean;
  emergencyStopEnabled: boolean;
  cooldownPeriod: number; // minutes
  adaptiveThrottling: boolean;
}

export class AntiBanSystem {
  private static instance: AntiBanSystem;
  private rateLimitStatuses: Map<number, RateLimitStatus> = new Map();
  private errorPatterns: Map<number, TelegramError[]> = new Map();
  private isMonitoring = false;

  private readonly DEFAULT_SAFETY_SETTINGS: SafetySettings = {
    maxMessagesPerMinute: 20,
    maxMessagesPerHour: 300,
    warningThreshold: 0.8, // 80% of limit
    criticalThreshold: 0.95, // 95% of limit
    autoThrottleEnabled: true,
    emergencyStopEnabled: true,
    cooldownPeriod: 30,
    adaptiveThrottling: true,
  };

  private readonly RATE_LIMIT_ERROR_CODES = [
    420, // FLOOD_WAIT
    429, // Too Many Requests
    400, // BAD_REQUEST (sometimes rate limit related)
  ];

  private readonly BAN_INDICATORS = [
    'FLOOD_WAIT',
    'Too Many Requests',
    'rate limit',
    'temporarily banned',
    'USER_DEACTIVATED',
    'USER_BLOCKED',
    'PEER_FLOOD',
  ];

  static getInstance(): AntiBanSystem {
    if (!AntiBanSystem.instance) {
      AntiBanSystem.instance = new AntiBanSystem();
    }
    return AntiBanSystem.instance;
  }

  async initialize(): Promise<void> {
    this.startMonitoring();
    await this.loadExistingStatuses();
  }

  private async loadExistingStatuses(): Promise<void> {
    try {
      const sessions = await storage.getAllTelegramSessions();
      for (const session of sessions) {
        if (session.isActive) {
          this.rateLimitStatuses.set(session.id, {
            userId: session.userId,
            sessionId: session.id,
            currentLevel: 'safe',
            messagesPerMinute: 0,
            messagesPerHour: 0,
            lastMessageTime: new Date(),
            throttleMultiplier: 1.0,
            warningCount: 0,
            detectedPatterns: [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading existing rate limit statuses:', error);
    }
  }

  async recordMessageSent(sessionId: number, userId: number): Promise<void> {
    const status = this.getOrCreateStatus(sessionId, userId);
    const now = new Date();

    // Update message counters
    status.messagesPerMinute++;
    status.messagesPerHour++;
    status.lastMessageTime = now;

    // Check if we need to update the rate limit level
    await this.updateRateLimitLevel(status);

    // Apply automatic throttling if needed
    if (this.DEFAULT_SAFETY_SETTINGS.autoThrottleEnabled) {
      await this.applyAutoThrottling(status);
    }
  }

  async recordTelegramError(sessionId: number, error: TelegramError): Promise<void> {
    const errors = this.errorPatterns.get(sessionId) || [];
    errors.push(error);

    // Keep only last 100 errors per session
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }

    this.errorPatterns.set(sessionId, errors);

    // Analyze error for rate limit indicators
    if (this.isRateLimitError(error)) {
      await this.handleRateLimitError(sessionId, error);
    }

    // Check for ban indicators
    if (this.isBanIndicator(error)) {
      await this.handlePotentialBan(sessionId, error);
    }
  }

  private async updateRateLimitLevel(status: RateLimitStatus): Promise<void> {
    const settings = this.DEFAULT_SAFETY_SETTINGS;
    const minuteUsage = status.messagesPerMinute / settings.maxMessagesPerMinute;
    const hourUsage = status.messagesPerHour / settings.maxMessagesPerHour;
    const maxUsage = Math.max(minuteUsage, hourUsage);

    const previousLevel = status.currentLevel;

    if (maxUsage >= settings.criticalThreshold) {
      status.currentLevel = 'critical';
    } else if (maxUsage >= settings.warningThreshold) {
      status.currentLevel = 'warning';
    } else {
      status.currentLevel = 'safe';
    }

    // If level changed to warning or critical, increment warning count
    if (status.currentLevel !== 'safe' && previousLevel === 'safe') {
      status.warningCount++;
      status.lastWarningTime = new Date();

      // Send alert to admin
      await this.sendRateLimitAlert(status);
    }

    // Log level change
    if (previousLevel !== status.currentLevel) {
      await storage.createActivityLog({
        userId: status.userId,
        type: 'rate_limit_change',
        action: 'level_changed',
        message: `Rate limit level changed from ${previousLevel} to ${status.currentLevel}`,
        details: `Messages per minute: ${status.messagesPerMinute}, per hour: ${status.messagesPerHour}`,
        metadata: {
          sessionId: status.sessionId,
          previousLevel,
          newLevel: status.currentLevel,
          messagesPerMinute: status.messagesPerMinute,
          messagesPerHour: status.messagesPerHour,
        },
      });
    }
  }

  private async applyAutoThrottling(status: RateLimitStatus): Promise<void> {
    let newThrottleMultiplier = 1.0;

    switch (status.currentLevel) {
      case 'warning':
        newThrottleMultiplier = 2.0; // Double the delay
        break;
      case 'critical':
        newThrottleMultiplier = 5.0; // 5x the delay
        break;
      case 'banned':
        newThrottleMultiplier = 0; // Stop completely
        break;
    }

    // Apply adaptive throttling based on error patterns
    if (this.DEFAULT_SAFETY_SETTINGS.adaptiveThrottling) {
      const recentErrors = this.getRecentErrors(status.sessionId, 10); // Last 10 minutes
      const rateLimitErrors = recentErrors.filter(e => this.isRateLimitError(e));
      
      if (rateLimitErrors.length > 0) {
        newThrottleMultiplier = Math.max(newThrottleMultiplier, rateLimitErrors.length * 1.5);
      }
    }

    if (newThrottleMultiplier !== status.throttleMultiplier) {
      status.throttleMultiplier = newThrottleMultiplier;

      // Update queue manager with new throttle settings
      queueManager.setSessionThrottle(status.sessionId, newThrottleMultiplier);

      await storage.createActivityLog({
        userId: status.userId,
        type: 'auto_throttle',
        action: 'throttle_applied',
        message: `Auto-throttling applied: ${newThrottleMultiplier}x delay`,
        details: `Session ${status.sessionId} throttled due to ${status.currentLevel} rate limit level`,
        metadata: {
          sessionId: status.sessionId,
          throttleMultiplier: newThrottleMultiplier,
          rateLimitLevel: status.currentLevel,
        },
      });
    }
  }

  private async handleRateLimitError(sessionId: number, error: TelegramError): Promise<void> {
    const status = this.rateLimitStatuses.get(sessionId);
    if (!status) return;

    // Immediately escalate to critical level
    status.currentLevel = 'critical';
    status.warningCount++;

    // Extract wait time from FLOOD_WAIT error if available
    const waitTimeMatch = error.message.match(/FLOOD_WAIT_(\d+)/);
    if (waitTimeMatch) {
      const waitTime = parseInt(waitTimeMatch[1]);
      
      // Pause the session for the required wait time
      await this.pauseSessionTemporarily(sessionId, waitTime);
    }

    // Apply emergency throttling
    status.throttleMultiplier = 10.0; // Very aggressive throttling
    queueManager.setSessionThrottle(sessionId, status.throttleMultiplier);

    await this.sendEmergencyAlert(status, error);
  }

  private async handlePotentialBan(sessionId: number, error: TelegramError): Promise<void> {
    const status = this.rateLimitStatuses.get(sessionId);
    if (!status) return;

    status.currentLevel = 'banned';
    status.detectedPatterns.push(error.message);

    // Emergency stop if enabled
    if (this.DEFAULT_SAFETY_SETTINGS.emergencyStopEnabled) {
      await this.emergencyStopSession(sessionId);
    }

    await this.sendBanAlert(status, error);
  }

  private async pauseSessionTemporarily(sessionId: number, waitTimeSeconds: number): Promise<void> {
    try {
      // Pause all forwarding pairs for this session
      const pairs = await storage.getForwardingPairsBySession(sessionId);
      for (const pair of pairs) {
        await storage.pauseForwardingPair(pair.id, pair.userId);
      }

      // Schedule automatic resume
      setTimeout(async () => {
        try {
          for (const pair of pairs) {
            await storage.resumeForwardingPair(pair.id, pair.userId);
          }
        } catch (error) {
          console.error('Error resuming pairs after flood wait:', error);
        }
      }, waitTimeSeconds * 1000);

      await storage.createActivityLog({
        userId: (await storage.getTelegramSessionById(sessionId))?.userId || 0,
        type: 'flood_wait',
        action: 'session_paused',
        message: `Session paused for ${waitTimeSeconds} seconds due to FLOOD_WAIT`,
        details: `Automatic resume scheduled`,
        metadata: { sessionId, waitTimeSeconds },
      });
    } catch (error) {
      console.error('Error pausing session temporarily:', error);
    }
  }

  private async emergencyStopSession(sessionId: number): Promise<void> {
    try {
      // Stop all forwarding pairs for this session
      const pairs = await storage.getForwardingPairsBySession(sessionId);
      for (const pair of pairs) {
        await storage.updateForwardingPair(pair.id, pair.userId, { isActive: false });
      }

      // Mark session as unhealthy
      sessionManager.markSessionUnhealthy(sessionId, 'Emergency stop due to potential ban');

      await storage.createActivityLog({
        userId: (await storage.getTelegramSessionById(sessionId))?.userId || 0,
        type: 'emergency_stop',
        action: 'session_stopped',
        message: `Session emergency stopped due to potential ban indicators`,
        details: `Manual intervention required`,
        metadata: { sessionId },
      });
    } catch (error) {
      console.error('Error in emergency stop:', error);
    }
  }

  private getOrCreateStatus(sessionId: number, userId: number): RateLimitStatus {
    if (!this.rateLimitStatuses.has(sessionId)) {
      this.rateLimitStatuses.set(sessionId, {
        userId,
        sessionId,
        currentLevel: 'safe',
        messagesPerMinute: 0,
        messagesPerHour: 0,
        lastMessageTime: new Date(),
        throttleMultiplier: 1.0,
        warningCount: 0,
        detectedPatterns: [],
      });
    }
    return this.rateLimitStatuses.get(sessionId)!;
  }

  private isRateLimitError(error: TelegramError): boolean {
    return this.RATE_LIMIT_ERROR_CODES.includes(error.code) ||
           this.BAN_INDICATORS.some(indicator => 
             error.message.toLowerCase().includes(indicator.toLowerCase())
           );
  }

  private isBanIndicator(error: TelegramError): boolean {
    const banPatterns = [
      'USER_DEACTIVATED',
      'USER_BLOCKED',
      'PEER_FLOOD',
      'temporarily banned',
      'account restricted'
    ];

    return banPatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private getRecentErrors(sessionId: number, minutesBack: number): TelegramError[] {
    const errors = this.errorPatterns.get(sessionId) || [];
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    return errors.filter(error => error.timestamp > cutoff);
  }

  private async sendRateLimitAlert(status: RateLimitStatus): Promise<void> {
    await errorHandler.handleError(
      new Error(`Rate limit ${status.currentLevel} level reached`),
      {
        userId: status.userId,
        sessionId: status.sessionId,
        errorType: 'rate_limit',
        severity: status.currentLevel === 'critical' ? 'high' : 'medium',
        context: {
          messagesPerMinute: status.messagesPerMinute,
          messagesPerHour: status.messagesPerHour,
          throttleMultiplier: status.throttleMultiplier,
        },
      }
    );
  }

  private async sendEmergencyAlert(status: RateLimitStatus, error: TelegramError): Promise<void> {
    await errorHandler.handleError(
      new Error(`Emergency rate limit response triggered: ${error.message}`),
      {
        userId: status.userId,
        sessionId: status.sessionId,
        errorType: 'telegram_api',
        severity: 'critical',
        context: {
          telegramError: error,
          rateLimitStatus: status,
        },
      }
    );
  }

  private async sendBanAlert(status: RateLimitStatus, error: TelegramError): Promise<void> {
    await errorHandler.handleError(
      new Error(`Potential ban detected: ${error.message}`),
      {
        userId: status.userId,
        sessionId: status.sessionId,
        errorType: 'telegram_api',
        severity: 'critical',
        context: {
          telegramError: error,
          detectedPatterns: status.detectedPatterns,
        },
      }
    );
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Reset counters every minute
    setInterval(() => {
      this.rateLimitStatuses.forEach(status => {
        status.messagesPerMinute = 0;
      });
    }, 60000);

    // Reset hour counters every hour
    setInterval(() => {
      this.rateLimitStatuses.forEach(status => {
        status.messagesPerHour = 0;
      });
    }, 3600000);

    // Clean up old error patterns every hour
    setInterval(() => {
      this.errorPatterns.forEach((errors, sessionId) => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        const recentErrors = errors.filter(error => error.timestamp > cutoff);
        this.errorPatterns.set(sessionId, recentErrors);
      });
    }, 3600000);
  }

  // Public API methods
  async getSessionStatus(sessionId: number): Promise<RateLimitStatus | null> {
    return this.rateLimitStatuses.get(sessionId) || null;
  }

  async getAllStatuses(): Promise<RateLimitStatus[]> {
    return Array.from(this.rateLimitStatuses.values());
  }

  async updateSafetySettings(settings: Partial<SafetySettings>): Promise<void> {
    Object.assign(this.DEFAULT_SAFETY_SETTINGS, settings);
  }

  async resetSessionStatus(sessionId: number): Promise<void> {
    const status = this.rateLimitStatuses.get(sessionId);
    if (status) {
      status.currentLevel = 'safe';
      status.messagesPerMinute = 0;
      status.messagesPerHour = 0;
      status.throttleMultiplier = 1.0;
      status.warningCount = 0;
      status.detectedPatterns = [];

      queueManager.setSessionThrottle(sessionId, 1.0);
    }
  }

  async getSystemHealthReport(): Promise<{
    totalSessions: number;
    safeSessions: number;
    warningSessions: number;
    criticalSessions: number;
    bannedSessions: number;
    averageThrottle: number;
  }> {
    const statuses = Array.from(this.rateLimitStatuses.values());
    
    return {
      totalSessions: statuses.length,
      safeSessions: statuses.filter(s => s.currentLevel === 'safe').length,
      warningSessions: statuses.filter(s => s.currentLevel === 'warning').length,
      criticalSessions: statuses.filter(s => s.currentLevel === 'critical').length,
      bannedSessions: statuses.filter(s => s.currentLevel === 'banned').length,
      averageThrottle: statuses.reduce((sum, s) => sum + s.throttleMultiplier, 0) / statuses.length || 1,
    };
  }
}

export const antiBanSystem = AntiBanSystem.getInstance();