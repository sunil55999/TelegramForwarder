import { storage } from './storage';
import { telegramClient } from './telegram-client';
import { paymentGateway } from './payment-gateway';
import crypto from 'crypto';

export interface ContentFilter {
  id: number;
  userId: number;
  forwardingPairId?: number;
  type: 'text' | 'image' | 'keyword' | 'media';
  pattern: string;
  action: 'block' | 'modify' | 'watermark';
  replacement?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WatermarkConfig {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
}

export interface MessageProcessingResult {
  shouldForward: boolean;
  modifiedContent?: any;
  blockReason?: string;
  watermarkApplied?: boolean;
}

export class ChannelManager {
  private static instance: ChannelManager;
  private imageHashCache: Map<string, string> = new Map();

  static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  async processMessage(
    userId: number,
    forwardingPairId: number,
    message: any
  ): Promise<MessageProcessingResult> {
    try {
      // Check user plan limits
      const planLimits = await paymentGateway.checkPlanLimits(userId);
      if (!planLimits.planFeatures.advancedFiltering) {
        // Basic filtering only for free users
        return await this.basicMessageProcessing(userId, forwardingPairId, message);
      }

      // Advanced filtering for paid users
      return await this.advancedMessageProcessing(userId, forwardingPairId, message);
    } catch (error) {
      console.error('Error processing message:', error);
      return { shouldForward: false, blockReason: 'Processing error' };
    }
  }

  private async basicMessageProcessing(
    userId: number,
    forwardingPairId: number,
    message: any
  ): Promise<MessageProcessingResult> {
    // Check basic blocked sentences
    const blockedSentences = await storage.getBlockedSentences(userId, forwardingPairId);
    
    if (message.text) {
      for (const blocked of blockedSentences) {
        if (message.text.toLowerCase().includes(blocked.sentence.toLowerCase())) {
          return {
            shouldForward: false,
            blockReason: `Contains blocked text: ${blocked.sentence}`,
          };
        }
      }
    }

    // Check basic blocked images
    if (message.media && message.media.type === 'photo') {
      const blockedImages = await storage.getBlockedImages(userId, forwardingPairId);
      const imageHash = await this.calculateImageHash(message.media.fileId);
      
      for (const blocked of blockedImages) {
        if (blocked.imageHash === imageHash) {
          return {
            shouldForward: false,
            blockReason: 'Image blocked by hash match',
          };
        }
      }
    }

    return { shouldForward: true };
  }

  private async advancedMessageProcessing(
    userId: number,
    forwardingPairId: number,
    message: any
  ): Promise<MessageProcessingResult> {
    // Run basic processing first
    const basicResult = await this.basicMessageProcessing(userId, forwardingPairId, message);
    if (!basicResult.shouldForward) {
      return basicResult;
    }

    // Advanced keyword filtering
    if (message.text) {
      const keywordFilters = await this.getContentFilters(userId, forwardingPairId, 'keyword');
      for (const filter of keywordFilters) {
        const regex = new RegExp(filter.pattern, 'gi');
        if (regex.test(message.text)) {
          if (filter.action === 'block') {
            return {
              shouldForward: false,
              blockReason: `Blocked by keyword filter: ${filter.pattern}`,
            };
          } else if (filter.action === 'modify' && filter.replacement) {
            message.text = message.text.replace(regex, filter.replacement);
          }
        }
      }
    }

    // Advanced media filtering
    if (message.media) {
      const mediaFilters = await this.getContentFilters(userId, forwardingPairId, 'media');
      for (const filter of mediaFilters) {
        if (message.media.type === filter.pattern) {
          if (filter.action === 'block') {
            return {
              shouldForward: false,
              blockReason: `Blocked media type: ${filter.pattern}`,
            };
          }
        }
      }

      // Apply watermark if configured
      if (message.media.type === 'photo') {
        const watermarkResult = await this.applyWatermark(userId, message);
        if (watermarkResult.watermarkApplied) {
          return {
            shouldForward: true,
            modifiedContent: watermarkResult.modifiedContent,
            watermarkApplied: true,
          };
        }
      }
    }

    // Content cleaning
    const cleanedMessage = await this.cleanContent(message);

    return {
      shouldForward: true,
      modifiedContent: cleanedMessage,
    };
  }

  private async getContentFilters(
    userId: number,
    forwardingPairId: number,
    type: string
  ): Promise<ContentFilter[]> {
    // This would be implemented with proper database schema
    // For now, return empty array
    return [];
  }

  private async calculateImageHash(fileId: string): Promise<string> {
    // Check cache first
    if (this.imageHashCache.has(fileId)) {
      return this.imageHashCache.get(fileId)!;
    }

    try {
      // In a real implementation, we would download the image and calculate hash
      // For now, use fileId as a simple hash
      const hash = crypto.createHash('md5').update(fileId).digest('hex');
      this.imageHashCache.set(fileId, hash);
      return hash;
    } catch (error) {
      console.error('Error calculating image hash:', error);
      return fileId; // Fallback to fileId
    }
  }

  private async applyWatermark(userId: number, message: any): Promise<{
    watermarkApplied: boolean;
    modifiedContent?: any;
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.watermarkConfig) {
        return { watermarkApplied: false };
      }

      // In a real implementation, we would:
      // 1. Download the image
      // 2. Apply watermark using image processing library
      // 3. Upload modified image
      // 4. Return new file ID

      // For now, just mark as watermarked
      const modifiedMessage = { ...message };
      modifiedMessage.watermarked = true;

      return {
        watermarkApplied: true,
        modifiedContent: modifiedMessage,
      };
    } catch (error) {
      console.error('Error applying watermark:', error);
      return { watermarkApplied: false };
    }
  }

  private async cleanContent(message: any): Promise<any> {
    const cleanedMessage = { ...message };

    if (cleanedMessage.text) {
      // Remove excessive whitespace
      cleanedMessage.text = cleanedMessage.text.replace(/\s+/g, ' ').trim();

      // Remove common spam patterns
      cleanedMessage.text = cleanedMessage.text.replace(/[🎉🔥💥⚡]{3,}/g, '');

      // Clean up URLs (optional based on user settings)
      // cleanedMessage.text = cleanedMessage.text.replace(/https?:\/\/[^\s]+/g, '[Link]');
    }

    return cleanedMessage;
  }

  async addContentFilter(
    userId: number,
    forwardingPairId: number | undefined,
    type: 'text' | 'image' | 'keyword' | 'media',
    pattern: string,
    action: 'block' | 'modify' | 'watermark',
    replacement?: string
  ): Promise<boolean> {
    try {
      // Check user plan limits
      const planLimits = await paymentGateway.checkPlanLimits(userId);
      if (!planLimits.planFeatures.advancedFiltering && type !== 'text') {
        throw new Error('Advanced filtering requires a paid plan');
      }

      // In a real implementation, this would save to content_filters table
      await storage.createActivityLog({
        userId,
        action: 'content_filter_added',
        details: `Added ${type} filter: ${pattern}`,
        metadata: { forwardingPairId, type, pattern, action, replacement },
      });

      return true;
    } catch (error) {
      console.error('Error adding content filter:', error);
      return false;
    }
  }

  async updateWatermarkConfig(userId: number, config: WatermarkConfig): Promise<boolean> {
    try {
      // Check if user has watermark feature
      const planLimits = await paymentGateway.checkPlanLimits(userId);
      if (!planLimits.planFeatures.customWatermarks) {
        throw new Error('Custom watermarks require a paid plan');
      }

      await storage.updateUser(userId, {
        watermarkConfig: config,
      });

      await storage.createActivityLog({
        userId,
        action: 'watermark_updated',
        details: 'Updated watermark configuration',
        metadata: config,
      });

      return true;
    } catch (error) {
      console.error('Error updating watermark config:', error);
      return false;
    }
  }

  async getChannelStats(userId: number, forwardingPairId: number): Promise<{
    totalMessages: number;
    blockedMessages: number;
    modifiedMessages: number;
    watermarkedMessages: number;
    successRate: number;
  }> {
    try {
      // In a real implementation, this would query message statistics
      // For now, return mock data
      return {
        totalMessages: 0,
        blockedMessages: 0,
        modifiedMessages: 0,
        watermarkedMessages: 0,
        successRate: 0,
      };
    } catch (error) {
      console.error('Error getting channel stats:', error);
      return {
        totalMessages: 0,
        blockedMessages: 0,
        modifiedMessages: 0,
        watermarkedMessages: 0,
        successRate: 0,
      };
    }
  }

  async optimizeForwarding(userId: number, forwardingPairId: number): Promise<{
    recommendations: string[];
    optimizationsApplied: string[];
  }> {
    try {
      const recommendations: string[] = [];
      const optimizationsApplied: string[] = [];

      // Analyze forwarding patterns and suggest optimizations
      const stats = await this.getChannelStats(userId, forwardingPairId);
      
      if (stats.successRate < 0.8) {
        recommendations.push('Consider reviewing your content filters - high block rate detected');
      }

      if (stats.totalMessages > 1000) {
        recommendations.push('Enable message batching for better performance');
        optimizationsApplied.push('Optimized message queue processing');
      }

      // Log optimization analysis
      await storage.createActivityLog({
        userId,
        action: 'forwarding_optimized',
        details: 'Analyzed and optimized forwarding performance',
        metadata: { forwardingPairId, recommendations, optimizationsApplied },
      });

      return { recommendations, optimizationsApplied };
    } catch (error) {
      console.error('Error optimizing forwarding:', error);
      return { recommendations: [], optimizationsApplied: [] };
    }
  }
}

export const channelManager = ChannelManager.getInstance();