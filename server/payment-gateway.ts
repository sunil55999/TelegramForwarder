import { Request, Response } from 'express';
import { storage } from './storage';
import { telegramClient } from './telegram-client';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: {
    maxAccounts: number;
    maxPairs: number;
    messagesPerDay: number;
    advancedFiltering: boolean;
    prioritySupport: boolean;
    customWatermarks: boolean;
  };
  duration: number; // days
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: {
      maxAccounts: 1,
      maxPairs: 3,
      messagesPerDay: 100,
      advancedFiltering: false,
      prioritySupport: false,
      customWatermarks: false,
    },
    duration: 0,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    features: {
      maxAccounts: 5,
      maxPairs: 15,
      messagesPerDay: 1000,
      advancedFiltering: true,
      prioritySupport: true,
      customWatermarks: true,
    },
    duration: 30,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 29.99,
    currency: 'USD',
    features: {
      maxAccounts: 15,
      maxPairs: 50,
      messagesPerDay: 5000,
      advancedFiltering: true,
      prioritySupport: true,
      customWatermarks: true,
    },
    duration: 30,
  },
};

export interface PaymentWebhook {
  paymentId: string;
  userId: number;
  planId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'paypal' | 'crypto';
  transactionId?: string;
  metadata?: Record<string, any>;
}

export class PaymentGateway {
  private static instance: PaymentGateway;

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  async createPayment(userId: number, planId: string, paymentMethod: 'paypal' | 'crypto'): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const plan = PAYMENT_PLANS[planId];
      if (!plan) {
        return { success: false, error: 'Invalid plan selected' };
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate payment ID
      const paymentId = `payment_${Date.now()}_${userId}`;

      if (paymentMethod === 'paypal') {
        return await this.createPayPalPayment(paymentId, plan, user);
      } else {
        return await this.createCryptoPayment(paymentId, plan, user);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: 'Failed to create payment' };
    }
  }

  private async createPayPalPayment(paymentId: string, plan: PaymentPlan, user: any): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentId?: string;
    error?: string;
  }> {
    // Integration with PayPal SDK (will be implemented with actual PayPal credentials)
    const paymentUrl = `https://www.paypal.com/checkoutnow?token=${paymentId}`;
    
    // Store payment record
    await storage.createActivityLog({
      userId: user.id,
      action: 'payment_initiated',
      details: `PayPal payment created for ${plan.name} plan`,
      metadata: { paymentId, planId: plan.id, amount: plan.price },
    });

    return {
      success: true,
      paymentUrl,
      paymentId,
    };
  }

  private async createCryptoPayment(paymentId: string, plan: PaymentPlan, user: any): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentId?: string;
    error?: string;
  }> {
    // Integration with NowPayments API (will be implemented with actual credentials)
    const paymentUrl = `https://nowpayments.io/payment/${paymentId}`;
    
    // Store payment record
    await storage.createActivityLog({
      userId: user.id,
      action: 'payment_initiated',
      details: `Crypto payment created for ${plan.name} plan`,
      metadata: { paymentId, planId: plan.id, amount: plan.price },
    });

    return {
      success: true,
      paymentUrl,
      paymentId,
    };
  }

  async processWebhook(webhook: PaymentWebhook): Promise<boolean> {
    try {
      const user = await storage.getUser(webhook.userId);
      if (!user) {
        console.error('User not found for payment webhook:', webhook.paymentId);
        return false;
      }

      const plan = PAYMENT_PLANS[webhook.planId];
      if (!plan) {
        console.error('Invalid plan in payment webhook:', webhook.planId);
        return false;
      }

      if (webhook.status === 'completed') {
        // Upgrade user plan
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.duration);

        await storage.updateUser(webhook.userId, {
          plan: webhook.planId,
          planExpiryDate: expiryDate,
        });

        // Log successful payment
        await storage.createActivityLog({
          userId: webhook.userId,
          action: 'payment_completed',
          details: `Successfully upgraded to ${plan.name} plan`,
          metadata: { 
            paymentId: webhook.paymentId,
            planId: webhook.planId,
            amount: webhook.amount,
            expiryDate: expiryDate.toISOString(),
          },
        });

        // Send notification via Telegram if user has active sessions
        const sessions = await storage.getTelegramSessions(webhook.userId);
        if (sessions.length > 0) {
          // Send upgrade notification (will be implemented with Telegram bot)
          console.log(`Sending upgrade notification to user ${webhook.userId}`);
        }

        return true;
      } else if (webhook.status === 'failed') {
        // Log failed payment
        await storage.createActivityLog({
          userId: webhook.userId,
          action: 'payment_failed',
          details: `Payment failed for ${plan.name} plan`,
          metadata: { 
            paymentId: webhook.paymentId,
            planId: webhook.planId,
            amount: webhook.amount,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      return false;
    }
  }

  async checkPlanLimits(userId: number): Promise<{
    canAddAccount: boolean;
    canAddPair: boolean;
    dailyMessageLimit: number;
    messagesUsedToday: number;
    planFeatures: PaymentPlan['features'];
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const plan = PAYMENT_PLANS[user.plan || 'free'];
      const sessions = await storage.getTelegramSessions(userId);
      const pairs = await storage.getForwardingPairs(userId);

      // Calculate messages used today (simplified - would need proper tracking)
      const messagesUsedToday = 0; // TODO: Implement actual message counting

      return {
        canAddAccount: sessions.length < plan.features.maxAccounts,
        canAddPair: pairs.length < plan.features.maxPairs,
        dailyMessageLimit: plan.features.messagesPerDay,
        messagesUsedToday,
        planFeatures: plan.features,
      };
    } catch (error) {
      console.error('Error checking plan limits:', error);
      throw error;
    }
  }

  async isPlanExpired(userId: number): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.planExpiryDate) {
        return false;
      }

      return new Date() > new Date(user.planExpiryDate);
    } catch (error) {
      console.error('Error checking plan expiry:', error);
      return false;
    }
  }

  async downgradeExpiredUsers(): Promise<void> {
    try {
      // This would typically run as a cron job
      console.log('Checking for expired user plans...');
      
      // Implementation would query all users with expired plans
      // and downgrade them to free tier
      
      // For now, we'll just log the action
      console.log('Plan expiry check completed');
    } catch (error) {
      console.error('Error checking expired plans:', error);
    }
  }
}

export const paymentGateway = PaymentGateway.getInstance();