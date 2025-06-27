import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, business
  planExpiryDate: timestamp("plan_expiry_date"),
  watermarkConfig: jsonb("watermark_config"),
  telegramAccounts: jsonb("telegram_accounts").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const telegramSessions = pgTable("telegram_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phoneNumber: text("phone_number").notNull(),
  sessionString: text("session_string"),
  isActive: boolean("is_active").notNull().default(true),
  lastHealthCheck: timestamp("last_health_check"),
  accountName: text("account_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const forwardingPairs = pgTable("forwarding_pairs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  telegramSessionId: integer("telegram_session_id").notNull().references(() => telegramSessions.id),
  sourceChannel: text("source_channel").notNull(),
  destinationChannel: text("destination_channel").notNull(),
  delay: integer("delay").notNull().default(0), // delay in seconds
  isActive: boolean("is_active").notNull().default(true),
  copyMode: boolean("copy_mode").notNull().default(false),
  silentMode: boolean("silent_mode").notNull().default(false),
  forwardEdits: boolean("forward_edits").notNull().default(true),
  forwardDeletions: boolean("forward_deletions").notNull().default(false),
  messageType: text("message_type").notNull().default("all"), // all, media, text
  chainForwarding: boolean("chain_forwarding").notNull().default(false),
  messagesForwarded: integer("messages_forwarded").notNull().default(0),
  successRate: integer("success_rate").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity"),
});

export const blockedSentences = pgTable("blocked_sentences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  forwardingPairId: integer("forwarding_pair_id").references(() => forwardingPairs.id),
  sentence: text("sentence").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedImages = pgTable("blocked_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  forwardingPairId: integer("forwarding_pair_id").references(() => forwardingPairs.id),
  imageHash: text("image_hash").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forwardingQueue = pgTable("forwarding_queue", {
  id: serial("id").primaryKey(),
  forwardingPairId: integer("forwarding_pair_id").notNull().references(() => forwardingPairs.id),
  messageId: text("message_id").notNull(),
  sourceChat: text("source_chat").notNull(),
  destinationChat: text("destination_chat").notNull(),
  messageContent: jsonb("message_content").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  forwardingPairId: integer("forwarding_pair_id").references(() => forwardingPairs.id),
  telegramSessionId: integer("telegram_session_id").references(() => telegramSessions.id),
  type: text("type").notNull(), // message_forwarded, pair_created, pair_paused, etc.
  action: text("action").notNull(), // for backward compatibility with payment system
  message: text("message").notNull(),
  details: text("details"), // additional details field
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentFilters = pgTable("content_filters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  forwardingPairId: integer("forwarding_pair_id").references(() => forwardingPairs.id),
  type: text("type").notNull(), // text, image, keyword, media
  pattern: text("pattern").notNull(),
  action: text("action").notNull(), // block, modify, watermark
  replacement: text("replacement"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentId: text("payment_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  amount: integer("amount").notNull(), // amount in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull(), // paypal, crypto
  transactionId: text("transaction_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  telegramSessions: many(telegramSessions),
  forwardingPairs: many(forwardingPairs),
  activityLogs: many(activityLogs),
  blockedSentences: many(blockedSentences),
  blockedImages: many(blockedImages),
  contentFilters: many(contentFilters),
  payments: many(payments),
}));

export const telegramSessionsRelations = relations(telegramSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramSessions.userId],
    references: [users.id],
  }),
  forwardingPairs: many(forwardingPairs),
  activityLogs: many(activityLogs),
}));

export const forwardingPairsRelations = relations(forwardingPairs, ({ one, many }) => ({
  user: one(users, {
    fields: [forwardingPairs.userId],
    references: [users.id],
  }),
  telegramSession: one(telegramSessions, {
    fields: [forwardingPairs.telegramSessionId],
    references: [telegramSessions.id],
  }),
  activityLogs: many(activityLogs),
  blockedSentences: many(blockedSentences),
  blockedImages: many(blockedImages),
  queueItems: many(forwardingQueue),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTelegramSessionSchema = createInsertSchema(telegramSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForwardingPairSchema = createInsertSchema(forwardingPairs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivity: true,
});

export const insertBlockedSentenceSchema = createInsertSchema(blockedSentences).omit({
  id: true,
  createdAt: true,
});

export const insertBlockedImageSchema = createInsertSchema(blockedImages).omit({
  id: true,
  createdAt: true,
});

export const insertForwardingQueueSchema = createInsertSchema(forwardingQueue).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertContentFilterSchema = createInsertSchema(contentFilters).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTelegramSession = z.infer<typeof insertTelegramSessionSchema>;
export type TelegramSession = typeof telegramSessions.$inferSelect;
export type InsertForwardingPair = z.infer<typeof insertForwardingPairSchema>;
export type ForwardingPair = typeof forwardingPairs.$inferSelect;
export type InsertBlockedSentence = z.infer<typeof insertBlockedSentenceSchema>;
export type BlockedSentence = typeof blockedSentences.$inferSelect;
export type InsertBlockedImage = z.infer<typeof insertBlockedImageSchema>;
export type BlockedImage = typeof blockedImages.$inferSelect;
export type InsertForwardingQueue = z.infer<typeof insertForwardingQueueSchema>;
export type ForwardingQueue = typeof forwardingQueue.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertContentFilter = z.infer<typeof insertContentFilterSchema>;
export type ContentFilter = typeof contentFilters.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
