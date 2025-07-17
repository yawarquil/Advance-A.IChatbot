import { pgTable, text, serial, integer, boolean, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().$type<any[]>().default([]),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  user_id: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().$type<any>().default({}),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const currentConversations = pgTable("current_conversations", {
  user_id: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull().$type<any[]>().default([]),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

// Conversation schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateConversationSchema = createInsertSchema(conversations).omit({
  user_id: true,
  created_at: true,
}).partial();

// Settings schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  user_id: true,
  updated_at: true,
});

// Current conversation schemas
export const insertCurrentConversationSchema = createInsertSchema(currentConversations).omit({
  user_id: true,
  updated_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type UpdateConversation = z.infer<typeof updateConversationSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type CurrentConversation = typeof currentConversations.$inferSelect;
export type InsertCurrentConversation = z.infer<typeof insertCurrentConversationSchema>;
