import { storage } from "./storage";
import { telegramClient } from "./telegram-real";
import type { TelegramSession } from "@shared/schema";

export interface SessionHealthStatus {
  sessionId: number;
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  consecutiveFailures: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private healthStatuses: Map<number, SessionHealthStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize session manager
  async initialize(): Promise<void> {
    console.log('Initializing Session Manager...');
    
    // Load all active sessions
    await this.loadActiveSessions();
    
    // Start health check loop
    this.startHealthCheckLoop();
    
    console.log('Session Manager initialized successfully');
  }

  // Load all active sessions from database
  private async loadActiveSessions(): Promise<void> {
    try {
      // Get all users and their active sessions
      const sessions = await this.getAllActiveSessions();
      
      for (const session of sessions) {
        this.healthStatuses.set(session.id, {
          sessionId: session.id,
          isHealthy: session.isActive,
          lastCheck: session.lastHealthCheck || new Date(),
          errorCount: 0,
          consecutiveFailures: 0
        });
      }
      
      console.log(`Loaded ${sessions.length} active sessions`);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  }

  // Get all active sessions across all users
  private async getAllActiveSessions(): Promise<TelegramSession[]> {
    // In a real implementation, this would query all active sessions
    // For now, we'll simulate with a simple approach
    return [];
  }

  // Start periodic health checks
  private startHealthCheckLoop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  // Perform health checks on all active sessions
  private async performHealthChecks(): Promise<void> {
    const sessionIds = Array.from(this.healthStatuses.keys());
    
    console.log(`Performing health checks on ${sessionIds.length} sessions`);
    
    for (const sessionId of sessionIds) {
      await this.checkSessionHealth(sessionId);
    }
  }

  // Check health of a specific session
  async checkSessionHealth(sessionId: number): Promise<boolean> {
    const status = this.healthStatuses.get(sessionId);
    if (!status) {
      return false;
    }

    try {
      // Get session from database
      const session = await storage.getTelegramSession(sessionId, 0); // We'll need to track userId differently
      if (!session) {
        this.healthStatuses.delete(sessionId);
        return false;
      }

      // Check with Telegram client
      const isHealthy = await telegramClient.checkSessionHealth(sessionId, session.userId);
      
      // Update status
      status.isHealthy = isHealthy;
      status.lastCheck = new Date();
      
      if (isHealthy) {
        status.consecutiveFailures = 0;
      } else {
        status.errorCount++;
        status.consecutiveFailures++;
        
        // If too many consecutive failures, mark session as inactive
        if (status.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          await this.deactivateSession(sessionId, session.userId);
          this.healthStatuses.delete(sessionId);
          
          // Log activity
          await storage.createActivityLog({
            userId: session.userId,
            telegramSessionId: sessionId,
            type: 'session_deactivated',
            message: `Session ${session.accountName} deactivated due to consecutive failures`,
            metadata: { consecutiveFailures: status.consecutiveFailures }
          });
          
          return false;
        }
      }
      
      this.healthStatuses.set(sessionId, status);
      return isHealthy;
      
    } catch (error) {
      console.error(`Health check failed for session ${sessionId}:`, error);
      
      if (status) {
        status.errorCount++;
        status.consecutiveFailures++;
        status.isHealthy = false;
        status.lastCheck = new Date();
        this.healthStatuses.set(sessionId, status);
      }
      
      return false;
    }
  }

  // Add new session to monitoring
  async addSession(sessionId: number): Promise<void> {
    this.healthStatuses.set(sessionId, {
      sessionId,
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveFailures: 0
    });
    
    console.log(`Added session ${sessionId} to health monitoring`);
  }

  // Remove session from monitoring
  async removeSession(sessionId: number): Promise<void> {
    this.healthStatuses.delete(sessionId);
    console.log(`Removed session ${sessionId} from health monitoring`);
  }

  // Deactivate a session
  private async deactivateSession(sessionId: number, userId: number): Promise<void> {
    try {
      await storage.updateTelegramSession(sessionId, userId, {
        isActive: false,
        updatedAt: new Date()
      });
      
      await telegramClient.disconnectSession(sessionId, userId);
      
      console.log(`Deactivated session ${sessionId} for user ${userId}`);
    } catch (error) {
      console.error(`Failed to deactivate session ${sessionId}:`, error);
    }
  }

  // Get session health status
  getSessionHealth(sessionId: number): SessionHealthStatus | undefined {
    return this.healthStatuses.get(sessionId);
  }

  // Get all session health statuses
  getAllSessionHealths(): SessionHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  // Manually trigger health check for a session
  async triggerHealthCheck(sessionId: number): Promise<boolean> {
    return await this.checkSessionHealth(sessionId);
  }

  // Get session recovery suggestions
  getRecoveryActions(sessionId: number): string[] {
    const status = this.healthStatuses.get(sessionId);
    if (!status) {
      return ['Session not found'];
    }

    const actions: string[] = [];

    if (!status.isHealthy) {
      actions.push('Restart Telegram session');
      actions.push('Check internet connection');
      actions.push('Verify phone number is still active');
    }

    if (status.errorCount > 5) {
      actions.push('Consider re-authenticating with Telegram');
    }

    if (status.consecutiveFailures > 1) {
      actions.push('Check for Telegram API rate limits');
      actions.push('Verify account is not banned or restricted');
    }

    return actions.length > 0 ? actions : ['Session is healthy'];
  }

  // Shutdown session manager
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.healthStatuses.clear();
    console.log('Session Manager shutdown complete');
  }

  // Get session statistics
  getSessionStats(): {
    totalSessions: number;
    healthySessions: number;
    unhealthySessions: number;
    averageErrorRate: number;
  } {
    const statuses = Array.from(this.healthStatuses.values());
    const totalSessions = statuses.length;
    const healthySessions = statuses.filter(s => s.isHealthy).length;
    const unhealthySessions = totalSessions - healthySessions;
    
    const totalErrors = statuses.reduce((sum, s) => sum + s.errorCount, 0);
    const averageErrorRate = totalSessions > 0 ? totalErrors / totalSessions : 0;

    return {
      totalSessions,
      healthySessions,
      unhealthySessions,
      averageErrorRate
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();