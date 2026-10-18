import { z } from 'zod';
import { insertUserSchema, insertMessageSchema, users, messages, calls } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/users',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages/:userId', // Get messages with a specific user
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages',
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  calls: {
    list: {
      method: 'GET' as const,
      path: '/api/calls',
      responses: {
        200: z.array(z.custom<typeof calls.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/calls',
      input: z.object({
        calleeId: z.string(),
        type: z.enum(['video', 'voice']),
      }),
      responses: {
        201: z.custom<typeof calls.$inferSelect>(),
      },
    },
  }
};

// ============================================
// HELPERS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPES
// ============================================
export type UserResponse = z.infer<typeof api.users.get.responses[200]>;
export type MessageInput = z.infer<typeof api.messages.send.input>;
export type MessageResponse = z.infer<typeof api.messages.send.responses[201]>;
