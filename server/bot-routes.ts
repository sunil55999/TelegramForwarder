import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { errorHandler } from './error-handler';
import { sessionManager } from './session-manager';
import { queueManager } from './queue-manager';
import { telegramClient } from './telegram-client';
import { channelManager } from './channel-manager';
import { paymentGateway } from './payment-gateway';

interface TelegramBotUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message?: any;
    data?: string;
  };
}

interface BotCommand {
  command: string;
  description: string;
  handler: (userId: number, chatId: number, args: string[]) => Promise<string>;
  requiresAuth: boolean;
}

export class TelegramBot {
  private static instance: TelegramBot;
  private botToken: string = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
  private userSessions: Map<number, { userId?: number; state?: string }> = new Map();
  private commands: Map<string, BotCommand> = new Map();

  static getInstance(): TelegramBot {
    if (!TelegramBot.instance) {
      TelegramBot.instance = new TelegramBot();
    }
    return TelegramBot.instance;
  }

  constructor() {
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Public commands
    this.commands.set('/start', {
      command: '/start',
      description: 'Start using AutoForwardX bot',
      handler: this.handleStart.bind(this),
      requiresAuth: false,
    });

    this.commands.set('/help', {
      command: '/help',
      description: 'Show available commands',
      handler: this.handleHelp.bind(this),
      requiresAuth: false,
    });

    this.commands.set('/login', {
      command: '/login',
      description: 'Link your AutoForwardX account',
      handler: this.handleLogin.bind(this),
      requiresAuth: false,
    });

    // Authenticated commands
    this.commands.set('/status', {
      command: '/status',
      description: 'Check your forwarding status',
      handler: this.handleStatus.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/pairs', {
      command: '/pairs',
      description: 'List your forwarding pairs',
      handler: this.handlePairs.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/pause', {
      command: '/pause',
      description: 'Pause a forwarding pair',
      handler: this.handlePause.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/resume', {
      command: '/resume',
      description: 'Resume a forwarding pair',
      handler: this.handleResume.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/stats', {
      command: '/stats',
      description: 'View your account statistics',
      handler: this.handleStats.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/plan', {
      command: '/plan',
      description: 'View your current plan',
      handler: this.handlePlan.bind(this),
      requiresAuth: true,
    });

    this.commands.set('/errors', {
      command: '/errors',
      description: 'Check recent errors',
      handler: this.handleErrors.bind(this),
      requiresAuth: true,
    });
  }

  async processUpdate(update: TelegramBotUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('Error processing bot update:', error);
      await errorHandler.handleError(error as Error, {
        errorType: 'telegram_api',
      });
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;

    // Check if it's a command
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0];
      const args = parts.slice(1);

      const botCommand = this.commands.get(command);
      if (botCommand) {
        // Check authentication if required
        if (botCommand.requiresAuth) {
          const session = this.userSessions.get(userId);
          if (!session || !session.userId) {
            await this.sendMessage(chatId, 
              '🔐 Please login first using /login command to link your AutoForwardX account.'
            );
            return;
          }
        }

        const linkedUserId = this.userSessions.get(userId)?.userId || 0;
        const response = await botCommand.handler(linkedUserId, chatId, args);
        await this.sendMessage(chatId, response);
      } else {
        await this.sendMessage(chatId, 
          '❓ Unknown command. Use /help to see available commands.'
        );
      }
    } else {
      // Handle non-command messages based on user state
      const session = this.userSessions.get(userId);
      if (session?.state === 'awaiting_username') {
        await this.handleUsernameInput(userId, chatId, text);
      } else {
        await this.sendMessage(chatId, 
          '💬 Use /help to see available commands or /start to begin.'
        );
      }
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    const userId = query.from.id;
    const data = query.data;
    const chatId = query.message?.chat?.id;

    if (!chatId) return;

    // Handle callback actions
    if (data?.startsWith('pause_pair_')) {
      const pairId = parseInt(data.replace('pause_pair_', ''));
      await this.handlePairAction(userId, chatId, pairId, 'pause');
    } else if (data?.startsWith('resume_pair_')) {
      const pairId = parseInt(data.replace('resume_pair_', ''));
      await this.handlePairAction(userId, chatId, pairId, 'resume');
    }
  }

  // Command handlers
  private async handleStart(userId: number, chatId: number, args: string[]): Promise<string> {
    return `🚀 Welcome to AutoForwardX Bot!

AutoForwardX helps you automatically forward messages between Telegram channels.

📋 Available commands:
• /help - Show all commands
• /login - Link your AutoForwardX account
• /status - Check forwarding status
• /pairs - Manage forwarding pairs

🔗 To get started, use /login to connect your AutoForwardX account.`;
  }

  private async handleHelp(userId: number, chatId: number, args: string[]): Promise<string> {
    let help = '📋 Available Commands:\n\n';
    
    for (const [command, info] of this.commands) {
      const authIcon = info.requiresAuth ? '🔐' : '🔓';
      help += `${authIcon} ${command} - ${info.description}\n`;
    }

    help += '\n💡 Commands marked with 🔐 require account linking via /login';
    return help;
  }

  private async handleLogin(userId: number, chatId: number, args: string[]): Promise<string> {
    if (args.length === 0) {
      this.userSessions.set(userId, { state: 'awaiting_username' });
      return `🔐 Please enter your AutoForwardX username:`;
    }

    const username = args[0];
    try {
      const user = await storage.getUserByUsername(username);
      if (user) {
        this.userSessions.set(userId, { userId: user.id, state: 'authenticated' });
        
        // Log the bot login
        await storage.createActivityLog({
          userId: user.id,
          type: 'bot_action',
          action: 'bot_login',
          message: 'User linked Telegram bot to account',
          details: 'Bot authentication successful',
          metadata: { telegramUserId: userId, chatId },
        });

        return `✅ Successfully linked to your AutoForwardX account!
        
📊 Account: ${user.username}
📋 Plan: ${user.plan.toUpperCase()}

Use /status to check your forwarding pairs or /help for all commands.`;
      } else {
        return `❌ Username not found. Please check your username and try again.`;
      }
    } catch (error) {
      return `❌ Error linking account. Please try again later.`;
    }
  }

  private async handleUsernameInput(telegramUserId: number, chatId: number, username: string): Promise<void> {
    try {
      const user = await storage.getUserByUsername(username);
      if (user) {
        this.userSessions.set(telegramUserId, { userId: user.id, state: 'authenticated' });
        
        await storage.createActivityLog({
          userId: user.id,
          type: 'bot_action',
          action: 'bot_login',
          message: 'User linked Telegram bot to account',
          details: 'Bot authentication successful',
          metadata: { telegramUserId, chatId },
        });

        await this.sendMessage(chatId, `✅ Successfully linked to ${user.username}!
        
Use /status to check your forwarding pairs or /help for all commands.`);
      } else {
        await this.sendMessage(chatId, `❌ Username "${username}" not found. Please try again or use /login.`);
        this.userSessions.delete(telegramUserId);
      }
    } catch (error) {
      await this.sendMessage(chatId, `❌ Error linking account. Please try again with /login.`);
      this.userSessions.delete(telegramUserId);
    }
  }

  private async handleStatus(userId: number, chatId: number, args: string[]): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return '❌ User not found.';

      const sessions = await storage.getTelegramSessions(userId);
      const pairs = await storage.getForwardingPairs(userId);
      const activePairs = pairs.filter(p => p.isActive);
      const queueStats = await queueManager.getQueueStats();

      const healthySessions = sessions.filter(s => {
        const health = sessionManager.getSessionHealth(s.id);
        return health?.isHealthy;
      });

      return `📊 AutoForwardX Status

👤 Account: ${user.username}
📋 Plan: ${user.plan.toUpperCase()}

📱 Telegram Sessions: ${healthySessions.length}/${sessions.length} healthy
🔄 Forwarding Pairs: ${activePairs.length}/${pairs.length} active
📤 Queue: ${queueStats.pending} pending, ${queueStats.processing} processing

${activePairs.length > 0 ? 'Use /pairs to manage your forwarding pairs.' : 'No active forwarding pairs. Set them up on the web dashboard.'}`;
    } catch (error) {
      return '❌ Error fetching status. Please try again.';
    }
  }

  private async handlePairs(userId: number, chatId: number, args: string[]): Promise<string> {
    try {
      const pairs = await storage.getForwardingPairs(userId);
      
      if (pairs.length === 0) {
        return '📋 No forwarding pairs found. Create them on the web dashboard at autoforwardx.com';
      }

      let response = `📋 Your Forwarding Pairs (${pairs.length}):\n\n`;
      
      for (const pair of pairs.slice(0, 10)) { // Limit to 10 pairs
        const status = pair.isActive ? '✅ Active' : '⏸️ Paused';
        const delay = pair.delay > 0 ? ` (${pair.delay}s delay)` : '';
        
        response += `${status} Pair #${pair.id}${delay}\n`;
        response += `📥 From: ${pair.sourceChannel}\n`;
        response += `📤 To: ${pair.destinationChannel}\n`;
        response += `📊 Forwarded: ${pair.messagesForwarded} messages\n\n`;
      }

      if (pairs.length > 10) {
        response += `... and ${pairs.length - 10} more pairs\n\n`;
      }

      response += 'Use /pause <pair_id> or /resume <pair_id> to control pairs.';
      return response;
    } catch (error) {
      return '❌ Error fetching forwarding pairs. Please try again.';
    }
  }

  private async handlePause(userId: number, chatId: number, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '❓ Please specify a pair ID. Example: /pause 123';
    }

    const pairId = parseInt(args[0]);
    if (isNaN(pairId)) {
      return '❓ Please provide a valid pair ID number.';
    }

    try {
      const success = await storage.pauseForwardingPair(pairId, userId);
      if (success) {
        await storage.createActivityLog({
          userId,
          type: 'bot_action',
          action: 'pair_paused',
          message: 'Forwarding pair paused via bot',
          details: `Pair ${pairId} paused`,
          forwardingPairId: pairId,
          metadata: { pairId, source: 'telegram_bot' },
        });

        return `⏸️ Forwarding pair #${pairId} has been paused.`;
      } else {
        return `❌ Failed to pause pair #${pairId}. Please check the pair ID.`;
      }
    } catch (error) {
      return '❌ Error pausing forwarding pair. Please try again.';
    }
  }

  private async handleResume(userId: number, chatId: number, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '❓ Please specify a pair ID. Example: /resume 123';
    }

    const pairId = parseInt(args[0]);
    if (isNaN(pairId)) {
      return '❓ Please provide a valid pair ID number.';
    }

    try {
      const success = await storage.resumeForwardingPair(pairId, userId);
      if (success) {
        await storage.createActivityLog({
          userId,
          type: 'bot_action',
          action: 'pair_resumed',
          message: 'Forwarding pair resumed via bot',
          details: `Pair ${pairId} resumed`,
          forwardingPairId: pairId,
          metadata: { pairId, source: 'telegram_bot' },
        });

        return `▶️ Forwarding pair #${pairId} has been resumed.`;
      } else {
        return `❌ Failed to resume pair #${pairId}. Please check the pair ID.`;
      }
    } catch (error) {
      return '❌ Error resuming forwarding pair. Please try again.';
    }
  }

  private async handleStats(userId: number, chatId: number, args: string[]): Promise<string> {
    try {
      const stats = await storage.getDashboardStats(userId);
      const planLimits = await paymentGateway.checkPlanLimits(userId);
      
      return `📊 Account Statistics

🔄 Active Pairs: ${stats.activePairs}
📱 Connected Accounts: ${stats.connectedAccounts}
📈 Success Rate: ${stats.successRate}%
📤 Messages Today: ${stats.messagesToday}

📋 Plan Limits:
• Max Accounts: ${planLimits.planFeatures.maxAccounts}
• Max Pairs: ${planLimits.planFeatures.maxPairs}
• Daily Messages: ${planLimits.planFeatures.messagesPerDay}

${planLimits.planFeatures.advancedFiltering ? '✅' : '❌'} Advanced Filtering
${planLimits.planFeatures.customWatermarks ? '✅' : '❌'} Custom Watermarks
${planLimits.planFeatures.prioritySupport ? '✅' : '❌'} Priority Support`;
    } catch (error) {
      return '❌ Error fetching statistics. Please try again.';
    }
  }

  private async handlePlan(userId: number, chatId: number, args: string[]): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return '❌ User not found.';

      const planLimits = await paymentGateway.checkPlanLimits(userId);
      const isExpired = await paymentGateway.isPlanExpired(userId);

      let response = `📋 Current Plan: ${user.plan.toUpperCase()}\n\n`;

      if (user.planExpiryDate) {
        const expiryDate = new Date(user.planExpiryDate);
        response += `📅 Expires: ${expiryDate.toDateString()}\n`;
        if (isExpired) {
          response += `⚠️ Plan has expired! Please renew to continue using premium features.\n\n`;
        }
      }

      response += `📊 Plan Features:
• Max Accounts: ${planLimits.planFeatures.maxAccounts}
• Max Pairs: ${planLimits.planFeatures.maxPairs}
• Daily Messages: ${planLimits.planFeatures.messagesPerDay}
• Advanced Filtering: ${planLimits.planFeatures.advancedFiltering ? 'Yes' : 'No'}
• Custom Watermarks: ${planLimits.planFeatures.customWatermarks ? 'Yes' : 'No'}
• Priority Support: ${planLimits.planFeatures.prioritySupport ? 'Yes' : 'No'}

💳 To upgrade your plan, visit autoforwardx.com/pricing`;

      return response;
    } catch (error) {
      return '❌ Error fetching plan information. Please try again.';
    }
  }

  private async handleErrors(userId: number, chatId: number, args: string[]): Promise<string> {
    try {
      const errors = errorHandler.getErrorReports({ 
        userId, 
        resolved: false, 
        limit: 5 
      });

      if (errors.length === 0) {
        return '✅ No recent errors found. Your system is running smoothly!';
      }

      let response = `⚠️ Recent Errors (${errors.length}):\n\n`;

      for (const error of errors) {
        const severity = error.severity === 'critical' ? '🔴' : 
                        error.severity === 'high' ? '🟠' : 
                        error.severity === 'medium' ? '🟡' : '🟢';
        
        response += `${severity} ${error.errorType.replace('_', ' ').toUpperCase()}\n`;
        response += `📝 ${error.message}\n`;
        response += `⏰ ${error.timestamp.toLocaleString()}\n\n`;
      }

      response += '🔧 Check the web dashboard for detailed error resolution.';
      return response;
    } catch (error) {
      return '❌ Error fetching error reports. Please try again.';
    }
  }

  private async handlePairAction(telegramUserId: number, chatId: number, pairId: number, action: 'pause' | 'resume'): Promise<void> {
    const session = this.userSessions.get(telegramUserId);
    if (!session?.userId) {
      await this.sendMessage(chatId, '🔐 Please login first using /login command.');
      return;
    }

    try {
      let success = false;
      if (action === 'pause') {
        success = await storage.pauseForwardingPair(pairId, session.userId);
      } else {
        success = await storage.resumeForwardingPair(pairId, session.userId);
      }

      if (success) {
        const emoji = action === 'pause' ? '⏸️' : '▶️';
        await this.sendMessage(chatId, `${emoji} Pair #${pairId} ${action}d successfully!`);
        
        await storage.createActivityLog({
          userId: session.userId,
          type: 'bot_action',
          action: `pair_${action}`,
          message: `Forwarding pair ${action}d via bot callback`,
          details: `Pair ${pairId} ${action}d`,
          forwardingPairId: pairId,
          metadata: { pairId, source: 'telegram_bot_callback' },
        });
      } else {
        await this.sendMessage(chatId, `❌ Failed to ${action} pair #${pairId}.`);
      }
    } catch (error) {
      await this.sendMessage(chatId, `❌ Error ${action}ing pair. Please try again.`);
    }
  }

  async sendMessage(chatId: number, text: string, options?: any): Promise<boolean> {
    try {
      // In a real implementation, this would use the Telegram Bot API
      // For now, we'll just log the message
      console.log(`[BOT MESSAGE] Chat ${chatId}: ${text}`);
      return true;
    } catch (error) {
      console.error('Error sending bot message:', error);
      return false;
    }
  }

  async sendNotification(userId: number, message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<boolean> {
    try {
      // Find user's Telegram chat ID from active sessions
      let chatId: number | null = null;
      for (const [telegramUserId, session] of this.userSessions) {
        if (session.userId === userId) {
          chatId = telegramUserId;
          break;
        }
      }

      if (!chatId) {
        console.log(`No Telegram chat found for user ${userId}`);
        return false;
      }

      const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
      return await this.sendMessage(chatId, `${emoji} ${message}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async broadcastToAdmins(message: string): Promise<number> {
    let sentCount = 0;
    
    // Send to admin chat IDs (would be configured in environment)
    const adminChatIds = process.env.ADMIN_TELEGRAM_CHATS?.split(',').map(id => parseInt(id)) || [];
    
    for (const chatId of adminChatIds) {
      if (await this.sendMessage(chatId, `🔔 ADMIN: ${message}`)) {
        sentCount++;
      }
    }

    return sentCount;
  }
}

export async function registerBotRoutes(app: Express): Promise<void> {
  const bot = TelegramBot.getInstance();

  // Webhook endpoint for Telegram bot
  app.post("/api/bot/webhook", async (req: Request, res: Response) => {
    try {
      const update: TelegramBotUpdate = req.body;
      await bot.processUpdate(update);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Bot webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Send notification endpoint (for internal use)
  app.post("/api/bot/notify", async (req: Request, res: Response) => {
    try {
      const { userId, message, type } = req.body;
      const success = await bot.sendNotification(userId, message, type);
      res.json({ success });
    } catch (error) {
      console.error('Bot notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // Admin broadcast endpoint
  app.post("/api/bot/broadcast", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      const sentCount = await bot.broadcastToAdmins(message);
      res.json({ success: true, sentCount });
    } catch (error) {
      console.error('Bot broadcast error:', error);
      res.status(500).json({ error: 'Failed to send broadcast' });
    }
  });
}

export const telegramBot = TelegramBot.getInstance();