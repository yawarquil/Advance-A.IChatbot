import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, 
  loginUserSchema,
  insertConversationSchema,
  updateConversationSchema,
  insertUserSettingsSchema,
  insertCurrentConversationSchema
} from "@shared/schema";

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
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({ email, password: hashedPassword });
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { id: user.id, email: user.email, createdAt: user.created_at },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { id: user.id, email: user.email, createdAt: user.created_at },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        user: { id: user.id, email: user.email, createdAt: user.created_at }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Conversation routes
  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversations = await storage.loadConversations(req.userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversationData = insertConversationSchema.parse({
        ...req.body,
        user_id: req.userId
      });
      
      const conversation = await storage.saveConversation(conversationData);
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/conversations/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = updateConversationSchema.parse(req.body);
      
      const conversation = await storage.updateConversation(id, updates);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/conversations/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteConversation(id, req.userId);
      res.json({ message: "Conversation deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User settings routes
  app.get("/api/settings", authenticateToken, async (req: any, res) => {
    try {
      const settings = await storage.loadUserSettings(req.userId);
      res.json(settings?.settings || null);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/settings", authenticateToken, async (req: any, res) => {
    try {
      const settingsData = insertUserSettingsSchema.parse(req.body);
      const userSettings = await storage.saveUserSettings(req.userId, settingsData);
      res.json(userSettings.settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Current conversation routes
  app.get("/api/current-conversation", authenticateToken, async (req: any, res) => {
    try {
      const currentConv = await storage.loadCurrentConversation(req.userId);
      res.json(currentConv?.messages || []);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/current-conversation", authenticateToken, async (req: any, res) => {
    try {
      const conversationData = insertCurrentConversationSchema.parse(req.body);
      const currentConv = await storage.saveCurrentConversation(req.userId, conversationData);
      res.json(currentConv.messages);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/current-conversation", authenticateToken, async (req: any, res) => {
    try {
      await storage.clearCurrentConversation(req.userId);
      res.json({ message: "Current conversation cleared" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
