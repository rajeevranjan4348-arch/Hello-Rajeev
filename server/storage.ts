import { db } from "./db";
import { eq, or, and, desc, ne, like, gt, isNull } from "drizzle-orm";
import {
  users, messages, calls, contacts, otps,
  type User,
  type Message, type InsertMessage,
  type Call, type InsertCall
} from "@shared/schema";
import { authStorage, memUsers } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth & User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  upsertUserByPhone(phoneNumber: string, name?: string): Promise<User>;
  getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUserStatus(userId: string, isOnline: boolean): Promise<void>;
  
  // Message methods
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number): Promise<Message>;
  clearChat(userId: string, partnerId: string): Promise<void>;
  deleteChat(userId: string, partnerId: string): Promise<void>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  
  // Call methods
  createCall(call: InsertCall): Promise<Call>;
  getCalls(userId: string): Promise<Call[]>;

  // OTP methods
  createOTP(phoneNumber: string, code: string): Promise<void>;
  verifyOTP(phoneNumber: string, code: string): Promise<boolean>;

  getRecentMessages(userId: string): Promise<Message[]>;

  // Contact methods
  isFollowing(userId: string, contactId: string): Promise<boolean>;
  followUser(userId: string, contactId: string): Promise<void>;
  unfollowUser(userId: string, contactId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async upsertUserByPhone(phoneNumber: string, name?: string): Promise<User> {
    const existing = await this.getUserByPhone(phoneNumber);
    if (existing) return existing;
    const firstName = name?.split(" ")[0] || "User";
    const lastName = name?.split(" ").slice(1).join(" ") || phoneNumber.slice(-4);
    const [user] = await db.insert(users).values({
      phoneNumber,
      firstName,
      lastName,
    }).returning();
    return user;
  }

  async getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]> {
    const allUsers = await db.select().from(users).where(ne(users.id, currentUserId));
    
    // Add last message for each user
    const usersWithMessages = await Promise.all(allUsers.map(async (user: User) => {
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
      and(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        ),
        isNull(messages.groupId)
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

export class MemStorage implements IStorage {
  private users = memUsers;
  private messages = new Map<number, Message>();
  private messageIdCounter = 1;
  private calls = new Map<number, Call>();
  private callIdCounter = 1;
  private contacts = new Set<string>();
  private otps: { id: number; phoneNumber: string; code: string; expiresAt: Date; isUsed: string }[] = [];
  private otpIdCounter = 1;

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    if (this.users.size === 0) {
      const demoUsers: User[] = [
        {
          id: "sarah-connor",
          email: "sarah@zenix.chat",
          firstName: "Sarah",
          lastName: "Connor",
          phoneNumber: "+14155552671",
          profileImageUrl: null,
          bio: "Cybersecurity analyst & privacy advocate.",
          birthDate: null,
          isPhoneNumberPublic: true,
          isBioPublic: true,
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "alex-rivera",
          email: "alex@zenix.chat",
          firstName: "Alex",
          lastName: "Rivera",
          phoneNumber: "+14155552672",
          profileImageUrl: null,
          bio: "Product designer & sound enthusiast.",
          birthDate: null,
          isPhoneNumberPublic: true,
          isBioPublic: true,
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "zenix-support",
          email: "support@zenix.chat",
          firstName: "Zenix",
          lastName: "Assistant",
          phoneNumber: "+14155552673",
          profileImageUrl: null,
          bio: "Official Zenix Welcome Bot.",
          birthDate: null,
          isPhoneNumberPublic: true,
          isBioPublic: true,
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const u of demoUsers) {
        this.users.set(u.id, u);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.phoneNumber === phoneNumber) {
        return user;
      }
    }
    return undefined;
  }

  async upsertUserByPhone(phoneNumber: string, name?: string): Promise<User> {
    const existing = await this.getUserByPhone(phoneNumber);
    if (existing) return existing;

    const id = `user-${Date.now()}`;
    const firstName = name?.split(" ")[0] || "User";
    const lastName = name?.split(" ").slice(1).join(" ") || phoneNumber.slice(-4);
    const user: User = {
      id,
      email: null,
      firstName,
      lastName,
      phoneNumber,
      profileImageUrl: null,
      bio: "Hey there! I am using Zenix.",
      birthDate: null,
      isPhoneNumberPublic: true,
      isBioPublic: true,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);

    // Add welcome message from Zenix Assistant
    await this.createMessage({
      senderId: "zenix-support",
      receiverId: id,
      content: "Welcome to Zenix! Fast, private, and secure messaging at your fingertips.",
      type: "text",
    });

    return user;
  }

  async getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]> {
    const allUsers = Array.from(this.users.values()).filter((u) => u.id !== currentUserId);

    return allUsers.map((user) => {
      // Find latest message between currentUserId and user.id
      const userMsgs = Array.from(this.messages.values()).filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === user.id) ||
          (m.senderId === user.id && m.receiverId === currentUserId)
      );

      userMsgs.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return {
        ...user,
        lastMessage: userMsgs[0],
      };
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    const q = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (u) =>
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q))
    );
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
    }
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const msgs = Array.from(this.messages.values()).filter(
      (m) =>
        !m.groupId &&
        ((m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1))
    );

    msgs.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    return msgs;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMsg: Message = {
      id,
      senderId: message.senderId,
      receiverId: message.receiverId ?? null,
      groupId: message.groupId ?? null,
      content: message.content,
      isEdited: "false",
      isDeleted: "false",
      type: message.type ?? "text",
      readAt: null,
      expiresAt: null,
      createdAt: new Date(),
    };
    this.messages.set(id, newMsg);
    return newMsg;
  }

  async updateMessage(id: number, content: string): Promise<Message> {
    const msg = this.messages.get(id);
    if (!msg) throw new Error("Message not found");
    msg.content = content;
    msg.isEdited = "true";
    return msg;
  }

  async deleteMessage(id: number): Promise<Message> {
    const msg = this.messages.get(id);
    if (!msg) throw new Error("Message not found");
    msg.isDeleted = "true";
    msg.content = "This message was deleted";
    return msg;
  }

  async clearChat(userId: string, partnerId: string): Promise<void> {
    for (const [id, m] of Array.from(this.messages.entries())) {
      if (
        (m.senderId === userId && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === userId)
      ) {
        this.messages.delete(id);
      }
    }
  }

  async deleteChat(userId: string, partnerId: string): Promise<void> {
    await this.clearChat(userId, partnerId);
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    for (const m of Array.from(this.messages.values())) {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.readAt) {
        m.readAt = new Date();
      }
    }
  }

  async createCall(call: InsertCall): Promise<Call> {
    const id = this.callIdCounter++;
    const newCall: Call = {
      id,
      callerId: call.callerId,
      calleeId: call.calleeId,
      type: call.type ?? "video",
      status: call.status ?? "started",
      startedAt: new Date(),
      endedAt: null,
    };
    this.calls.set(id, newCall);
    return newCall;
  }

  async getCalls(userId: string): Promise<Call[]> {
    const userCalls = Array.from(this.calls.values()).filter(
      (c) => c.callerId === userId || c.calleeId === userId
    );

    userCalls.sort((a, b) => {
      const timeA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const timeB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return timeB - timeA;
    });

    return userCalls;
  }

  async createOTP(phoneNumber: string, code: string): Promise<void> {
    this.otps.push({
      id: this.otpIdCounter++,
      phoneNumber,
      code,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      isUsed: "false",
    });
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    const now = new Date();
    const otp = this.otps.find(
      (o) => o.phoneNumber === phoneNumber && o.code === code && o.isUsed === "false" && o.expiresAt > now
    );
    if (otp) {
      otp.isUsed = "true";
      return true;
    }
    return false;
  }

  async getRecentMessages(userId: string): Promise<Message[]> {
    const msgs = Array.from(this.messages.values()).filter((m) => m.receiverId === userId);
    msgs.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    return msgs.slice(0, 10);
  }

  async isFollowing(userId: string, contactId: string): Promise<boolean> {
    return this.contacts.has(`${userId}:${contactId}`);
  }

  async followUser(userId: string, contactId: string): Promise<void> {
    this.contacts.add(`${userId}:${contactId}`);
  }

  async unfollowUser(userId: string, contactId: string): Promise<void> {
    this.contacts.delete(`${userId}:${contactId}`);
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
