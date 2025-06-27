import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { errorHandler } from './error-handler';
import { paymentGateway } from './payment-gateway';
import { sessionManager } from './session-manager';
import { queueManager } from './queue-manager';
import { telegramClient } from './telegram-client';
import jwt from 'jsonwebtoken';

interface AdminRequest extends Request {
  user?: any;
  admin?: boolean;
}

const ADMIN_EMAILS = [
  'admin@autoforwardx.com',
  'support@autoforwardx.com'
];

// Admin authentication middleware
const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Admin token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.admin = true;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

export async function registerAdminRoutes(app: Express): Promise<void> {
  // Admin dashboard stats
  app.get("/api/admin/dashboard", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      // Get overall system statistics
      const totalUsers = await storage.getAllUsers();
      const totalSessions = await storage.getAllTelegramSessions();
      const totalPairs = await storage.getAllForwardingPairs();
      const queueStats = await queueManager.getQueueStats();
      const errorStats = errorHandler.getErrorStats();
      
      // Calculate revenue and plan distribution
      const planDistribution = totalUsers.reduce((acc, user) => {
        acc[user.plan] = (acc[user.plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentErrors = errorHandler.getErrorReports({ 
        resolved: false, 
        limit: 10 
      });

      res.json({
        users: {
          total: totalUsers.length,
          active: totalUsers.filter(u => u.plan !== 'free').length,
          planDistribution,
        },
        sessions: {
          total: totalSessions.length,
          healthy: sessionManager.getAllSessionHealths().filter(s => s.isHealthy).length,
          unhealthy: sessionManager.getAllSessionHealths().filter(s => !s.isHealthy).length,
        },
        forwarding: {
          totalPairs: totalPairs.length,
          activePairs: totalPairs.filter(p => p.isActive).length,
          queueStats,
        },
        errors: {
          ...errorStats,
          recent: recentErrors,
        },
        revenue: {
          // Calculate estimated monthly revenue
          monthlyRevenue: totalUsers.filter(u => u.plan === 'pro').length * 9.99 +
                          totalUsers.filter(u => u.plan === 'business').length * 29.99,
        },
      });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to fetch admin dashboard', errorId });
    }
  });

  // User management
  app.get("/api/admin/users", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const plan = req.query.plan as string;

      let users = await storage.getAllUsers();

      // Apply filters
      if (search) {
        users = users.filter(u => 
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (plan) {
        users = users.filter(u => u.plan === plan);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedUsers = users.slice(startIndex, startIndex + limit);

      // Get additional data for each user
      const usersWithStats = await Promise.all(
        paginatedUsers.map(async (user) => {
          const sessions = await storage.getTelegramSessions(user.id);
          const pairs = await storage.getForwardingPairs(user.id);
          const recentActivity = await storage.getActivityLogs(user.id, 5);

          return {
            ...user,
            password: undefined, // Don't send password
            stats: {
              sessions: sessions.length,
              activePairs: pairs.filter(p => p.isActive).length,
              totalPairs: pairs.length,
              lastActivity: recentActivity[0]?.createdAt || null,
            },
          };
        })
      );

      res.json({
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit),
        },
      });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to fetch users', errorId });
    }
  });

  // Update user plan
  app.put("/api/admin/users/:id/plan", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { plan, expiryDate } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        plan,
        planExpiryDate: expiryDate ? new Date(expiryDate) : undefined,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log admin action
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'plan_updated',
        message: `Admin updated user ${userId} plan to ${plan}`,
        details: `Updated plan from ${updatedUser.plan} to ${plan}`,
        metadata: { targetUserId: userId, oldPlan: updatedUser.plan, newPlan: plan },
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to update user plan', errorId });
    }
  });

  // Session management
  app.get("/api/admin/sessions", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const sessions = await storage.getAllTelegramSessions();
      const sessionHealths = sessionManager.getAllSessionHealths();
      
      const sessionsWithHealth = sessions.map(session => {
        const health = sessionHealths.find(h => h.sessionId === session.id);
        return {
          ...session,
          health: health || { isHealthy: false, lastCheck: new Date(), errorCount: 0 },
        };
      });

      res.json({ sessions: sessionsWithHealth });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to fetch sessions', errorId });
    }
  });

  // Force session reconnection
  app.post("/api/admin/sessions/:id/reconnect", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getTelegramSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Trigger session health check and reconnection
      const isHealthy = await sessionManager.triggerHealthCheck(sessionId);
      
      // Log admin action
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'session_reconnect',
        message: `Admin triggered reconnection for session ${sessionId}`,
        details: `Reconnection ${isHealthy ? 'successful' : 'failed'}`,
        metadata: { sessionId, result: isHealthy },
      });

      res.json({ success: true, healthy: isHealthy });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to reconnect session', errorId });
    }
  });

  // Pause/resume forwarding pairs
  app.post("/api/admin/pairs/:id/toggle", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const pairId = parseInt(req.params.id);
      const { action } = req.body; // 'pause' or 'resume'

      const pair = await storage.getForwardingPairById(pairId);
      if (!pair) {
        return res.status(404).json({ error: 'Forwarding pair not found' });
      }

      let result;
      if (action === 'pause') {
        result = await storage.pauseForwardingPair(pairId, pair.userId);
      } else if (action === 'resume') {
        result = await storage.resumeForwardingPair(pairId, pair.userId);
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }

      // Log admin action
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: `pair_${action}`,
        message: `Admin ${action}d forwarding pair ${pairId}`,
        details: `Pair ${action} by admin`,
        metadata: { pairId, action },
      });

      res.json({ success: result });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: `Failed to ${req.body.action} pair`, errorId });
    }
  });

  // Error management
  app.get("/api/admin/errors", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const {
        severity,
        errorType,
        resolved,
        limit = 100,
      } = req.query;

      const errors = errorHandler.getErrorReports({
        severity: severity as any,
        errorType: errorType as any,
        resolved: resolved === 'true',
        limit: parseInt(limit as string),
      });

      res.json({ errors });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to fetch errors', errorId });
    }
  });

  // Resolve error
  app.post("/api/admin/errors/:id/resolve", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const errorId = req.params.id;
      const { resolution } = req.body;

      const success = await errorHandler.resolveError(errorId, resolution, req.user.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Error not found' });
      }

      res.json({ success: true });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to resolve error', errorId });
    }
  });

  // Send promotional messages to free users
  app.post("/api/admin/broadcast/free-users", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const { message, targetChannels } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get all free users with active forwarding pairs
      const freeUsers = await storage.getUsersByPlan('free');
      let successCount = 0;
      let failureCount = 0;

      for (const user of freeUsers) {
        try {
          const pairs = await storage.getForwardingPairs(user.id);
          const activePairs = pairs.filter(p => p.isActive);

          for (const pair of activePairs) {
            if (targetChannels === 'destination' || targetChannels === 'all') {
              // Send to destination channels
              const sessions = await storage.getTelegramSessions(user.id);
              const activeSession = sessions.find(s => s.isActive);

              if (activeSession) {
                const success = await telegramClient.sendMessage(
                  activeSession.id,
                  pair.destinationChannel,
                  {
                    id: `promo_${Date.now()}`,
                    text: message,
                    date: new Date(),
                    chatId: pair.destinationChannel,
                  }
                );

                if (success) {
                  successCount++;
                } else {
                  failureCount++;
                }
              }
            }
          }
        } catch (userError) {
          failureCount++;
          console.error(`Failed to send promotional message to user ${user.id}:`, userError);
        }
      }

      // Log admin broadcast
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'promotional_broadcast',
        message: `Admin sent promotional message to free users`,
        details: `Message: ${message}`,
        metadata: { 
          targetChannels, 
          successCount, 
          failureCount,
          totalUsers: freeUsers.length 
        },
      });

      res.json({
        success: true,
        stats: {
          targetUsers: freeUsers.length,
          messagesSucceeded: successCount,
          messagesFailed: failureCount,
        },
      });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to send promotional broadcast', errorId });
    }
  });

  // System controls
  app.post("/api/admin/system/queue/pause", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      queueManager.pauseProcessing();
      
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'queue_paused',
        message: 'Admin paused queue processing',
        details: 'Global queue processing paused',
        metadata: { action: 'pause' },
      });

      res.json({ success: true, message: 'Queue processing paused' });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to pause queue', errorId });
    }
  });

  app.post("/api/admin/system/queue/resume", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      queueManager.resumeProcessing();
      
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'queue_resumed',
        message: 'Admin resumed queue processing',
        details: 'Global queue processing resumed',
        metadata: { action: 'resume' },
      });

      res.json({ success: true, message: 'Queue processing resumed' });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to resume queue', errorId });
    }
  });

  // Clear failed queue items
  app.post("/api/admin/system/queue/clear-failed", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const clearedCount = await queueManager.clearFailedItems();
      
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'admin_action',
        action: 'queue_cleared',
        message: 'Admin cleared failed queue items',
        details: `Cleared ${clearedCount} failed items`,
        metadata: { clearedCount },
      });

      res.json({ success: true, clearedCount });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to clear failed queue items', errorId });
    }
  });

  // Get system health
  app.get("/api/admin/system/health", authenticateAdmin, async (req: AdminRequest, res) => {
    try {
      const queueStats = await queueManager.getQueueStats();
      const sessionStats = sessionManager.getSessionStats();
      const errorStats = errorHandler.getErrorStats();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          telegram: 'active',
          queue: queueStats,
          sessions: sessionStats,
          errors: errorStats,
        },
      });
    } catch (error) {
      const errorId = await errorHandler.handleError(error as Error, { 
        userId: req.user?.id,
        errorType: 'system' 
      });
      res.status(500).json({ error: 'Failed to get system health', errorId });
    }
  });
}