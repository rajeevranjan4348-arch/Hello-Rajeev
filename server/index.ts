import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Manage user presence and socket mapping
const userSockets = new Map<string, string>();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  socket.on("call-user", ({ to, offer, type }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from: userId, offer, type });
    }
  });

  socket.on("send-message", ({ to, content }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("new-message", { senderId: userId, content });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-answered", { from: userId, answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", { from: userId, candidate });
    }
  });

  socket.on("reject-call", ({ to }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-rejected", { from: userId });
    }
  });

  socket.on("end-call", ({ to }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-ended", { from: userId });
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
