import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  creatorId: text("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id"), // Nullable for group messages
  groupId: integer("group_id"), // For group messages
  content: text("content").notNull(),
  isEdited: text("is_edited").default("false"),
  isDeleted: text("is_deleted").default("false"),
  type: text("type").default("text"),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  callerId: text("caller_id").notNull(), // Matching auth.users.id (varchar)
  calleeId: text("callee_id").notNull(), // Matching auth.users.id (varchar)
  type: text("type").default("video"), // video, voice
  status: text("status").default("missed"), // missed, completed, rejected
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Matching auth.users.id (varchar)
  contactId: text("contact_id").notNull(), // Matching auth.users.id (varchar)
  createdAt: timestamp("created_at").defaultNow(),
});

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: text("is_used").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  initiatedCalls: many(calls, { relationName: "caller" }),
  receivedCalls: many(calls, { relationName: "callee" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  caller: one(users, {
    fields: [calls.callerId],
    references: [users.id],
    relationName: "caller",
  }),
  callee: one(users, {
    fields: [calls.calleeId],
    references: [users.id],
    relationName: "callee",
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, readAt: true, expiresAt: true, isEdited: true, isDeleted: true });
export const insertCallSchema = createInsertSchema(calls).omit({ id: true, startedAt: true, endedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

// Request types
export type SendMessageRequest = InsertMessage;

// Response types
export type MessageResponse = Message & { sender?: any, receiver?: any };
export type CallResponse = Call & { caller?: any, callee?: any };

// Query params
export interface MessagesQueryParams {
  userId?: string; // Filter by conversation partner
  cursor?: string;
}
