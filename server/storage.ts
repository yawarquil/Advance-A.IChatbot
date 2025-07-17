import { 
  users, 
  conversations, 
  userSettings, 
  currentConversations,
  type User, 
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type UpdateConversation,
  type UserSettings,
  type InsertUserSettings,
  type CurrentConversation,
  type InsertCurrentConversation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation operations
  saveConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined>;
  loadConversations(userId: string): Promise<Conversation[]>;
  deleteConversation(id: string, userId: string): Promise<void>;
  
  // User settings operations
  saveUserSettings(userId: string, settings: InsertUserSettings): Promise<UserSettings>;
  loadUserSettings(userId: string): Promise<UserSettings | undefined>;
  
  // Current conversation operations
  saveCurrentConversation(userId: string, conversation: InsertCurrentConversation): Promise<CurrentConversation>;
  loadCurrentConversation(userId: string): Promise<CurrentConversation | undefined>;
  clearCurrentConversation(userId: string): Promise<void>;
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Conversation operations
  async saveConversation(conversation: InsertConversation): Promise<Conversation> {
    const [saved] = await db.insert(conversations).values({
      ...conversation,
      messages: conversation.messages || [],
    }).returning();
    return saved;
  }

  async updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async loadConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at));
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    await db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }

  // User settings operations
  async saveUserSettings(userId: string, settings: InsertUserSettings): Promise<UserSettings> {
    const [saved] = await db
      .insert(userSettings)
      .values({
        user_id: userId,
        settings: settings.settings || {},
      })
      .onConflictDoUpdate({
        target: userSettings.user_id,
        set: {
          settings: settings.settings || {},
          updated_at: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async loadUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.user_id, userId));
    return settings;
  }

  // Current conversation operations
  async saveCurrentConversation(userId: string, conversation: InsertCurrentConversation): Promise<CurrentConversation> {
    const [saved] = await db
      .insert(currentConversations)
      .values({
        user_id: userId,
        messages: conversation.messages || [],
      })
      .onConflictDoUpdate({
        target: currentConversations.user_id,
        set: {
          messages: conversation.messages || [],
          updated_at: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async loadCurrentConversation(userId: string): Promise<CurrentConversation | undefined> {
    const [current] = await db
      .select()
      .from(currentConversations)
      .where(eq(currentConversations.user_id, userId));
    return current;
  }

  async clearCurrentConversation(userId: string): Promise<void> {
    await db
      .delete(currentConversations)
      .where(eq(currentConversations.user_id, userId));
  }
}

export const storage = new DatabaseStorage();
