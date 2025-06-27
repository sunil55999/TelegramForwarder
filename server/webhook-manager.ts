import { storage } from "./storage";
import { errorHandler } from "./error-handler";

export interface WebhookConfig {
  id: number;
  userId: number;
  url: string;
  events: string[];
  isActive: boolean;
  secretKey: string;
  lastTriggered?: Date;
  failureCount: number;
  maxRetries: number;
  timeout: number;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: 'message_forwarded' | 'pair_created' | 'pair_paused' | 'pair_resumed' | 'error_occurred' | 'session_disconnected';
  userId: number;
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface ApiKey {
  id: number;
  userId: number;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  lastUsed?: Date;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private webhookQueue: WebhookEvent[] = [];
  private isProcessing = false;
  private apiKeyUsage: Map<string, { minute: number; hour: number; day: number; lastReset: Date }> = new Map();

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  constructor() {
    this.startProcessingLoop();
  }

  // Webhook Management
  async createWebhook(userId: number, config: Omit<WebhookConfig, 'id' | 'userId' | 'secretKey' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfig> {
    const secretKey = this.generateSecretKey();
    const webhook: Omit<WebhookConfig, 'id'> = {
      userId,
      ...config,
      secretKey,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await storage.createWebhook(webhook);
    return { ...webhook, id };
  }

  async updateWebhook(webhookId: number, userId: number, updates: Partial<WebhookConfig>): Promise<boolean> {
    return await storage.updateWebhook(webhookId, userId, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteWebhook(webhookId: number, userId: number): Promise<boolean> {
    return await storage.deleteWebhook(webhookId, userId);
  }

  async getUserWebhooks(userId: number): Promise<WebhookConfig[]> {
    return await storage.getUserWebhooks(userId);
  }

  async triggerWebhook(event: WebhookEvent): Promise<void> {
    this.webhookQueue.push(event);
  }

  private async processWebhookQueue(): Promise<void> {
    if (this.isProcessing || this.webhookQueue.length === 0) return;

    this.isProcessing = true;

    while (this.webhookQueue.length > 0) {
      const event = this.webhookQueue.shift()!;
      await this.processWebhookEvent(event);
    }

    this.isProcessing = false;
  }

  private async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      const webhooks = await storage.getUserWebhooks(event.userId);
      const activeWebhooks = webhooks.filter(w => 
        w.isActive && w.events.includes(event.type)
      );

      for (const webhook of activeWebhooks) {
        await this.sendWebhook(webhook, event);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  private async sendWebhook(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    try {
      const payload = {
        event: event.type,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        metadata: event.metadata,
      };

      const signature = this.generateSignature(JSON.stringify(payload), webhook.secretKey);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AutoForwardX-Signature': signature,
          'X-AutoForwardX-Event': event.type,
          'User-Agent': 'AutoForwardX-Webhook/1.0',
          ...webhook.headers,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(webhook.timeout * 1000),
      });

      if (response.ok) {
        // Reset failure count on success
        await storage.updateWebhook(webhook.id, webhook.userId, {
          failureCount: 0,
          lastTriggered: new Date(),
        });
      } else {
        await this.handleWebhookFailure(webhook, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      await this.handleWebhookFailure(webhook, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleWebhookFailure(webhook: WebhookConfig, error: string): Promise<void> {
    const newFailureCount = webhook.failureCount + 1;

    if (newFailureCount >= webhook.maxRetries) {
      // Disable webhook after max retries
      await storage.updateWebhook(webhook.id, webhook.userId, {
        isActive: false,
        failureCount: newFailureCount,
      });

      // Log error for admin review
      await errorHandler.handleError(new Error(`Webhook disabled due to repeated failures: ${error}`), {
        userId: webhook.userId,
        webhookId: webhook.id,
        errorType: 'webhook',
      });
    } else {
      await storage.updateWebhook(webhook.id, webhook.userId, {
        failureCount: newFailureCount,
      });
    }
  }

  // API Key Management
  async createApiKey(userId: number, config: {
    name: string;
    permissions: string[];
    rateLimit: ApiKey['rateLimit'];
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const key = this.generateApiKey();
    const apiKey: Omit<ApiKey, 'id'> = {
      userId,
      name: config.name,
      key,
      permissions: config.permissions,
      isActive: true,
      rateLimit: config.rateLimit,
      usageCount: 0,
      expiresAt: config.expiresAt,
      createdAt: new Date(),
    };

    const id = await storage.createApiKey(apiKey);
    return { ...apiKey, id };
  }

  async updateApiKey(apiKeyId: number, userId: number, updates: Partial<ApiKey>): Promise<boolean> {
    return await storage.updateApiKey(apiKeyId, userId, updates);
  }

  async deleteApiKey(apiKeyId: number, userId: number): Promise<boolean> {
    return await storage.deleteApiKey(apiKeyId, userId);
  }

  async getUserApiKeys(userId: number): Promise<Omit<ApiKey, 'key'>[]> {
    const apiKeys = await storage.getUserApiKeys(userId);
    return apiKeys.map(({ key, ...rest }) => rest);
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      const apiKey = await storage.getApiKeyByKey(key);

      if (!apiKey) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (!apiKey.isActive) {
        return { valid: false, error: 'API key is disabled' };
      }

      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        return { valid: false, error: 'API key has expired' };
      }

      // Check rate limits
      if (!this.checkApiKeyRateLimit(key, apiKey.rateLimit)) {
        return { valid: false, error: 'Rate limit exceeded' };
      }

      // Update usage
      await storage.updateApiKey(apiKey.id, apiKey.userId, {
        lastUsed: new Date(),
        usageCount: apiKey.usageCount + 1,
      });

      return { valid: true, apiKey };
    } catch (error) {
      return { valid: false, error: 'Internal error validating API key' };
    }
  }

  private checkApiKeyRateLimit(key: string, rateLimit: ApiKey['rateLimit']): boolean {
    const usage = this.getApiKeyUsage(key);
    const now = new Date();

    // Reset counters if needed
    const timeSinceReset = now.getTime() - usage.lastReset.getTime();
    if (timeSinceReset >= 60000) { // 1 minute
      usage.minute = 0;
    }
    if (timeSinceReset >= 3600000) { // 1 hour
      usage.hour = 0;
    }
    if (timeSinceReset >= 86400000) { // 1 day
      usage.day = 0;
      usage.lastReset = now;
    }

    // Check limits
    if (usage.minute >= rateLimit.requestsPerMinute ||
        usage.hour >= rateLimit.requestsPerHour ||
        usage.day >= rateLimit.requestsPerDay) {
      return false;
    }

    // Increment counters
    usage.minute++;
    usage.hour++;
    usage.day++;

    return true;
  }

  private getApiKeyUsage(key: string): { minute: number; hour: number; day: number; lastReset: Date } {
    if (!this.apiKeyUsage.has(key)) {
      this.apiKeyUsage.set(key, {
        minute: 0,
        hour: 0,
        day: 0,
        lastReset: new Date(),
      });
    }
    return this.apiKeyUsage.get(key)!;
  }

  // Utility Methods
  private generateSecretKey(): string {
    return 'whsec_' + this.generateRandomString(32);
  }

  private generateApiKey(): string {
    return 'afxapi_' + this.generateRandomString(40);
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private startProcessingLoop(): void {
    setInterval(() => {
      this.processWebhookQueue();
    }, 1000); // Process every second
  }

  // Event Triggers
  async triggerMessageForwarded(userId: number, data: {
    pairId: number;
    sourceChannel: string;
    destinationChannel: string;
    messageId: string;
    forwardedAt: Date;
  }): Promise<void> {
    await this.triggerWebhook({
      id: this.generateEventId(),
      type: 'message_forwarded',
      userId,
      timestamp: new Date(),
      data,
    });
  }

  async triggerPairCreated(userId: number, data: {
    pairId: number;
    sourceChannel: string;
    destinationChannel: string;
  }): Promise<void> {
    await this.triggerWebhook({
      id: this.generateEventId(),
      type: 'pair_created',
      userId,
      timestamp: new Date(),
      data,
    });
  }

  async triggerPairStatusChanged(userId: number, data: {
    pairId: number;
    sourceChannel: string;
    destinationChannel: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    const eventType = data.newStatus === 'paused' ? 'pair_paused' : 'pair_resumed';
    await this.triggerWebhook({
      id: this.generateEventId(),
      type: eventType,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  async triggerErrorOccurred(userId: number, data: {
    errorType: string;
    errorMessage: string;
    pairId?: number;
    sessionId?: number;
  }): Promise<void> {
    await this.triggerWebhook({
      id: this.generateEventId(),
      type: 'error_occurred',
      userId,
      timestamp: new Date(),
      data,
    });
  }

  async triggerSessionDisconnected(userId: number, data: {
    sessionId: number;
    reason: string;
  }): Promise<void> {
    await this.triggerWebhook({
      id: this.generateEventId(),
      type: 'session_disconnected',
      userId,
      timestamp: new Date(),
      data,
    });
  }

  private generateEventId(): string {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const webhookManager = WebhookManager.getInstance();