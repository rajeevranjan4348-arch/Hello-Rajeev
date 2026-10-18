import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  let sessionStore: any;
  if (process.env.DATABASE_URL) {
    try {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl / 1000, // ttl is in seconds for connect-pg-simple
        tableName: "sessions",
      });
    } catch (e) {
      console.warn("[Auth] Failed to initialize pg session store, using MemoryStore:", e);
    }
  }

  if (!sessionStore) {
    const MemoryStore = memorystore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  return session({
    secret: process.env.SESSION_SECRET || "zenix-secure-session-secret-key-2026",
    store: sessionStore,
    resave: true, // Force session to be saved back to the session store
    saveUninitialized: false,
    rolling: true, // Force a session identifier cookie to be set on every response
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: "auto",
      maxAge: sessionTtl,
      sameSite: "none",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (!process.env.REPL_ID) {
    console.log("[Auth] REPL_ID not set — Replit OIDC skipped. Phone/OTP authentication active.");
    return;
  }

  let config: any;
  try {
    config = await getOidcConfig();
  } catch (err) {
    console.warn("[Auth] Replit OIDC discovery failed:", err);
    return;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };


  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Support Header-based auth (for iframes where 3rd-party cookies are blocked)
  const authHeader = req.headers.authorization;
  const headerUserId =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    req.headers["x-user-id"];

  if (headerUserId) {
    const user = await authStorage.getUser(String(headerUserId));
    if (user) {
      req.user = { claims: { sub: user.id }, expires_at: Infinity };
      if (req.session) {
        req.session.otpUserId = user.id;
      }
      return next();
    }
  }

  // Support OTP-based phone auth (session-stored userId)
  if (req.session?.otpUserId) {
    req.user = { claims: { sub: req.session.otpUserId }, expires_at: Infinity };
    // Extend session on every request
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    return next();
  }

  // Fallback: Check if request body contains userId or phoneNumberFallback
  if (req.body?.userId) {
    const user = await authStorage.getUser(String(req.body.userId));
    if (user) {
      req.user = { claims: { sub: user.id }, expires_at: Infinity };
      if (req.session) {
        req.session.otpUserId = user.id;
      }
      return next();
    }
  }

  if (req.body?.phoneNumberFallback || req.body?.phoneNumber) {
    const phone = String(req.body.phoneNumberFallback || req.body.phoneNumber);
    const { storage } = await import("../../storage");
    const user = await storage.getUserByPhone(phone);
    if (user) {
      req.user = { claims: { sub: user.id }, expires_at: Infinity };
      if (req.session) {
        req.session.otpUserId = user.id;
      }
      return next();
    }
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extend session on every authenticated request to prevent timeout
  if (req.session) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Reset to 30 days
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
