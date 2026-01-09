# SwiftChat - Real-time Messaging Application

## Overview

SwiftChat is a modern real-time messaging application built with a React frontend and Express backend. The application provides instant messaging, voice/video call tracking, user discovery, and contact management features. It follows a mobile-first design approach inspired by WhatsApp, Telegram, and Signal, with phone-based user discovery as a key feature.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for development and building
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management
- Tailwind CSS with custom design system
- Shadcn/ui component library (New York style variant)
- Lucide React for icons

**Design System:**
- Mobile-first responsive design with max-width containers
- Custom color palette using CSS variables with HSL values
- Plus Jakarta Sans (body) and Outfit (display) fonts
- Bottom navigation pattern for primary app navigation
- Polling-based real-time updates (2-second intervals for messages)

**Key Frontend Patterns:**
- Custom hooks for data fetching (`use-users`, `use-messages`, `use-calls`, `use-auth`)
- Layout component with conditional bottom navigation
- Avatar component with online status indicators
- Path aliases: `@/` for client/src, `@shared/` for shared code

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript
- Node.js with ESM modules
- HTTP server (no WebSocket implementation yet - uses polling)

**API Design:**
- RESTful API endpoints defined in `shared/routes.ts`
- Zod schemas for request/response validation
- Centralized route definitions shared between frontend and backend
- Session-based authentication with Replit Auth integration

**Authentication:**
- Replit OpenID Connect (OIDC) authentication
- Session storage in PostgreSQL via connect-pg-simple
- Passport.js for authentication middleware
- Session-based user state management

### Data Storage

**Database:**
- PostgreSQL (provisioned via Replit)
- Drizzle ORM for type-safe database operations
- Schema defined in `shared/schema.ts` and `shared/models/auth.ts`

**Schema Structure:**
- `users` - User profiles with auth integration (id as varchar/UUID)
- `sessions` - Session storage for authentication
- `messages` - Chat messages between users
- `calls` - Call history (video/voice)
- `contacts` - User contact relationships

**Database Commands:**
- `npm run db:push` - Push schema changes to database

### Build System

**Development:**
- `npm run dev` - Runs server with tsx in development mode
- Vite dev server with HMR for frontend
- Replit-specific plugins for development banner and cartographer

**Production:**
- `npm run build` - Builds both client (Vite) and server (esbuild)
- Server bundles select dependencies to reduce cold start times
- Output to `dist/` directory with `dist/public/` for static assets

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Drizzle ORM with node-postgres driver

### Authentication
- Replit OIDC authentication (`ISSUER_URL`, `REPL_ID` environment variables)
- `SESSION_SECRET` required for session encryption

### Third-Party Services
- UI Avatars API for fallback avatar generation
- Google Fonts for typography (Plus Jakarta Sans, Outfit)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express-session` / `connect-pg-simple` - Session management
- `passport` / `openid-client` - Authentication
- `@tanstack/react-query` - Server state management
- `zod` / `drizzle-zod` - Schema validation
- `date-fns` - Date formatting
- Radix UI primitives - Accessible component primitives