import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, business
  telegramAccounts: jsonb("telegram_accounts").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forwardingPairs = pgTable("forwarding_pairs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sourceChannel: text("source_channel").notNull(),
  destinationChannel: text("destination_channel").notNull(),
  delay: integer("delay").notNull().default(0), // delay in seconds
  isActive: boolean("is_active").notNull().default(true),
  copyMode: boolean("copy_mode").notNull().default(false),
  silentMode: boolean("silent_mode").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  forwardingPairId: integer("forwarding_pair_id"),
  type: text("type").notNull(), // message_forwarded, pair_created, pair_paused, etc.
  message: text("message").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertForwardingPairSchema = createInsertSchema(forwardingPairs).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertForwardingPair = z.infer<typeof insertForwardingPairSchema>;
export type ForwardingPair = typeof forwardingPairs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
