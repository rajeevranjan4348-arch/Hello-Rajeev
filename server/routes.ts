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
    const messages = await storage.getMessages(currentUserId, partnerId);
    res.json(messages);
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
      startedAt: new Date()
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

  return httpServer;
}
