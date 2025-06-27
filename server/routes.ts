import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramClient } from "./telegram-client";
import { sessionManager } from "./session-manager";
import { queueManager } from "./queue-manager";
import { 
  insertUserSchema, 
  insertForwardingPairSchema, 
  insertTelegramSessionSchema,
  insertBlockedSentenceSchema,
  insertBlockedImageSchema,
  type User 
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware
interface AuthRequest extends Request {
  user?: User;
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize services
  await sessionManager.initialize();
  await queueManager.initialize();
  await telegramClient.initializeSessions();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email) || 
                          await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ user: { ...req.user!, password: undefined } });
  });

  // Telegram Authentication Routes
  app.post("/api/telegram/send-otp", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, countryCode } = req.body;
      
      if (!phoneNumber || !countryCode) {
        return res.status(400).json({ message: "Phone number and country code are required" });
      }

      const result = await telegramClient.sendOTP({ phoneNumber, countryCode });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/telegram/verify-otp", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, otpCode } = req.body;
      
      if (!phoneNumber || !otpCode) {
        return res.status(400).json({ message: "Phone number and OTP code are required" });
      }

      const result = await telegramClient.verifyOTP({
        phoneNumber,
        otpCode,
        userId: req.user!.id
      });

      if (result.success && result.sessionId) {
        await sessionManager.addSession(result.sessionId);
        
        await storage.createActivityLog({
          userId: req.user!.id,
          telegramSessionId: result.sessionId,
          type: 'telegram_login',
          message: `Successfully connected Telegram account ${result.accountName}`,
          metadata: { phoneNumber }
        });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Telegram Session Management
  app.get("/api/telegram/sessions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessions = await storage.getTelegramSessions(req.user!.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Telegram sessions" });
    }
  });

  app.delete("/api/telegram/sessions/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      await telegramClient.disconnectSession(sessionId, req.user!.id);
      await sessionManager.removeSession(sessionId);
      
      const success = await storage.deleteTelegramSession(sessionId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        telegramSessionId: sessionId,
        type: 'telegram_logout',
        message: 'Telegram session disconnected',
        metadata: { sessionId }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect session" });
    }
  });

  app.get("/api/telegram/sessions/:id/channels", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const session = await storage.getTelegramSession(sessionId, req.user!.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const channels = await telegramClient.getJoinedChannels(sessionId, req.user!.id);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/telegram/sessions/:id/health", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const session = await storage.getTelegramSession(sessionId, req.user!.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const health = sessionManager.getSessionHealth(sessionId);
      const isHealthy = await sessionManager.triggerHealthCheck(sessionId);
      
      res.json({
        isHealthy,
        health,
        lastCheck: health?.lastCheck,
        errorCount: health?.errorCount || 0,
        recoveryActions: sessionManager.getRecoveryActions(sessionId)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check session health" });
    }
  });

  // Forwarding Pair Management
  app.get("/api/forwarding-pairs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const pairs = await storage.getForwardingPairs(req.user!.id);
      res.json(pairs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forwarding pairs" });
    }
  });

  app.post("/api/forwarding-pairs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const pairData = insertForwardingPairSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const session = await storage.getTelegramSession(pairData.telegramSessionId, req.user!.id);
      if (!session) {
        return res.status(400).json({ message: "Invalid Telegram session" });
      }

      const pair = await storage.createForwardingPair(pairData);

      await storage.createActivityLog({
        userId: req.user!.id,
        forwardingPairId: pair.id,
        telegramSessionId: pair.telegramSessionId,
        type: 'pair_created',
        message: `Created forwarding pair from ${pair.sourceChannel} to ${pair.destinationChannel}`,
        metadata: { 
          delay: pair.delay,
          copyMode: pair.copyMode,
          silentMode: pair.silentMode
        }
      });

      res.json(pair);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create forwarding pair" });
      }
    }
  });

  app.put("/api/forwarding-pairs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const pair = await storage.updateForwardingPair(id, req.user!.id, updates);
      if (!pair) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        forwardingPairId: pair.id,
        telegramSessionId: pair.telegramSessionId,
        type: 'pair_updated',
        message: `Updated forwarding pair settings`,
        metadata: updates
      });
      
      res.json(pair);
    } catch (error) {
      res.status(500).json({ message: "Failed to update forwarding pair" });
    }
  });

  app.delete("/api/forwarding-pairs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const pair = await storage.getForwardingPair(id, req.user!.id);
      if (!pair) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      const success = await storage.deleteForwardingPair(id, req.user!.id);
      
      if (success) {
        await storage.createActivityLog({
          userId: req.user!.id,
          forwardingPairId: id,
          telegramSessionId: pair.telegramSessionId,
          type: 'pair_deleted',
          message: `Deleted forwarding pair from ${pair.sourceChannel} to ${pair.destinationChannel}`,
          metadata: { pairId: id }
        });
      }
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete forwarding pair" });
    }
  });

  app.post("/api/forwarding-pairs/:id/pause", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.pauseForwardingPair(id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        forwardingPairId: id,
        type: 'pair_paused',
        message: 'Forwarding pair paused',
        metadata: { pairId: id }
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause forwarding pair" });
    }
  });

  app.post("/api/forwarding-pairs/:id/resume", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.resumeForwardingPair(id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        forwardingPairId: id,
        type: 'pair_resumed',
        message: 'Forwarding pair resumed',
        metadata: { pairId: id }
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume forwarding pair" });
    }
  });

  // Blocking Management
  app.get("/api/blocked-sentences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const forwardingPairId = req.query.forwardingPairId ? parseInt(req.query.forwardingPairId as string) : undefined;
      const sentences = await storage.getBlockedSentences(req.user!.id, forwardingPairId);
      res.json(sentences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocked sentences" });
    }
  });

  app.post("/api/blocked-sentences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sentenceData = insertBlockedSentenceSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const sentence = await storage.createBlockedSentence(sentenceData);
      res.json(sentence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create blocked sentence" });
      }
    }
  });

  app.delete("/api/blocked-sentences/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlockedSentence(id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Blocked sentence not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blocked sentence" });
    }
  });

  app.get("/api/blocked-images", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const forwardingPairId = req.query.forwardingPairId ? parseInt(req.query.forwardingPairId as string) : undefined;
      const images = await storage.getBlockedImages(req.user!.id, forwardingPairId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocked images" });
    }
  });

  app.post("/api/blocked-images", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const imageData = insertBlockedImageSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const image = await storage.createBlockedImage(imageData);
      res.json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create blocked image" });
      }
    }
  });

  app.delete("/api/blocked-images/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlockedImage(id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Blocked image not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blocked image" });
    }
  });

  // Queue Management
  app.get("/api/queue/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await queueManager.getQueueStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue stats" });
    }
  });

  app.post("/api/queue/pause", authenticateToken, async (req: AuthRequest, res) => {
    try {
      queueManager.pauseProcessing();
      res.json({ success: true, message: "Queue processing paused" });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause queue processing" });
    }
  });

  app.post("/api/queue/resume", authenticateToken, async (req: AuthRequest, res) => {
    try {
      queueManager.resumeProcessing();
      res.json({ success: true, message: "Queue processing resumed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume queue processing" });
    }
  });

  app.post("/api/queue/clear-failed", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const clearedCount = await queueManager.clearFailedItems();
      res.json({ success: true, clearedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear failed items" });
    }
  });

  // Activity and Dashboard
  app.get("/api/activity-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogs(req.user!.id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user!.id);
      const queueStats = await queueManager.getQueueStats();
      const sessionStats = sessionManager.getSessionStats();
      
      res.json({
        ...stats,
        queue: queueStats,
        sessions: sessionStats
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // System Health
  app.get("/api/health", async (req, res) => {
    try {
      const queueStats = await queueManager.getQueueStats();
      const sessionStats = sessionManager.getSessionStats();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          telegram: "active",
          queue: queueStats,
          sessions: sessionStats
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service health check failed"
      });
    }
  });

  return httpServer;
}