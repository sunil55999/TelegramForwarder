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

export class RealTelegramApiClient {
  private static instances: Map<number, RealTelegramApiClient> = new Map();
  private client: any = null;
  private sessionId: number;
  private userId: number;
  private phoneCodeHash: string | null = null;

  constructor(sessionId: number, userId: number) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  static async getInstance(sessionId: number, userId: number): Promise<RealTelegramApiClient> {
    let instance = this.instances.get(sessionId);
    
    if (!instance) {
      instance = new RealTelegramApiClient(sessionId, userId);
      this.instances.set(sessionId, instance);
    }
    
    return instance;
  }

  async initializeClient(sessionString?: string): Promise<void> {
    try {
      // Configure Telegram API credentials
      const apiId = 23697291;
      const apiHash = 'b3a10e33ef507e864ed7018df0495ca8';
      
      console.log('Using configured API ID:', apiId);
      console.log('API Hash configured:', !!apiHash);

      const session = new StringSession(sessionString || '');
      
      this.client = new TelegramClient(session, apiId, apiHash, {
        deviceModel: 'AutoForwardX',
        systemVersion: '1.0',
        appVersion: '1.0.0',
        langCode: 'en',
        systemLangCode: 'en',
      });

      console.log('Initializing Telegram client...');
      
      await this.client.start({
        phoneNumber: async () => {
          throw new Error('Phone number should be provided via sendOTP');
        },
        password: async () => {
          throw new Error('Password should be handled separately');
        },
        phoneCode: async () => {
          throw new Error('Phone code should be provided via verifyOTP');
        },
        onError: (err: any) => {
          console.error('Telegram client error:', err);
        },
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
      console.log('OTP sent successfully, phone code hash:', result.phoneCodeHash);

      // Update session in database
      await db.update(telegramSessions)
        .set({
          phoneNumber: cleanPhone,
          isActive: false, // Will be activated after OTP verification
          lastHealthCheck: new Date(),
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return {
        success: true,
        message: 'OTP sent successfully to your phone',
        phoneCodeHash: result.phoneCodeHash,
        sessionId: this.sessionId
      };

    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      
      let errorMessage = 'Failed to send OTP';
      if (error.message.includes('PHONE_NUMBER_INVALID')) {
        errorMessage = 'Invalid phone number format';
      } else if (error.message.includes('PHONE_NUMBER_BANNED')) {
        errorMessage = 'This phone number is banned from Telegram';
      } else if (error.message.includes('FLOOD_WAIT')) {
        errorMessage = 'Too many attempts. Please try again later';
      }

      return {
        success: false,
        message: errorMessage,
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
      console.log('Verifying OTP for phone:', session.phoneNumber);

      const result = await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phoneNumber,
          phoneCodeHash: hashToUse,
          phoneCode: code,
        })
      );

      // Save session string
      const sessionString = this.client.session.save() as unknown as string;
      console.log('OTP verified successfully, session saved');

      // Update session in database
      await db.update(telegramSessions)
        .set({
          sessionString: sessionString,
          isActive: true,
          lastHealthCheck: new Date(),
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return {
        success: true,
        message: 'Successfully authenticated with Telegram',
        sessionId: this.sessionId
      };

    } catch (error: any) {
      console.error('Failed to verify OTP:', error);

      // Handle specific Telegram errors
      if (error.message.includes('PHONE_CODE_INVALID')) {
        return {
          success: false,
          message: 'Invalid verification code. Please check and try again.',
          error: 'PHONE_CODE_INVALID'
        };
      }

      if (error.message.includes('PHONE_CODE_EXPIRED')) {
        return {
          success: false,
          message: 'Verification code expired. Please request a new one.',
          error: 'PHONE_CODE_EXPIRED'
        };
      }

      if (error.message.includes('SESSION_PASSWORD_NEEDED')) {
        return {
          success: false,
          message: 'Two-factor authentication is enabled. Please disable it and try again.',
          error: 'SESSION_PASSWORD_NEEDED'
        };
      }

      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
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

        if (sessionData.length === 0 || !sessionData[0].sessionString) {
          throw new Error('No active session found');
        }

        await this.initializeClient(sessionData[0].sessionString);
      }

      if (!this.client) {
        throw new Error('Failed to initialize client');
      }

      console.log('Getting channels for session:', this.sessionId);

      const result = await this.client.invoke(new Api.messages.GetDialogs({
        offsetDate: 0,
        offsetId: 0,
        offsetPeer: new Api.InputPeerEmpty(),
        limit: 100,
        hash: BigInt(0),
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

      console.log('Found', channels.length, 'channels');
      return channels;

    } catch (error) {
      console.error('Failed to get channels:', error);
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

        if (sessionData.length === 0 || !sessionData[0].sessionString) {
          return false;
        }

        await this.initializeClient(sessionData[0].sessionString);
      }

      if (!this.client) {
        return false;
      }

      // Simple ping to check if session is still valid
      await this.client.invoke(new Api.users.GetFullUser({
        id: new Api.InputUserSelf(),
      }));

      // Update last health check
      await db.update(telegramSessions)
        .set({
          lastHealthCheck: new Date(),
          isActive: true
        })
        .where(eq(telegramSessions.id, this.sessionId));

      return true;

    } catch (error) {
      console.error('Health check failed for session', this.sessionId, ':', error);

      // Update session status to inactive
      await db.update(telegramSessions)
        .set({
          isActive: false,
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
      
      RealTelegramApiClient.instances.delete(this.sessionId);
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

export const realTelegramApiManager = {
  async createSession(userId: number, phoneNumber: string): Promise<number> {
    const [session] = await db.insert(telegramSessions)
      .values({
        userId,
        phoneNumber,
        sessionString: null,
        isActive: false,
        lastHealthCheck: null,
        accountName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return session.id;
  },

  async getClient(sessionId: number, userId: number): Promise<RealTelegramApiClient> {
    return RealTelegramApiClient.getInstance(sessionId, userId);
  },

  async healthCheckAll(): Promise<void> {
    try {
      const sessions = await db.select()
        .from(telegramSessions)
        .where(eq(telegramSessions.isActive, true));

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