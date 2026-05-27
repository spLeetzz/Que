# 🔧 Que Developer Guide

> **Complete technical documentation for developers building with and on Que**

This guide covers everything you need to know about Que's architecture, API, and integration patterns.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Forms as a Service](#forms-as-a-service)
5. [Development Workflow](#development-workflow)
6. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

Que is built as a modern monorepo using **Turborepo** and **pnpm workspaces**, providing a clean separation between frontend, backend, and shared packages.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 16 (React 19) + tRPC Client + React Query          │
│  • Server Components for SEO                                 │
│  • Client Components for interactivity                       │
│  • Optimistic updates & caching                              │
└────────────────────┬────────────────────────────────────────┘
                     │ tRPC (Type-safe RPC)
┌────────────────────┴────────────────────────────────────────┐
│                         Backend                              │
│  Express + tRPC Server + Better Auth                         │
│  • /trpc - tRPC endpoints                                    │
│  • /api - REST endpoints (auto-generated)                    │
│  • /docs - Interactive API documentation                     │
│  • /api/auth - Better Auth endpoints                         │
└────────────────────┬────────────────────────────────────────┘
                     │ Drizzle ORM
┌────────────────────┴────────────────────────────────────────┐
│                       PostgreSQL                             │
│  • Events, Items, Participants, Responses                    │
│  • Users, Sessions, Accounts (Better Auth)                   │
│  • Personal Access Tokens, Form States                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Everything is an Event** - Forms, polls, and banter sessions share one unified table
2. **Items are Universal** - Questions and chat messages use the same structure
3. **Type Safety Everywhere** - tRPC ensures compile-time type checking from DB to UI
4. **Decimal Ordering** - Reorder items with a single write (no list reshuffling)
5. **Metadata Flexibility** - JSONB fields store type-specific configuration
6. **API-First** - Every feature is accessible via REST and tRPC

---

## 🗄️ Database Schema

### Core Entities

#### Events Table
The foundation of everything. Every form, poll, or banter session is an event.

```typescript
{
  id: uuid,
  creatorId: text,              // User who created it
  type: "form" | "poll" | "banter",
  status: "draft" | "published" | "archived" | "completed" | "deleted",
  mode: "standard" | "service", // Service mode for API integrations
  visibility: "public" | "private",
  resultVisibility: "all" | "creator_only",
  title: text,
  description: text,
  slug: text,                   // Custom URL slug
  authRequired: boolean,
  multipleResponses: boolean,
  receiveEmails: boolean,
  redirectUrl: text,            // For service mode
  hiddenFields: jsonb,          // For service mode
  theme: text,                  // Custom styling
  expiresAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Items Table
Questions and chat messages. Same table, different categories.

```typescript
{
  id: uuid,
  eventId: uuid,
  category: "question" | "chat",
  value: text,                  // Question text or chat message
  order: double,                // Decimal ordering (1.0, 1.5, 2.0)
  participantId: uuid,          // For chat messages only
  questionType: "text" | "slider" | "options", // For questions only
  required: boolean,
  metadata: jsonb,              // Type-specific config
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Metadata Examples:**
```typescript
// Text question
{ subtype: "short" | "long" | "email" | "date" | "number" }

// Slider question
{ min: 0, max: 100 }

// Options question
{ 
  multiple: false,
  choices: ["Option 1", "Option 2", "Option 3"],
  isDropdown: false  // true for select dropdown
}
```

#### Participants Table
Identity layer for event interactions.

```typescript
{
  id: uuid,
  eventId: uuid,
  userId: text,                 // Null for anonymous
  alias: text,                  // Display name
  lastSeenItemId: uuid,         // For abandonment tracking
  submittedAt: timestamp,       // Null until form submitted
  joinedAt: timestamp
}
```

#### Responses & Answers Tables
Split submission metadata from answer data for efficient querying.

```typescript
// Responses - One per submission
{
  id: uuid,
  eventId: uuid,
  participantId: uuid,
  userId: text,
  stateId: uuid,                // For service mode
  externalUserId: text,         // For service mode
  externalMetadata: jsonb,      // For service mode
  ipHash: text,
  userAgent: text,
  submittedAt: timestamp
}

// Answers - One per question per response
{
  id: uuid,
  responseId: uuid,
  participantId: uuid,
  itemId: uuid,
  value: text[],                // Array for multi-select
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Service Mode Tables

#### Personal Access Tokens
API authentication for developers.

```typescript
{
  id: uuid,
  userId: text,
  tokenHash: text,              // SHA-256 hashed
  name: text,
  lastUsedAt: timestamp,
  createdAt: timestamp,
  expiresAt: timestamp,
  revokedAt: timestamp
}
```

**Token Format:** `que_pat_<32_random_chars>`

**Constraint:** Only one active PAT per user (enforced by unique index)

#### Form States
Temporary authentication tokens for service mode forms.

```typescript
{
  id: uuid,
  eventId: uuid,
  stateToken: text,             // HMAC-SHA256 signed
  externalUserId: text,         // From your system
  metadata: jsonb,              // Additional context
  expiresAt: timestamp,         // 60s - 1 hour
  usedAt: timestamp,            // One-time use
  responseId: uuid,             // Linked after submission
  createdAt: timestamp
}
```

---

## 🔌 API Reference

### tRPC Endpoints

All tRPC endpoints are automatically documented at `/docs` when running the API server.

#### Events

```typescript
// List events
trpc.events.list.query({
  type?: "form" | "poll" | "banter",
  status?: "draft" | "published" | "archived" | "completed",
  page?: number,
  pageSize?: number
})

// Get single event
trpc.events.getByIdOrSlug.query({
  identifier: string  // UUID or slug
})

// Create event
trpc.events.create.mutate({
  type: "form" | "poll" | "banter",
  title: string,
  description?: string,
  slug?: string,
  visibility?: "public" | "private",
  authRequired?: boolean,
  multipleResponses?: boolean,
  theme?: string
})

// Update event
trpc.events.update.mutate({
  id: string,
  title?: string,
  description?: string,
  status?: "draft" | "published" | "archived" | "completed"
  // ... other fields
})

// Delete event (soft delete)
trpc.events.delete.mutate({ id: string })
```

#### Items

```typescript
// List items for an event
trpc.items.listByEvent.query({
  eventId: string,
  category?: "question" | "chat"
})

// Create item
trpc.items.create.mutate({
  eventId: string,
  category: "question" | "chat",
  value: string,
  questionType?: "text" | "slider" | "options",
  required?: boolean,
  metadata?: object
})

// Update item
trpc.items.update.mutate({
  id: string,
  value?: string,
  required?: boolean,
  metadata?: object
})

// Reorder item
trpc.items.reorder.mutate({
  id: string,
  newOrder: number  // Decimal value
})

// Delete item
trpc.items.delete.mutate({ id: string })
```

#### Responses

```typescript
// Submit response
trpc.responses.create.mutate({
  eventId: string,
  participantId?: string,
  answers: [
    {
      itemId: string,
      value: string[]
    }
  ]
})

// List responses
trpc.responses.listByEvent.query({
  eventId: string,
  page?: number,
  pageSize?: number
})
```

#### Analytics

```typescript
// Get event analytics
trpc.analytics.getFullAnalytics.query({
  eventId: string
})

// Returns:
{
  overview: {
    totalResponses: number,
    completionRate: number,
    avgTimeToComplete: number,
    abandonmentRate: number
  },
  timeline: Array<{ date: string, count: number }>,
  abandonmentFunnel: Array<{ itemId: string, dropoffCount: number }>,
  questionAnalytics: Array<{
    itemId: string,
    questionText: string,
    responseCount: number,
    distribution: object
  }>,
  participantJourneys: Array<{
    participantId: string,
    completedAt: timestamp,
    timeSpent: number
  }>
}
```

### REST API

All tRPC endpoints are automatically exposed as REST endpoints via `trpc-to-openapi`.

**Base URL:** `http://localhost:8000/api`

**Authentication:** Bearer token (PAT) in Authorization header

```bash
# Example: List events
curl -H "Authorization: Bearer que_pat_..." \
  http://localhost:8000/api/events

# Example: Create event
curl -X POST \
  -H "Authorization: Bearer que_pat_..." \
  -H "Content-Type: application/json" \
  -d '{"type":"form","title":"Customer Survey"}' \
  http://localhost:8000/api/events
```

**Interactive Documentation:** Visit `http://localhost:8000/docs` for the full Scalar API explorer.

---

## 🚀 Forms as a Service

Que can be used as a headless form backend for your applications. This is perfect for:
- Embedding forms in your website
- Collecting data from mobile apps
- Building custom form UIs
- Integrating with existing systems

### Setup Flow

1. **Generate a Personal Access Token (PAT)**
   ```typescript
   // Via tRPC
   const { token } = await trpc.pat.generate.mutate({
     name: "My App Integration"
   })
   // Returns: "que_pat_abc123..."
   ```

2. **Create a Service Mode Form**
   ```typescript
   const event = await fetch('http://localhost:8000/api/events', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${pat}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       type: 'form',
       mode: 'service',
       title: 'Customer Feedback',
       redirectUrl: 'https://yourapp.com/thank-you',
       hiddenFields: {
         required: ['external_user_id'],
         optional: ['source', 'campaign']
       }
     })
   })
   ```

3. **Generate a State Token**
   ```typescript
   // When a user in your system wants to fill the form
   const { stateToken } = await fetch('http://localhost:8000/api/form-states', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${pat}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       eventId: 'event-uuid',
       externalUserId: 'user-123',
       metadata: {
         source: 'mobile-app',
         campaign: 'summer-2024'
       },
       expiresIn: 3600  // 1 hour
     })
   })
   ```

4. **Redirect User to Form**
   ```typescript
   // Send user to:
   const formUrl = `https://que.yourapp.com/forms/${eventId}?state=${stateToken}`
   ```

5. **User Fills Form**
   - Form validates state token
   - Hidden fields are automatically populated
   - User completes the form
   - Redirected to your `redirectUrl`

6. **Retrieve Responses**
   ```typescript
   // Fetch responses via API
   const responses = await fetch(
     `http://localhost:8000/api/responses?eventId=${eventId}`,
     {
       headers: { 'Authorization': `Bearer ${pat}` }
     }
   )
   ```

### Security Features

- **One-time use tokens** - State tokens can only be used once
- **Expiration** - Tokens expire after configured time (60s - 1 hour)
- **HMAC signing** - Tokens are cryptographically signed
- **PAT rotation** - Only one active PAT per user (revoke and regenerate)
- **IP tracking** - Response IP addresses are hashed for privacy

---

## 💻 Development Workflow

### Project Structure

```
que/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   └── trpc/               # tRPC client setup
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── index.ts        # HTTP server
│       │   ├── server.ts       # Express app
│       │   └── socket.ts       # WebSocket (optional)
│       └── dist/               # Build output
├── packages/
│   ├── database/               # Drizzle ORM
│   │   ├── schema.ts           # Database tables
│   │   ├── index.ts            # DB connection
│   │   └── migrations/         # SQL migrations
│   ├── trpc/                   # tRPC server
│   │   └── server/
│   │       ├── index.ts        # Main router
│   │       ├── trpc.ts         # Procedures & middleware
│   │       ├── context.ts      # Request context
│   │       └── modules/        # Feature modules
│   ├── auth/                   # Better Auth
│   │   ├── server.ts           # Auth config
│   │   └── schema.ts           # Auth tables
│   └── logger/                 # Logging utilities
└── docs/                       # Additional documentation
```

### Adding a New Feature

Let's walk through adding a new feature: **Event Templates**.

#### 1. Update Database Schema

```typescript
// packages/database/schema.ts
export const eventTemplates = pgTable("event_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: eventTypeEnum("type").notNull(),
  templateData: jsonb("template_data").notNull(),
  creatorId: text("creator_id").references(() => user.id),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
})
```

```bash
# Generate and run migration
pnpm db:generate
pnpm db:migrate
```

#### 2. Create tRPC Module

```typescript
// packages/trpc/server/modules/templates/templates.schema.ts
import { z } from "zod"

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["form", "poll", "banter"]),
  templateData: z.object({
    items: z.array(z.any()),
    settings: z.any()
  })
})

export const listTemplatesSchema = z.object({
  type: z.enum(["form", "poll", "banter"]).optional(),
  isPublic: z.boolean().optional()
})
```

```typescript
// packages/trpc/server/modules/templates/templates.service.ts
import { db } from "@repo/database"
import { eventTemplates } from "@repo/database/schema"
import { eq, and } from "drizzle-orm"

export class TemplatesService {
  static async create(data: any, userId: string) {
    const [template] = await db
      .insert(eventTemplates)
      .values({ ...data, creatorId: userId })
      .returning()
    return template
  }

  static async list(filters: any) {
    const conditions = []
    if (filters.type) conditions.push(eq(eventTemplates.type, filters.type))
    if (filters.isPublic !== undefined) {
      conditions.push(eq(eventTemplates.isPublic, filters.isPublic))
    }
    
    return await db
      .select()
      .from(eventTemplates)
      .where(and(...conditions))
  }
}
```

```typescript
// packages/trpc/server/modules/templates/index.ts
import { router, publicProcedure, protectedProcedure } from "../../trpc"
import { createTemplateSchema, listTemplatesSchema } from "./templates.schema"
import { TemplatesService } from "./templates.service"

export const templatesRouter = router({
  list: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/templates",
        summary: "List event templates",
        tags: ["templates"]
      }
    })
    .input(listTemplatesSchema)
    .query(async ({ input }) => {
      return await TemplatesService.list(input)
    }),

  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/templates",
        summary: "Create event template",
        tags: ["templates"],
        protect: true
      }
    })
    .input(createTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      return await TemplatesService.create(input, ctx.user.id)
    })
})
```

#### 3. Register Router

```typescript
// packages/trpc/server/index.ts
import { templatesRouter } from "./modules/templates"

export const serverRouter = router({
  // ... existing routers
  templates: templatesRouter
})
```

#### 4. Create Frontend Hook

```typescript
// apps/web/hooks/use-templates.ts
import { trpc } from "~/trpc/client"

export function useTemplates(filters?: { type?: string }) {
  return trpc.templates.list.useQuery(filters)
}

export function useCreateTemplate() {
  const utils = trpc.useUtils()
  
  return trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate()
    }
  })
}
```

#### 5. Build UI Component

```typescript
// apps/web/components/features/template-picker.tsx
"use client"

import { useTemplates } from "~/hooks/use-templates"
import { Card } from "~/components/ui/card"

export function TemplatePicker({ onSelect }: { onSelect: (template: any) => void }) {
  const { data: templates, isLoading } = useTemplates()

  if (isLoading) return <div>Loading templates...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      {templates?.map((template) => (
        <Card
          key={template.id}
          onClick={() => onSelect(template)}
          className="cursor-pointer hover:border-primary"
        >
          <h3>{template.name}</h3>
          <p>{template.description}</p>
        </Card>
      ))}
    </div>
  )
}
```

### Development Commands

```bash
# Start all services in development mode
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint

# Database operations
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio
pnpm db:push        # Push schema changes (dev only)

# Package-specific commands
pnpm --filter web dev        # Run only web app
pnpm --filter api dev        # Run only API server
pnpm --filter @repo/trpc build  # Build specific package
```

### Adding Dependencies

```bash
# Add to specific package
pnpm add <package> --filter <workspace-name>

# Examples:
pnpm add zod --filter @repo/trpc
pnpm add lucide-react --filter web
pnpm add express-rate-limit --filter api

# Add to root (dev dependencies only)
pnpm add -D <package> -w
```

---

## 🚢 Deployment

### Environment Variables

#### Frontend (apps/web/.env)
```bash
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

#### Backend (apps/api/.env)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://api.yourapp.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Database (packages/database/.env)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Production Checklist

- [ ] Set strong `BETTER_AUTH_SECRET`
- [ ] Configure OAuth providers
- [ ] Set up PostgreSQL with connection pooling
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets

### Deployment Platforms

#### Vercel (Frontend)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel
```

#### Railway/Render (Backend)
```bash
# Build command
pnpm build --filter api

# Start command
node apps/api/dist/index.js
```

#### Docker
```dockerfile
# Example Dockerfile for API
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build --filter api
CMD ["node", "apps/api/dist/index.js"]
```

---

## 🔍 Debugging

### Enable Debug Logging

```typescript
// packages/logger/index.ts
export const logger = pino({
  level: process.env.LOG_LEVEL || 'debug'
})
```

### tRPC Request Logging

```typescript
// packages/trpc/server/trpc.ts
export const tRPCContext = initTRPC
  .context<typeof createContext>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      logger.error({ error }, 'tRPC Error')
      return shape
    }
  })
```

### Database Query Logging

```typescript
// packages/database/index.ts
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development'
})
```

---

## 📚 Additional Resources

- **[Modular Structure Guide](./docs/MODULAR-STRUCTURE.md)** - tRPC module organization
- **[CSS Architecture](./docs/CSS_ARCHITECTURE.md)** - Frontend styling patterns
- **[Forms as a Service Spec](./docs/FORMS_AS_SERVICE_SPEC.md)** - Complete FaaS documentation
- **[Analytics Implementation](./docs/ANALYTICS_IMPLEMENTATION_SUMMARY.md)** - Analytics system details

---

## 🤝 Contributing

When contributing code:

1. Follow the existing module structure
2. Add tRPC schemas with OpenAPI metadata
3. Write services for business logic
4. Create custom hooks for frontend
5. Add TypeScript types everywhere
6. Update this documentation

---

**Questions?** Open an issue or check the [docs folder](./docs/) for more detailed guides.
