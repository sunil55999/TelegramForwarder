import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { db } from './db';
import { telegramSessions } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface TelegramAuthResult {
  success: boolean;
  message: string;
  sessionId?: number;
  phoneCodeHash?: string;
  error?: string;
}

export interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  type: 'channel' | 'group' | 'supergroup';
  participantCount?: number;
  isChannel: boolean;
  isMegagroup: boolean;
}

export class RealTelegramClient {
  private static instances: Map<number, RealTelegramClient> = new Map();
  private client: TelegramClient | null = null;
  private sessionId: number;
  private userId: number;
  private phoneCodeHash: string | null = null;

  constructor(sessionId: number, userId: number) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  static async getInstance(sessionId: number, userId: number): Promise<RealTelegramClient> {
    if (!RealTelegramClient.instances.has(sessionId)) {
      const instance = new RealTelegramClient(sessionId, userId);
      RealTelegramClient.instances.set(sessionId, instance);
    }
    return RealTelegramClient.instances.get(sessionId)!;
  }

  async initializeClient(sessionString?: string): Promise<void> {
    try {
      const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
      const apiHash = process.env.TELEGRAM_API_HASH || '';

      if (!apiId || !apiHash) {
        throw new Error('Telegram API credentials not configured');
      }

      const session = new StringSession(sessionString || '');
      
      this.client = new TelegramClient(session, apiId, apiHash, {
        deviceModel: 'AutoForwardX',
        systemVersion: '1.0',
        appVersion: '1.0.0',
        langCode: 'en',
        systemLangCode: 'en',
        connectionRetries: 5,
        floodSleepThreshold: 60
      });

      console.log('Telegram client initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Telegram client:', error);
      throw error;
    }
  }

  async sendOTP(phoneNumber: string): Promise<TelegramAuthResult> {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      if (!this.client) {
        throw new Error('Failed to initialize Telegram client');
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      console.log('Sending OTP to:', cleanPhone);

      // Connect to Telegram first
      await this.client.connect();

      const result = await this.client.invoke(
        new Api.auth.SendCode({
          phoneNumber: cleanPhone,
          apiId: parseInt(process.env.TELEGRAM_API_ID || ''),
          apiHash: process.env.TELEGRAM_API_HASH || '',
          settings: new Api.CodeSettings({
            allowFlashcall: false,
            currentNumber: false,
            allowAppHash: false,
          }),
        })
      );

      // Extract phoneCodeHash from result
      let phoneCodeHash = '';
      if ('phoneCodeHash' in result) {
        phoneCodeHash = result.phoneCodeHash;
      }

      this.phoneCodeHash = phoneCodeHash;

      // Save session to database
      await db.update(telegramSessions)
        .set({
          phoneNumber: cleanPhone,
          sessionString: this.client.session.save() as any,
          updatedAt: new Date(),
        })
        .where(eq(telegramSessions.id, this.sessionId));

      console.log('OTP sent successfully, phoneCodeHash:', phoneCodeHash);

      return {
        success: true,
        message: 'OTP sent successfully',
        sessionId: this.sessionId,
        phoneCodeHash: phoneCodeHash,
      };

    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error.message,
      };
    }
  }

  async verifyOTP(code: string, phoneCodeHash?: string): Promise<TelegramAuthResult> {
    try {
      if (!this.client) {
        throw new Error('Telegram client not initialized');
      }

      const hashToUse = phoneCodeHash || this.phoneCodeHash;
      if (!hashToUse) {
        throw new Error('Phone code hash not available');
      }

      console.log('Verifying OTP with code:', code);

      const sessionData = await db.select().from(telegramSessions).where(eq(telegramSessions.id, this.sessionId));
      const phoneNumber = sessionData[0]?.phoneNumber || '';

      const result = await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: hashToUse,
          phoneCode: code,
        })
      );

      let accountName = '';
      if ('user' in result && result.user) {
        const user = result.user as any;
        accountName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }

      // Save successful session
      await db.update(telegramSessions)
        .set({
          sessionString: this.client.session.save() as any,
          isActive: true,
          accountName: accountName || null,
          lastHealthCheck: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(telegramSessions.id, this.sessionId));

      console.log('OTP verified successfully');

      return {
        success: true,
        message: 'Authentication successful',
        sessionId: this.sessionId,
      };

    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      return {
        success: false,
        message: 'Invalid verification code',
        error: error.message,
      };
    }
  }

  async getChannels(): Promise<TelegramChannel[]> {
    try {
      if (!this.client) {
        throw new Error('Telegram client not initialized');
      }

      const dialogs = await this.client.getDialogs();
      const channels: TelegramChannel[] = [];

      for (const dialog of dialogs) {
        if (dialog.isChannel || dialog.isGroup) {
          const entity = dialog.entity as any;
          channels.push({
            id: dialog.id?.toString() || '',
            title: dialog.title || '',
            username: entity?.username || undefined,
            type: dialog.isChannel ? 'channel' : dialog.isGroup ? 'group' : 'supergroup',
            participantCount: entity?.participantsCount || undefined,
            isChannel: dialog.isChannel,
            isMegagroup: entity?.megagroup || false,
          });
        }
      }

      return channels;
    } catch (error) {
      console.error('Failed to get channels:', error);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.invoke(new Api.updates.GetState());
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      RealTelegramClient.instances.delete(this.sessionId);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  static async disconnectAll(): Promise<void> {
    const instances = Array.from(RealTelegramClient.instances.values());
    for (const instance of instances) {
      await instance.disconnect();
    }
    RealTelegramClient.instances.clear();
  }
}

export const telegramClient = {
  async createSession(userId: number, phoneNumber: string): Promise<number> {
    const [session] = await db.insert(telegramSessions).values({
      userId,
      phoneNumber,
      sessionString: '',
      isActive: false,
      lastHealthCheck: null,
      accountName: null,
    }).returning();

    return session.id;
  },

  async getClient(sessionId: number, userId: number): Promise<RealTelegramClient> {
    return await RealTelegramClient.getInstance(sessionId, userId);
  },

  async healthCheckAll(): Promise<void> {
    const sessions = await db.select().from(telegramSessions).where(eq(telegramSessions.isActive, true));
    
    for (const session of sessions) {
      try {
        const client = await RealTelegramClient.getInstance(session.id, session.userId);
        const isHealthy = await client.checkHealth();
        
        await db.update(telegramSessions)
          .set({
            isActive: isHealthy,
            lastHealthCheck: new Date(),
          })
          .where(eq(telegramSessions.id, session.id));
      } catch (error) {
        console.error(`Health check failed for session ${session.id}:`, error);
      }
    }
  },
};