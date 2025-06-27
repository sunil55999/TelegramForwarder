import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertForwardingPairSchema, insertActivityLogSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
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

      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        type: "user_registered",
        message: "Account created successfully",
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Protected routes
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Forwarding pairs routes
  app.get("/api/forwarding-pairs", authenticateToken, async (req: any, res) => {
    try {
      const pairs = await storage.getForwardingPairs(req.user.id);
      res.json(pairs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forwarding pairs" });
    }
  });

  app.post("/api/forwarding-pairs", authenticateToken, async (req: any, res) => {
    try {
      const pairData = insertForwardingPairSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Check user's plan limits
      const existingPairs = await storage.getForwardingPairs(req.user.id);
      const planLimits = {
        free: 3,
        pro: 15,
        business: 50,
      };

      const limit = planLimits[req.user.plan as keyof typeof planLimits] || 3;
      if (existingPairs.length >= limit) {
        return res.status(400).json({ 
          message: `Plan limit reached. ${req.user.plan} plan allows ${limit} pairs.` 
        });
      }

      const pair = await storage.createForwardingPair(pairData);

      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        forwardingPairId: pair.id,
        type: "pair_created",
        message: `Forwarding pair created: ${pair.sourceChannel} → ${pair.destinationChannel}`,
      });

      res.json(pair);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.patch("/api/forwarding-pairs/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const pair = await storage.updateForwardingPair(id, req.user.id, updates);
      if (!pair) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      // Create activity log
      const action = updates.isActive === false ? "paused" : 
                    updates.isActive === true ? "activated" : "updated";
      
      await storage.createActivityLog({
        userId: req.user.id,
        forwardingPairId: pair.id,
        type: `pair_${action}`,
        message: `Forwarding pair ${action}: ${pair.sourceChannel} → ${pair.destinationChannel}`,
      });

      res.json(pair);
    } catch (error) {
      res.status(500).json({ message: "Failed to update forwarding pair" });
    }
  });

  app.delete("/api/forwarding-pairs/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const pair = await storage.getForwardingPair(id, req.user.id);
      if (!pair) {
        return res.status(404).json({ message: "Forwarding pair not found" });
      }

      const deleted = await storage.deleteForwardingPair(id, req.user.id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete forwarding pair" });
      }

      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        type: "pair_deleted",
        message: `Forwarding pair deleted: ${pair.sourceChannel} → ${pair.destinationChannel}`,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete forwarding pair" });
    }
  });

  // Activity logs route
  app.get("/api/activity-logs", authenticateToken, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogs(req.user.id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Mock Telegram operations
  app.post("/api/telegram/forward-message", authenticateToken, async (req: any, res) => {
    try {
      const { forwardingPairId, messageId } = req.body;
      
      const pair = await storage.getForwardingPair(forwardingPairId, req.user.id);
      if (!pair || !pair.isActive) {
        return res.status(400).json({ message: "Invalid or inactive forwarding pair" });
      }

      // Mock successful forward
      await storage.createActivityLog({
        userId: req.user.id,
        forwardingPairId: pair.id,
        type: "message_forwarded",
        message: `Message forwarded successfully`,
        metadata: { messageId, delay: pair.delay },
      });

      // Update last activity
      await storage.updateForwardingPair(pair.id, req.user.id, {
        lastActivity: new Date(),
      });

      res.json({ success: true, messageId });
    } catch (error) {
      res.status(500).json({ message: "Failed to forward message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
