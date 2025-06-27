import { storage } from "./storage";
import { telegramClient, type TelegramMessage } from "./telegram-client";
import type { ForwardingPair, ForwardingQueue, InsertForwardingQueue } from "@shared/schema";

export interface QueueItem {
  id: number;
  forwardingPairId: number;
  messageId: string;
  sourceChat: string;
  destinationChat: string;
  messageContent: any;
  scheduledTime: Date;
  delay: number;
  attempts: number;
  pairConfig: ForwardingPair;
}

export interface RateLimitConfig {
  messagesPerMinute: number;
  messagesPerHour: number;
  burstLimit: number;
  cooldownPeriod: number; // seconds
}

export class QueueManager {
  private static instance: QueueManager;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private rateLimits: Map<number, RateLimitConfig> = new Map();
  private messageCounters: Map<number, { minute: number; hour: number; lastReset: Date }> = new Map();
  
  private readonly DEFAULT_RATE_LIMIT: RateLimitConfig = {
    messagesPerMinute: 20,
    messagesPerHour: 200,
    burstLimit: 5,
    cooldownPeriod: 30
  };

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  // Initialize queue manager
  async initialize(): Promise<void> {
    console.log('Initializing Queue Manager...');
    
    // Start processing loop
    this.startProcessingLoop();
    
    // Initialize rate limits for existing pairs
    await this.initializeRateLimits();
    
    console.log('Queue Manager initialized successfully');
  }

  // Initialize rate limits for existing forwarding pairs
  private async initializeRateLimits(): Promise<void> {
    try {
      // In a real implementation, we'd load rate limits from config or database
      // For now, we'll use default rate limits for all pairs
      console.log('Rate limits initialized with default values');
    } catch (error) {
      console.error('Failed to initialize rate limits:', error);
    }
  }

  // Add message to forwarding queue
  async addToQueue(
    forwardingPair: ForwardingPair,
    message: TelegramMessage,
    sourceChat: string,
    destinationChat: string
  ): Promise<boolean> {
    try {
      // Check if forwarding should be blocked
      if (await this.shouldBlockMessage(forwardingPair, message)) {
        console.log(`Message blocked for pair ${forwardingPair.id}`);
        return false;
      }

      // Calculate scheduled time based on delay
      const scheduledTime = new Date();
      scheduledTime.setSeconds(scheduledTime.getSeconds() + forwardingPair.delay);

      // Create queue item
      const queueItem: InsertForwardingQueue = {
        forwardingPairId: forwardingPair.id,
        messageId: message.id,
        sourceChat,
        destinationChat,
        messageContent: message,
        scheduledTime,
        status: 'pending'
      };

      await storage.addToQueue(queueItem);

      // Log activity
      await storage.createActivityLog({
        userId: forwardingPair.userId,
        forwardingPairId: forwardingPair.id,
        telegramSessionId: forwardingPair.telegramSessionId,
        type: 'message_queued',
        message: `Message queued for forwarding with ${forwardingPair.delay}s delay`,
        metadata: { 
          messageId: message.id,
          sourceChat,
          destinationChat,
          delay: forwardingPair.delay
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add message to queue:', error);
      return false;
    }
  }

  // Check if message should be blocked
  private async shouldBlockMessage(pair: ForwardingPair, message: TelegramMessage): Promise<boolean> {
    try {
      // Check blocked sentences
      if (message.text) {
        const blockedSentences = await storage.getBlockedSentences(pair.userId, pair.id);
        for (const blockedSentence of blockedSentences) {
          if (blockedSentence.isActive && message.text.toLowerCase().includes(blockedSentence.sentence.toLowerCase())) {
            return true;
          }
        }
      }

      // Check blocked images (simplified - would need actual image hash comparison)
      if (message.media?.type === 'photo') {
        const blockedImages = await storage.getBlockedImages(pair.userId, pair.id);
        // In a real implementation, we'd compare image hashes
        if (blockedImages.length > 0) {
          // For now, we'll just check if there are any blocked images
        }
      }

      // Check message type filter
      if (pair.messageType === 'text' && message.media) {
        return true; // Block media messages if only text is allowed
      }
      if (pair.messageType === 'media' && !message.media) {
        return true; // Block text messages if only media is allowed
      }

      return false;
    } catch (error) {
      console.error('Error checking if message should be blocked:', error);
      return false;
    }
  }

  // Start processing loop
  private startProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  // Process pending queue items
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Get pending items that are ready to be processed
      const pendingItems = await storage.getQueueItems('pending', 50);
      const readyItems = pendingItems.filter(item => new Date(item.scheduledTime) <= new Date());

      if (readyItems.length === 0) {
        return;
      }

      console.log(`Processing ${readyItems.length} ready queue items`);

      for (const item of readyItems) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual queue item
  private async processQueueItem(item: ForwardingQueue): Promise<void> {
    try {
      // Mark as processing
      await storage.updateQueueItem(item.id, { status: 'processing' });

      // Get forwarding pair details
      const pair = await storage.getForwardingPair(item.forwardingPairId, 0); // We'll need better user tracking
      if (!pair || !pair.isActive) {
        await storage.updateQueueItem(item.id, { 
          status: 'failed', 
          lastError: 'Forwarding pair not found or inactive'
        });
        return;
      }

      // Check rate limits
      if (!this.checkRateLimit(pair.id)) {
        // Reschedule for later
        const newScheduledTime = new Date();
        newScheduledTime.setMinutes(newScheduledTime.getMinutes() + 1);
        
        await storage.updateQueueItem(item.id, { 
          status: 'pending',
          scheduledTime: newScheduledTime
        });
        return;
      }

      // Process the message
      const success = await this.forwardMessage(pair, item);

      if (success) {
        await storage.completeQueueItem(item.id);
        this.updateMessageCounter(pair.id);
        
        // Update pair statistics
        await storage.updateForwardingPair(item.forwardingPairId, pair.userId, {
          messagesForwarded: pair.messagesForwarded + 1,
          lastActivity: new Date()
        });

        // Log successful forwarding
        await storage.createActivityLog({
          userId: pair.userId,
          forwardingPairId: pair.id,
          telegramSessionId: pair.telegramSessionId,
          type: 'message_forwarded',
          message: `Message successfully forwarded from ${item.sourceChat} to ${item.destinationChat}`,
          metadata: {
            messageId: item.messageId,
            attempts: item.attempts + 1
          }
        });
      } else {
        // Handle failure
        await this.handleQueueItemFailure(item, 'Failed to forward message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing queue item ${item.id}:`, error);
      await this.handleQueueItemFailure(item, errorMessage);
    }
  }

  // Forward message based on pair configuration
  private async forwardMessage(pair: ForwardingPair, item: ForwardingQueue): Promise<boolean> {
    try {
      const message = item.messageContent as TelegramMessage;

      if (pair.copyMode) {
        // Copy mode: send as new message
        return await telegramClient.copyMessage(
          pair.telegramSessionId,
          message,
          item.destinationChat,
          pair.silentMode
        );
      } else {
        // Forward mode: forward original message
        return await telegramClient.forwardMessage(
          pair.telegramSessionId,
          item.sourceChat,
          item.destinationChat,
          item.messageId,
          pair.silentMode
        );
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      return false;
    }
  }

  // Handle queue item failure
  private async handleQueueItemFailure(item: ForwardingQueue, error: string): Promise<void> {
    const maxRetries = 3;
    const newAttempts = item.attempts + 1;

    if (newAttempts >= maxRetries) {
      // Max retries reached, mark as failed
      await storage.failQueueItem(item.id, error);
    } else {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, newAttempts) * 60; // 2, 4, 8 minutes
      const newScheduledTime = new Date();
      newScheduledTime.setSeconds(newScheduledTime.getSeconds() + retryDelay);

      await storage.updateQueueItem(item.id, {
        status: 'pending',
        scheduledTime: newScheduledTime,
        attempts: newAttempts,
        lastError: error
      });
    }
  }

  // Check rate limits for a forwarding pair
  private checkRateLimit(pairId: number): boolean {
    const rateLimit = this.rateLimits.get(pairId) || this.DEFAULT_RATE_LIMIT;
    const counter = this.getMessageCounter(pairId);

    // Reset counters if needed
    const now = new Date();
    const timeSinceReset = now.getTime() - counter.lastReset.getTime();

    if (timeSinceReset >= 60000) { // 1 minute
      counter.minute = 0;
      if (timeSinceReset >= 3600000) { // 1 hour
        counter.hour = 0;
      }
      counter.lastReset = now;
    }

    // Check limits
    if (counter.minute >= rateLimit.messagesPerMinute) {
      return false;
    }
    if (counter.hour >= rateLimit.messagesPerHour) {
      return false;
    }

    return true;
  }

  // Get message counter for a pair
  private getMessageCounter(pairId: number): { minute: number; hour: number; lastReset: Date } {
    if (!this.messageCounters.has(pairId)) {
      this.messageCounters.set(pairId, {
        minute: 0,
        hour: 0,
        lastReset: new Date()
      });
    }
    return this.messageCounters.get(pairId)!;
  }

  // Update message counter
  private updateMessageCounter(pairId: number): void {
    const counter = this.getMessageCounter(pairId);
    counter.minute++;
    counter.hour++;
  }

  // Set custom rate limit for a pair
  setRateLimit(pairId: number, rateLimit: RateLimitConfig): void {
    this.rateLimits.set(pairId, rateLimit);
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [pending, processing, completed, failed] = await Promise.all([
        storage.getQueueItems('pending'),
        storage.getQueueItems('processing'),
        storage.getQueueItems('completed'),
        storage.getQueueItems('failed')
      ]);

      return {
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  // Pause queue processing
  pauseProcessing(): void {
    this.isProcessing = true;
    console.log('Queue processing paused');
  }

  // Resume queue processing
  resumeProcessing(): void {
    this.isProcessing = false;
    console.log('Queue processing resumed');
  }

  // Clear failed items
  async clearFailedItems(): Promise<number> {
    try {
      const failedItems = await storage.getQueueItems('failed');
      let clearedCount = 0;

      for (const item of failedItems) {
        await storage.updateQueueItem(item.id, { status: 'cleared' });
        clearedCount++;
      }

      console.log(`Cleared ${clearedCount} failed queue items`);
      return clearedCount;
    } catch (error) {
      console.error('Error clearing failed items:', error);
      return 0;
    }
  }

  // Shutdown queue manager
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.isProcessing = false;
    this.rateLimits.clear();
    this.messageCounters.clear();
    
    console.log('Queue Manager shutdown complete');
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance();