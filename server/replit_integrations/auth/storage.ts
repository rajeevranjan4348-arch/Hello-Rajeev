import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

const memUsers = new Map<string, User>();

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (db) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    }
    return memUsers.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (db) {
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

    const id = userData.id || `user-${Date.now()}`;
    const existing = memUsers.get(id);
    const updated: User = {
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
      isOnline: userData.isOnline ?? existing?.isOnline ?? true,
      lastSeen: new Date(),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    memUsers.set(id, updated);
    return updated;
  }
}

export const authStorage = new AuthStorage();
export { memUsers };
