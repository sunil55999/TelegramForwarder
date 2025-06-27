import { 
  users, 
  telegramSessions,
  forwardingPairs, 
  activityLogs,
  blockedSentences,
  blockedImages,
  forwardingQueue,
  contentFilters,
  payments,
  type User, 
  type InsertUser, 
  type TelegramSession,
  type InsertTelegramSession,
  type ForwardingPair, 
  type InsertForwardingPair, 
  type ActivityLog, 
  type InsertActivityLog,
  type BlockedSentence,
  type InsertBlockedSentence,
  type BlockedImage,
  type InsertBlockedImage,
  type ForwardingQueue,
  type InsertForwardingQueue,
  type ContentFilter,
  type InsertContentFilter,
  type Payment,
  type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Telegram session operations
  getTelegramSessions(userId: number): Promise<TelegramSession[]>;
  getTelegramSession(id: number, userId: number): Promise<TelegramSession | undefined>;
  getTelegramSessionByPhone(phoneNumber: string, userId: number): Promise<TelegramSession | undefined>;
  createTelegramSession(session: InsertTelegramSession): Promise<TelegramSession>;
  updateTelegramSession(id: number, userId: number, updates: Partial<TelegramSession>): Promise<TelegramSession | undefined>;
  deleteTelegramSession(id: number, userId: number): Promise<boolean>;
  updateSessionHealth(id: number, userId: number, isHealthy: boolean): Promise<void>;

  // Forwarding pair operations
  getForwardingPairs(userId: number): Promise<ForwardingPair[]>;
  getForwardingPair(id: number, userId: number): Promise<ForwardingPair | undefined>;
  createForwardingPair(pair: InsertForwardingPair): Promise<ForwardingPair>;
  updateForwardingPair(id: number, userId: number, updates: Partial<ForwardingPair>): Promise<ForwardingPair | undefined>;
  deleteForwardingPair(id: number, userId: number): Promise<boolean>;
  pauseForwardingPair(id: number, userId: number): Promise<boolean>;
  resumeForwardingPair(id: number, userId: number): Promise<boolean>;

  // Blocking operations
  getBlockedSentences(userId: number, forwardingPairId?: number): Promise<BlockedSentence[]>;
  createBlockedSentence(sentence: InsertBlockedSentence): Promise<BlockedSentence>;
  deleteBlockedSentence(id: number, userId: number): Promise<boolean>;
  getBlockedImages(userId: number, forwardingPairId?: number): Promise<BlockedImage[]>;
  createBlockedImage(image: InsertBlockedImage): Promise<BlockedImage>;
  deleteBlockedImage(id: number, userId: number): Promise<boolean>;

  // Queue operations
  addToQueue(queueItem: InsertForwardingQueue): Promise<ForwardingQueue>;
  getQueueItems(status?: string, limit?: number): Promise<ForwardingQueue[]>;
  updateQueueItem(id: number, updates: Partial<ForwardingQueue>): Promise<ForwardingQueue | undefined>;
  completeQueueItem(id: number): Promise<boolean>;
  failQueueItem(id: number, error: string): Promise<boolean>;

  // Activity log operations
  getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Content filter operations
  getContentFilters(userId: number, forwardingPairId?: number): Promise<ContentFilter[]>;
  createContentFilter(filter: InsertContentFilter): Promise<ContentFilter>;
  deleteContentFilter(id: number, userId: number): Promise<boolean>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | undefined>;
  updatePayment(paymentId: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  getUsersByPlan(plan: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllTelegramSessions(): Promise<TelegramSession[]>;
  getAllForwardingPairs(): Promise<ForwardingPair[]>;
  getTelegramSessionById(id: number): Promise<TelegramSession | undefined>;
  getForwardingPairById(id: number): Promise<ForwardingPair | undefined>;

  // Dashboard stats
  getDashboardStats(userId: number): Promise<{
    activePairs: number;
    messagesToday: number;
    successRate: number;
    connectedAccounts: number;
  }>;

  // Missing methods for error recovery
  testConnection(): Promise<boolean>;
  getForwardingPairsByTelegramSession(sessionId: number): Promise<ForwardingPair[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    // Get user through their Telegram session with this phone number
    const result = await db.select({ user: users })
      .from(users)
      .innerJoin(telegramSessions, eq(users.id, telegramSessions.userId))
      .where(eq(telegramSessions.phoneNumber, phoneNumber))
      .limit(1);
    
    return result[0]?.user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Telegram session operations
  async getTelegramSessions(userId: number): Promise<TelegramSession[]> {
    return await db.select().from(telegramSessions).where(eq(telegramSessions.userId, userId));
  }

  async getTelegramSession(id: number, userId: number): Promise<TelegramSession | undefined> {
    const [session] = await db.select().from(telegramSessions)
      .where(and(eq(telegramSessions.id, id), eq(telegramSessions.userId, userId)));
    return session || undefined;
  }

  async getTelegramSessionByPhone(phoneNumber: string, userId: number): Promise<TelegramSession | undefined> {
    const [session] = await db.select().from(telegramSessions)
      .where(and(eq(telegramSessions.phoneNumber, phoneNumber), eq(telegramSessions.userId, userId)));
    return session || undefined;
  }

  async createTelegramSession(session: InsertTelegramSession): Promise<TelegramSession> {
    const [newSession] = await db.insert(telegramSessions).values(session).returning();
    return newSession;
  }

  async updateTelegramSession(id: number, userId: number, updates: Partial<TelegramSession>): Promise<TelegramSession | undefined> {
    const [session] = await db.update(telegramSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(telegramSessions.id, id), eq(telegramSessions.userId, userId)))
      .returning();
    return session || undefined;
  }

  async deleteTelegramSession(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(telegramSessions)
      .where(and(eq(telegramSessions.id, id), eq(telegramSessions.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async updateSessionHealth(id: number, userId: number, isHealthy: boolean): Promise<void> {
    await db.update(telegramSessions)
      .set({ 
        isActive: isHealthy, 
        lastHealthCheck: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(telegramSessions.id, id), eq(telegramSessions.userId, userId)));
  }

  // Forwarding pair operations
  async getForwardingPairs(userId: number): Promise<ForwardingPair[]> {
    return await db.select().from(forwardingPairs).where(eq(forwardingPairs.userId, userId));
  }

  async getForwardingPair(id: number, userId: number): Promise<ForwardingPair | undefined> {
    const [pair] = await db.select().from(forwardingPairs)
      .where(and(eq(forwardingPairs.id, id), eq(forwardingPairs.userId, userId)));
    return pair || undefined;
  }

  async createForwardingPair(pair: InsertForwardingPair): Promise<ForwardingPair> {
    const [newPair] = await db.insert(forwardingPairs).values(pair).returning();
    return newPair;
  }

  async updateForwardingPair(id: number, userId: number, updates: Partial<ForwardingPair>): Promise<ForwardingPair | undefined> {
    const [pair] = await db.update(forwardingPairs)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(forwardingPairs.id, id), eq(forwardingPairs.userId, userId)))
      .returning();
    return pair || undefined;
  }

  async deleteForwardingPair(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(forwardingPairs)
      .where(and(eq(forwardingPairs.id, id), eq(forwardingPairs.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async pauseForwardingPair(id: number, userId: number): Promise<boolean> {
    const result = await this.updateForwardingPair(id, userId, { isActive: false });
    return result !== undefined;
  }

  async resumeForwardingPair(id: number, userId: number): Promise<boolean> {
    const result = await this.updateForwardingPair(id, userId, { isActive: true });
    return result !== undefined;
  }

  // Blocking operations
  async getBlockedSentences(userId: number, forwardingPairId?: number): Promise<BlockedSentence[]> {
    const conditions = [eq(blockedSentences.userId, userId)];
    if (forwardingPairId) {
      conditions.push(eq(blockedSentences.forwardingPairId, forwardingPairId));
    }
    return await db.select().from(blockedSentences).where(and(...conditions));
  }

  async createBlockedSentence(sentence: InsertBlockedSentence): Promise<BlockedSentence> {
    const [newSentence] = await db.insert(blockedSentences).values(sentence).returning();
    return newSentence;
  }

  async deleteBlockedSentence(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(blockedSentences)
      .where(and(eq(blockedSentences.id, id), eq(blockedSentences.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getBlockedImages(userId: number, forwardingPairId?: number): Promise<BlockedImage[]> {
    const conditions = [eq(blockedImages.userId, userId)];
    if (forwardingPairId) {
      conditions.push(eq(blockedImages.forwardingPairId, forwardingPairId));
    }
    return await db.select().from(blockedImages).where(and(...conditions));
  }

  async createBlockedImage(image: InsertBlockedImage): Promise<BlockedImage> {
    const [newImage] = await db.insert(blockedImages).values(image).returning();
    return newImage;
  }

  async deleteBlockedImage(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(blockedImages)
      .where(and(eq(blockedImages.id, id), eq(blockedImages.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Queue operations
  async addToQueue(queueItem: InsertForwardingQueue): Promise<ForwardingQueue> {
    const [item] = await db.insert(forwardingQueue).values(queueItem).returning();
    return item;
  }

  async getQueueItems(status?: string, limit: number = 100): Promise<ForwardingQueue[]> {
    if (status) {
      return await db.select().from(forwardingQueue)
        .where(eq(forwardingQueue.status, status))
        .orderBy(forwardingQueue.scheduledTime)
        .limit(limit);
    }
    
    return await db.select().from(forwardingQueue)
      .orderBy(forwardingQueue.scheduledTime)
      .limit(limit);
  }

  async updateQueueItem(id: number, updates: Partial<ForwardingQueue>): Promise<ForwardingQueue | undefined> {
    const [item] = await db.update(forwardingQueue)
      .set(updates)
      .where(eq(forwardingQueue.id, id))
      .returning();
    return item || undefined;
  }

  async completeQueueItem(id: number): Promise<boolean> {
    const result = await this.updateQueueItem(id, { 
      status: 'completed', 
      processedAt: new Date() 
    });
    return result !== undefined;
  }

  async failQueueItem(id: number, error: string): Promise<boolean> {
    const [item] = await db.select().from(forwardingQueue).where(eq(forwardingQueue.id, id));
    if (!item) return false;

    const result = await this.updateQueueItem(id, { 
      status: 'failed', 
      lastError: error,
      attempts: item.attempts + 1,
      processedAt: new Date() 
    });
    return result !== undefined;
  }

  // Activity log operations
  async getActivityLogs(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Dashboard stats
  async getDashboardStats(userId: number): Promise<{
    activePairs: number;
    messagesToday: number;
    successRate: number;
    connectedAccounts: number;
  }> {
    // Get active pairs count
    const [activePairsResult] = await db.select({ count: count() })
      .from(forwardingPairs)
      .where(and(eq(forwardingPairs.userId, userId), eq(forwardingPairs.isActive, true)));

    // Get connected accounts count
    const [connectedAccountsResult] = await db.select({ count: count() })
      .from(telegramSessions)
      .where(and(eq(telegramSessions.userId, userId), eq(telegramSessions.isActive, true)));

    // Get today's message count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [messagesTodayResult] = await db.select({ count: count() })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.type, 'message_forwarded'),
        sql`${activityLogs.createdAt} >= ${today}`
      ));

    // Calculate success rate from forwarding queue
    const [totalMessages] = await db.select({ count: count() })
      .from(forwardingQueue)
      .innerJoin(forwardingPairs, eq(forwardingQueue.forwardingPairId, forwardingPairs.id))
      .where(eq(forwardingPairs.userId, userId));

    const [successfulMessages] = await db.select({ count: count() })
      .from(forwardingQueue)
      .innerJoin(forwardingPairs, eq(forwardingQueue.forwardingPairId, forwardingPairs.id))
      .where(and(
        eq(forwardingPairs.userId, userId),
        eq(forwardingQueue.status, 'completed')
      ));

    const successRate = totalMessages?.count > 0 
      ? Math.round((successfulMessages?.count || 0) / totalMessages.count * 100)
      : 100;

    return {
      activePairs: activePairsResult?.count || 0,
      messagesToday: messagesTodayResult?.count || 0,
      successRate,
      connectedAccounts: connectedAccountsResult?.count || 0,
    };
  }

  // Content filter operations
  async getContentFilters(userId: number, forwardingPairId?: number): Promise<ContentFilter[]> {
    if (forwardingPairId) {
      return await db.select().from(contentFilters)
        .where(and(eq(contentFilters.userId, userId), eq(contentFilters.forwardingPairId, forwardingPairId)));
    }
    return await db.select().from(contentFilters).where(eq(contentFilters.userId, userId));
  }

  async createContentFilter(filter: InsertContentFilter): Promise<ContentFilter> {
    const [newFilter] = await db.insert(contentFilters).values(filter).returning();
    return newFilter;
  }

  async deleteContentFilter(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(contentFilters)
      .where(and(eq(contentFilters.id, id), eq(contentFilters.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.paymentId, paymentId));
    return payment || undefined;
  }

  async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db.update(payments)
      .set(updates)
      .where(eq(payments.paymentId, paymentId))
      .returning();
    return updatedPayment || undefined;
  }

  async getUsersByPlan(plan: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.plan, plan));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllTelegramSessions(): Promise<TelegramSession[]> {
    return await db.select().from(telegramSessions);
  }

  async getAllForwardingPairs(): Promise<ForwardingPair[]> {
    return await db.select().from(forwardingPairs);
  }

  async getTelegramSessionById(id: number): Promise<TelegramSession | undefined> {
    const [session] = await db.select().from(telegramSessions).where(eq(telegramSessions.id, id));
    return session || undefined;
  }

  async getForwardingPairById(id: number): Promise<ForwardingPair | undefined> {
    const [pair] = await db.select().from(forwardingPairs).where(eq(forwardingPairs.id, id));
    return pair || undefined;
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Get forwarding pairs by telegram session
  async getForwardingPairsByTelegramSession(sessionId: number): Promise<ForwardingPair[]> {
    return await db.select()
      .from(forwardingPairs)
      .where(eq(forwardingPairs.telegramSessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();