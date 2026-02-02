import { db } from "./db";
import { eq, or, and, desc, ne, like, gt, isNull } from "drizzle-orm";
import {
  users, messages, calls, contacts, otps,
  type User,
  type Message, type InsertMessage,
  type Call, type InsertCall
} from "@shared/schema";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth & User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(currentUserId: string): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUserStatus(userId: string, isOnline: boolean): Promise<void>;
  
  // Message methods
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number): Promise<Message>;
  clearChat(userId: string, partnerId: string): Promise<void>;
  deleteChat(userId: string, partnerId: string): Promise<void>;
  
  // Call methods
  createCall(call: InsertCall): Promise<Call>;
  getCalls(userId: string): Promise<Call[]>;

  // OTP methods
  createOTP(phoneNumber: string, code: string): Promise<void>;
  verifyOTP(phoneNumber: string, code: string): Promise<boolean>;

  getRecentMessages(userId: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]> {
    const allUsers = await db.select().from(users).where(ne(users.id, currentUserId));
    
    // Add last message for each user
    const usersWithMessages = await Promise.all(allUsers.map(async (user) => {
      const [lastMessage] = await db.select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, currentUserId), eq(messages.receiverId, user.id)),
            and(eq(messages.senderId, user.id), eq(messages.receiverId, currentUserId))
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      return { ...user, lastMessage };
    }));

    return usersWithMessages;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        like(users.firstName, `%${query}%`),
        like(users.lastName, `%${query}%`),
        like(users.email, `%${query}%`),
        like(users.phoneNumber, `%${query}%`)
      )
    );
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(id: number, content: string): Promise<Message> {
    const [updatedMessage] = await db.update(messages)
      .set({ content, isEdited: "true" })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<Message> {
    const [deletedMessage] = await db.update(messages)
      .set({ isDeleted: "true", content: "This message was deleted" })
      .where(eq(messages.id, id))
      .returning();
    return deletedMessage;
  }

  async clearChat(userId: string, partnerId: string): Promise<void> {
    await db.delete(messages).where(
      or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, partnerId)),
        and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId))
      )
    );
  }

  async deleteChat(userId: string, partnerId: string): Promise<void> {
    // In this simple implementation, deleteChat is same as clearChat
    // Real implementation might involve soft-deletes or conversation tracking
    await this.clearChat(userId, partnerId);
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          isNull(messages.readAt)
        )
      );
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db.insert(calls).values(call as any).returning();
    return newCall;
  }

  async getCalls(userId: string): Promise<Call[]> {
    return await db.select().from(calls).where(
      or(eq(calls.callerId, userId), eq(calls.calleeId, userId))
    ).orderBy(desc(calls.startedAt));
  }

  async createOTP(phoneNumber: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await db.insert(otps).values({
      phoneNumber,
      code,
      expiresAt,
    });
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    const [otp] = await db.select()
      .from(otps)
      .where(
        and(
          eq(otps.phoneNumber, phoneNumber),
          eq(otps.code, code),
          eq(otps.isUsed, "false"),
          gt(otps.expiresAt, new Date())
        )
      )
      .limit(1);

    if (otp) {
      await db.update(otps)
        .set({ isUsed: "true" })
        .where(eq(otps.id, otp.id));
      return true;
    }
    return false;
  }

  async getRecentMessages(userId: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(10);
  }

  async isFollowing(userId: string, contactId: string): Promise<boolean> {
    const [follow] = await db.select().from(contacts).where(
      and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))
    );
    return !!follow;
  }

  async followUser(userId: string, contactId: string): Promise<void> {
    await db.insert(contacts).values({ userId, contactId });
  }

  async unfollowUser(userId: string, contactId: string): Promise<void> {
    await db.delete(contacts).where(
      and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))
    );
  }
}

export const storage = new DatabaseStorage();
