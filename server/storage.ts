import { users, forwardingPairs, activityLogs, type User, type InsertUser, type ForwardingPair, type InsertForwardingPair, type ActivityLog, type InsertActivityLog } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Forwarding pair operations
  getForwardingPairs(userId: number): Promise<ForwardingPair[]>;
  getForwardingPair(id: number, userId: number): Promise<ForwardingPair | undefined>;
  createForwardingPair(pair: InsertForwardingPair): Promise<ForwardingPair>;
  updateForwardingPair(id: number, userId: number, updates: Partial<ForwardingPair>): Promise<ForwardingPair | undefined>;
  deleteForwardingPair(id: number, userId: number): Promise<boolean>;

  // Activity log operations
  getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard stats
  getDashboardStats(userId: number): Promise<{
    activePairs: number;
    messagesToday: number;
    successRate: number;
    connectedAccounts: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private forwardingPairs: Map<number, ForwardingPair>;
  private activityLogs: Map<number, ActivityLog>;
  private currentUserId: number;
  private currentPairId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.forwardingPairs = new Map();
    this.activityLogs = new Map();
    this.currentUserId = 1;
    this.currentPairId = 1;
    this.currentLogId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      telegramAccounts: insertUser.telegramAccounts || [],
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getForwardingPairs(userId: number): Promise<ForwardingPair[]> {
    return Array.from(this.forwardingPairs.values()).filter(
      (pair) => pair.userId === userId,
    );
  }

  async getForwardingPair(id: number, userId: number): Promise<ForwardingPair | undefined> {
    const pair = this.forwardingPairs.get(id);
    return pair && pair.userId === userId ? pair : undefined;
  }

  async createForwardingPair(insertPair: InsertForwardingPair): Promise<ForwardingPair> {
    const id = this.currentPairId++;
    const pair: ForwardingPair = { 
      ...insertPair, 
      id, 
      createdAt: new Date(),
      lastActivity: null,
    };
    this.forwardingPairs.set(id, pair);
    return pair;
  }

  async updateForwardingPair(id: number, userId: number, updates: Partial<ForwardingPair>): Promise<ForwardingPair | undefined> {
    const pair = this.forwardingPairs.get(id);
    if (!pair || pair.userId !== userId) return undefined;
    
    const updatedPair = { ...pair, ...updates };
    this.forwardingPairs.set(id, updatedPair);
    return updatedPair;
  }

  async deleteForwardingPair(id: number, userId: number): Promise<boolean> {
    const pair = this.forwardingPairs.get(id);
    if (!pair || pair.userId !== userId) return false;
    
    this.forwardingPairs.delete(id);
    return true;
  }

  async getActivityLogs(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentLogId++;
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      createdAt: new Date(),
      metadata: insertLog.metadata || {},
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getDashboardStats(userId: number): Promise<{
    activePairs: number;
    messagesToday: number;
    successRate: number;
    connectedAccounts: number;
  }> {
    const pairs = await this.getForwardingPairs(userId);
    const activePairs = pairs.filter(pair => pair.isActive).length;
    
    const user = await this.getUser(userId);
    const telegramAccounts = Array.isArray(user?.telegramAccounts) ? user.telegramAccounts : [];
    
    // Mock stats for demonstration
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId && log.createdAt >= today && log.type === 'message_forwarded');

    return {
      activePairs,
      messagesToday: todayLogs.length,
      successRate: 98.5,
      connectedAccounts: telegramAccounts.length,
    };
  }
}

export const storage = new MemStorage();
