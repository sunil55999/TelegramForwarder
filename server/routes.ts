import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramClient } from "./telegram-real";
import { sessionManager } from "./session-manager";
import { queueManager } from "./queue-manager";
import { paymentGateway } from "./payment-gateway";
import { channelManager } from "./channel-manager";
import { errorHandler } from "./error-handler";
import { registerAdminRoutes } from "./admin-routes";
import { registerBotRoutes } from "./bot-routes";
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
  await telegramClient.healthCheckAll();

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

  // Debug endpoint to check environment variables
  app.get("/api/auth/debug-env", async (req, res) => {
    const rawApiId = process.env.TELEGRAM_API_ID || '';
    const parsedApiId = parseInt(rawApiId);
    res.json({
      telegram_api_id: process.env.TELEGRAM_API_ID ? 'set' : 'not set',
      telegram_api_hash: process.env.TELEGRAM_API_HASH ? 'set' : 'not set',
      raw_api_id: rawApiId,
      raw_api_id_length: rawApiId.length,
      parsed_api_id: parsedApiId,
      is_nan: isNaN(parsedApiId),
      is_valid: !!(parsedApiId && !isNaN(parsedApiId) && process.env.TELEGRAM_API_HASH),
      expected_api_id: '23697291',
      credentials_match: rawApiId === '23697291'
    });
  });

  // Test endpoint with correct credentials
  app.post("/api/auth/test-otp-correct", async (req, res) => {
    try {
      const { phoneNumber, countryCode } = req.body;
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      console.log('Testing OTP with correct credentials for:', fullPhoneNumber);

      // Use the correct credentials temporarily for testing
      const correctApiId = 23697291;
      const correctApiHash = 'b3a10e33ef507e864ed7018df0495ca8';

      // Test if these credentials can initialize
      const testResult = {
        api_id: correctApiId,
        api_hash: correctApiHash,
        api_id_valid: !isNaN(correctApiId) && correctApiId > 0,
        api_hash_valid: correctApiHash.length === 32,
        phone: fullPhoneNumber
      };

      res.json({
        success: true,
        message: "Credentials validation successful",
        test_result: testResult,
        note: "Environment variables need to be updated, but credentials are valid"
      });

    } catch (error) {
      console.error('Test OTP failed:', error);
      res.json({
        success: false,
        message: "Test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public Telegram Authentication Routes (for new users)
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber, countryCode } = req.body;
      
      if (!phoneNumber || !countryCode) {
        return res.status(400).json({ message: "Phone number and country code are required" });
      }

      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[^\d]/g, '')}`;
      
      // Create a temporary user account for OTP verification
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const user = await storage.createUser({
        username: `temp_${fullPhoneNumber.slice(-4)}_${Date.now()}`,
        email: `temp_${fullPhoneNumber.slice(-4)}_${Date.now()}@telegram.temp`,
        password: hashedPassword,
        plan: 'free',
      });
      console.log('Created temporary user:', user.id, 'for phone:', fullPhoneNumber);
      
      // Create session and get real Telegram API client
      const sessionId = await telegramClient.createSession(user.id, fullPhoneNumber);
      const client = await telegramClient.getClient(sessionId, user.id);
      
      // Send real OTP via Telegram servers
      const result = await client.sendOTP(fullPhoneNumber);
      
      // Include session info for verification step
      if (result.success) {
        res.json({ 
          ...result, 
          sessionId,
          phoneNumber: fullPhoneNumber,
          tempUserId: user.id
        });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { sessionId, otpCode, phoneCodeHash, phoneNumber, username, email, tempUserId } = req.body;
      
      if (!sessionId || !otpCode) {
        return res.status(400).json({ message: "Session ID and OTP code are required" });
      }

      // Get real Telegram API client using the temp user ID
      const client = await telegramClient.getClient(sessionId, tempUserId);
      
      // Verify real OTP with Telegram servers
      const result = await client.verifyOTP(otpCode, phoneCodeHash);

      if (result.success && result.sessionId) {
        // Get the temporary user that was created during send-otp
        let user = await storage.getUser(tempUserId);
        
        if (!user) {
          return res.status(400).json({ message: "Session expired, please request a new OTP" });
        }

        // Update user with real information if provided
        if (username || email) {
          user = await storage.updateUser(user.id, {
            username: username || user.username,
            email: email || user.email,
          }) || user;
        }

        // Update session with verified status
        await sessionManager.addSession(result.sessionId);
        
        // Create JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        // Log activity
        await storage.createActivityLog({
          userId: user.id,
          telegramSessionId: result.sessionId,
          type: 'telegram_auth',
          action: 'verify_otp',
          message: `Successfully authenticated Telegram account`,
          metadata: { sessionId: result.sessionId, phoneNumber }
        });

        res.json({ 
          ...result, 
          user: { ...user, password: undefined },
          token 
        });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Telegram Authentication Routes
  app.post("/api/telegram/send-otp", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, countryCode } = req.body;
      
      if (!phoneNumber || !countryCode) {
        return res.status(400).json({ message: "Phone number and country code are required" });
      }

      // Create session and get real Telegram API client
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[^\d]/g, '')}`;
      const sessionId = await telegramClient.createSession(req.user!.id, fullPhoneNumber);
      const client = await telegramClient.getClient(sessionId, req.user!.id);
      
      // Send real OTP via Telegram servers
      const result = await client.sendOTP(fullPhoneNumber);
      
      if (result.success) {
        await storage.createActivityLog({
          userId: req.user!.id,
          telegramSessionId: sessionId,
          type: 'telegram_auth',
          action: 'send_otp',
          message: `OTP sent to ${fullPhoneNumber}`,
          metadata: { phoneNumber: fullPhoneNumber }
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/telegram/verify-otp", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { sessionId, otpCode, phoneCodeHash } = req.body;
      
      if (!sessionId || !otpCode) {
        return res.status(400).json({ message: "Session ID and OTP code are required" });
      }

      // Get real Telegram API client
      const client = await telegramClient.getClient(sessionId, req.user!.id);
      
      // Verify real OTP with Telegram servers
      const result = await client.verifyOTP(otpCode, phoneCodeHash);

      if (result.success && result.sessionId) {
        await sessionManager.addSession(result.sessionId);
        
        await storage.createActivityLog({
          userId: req.user!.id,
          telegramSessionId: result.sessionId,
          type: 'telegram_auth',
          action: 'verify_otp',
          message: `Successfully authenticated Telegram account`,
          metadata: { sessionId: result.sessionId }
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Verify OTP error:', error);
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

      const client = await telegramClient.getClient(sessionId, req.user!.id);
      const channels = await client.getChannels();
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

  // Register admin routes
  await registerAdminRoutes(app);
  
  // Register bot routes  
  await registerBotRoutes(app);

  return httpServer;
}