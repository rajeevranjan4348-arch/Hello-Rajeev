import { db } from "./db";
import { eq, or, and, desc, ne, like, gt, isNull } from "drizzle-orm";
import {
  users, messages, calls, contacts, otps,
  type User, type UpsertUser,
  type Message, type InsertMessage,
  type Call, type InsertCall
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Auth & User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  upsertUserByPhone(phoneNumber: string, name?: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
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

  // Contact methods
  isFollowing(userId: string, contactId: string): Promise<boolean>;
  followUser(userId: string, contactId: string): Promise<void>;
  unfollowUser(userId: string, contactId: string): Promise<void>;

  // OTP methods
  createOTP(phoneNumber: string, code: string): Promise<void>;
  verifyOTP(phoneNumber: string, code: string): Promise<boolean>;

  getRecentMessages(userId: string): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private usersMap = new Map<string, User>();
  private messagesList: Message[] = [];
  private callsList: Call[] = [];
  private contactsList: { id: number; userId: string; contactId: string; createdAt: Date }[] = [];
  private otpsList: { id: number; phoneNumber: string; code: string; expiresAt: Date; isUsed: string; createdAt: Date }[] = [];
  private currentMessageId = 1;
  private currentCallId = 1;
  private currentContactId = 1;
  private currentOtpId = 1;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const demoUsers: User[] = [
      {
        id: "demo-user-aarav",
        email: "aarav@zenix.chat",
        firstName: "Aarav",
        lastName: "Sharma",
        phoneNumber: "+919876543210",
        profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        bio: "Hey there! I am using Zenix 🚀",
        birthDate: null,
        isPhoneNumberPublic: true,
        isBioPublic: true,
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo-user-priya",
        email: "priya@zenix.chat",
        firstName: "Priya",
        lastName: "Patel",
        phoneNumber: "+919123456789",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        bio: "Designing digital experiences ✨",
        birthDate: null,
        isPhoneNumberPublic: false,
        isBioPublic: true,
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo-user-rohan",
        email: "rohan@zenix.chat",
        firstName: "Rohan",
        lastName: "Verma",
        phoneNumber: "+919988776655",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        bio: "Available for voice & video calls 📞",
        birthDate: null,
        isPhoneNumberPublic: false,
        isBioPublic: true,
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo-user-rajeev",
        email: "rajeev@zenix.chat",
        firstName: "Rajeev",
        lastName: "Ranjan",
        phoneNumber: "+919811223344",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        bio: "Welcome to Zenix Messenger! 👋",
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
      this.usersMap.set(u.id, u);
    }

    // Seed some initial welcome messages between Rajeev and Aarav
    this.messagesList.push({
      id: this.currentMessageId++,
      senderId: "demo-user-rajeev",
      receiverId: "demo-user-aarav",
      groupId: null,
      content: "Welcome to Zenix! Ready for real-time messaging.",
      isEdited: "false",
      isDeleted: "false",
      type: "text",
      readAt: new Date(),
      expiresAt: null,
      createdAt: new Date(Date.now() - 7200000),
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    for (const user of Array.from(this.usersMap.values())) {
      if (user.phoneNumber === phoneNumber) return user;
    }
    return undefined;
  }

  async upsertUserByPhone(phoneNumber: string, name?: string): Promise<User> {
    const existing = await this.getUserByPhone(phoneNumber);
    if (existing) {
      if (name && (!existing.firstName || existing.firstName === "User")) {
        const parts = name.trim().split(" ");
        existing.firstName = parts[0] || "User";
        existing.lastName = parts.slice(1).join(" ") || "";
        existing.updatedAt = new Date();
        this.usersMap.set(existing.id, existing);
      }
      return existing;
    }
    const firstName = name?.split(" ")[0] || "User";
    const lastName = name?.split(" ").slice(1).join(" ") || phoneNumber.slice(-4);
    const newUser: User = {
      id: randomUUID(),
      email: null,
      firstName,
      lastName,
      phoneNumber,
      profileImageUrl: null,
      bio: "Hey there! I am using Zenix.",
      birthDate: null,
      isPhoneNumberPublic: false,
      isBioPublic: true,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(newUser.id, newUser);
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const existing = this.usersMap.get(id);
    const updatedUser: User = {
      id,
      email: userData.email ?? existing?.email ?? null,
      firstName: userData.firstName ?? existing?.firstName ?? "User",
      lastName: userData.lastName ?? existing?.lastName ?? "",
      phoneNumber: userData.phoneNumber ?? existing?.phoneNumber ?? null,
      profileImageUrl: userData.profileImageUrl ?? existing?.profileImageUrl ?? null,
      bio: userData.bio ?? existing?.bio ?? null,
      birthDate: userData.birthDate ?? existing?.birthDate ?? null,
      isPhoneNumberPublic: userData.isPhoneNumberPublic ?? existing?.isPhoneNumberPublic ?? false,
      isBioPublic: userData.isBioPublic ?? existing?.isBioPublic ?? true,
      isOnline: userData.isOnline ?? existing?.isOnline ?? false,
      lastSeen: userData.lastSeen ?? existing?.lastSeen ?? new Date(),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]> {
    const allUsers = Array.from(this.usersMap.values()).filter((u) => u.id !== currentUserId);

    return allUsers.map((user) => {
      const convoMessages = this.messagesList.filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === user.id) ||
          (m.senderId === user.id && m.receiverId === currentUserId)
      );
      const lastMessage = convoMessages[convoMessages.length - 1];
      return { ...user, lastMessage };
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    const q = query.toLowerCase();
    return Array.from(this.usersMap.values()).filter(
      (u) =>
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q))
    );
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.usersMap.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.usersMap.set(userId, user);
    }
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return this.messagesList
      .filter(
        (m) =>
          !m.groupId &&
          ((m.senderId === userId1 && m.receiverId === userId2) ||
            (m.senderId === userId2 && m.receiverId === userId1))
      )
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.currentMessageId++,
      senderId: message.senderId,
      receiverId: message.receiverId ?? null,
      groupId: message.groupId ?? null,
      content: message.content,
      isEdited: "false",
      isDeleted: "false",
      type: message.type || "text",
      readAt: null,
      expiresAt: null,
      createdAt: new Date(),
    };
    this.messagesList.push(newMessage);
    return newMessage;
  }

  async updateMessage(id: number, content: string): Promise<Message> {
    const msg = this.messagesList.find((m) => m.id === id);
    if (!msg) throw new Error("Message not found");
    msg.content = content;
    msg.isEdited = "true";
    return msg;
  }

  async deleteMessage(id: number): Promise<Message> {
    const msg = this.messagesList.find((m) => m.id === id);
    if (!msg) throw new Error("Message not found");
    msg.isDeleted = "true";
    msg.content = "This message was deleted";
    return msg;
  }

  async clearChat(userId: string, partnerId: string): Promise<void> {
    this.messagesList = this.messagesList.filter(
      (m) =>
        !(
          (m.senderId === userId && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === userId)
        )
    );
  }

  async deleteChat(userId: string, partnerId: string): Promise<void> {
    await this.clearChat(userId, partnerId);
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    const now = new Date();
    for (const msg of this.messagesList) {
      if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.readAt) {
        msg.readAt = now;
      }
    }
  }

  async createCall(call: InsertCall): Promise<Call> {
    const newCall: Call = {
      id: this.currentCallId++,
      callerId: call.callerId,
      calleeId: call.calleeId,
      type: call.type ?? "video",
      status: call.status ?? "missed",
      startedAt: new Date(),
      endedAt: null,
    };
    this.callsList.unshift(newCall);
    return newCall;
  }

  async getCalls(userId: string): Promise<Call[]> {
    return this.callsList
      .filter((c) => c.callerId === userId || c.calleeId === userId)
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  async createOTP(phoneNumber: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    this.otpsList.push({
      id: this.currentOtpId++,
      phoneNumber,
      code,
      expiresAt,
      isUsed: "false",
      createdAt: new Date(),
    });
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    const now = new Date();
    const otp = this.otpsList
      .slice()
      .reverse()
      .find((o) => o.phoneNumber === phoneNumber && o.code === code && o.isUsed === "false" && o.expiresAt > now);

    if (otp) {
      otp.isUsed = "true";
      return true;
    }
    return false;
  }

  async getRecentMessages(userId: string): Promise<Message[]> {
    return this.messagesList
      .filter((m) => m.receiverId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 10);
  }

  async isFollowing(userId: string, contactId: string): Promise<boolean> {
    return this.contactsList.some((c) => c.userId === userId && c.contactId === contactId);
  }

  async followUser(userId: string, contactId: string): Promise<void> {
    if (!await this.isFollowing(userId, contactId)) {
      this.contactsList.push({
        id: this.currentContactId++,
        userId,
        contactId,
        createdAt: new Date(),
      });
    }
  }

  async unfollowUser(userId: string, contactId: string): Promise<void> {
    this.contactsList = this.contactsList.filter(
      (c) => !(c.userId === userId && c.contactId === contactId)
    );
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    if (!db) return undefined;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsers(currentUserId: string): Promise<(User & { lastMessage?: Message })[]> {
    if (!db) return [];
    const allUsers = await db.select().from(users).where(ne(users.id, currentUserId));
    
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
    if (!db) return [];
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
    if (!db) return;
    await db.update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    if (!db) return [];
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
    if (!db) return;
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
    if (!db) return;
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
    if (!db) return [];
    return await db.select().from(calls).where(
      or(eq(calls.callerId, userId), eq(calls.calleeId, userId))
    ).orderBy(desc(calls.startedAt));
  }

  async createOTP(phoneNumber: string, code: string): Promise<void> {
    if (!db) return;
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await db.insert(otps).values({
      phoneNumber,
      code,
      expiresAt,
    });
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    if (!db) return false;
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
    if (!db) return [];
    return await db.select()
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(10);
  }

  async isFollowing(userId: string, contactId: string): Promise<boolean> {
    if (!db) return false;
    const [follow] = await db.select().from(contacts).where(
      and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))
    );
    return !!follow;
  }

  async followUser(userId: string, contactId: string): Promise<void> {
    if (!db) return;
    await db.insert(contacts).values({ userId, contactId });
  }

  async unfollowUser(userId: string, contactId: string): Promise<void> {
    if (!db) return;
    await db.delete(contacts).where(
      and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))
    );
  }
}

export const memStorage = new MemStorage();
export const storage: IStorage = db ? new DatabaseStorage() : memStorage;
