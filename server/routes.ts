import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === User Routes ===

  app.get(api.users.me.path, isAuthenticated, async (req: any, res) => {
    // isAuthenticated middleware ensures req.user is set
    // But we need to fetch full user details from DB
    const user = await storage.getUser(req.user.claims.sub);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Update online status
    await storage.updateUserStatus(user.id, true);
    res.json(user);
  });

  app.get(api.users.list.path, isAuthenticated, async (req: any, res) => {
    const query = req.query.search as string;
    let users;
    if (query) {
      users = await storage.searchUsers(query);
    } else {
      users = await storage.getUsers(req.user.claims.sub);
    }
    res.json(users);
  });

  app.get(api.users.get.path, isAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // === Message Routes ===

  app.get(api.messages.list.path, isAuthenticated, async (req: any, res) => {
    const partnerId = req.params.userId;
    const currentUserId = req.user.claims.sub;
    
    // Mark messages as read
    await storage.markMessagesAsRead(partnerId, currentUserId);
    
    const msgs = await storage.getMessages(currentUserId, partnerId);
    res.json(msgs);
  });

  app.post(api.messages.send.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.messages.send.input.parse(req.body);
      // Enforce sender is current user
      const messageData = {
        ...input,
        senderId: req.user.claims.sub,
      };
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    const message = await storage.updateMessage(id, content);
    res.json(message);
  });

  app.delete("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const message = await storage.deleteMessage(id);
    res.json(message);
  });

  app.delete("/api/chat/:partnerId/clear", isAuthenticated, async (req: any, res) => {
    await storage.clearChat(req.user.claims.sub, req.params.partnerId);
    res.json({ success: true });
  });

  app.delete("/api/chat/:partnerId", isAuthenticated, async (req: any, res) => {
    await storage.deleteChat(req.user.claims.sub, req.params.partnerId);
    res.json({ success: true });
  });

  // === Call Routes ===

  app.get(api.calls.list.path, isAuthenticated, async (req: any, res) => {
    const calls = await storage.getCalls(req.user.claims.sub);
    res.json(calls);
  });

  app.post(api.calls.create.path, isAuthenticated, async (req: any, res) => {
    // Simplification: We don't have full call signaling yet.
    // This just logs a call.
    // In a real app, we would emit WebSocket events here.
    const { calleeId, type } = req.body;
    const call = await storage.createCall({
      callerId: req.user.claims.sub,
      calleeId: String(calleeId), // Ensure string
      type,
      status: 'started',
    });
    res.status(201).json(call);
  });

  app.get("/api/contacts/check/:contactId", isAuthenticated, async (req: any, res) => {
    const isFollowing = await storage.isFollowing(req.user.claims.sub, req.params.contactId);
    res.json({ isFollowing });
  });

  app.post("/api/contacts/follow/:contactId", isAuthenticated, async (req: any, res) => {
    await storage.followUser(req.user.claims.sub, req.params.contactId);
    res.json({ success: true });
  });

  app.post("/api/contacts/unfollow/:contactId", isAuthenticated, async (req: any, res) => {
    await storage.unfollowUser(req.user.claims.sub, req.params.contactId);
    res.json({ success: true });
  });

  // === OTP Routes ===

  app.post("/api/otp/send", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "Phone number required" });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await storage.createOTP(phoneNumber, code);
    
    // In a real app, send SMS here. For now, log it.
    console.log(`OTP for ${phoneNumber}: ${code}`);
    
    res.json({ success: true, message: "OTP sent successfully (Demo)" });
  });

  app.post("/api/otp/verify", async (req, res) => {
    const { phoneNumber, code } = req.body;
    const isValid = await storage.verifyOTP(phoneNumber, code);
    
    if (isValid) {
      // Find or create user with this phone number
      let user = await storage.searchUsers(phoneNumber).then(users => users.find(u => u.phoneNumber === phoneNumber));
      
      if (!user) {
        // Create a new user if they don't exist
        const claims = {
          sub: `phone_${phoneNumber.replace(/\D/g, "")}`,
          phone_number: phoneNumber,
          first_name: "Zenix",
          last_name: "User"
        };
        await storage.getUser(claims.sub).then(async (existing) => {
          if (!existing) {
            // We need to use the internal auth storage to ensure consistency
            const { authStorage } = await import("./replit_integrations/auth/storage");
            await authStorage.upsertUser({
              id: claims.sub,
              phoneNumber: phoneNumber,
              firstName: claims.first_name,
              lastName: claims.last_name,
            });
          }
        });
        user = await storage.getUser(claims.sub);
      }

      // Manually establish passport session
      const passportUser = {
        claims: {
          sub: user!.id,
          email: user!.email,
          first_name: user!.firstName,
          last_name: user!.lastName,
          phone_number: user!.phoneNumber,
        },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
      };

      req.login(passportUser, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.json({ success: true, user });
      });
    } else {
      res.status(400).json({ message: "Invalid or expired OTP" });
    }
  });

  app.get("/api/messages/recent", isAuthenticated, async (req: any, res) => {
    const currentUserId = req.user.claims.sub;
    // Get last 10 messages for the user as receiver
    const msgs = await storage.getRecentMessages(currentUserId);
    res.json(msgs);
  });

  return httpServer;
}
