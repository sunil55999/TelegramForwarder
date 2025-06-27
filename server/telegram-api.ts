import { TelegramApi } from 'telegram';
import { Api } from 'telegram/tl';
import { StringSession } from 'telegram/sessions';
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

export class TelegramApiClient {
  private static instances: Map<number, TelegramApiClient> = new Map();
  private client: TelegramApi | null = null;
  private sessionId: number;
  private userId: number;
  private phoneCodeHash: string | null = null;

  constructor(sessionId: number, userId: number) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  static async getInstance(sessionId: number, userId: number): Promise<TelegramApiClient> {
    const key = `${userId}-${sessionId}`;
    let instance = this.instances.get(sessionId);
    
    if (!instance) {
      instance = new TelegramApiClient(sessionId, userId);
      this.instances.set(sessionId, instance);
    }
    
    return instance;
  }

  async initializeClient(sessionString?: string): Promise<void> {
    try {
      const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
      const apiHash = process.env.TELEGRAM_API_HASH || '';

      if (!apiId || !apiHash) {
        throw new Error('Telegram API credentials not configured');
      }

      const session = new StringSession(sessionString || '');
      
      this.client = new TelegramApi(session, apiId, apiHash, {
        deviceModel: 'AutoForwardX',
        systemVersion: '1.0',
        appVersion: '1.0.0',
        langCode: 'en',
        systemLangCode: 'en',
      });

      await this.client.start({
        phoneNumber: async () => '',
        password: async () => '',
        phoneCode: async () => '',
        onError: (err) => {
          console.error('Telegram client error:', err);
        },
      });

    } catch (error) {
      await errorHandler.handleError(error as Error, {
        userId: this.userId,
        sessionId: this.sessionId,
        operation: 'initialize_client'
      });
      throw error;
    }
  }

  async sendOTP(phoneNumber: string): Promise<TelegramAuthResult> {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

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

      this.phoneCodeHash = result.phoneCodeHash;

      // Update session in database
      await db.update(telegramSessions)
        .set({
          phone: cleanPhone,
          status: 'otp_sent',
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return {
        success: true,
        message: 'OTP sent successfully',
        phoneCodeHash: result.phoneCodeHash,
        sessionId: this.sessionId
      };

    } catch (error: any) {
      await errorHandler.handleError(error, {
        userId: this.userId,
        sessionId: this.sessionId,
        operation: 'send_otp',
        phone: phoneNumber
      });

      return {
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      };
    }
  }

  async verifyOTP(code: string, phoneCodeHash?: string): Promise<TelegramAuthResult> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      const hashToUse = phoneCodeHash || this.phoneCodeHash;
      if (!hashToUse) {
        throw new Error('Phone code hash not found');
      }

      // Get session data
      const sessionData = await db.select()
        .from(telegramSessions)
        .where(eq(telegramSessions.id, this.sessionId))
        .limit(1);

      if (sessionData.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessionData[0];

      const result = await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phone,
          phoneCodeHash: hashToUse,
          phoneCode: code,
        })
      );

      // Save session string
      const sessionString = this.client.session.save() as unknown as string;

      // Update session in database
      await db.update(telegramSessions)
        .set({
          sessionData: sessionString,
          status: 'active',
          lastHealthCheck: new Date(),
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return {
        success: true,
        message: 'Successfully authenticated with Telegram',
        sessionId: this.sessionId
      };

    } catch (error: any) {
      await errorHandler.handleError(error, {
        userId: this.userId,
        sessionId: this.sessionId,
        operation: 'verify_otp'
      });

      // Handle specific Telegram errors
      if (error.message.includes('PHONE_CODE_INVALID')) {
        return {
          success: false,
          message: 'Invalid verification code',
          error: 'PHONE_CODE_INVALID'
        };
      }

      if (error.message.includes('PHONE_CODE_EXPIRED')) {
        return {
          success: false,
          message: 'Verification code expired',
          error: 'PHONE_CODE_EXPIRED'
        };
      }

      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message
      };
    }
  }

  async getChannels(): Promise<TelegramChannel[]> {
    try {
      if (!this.client) {
        const sessionData = await db.select()
          .from(telegramSessions)
          .where(eq(telegramSessions.id, this.sessionId))
          .limit(1);

        if (sessionData.length === 0 || !sessionData[0].sessionData) {
          throw new Error('No active session found');
        }

        await this.initializeClient(sessionData[0].sessionData);
      }

      const result = await this.client.invoke(new Api.messages.GetDialogs({
        offsetDate: 0,
        offsetId: 0,
        offsetPeer: new Api.InputPeerEmpty(),
        limit: 100,
        hash: 0,
      }));

      const channels: TelegramChannel[] = [];

      for (const chat of result.chats) {
        if (chat.className === 'Channel' || chat.className === 'Chat') {
          const channel = chat as any;
          channels.push({
            id: channel.id.toString(),
            title: channel.title,
            username: channel.username,
            type: channel.broadcast ? 'channel' : channel.megagroup ? 'supergroup' : 'group',
            participantCount: channel.participantsCount,
            isChannel: channel.broadcast || false,
            isMegagroup: channel.megagroup || false,
          });
        }
      }

      return channels;

    } catch (error) {
      await errorHandler.handleError(error as Error, {
        userId: this.userId,
        sessionId: this.sessionId,
        operation: 'get_channels'
      });
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this.client) {
        const sessionData = await db.select()
          .from(telegramSessions)
          .where(eq(telegramSessions.id, this.sessionId))
          .limit(1);

        if (sessionData.length === 0 || !sessionData[0].sessionData) {
          return false;
        }

        await this.initializeClient(sessionData[0].sessionData);
      }

      // Simple ping to check if session is still valid
      await this.client.invoke(new Api.users.GetFullUser({
        id: new Api.InputUserSelf(),
      }));

      // Update last health check
      await db.update(telegramSessions)
        .set({
          lastHealthCheck: new Date(),
          status: 'active'
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return true;

    } catch (error) {
      await errorHandler.handleError(error as Error, {
        userId: this.userId,
        sessionId: this.sessionId,
        operation: 'health_check'
      });

      // Update session status to error
      await db.update(telegramSessions)
        .set({
          status: 'error',
          lastHealthCheck: new Date()
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      
      TelegramApiClient.instances.delete(this.sessionId);
    } catch (error) {
      console.error('Error disconnecting Telegram client:', error);
    }
  }

  static async disconnectAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(instance => 
      instance.disconnect()
    );
    await Promise.all(promises);
    this.instances.clear();
  }
}

export const telegramApiManager = {
  async createSession(userId: number, phone: string): Promise<number> {
    const [session] = await db.insert(telegramSessions)
      .values({
        userId,
        phone,
        status: 'created',
        createdAt: new Date(),
      })
      .returning();

    return session.id;
  },

  async getClient(sessionId: number, userId: number): Promise<TelegramApiClient> {
    return TelegramApiClient.getInstance(sessionId, userId);
  },

  async healthCheckAll(): Promise<void> {
    try {
      const sessions = await db.select()
        .from(telegramSessions)
        .where(eq(telegramSessions.status, 'active'));

      console.log(`Performing health checks on ${sessions.length} sessions`);

      const healthCheckPromises = sessions.map(async (session) => {
        try {
          const client = await this.getClient(session.id, session.userId);
          await client.checkHealth();
        } catch (error) {
          console.error(`Health check failed for session ${session.id}:`, error);
        }
      });

      await Promise.all(healthCheckPromises);
    } catch (error) {
      console.error('Error during health check:', error);
    }
  }
};