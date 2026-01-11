# Rocket Site Builder

**Skills & Ignition Engine** - A modular plugin architecture with AI-powered execution runtime for building and deploying websites.

## Overview

Rocket Site Builder is a complete skill/plugin system extracted from the RocketOpp Marketplace. It provides:

1. **Skills Framework** - Modular, pluggable enhancements with JSON manifests
2. **Ignition Engine** - Execution runtime that performs real actions (file ops, database, AI, deployment)
3. **Permission System** - Granular security with risk assessment
4. **Rollback Capability** - Full audit trail with reversible actions
5. **AI Integration** - Anthropic Claude & OpenAI support for content generation
6. **Deployment** - Vercel integration for instant site deployment

---

## Architecture

```
rocket-site-builder/
├── lib/
│   └── skills/
│       ├── types.ts              # Core type definitions
│       ├── permissions.ts        # Permission checking system
│       ├── parser.ts             # Manifest validation
│       ├── logger.ts             # Action audit logging
│       ├── rollback.ts           # Revert operations
│       ├── runtime.ts            # Skill execution runtime
│       ├── index.ts              # Main exports
│       │
│       ├── ignition/             # Execution Engine
│       │   ├── types.ts          # Ignition-specific types
│       │   ├── engine.ts         # Core execution engine
│       │   ├── context.ts        # Execution context builder
│       │   ├── index.ts          # Ignition exports
│       │   │
│       │   ├── actions/          # Action Handlers
│       │   │   ├── registry.ts   # Action type registry
│       │   │   ├── file.ts       # File operations
│       │   │   ├── database.ts   # Database operations
│       │   │   ├── ai.ts         # AI generation
│       │   │   ├── deployment.ts # Vercel deployment
│       │   │   └── index.ts
│       │   │
│       │   └── providers/        # External Service Providers
│       │       ├── ai.ts         # Anthropic/OpenAI
│       │       ├── vercel.ts     # Vercel API
│       │       └── index.ts
│       │
│       └── package/              # Skill Packaging
│           ├── types.ts          # Package types
│           ├── templates.ts      # Pre-built templates
│           ├── creator.ts        # Skill creation
│           ├── exporter.ts       # Export to file
│           ├── importer.ts       # Import from file/URL
│           └── index.ts
│
├── app/
│   ├── api/skills/               # API Routes
│   │   ├── installed/route.ts    # List user's skills
│   │   ├── marketplace/route.ts  # Browse marketplace
│   │   ├── install/route.ts      # Install from marketplace
│   │   ├── import/route.ts       # Import skill package
│   │   ├── create/route.ts       # Create from template
│   │   ├── export/[id]/route.ts  # Export skill
│   │   └── [id]/
│   │       ├── route.ts          # Get/delete skill
│   │       ├── execute/route.ts  # Execute skill
│   │       ├── execute/stream/route.ts  # Streaming execution
│   │       ├── logs/route.ts     # Execution logs
│   │       ├── onboarding/route.ts      # Save onboarding
│   │       └── rollback/[logId]/route.ts
│   │
│   └── dashboard/skills/         # Dashboard Pages
│       ├── page.tsx              # Skills management
│       ├── marketplace/page.tsx  # Browse & install
│       ├── create/page.tsx       # Create custom skill
│       ├── install/page.tsx      # Install from URL
│       └── [id]/page.tsx         # Configure skill
│
└── supabase/migrations/
    ├── 005_skills_system.sql     # Skills tables
    └── 007_ignition_system.sql   # Execution tables
```

---

## Source Files Reference

All source files are located in `/Users/rocketopp/Desktop/GitHub/rocketopp-live/`

### Core Skills Library (`lib/skills/`)

| File | Lines | Description |
|:-----|:------|:------------|
| `types.ts` | 257 | Core type definitions - SkillManifest, PermissionType, ActionType, etc. |
| `permissions.ts` | 317 | Permission checking, risk levels, wildcard matching |
| `parser.ts` | 302 | Manifest JSON parsing and validation |
| `logger.ts` | 426 | Action logging for audit trail |
| `rollback.ts` | 359 | Revert operations using logged before states |
| `runtime.ts` | - | Skill execution runtime |
| `index.ts` | - | Main exports |

### Ignition Engine (`lib/skills/ignition/`)

| File | Lines | Description |
|:-----|:------|:------------|
| `types.ts` | 247 | Execution types - ActionConfig, ProgressEvent, ExecutionContext |
| `engine.ts` | 470 | Core IgnitionEngine class - orchestrates execution |
| `context.ts` | - | Builds execution context, template resolution |
| `actions/registry.ts` | 187 | Action handler registry with permission checks |
| `actions/file.ts` | 411 | file:create, file:modify, file:delete, file:template |
| `actions/database.ts` | 337 | db:query, db:insert, db:update, db:delete, db:upsert |
| `actions/ai.ts` | 331 | ai:generate, ai:analyze, ai:transform |
| `actions/deployment.ts` | 333 | deploy:vercel operations |
| `providers/ai.ts` | - | Anthropic & OpenAI provider abstraction |
| `providers/vercel.ts` | - | Vercel API wrapper |

### Skill Packaging (`lib/skills/package/`)

| File | Lines | Description |
|:-----|:------|:------------|
| `types.ts` | - | Package/template types |
| `templates.ts` | 838 | Pre-built skill templates (Blank, API Integration, Dashboard Widget, Cron Job, Database Sync) |
| `creator.ts` | - | Create skills from templates |
| `exporter.ts` | - | Export skills to files |
| `importer.ts` | - | Import from file/URL |

### API Routes (`app/api/skills/`)

| Route | Methods | Description |
|:------|:--------|:------------|
| `/installed` | GET | List user's installed skills |
| `/marketplace` | GET | Browse marketplace skills |
| `/install` | POST | Install from marketplace |
| `/import` | POST | Import skill package |
| `/create` | POST | Create from template |
| `/export/[id]` | GET | Export skill |
| `/[id]` | GET, DELETE | Get/uninstall skill |
| `/[id]/execute` | POST | Execute skill (supports pause/resume) |
| `/[id]/execute/stream` | GET | Stream execution progress |
| `/[id]/logs` | GET | Get execution logs |
| `/[id]/onboarding` | POST | Save onboarding data |
| `/[id]/rollback/[logId]` | POST | Rollback specific action |

---

## Core Concepts

### 1. Skill Manifest

Every skill is defined by a JSON manifest:

```typescript
interface SkillManifest {
  name: string           // Human-readable name
  slug: string           // URL-safe identifier (lowercase, hyphens)
  version: string        // Semantic version (1.0.0)
  author?: string
  description?: string
  icon?: string          // Icon name
  category?: string      // general, integrations, ui, automation, data

  // Security
  permissions: PermissionType[]  // Required permissions
  dependencies?: string[]        // Other skill slugs

  // Configuration
  onboarding: OnboardingField[]  // Setup form fields
  files?: FileMapping[]          // Files to create on install
  hooks?: SkillHooks             // Lifecycle scripts

  // Runtime
  entryPoint?: string
  schedules?: { name: string; cron: string; handler: string }[]

  // Dashboard Integration
  dashboard?: {
    route: string
    sidebar?: { label: string; icon: string; order?: number }
    widgets?: { type: string; title: string; component: string }[]
  }
}
```

### 2. Permission System

Granular permission types with risk assessment:

```typescript
type PermissionType =
  | 'api:read'           // Low risk
  | 'api:write'          // Medium risk
  | 'database:*'         // High risk - full DB access
  | 'database:${table}'  // High risk - specific table
  | 'files:read'         // Low risk
  | 'files:write'        // High risk
  | 'env:*'              // High risk - all env vars
  | 'env:${var}'         // High risk - specific var
  | 'exec:server'        // High risk
  | 'exec:client'        // Medium risk
  | 'cron:*'             // Medium risk
```

**Risk Levels:**
- **Low**: api:read, files:read
- **Medium**: api:write, exec:client, cron:*
- **High**: database:*, files:write, env:*, exec:server

### 3. Ignition Action Types

Actions that the engine can execute:

```typescript
type ActionType =
  // File Operations
  | 'file:create'     // Create new file
  | 'file:modify'     // Update existing file
  | 'file:delete'     // Remove file
  | 'file:template'   // Create from template with variables

  // Database Operations
  | 'db:query'        // SELECT
  | 'db:insert'       // INSERT
  | 'db:update'       // UPDATE
  | 'db:delete'       // DELETE
  | 'db:upsert'       // INSERT or UPDATE

  // External APIs
  | 'api:call'        // HTTP request

  // Deployment
  | 'deploy:vercel'   // Vercel operations

  // AI Generation
  | 'ai:generate'     // Generate content
  | 'ai:analyze'      // Analyze content
  | 'ai:transform'    // Transform content
```

### 4. Execution Context

Runtime context available to all actions:

```typescript
interface ExecutionContext {
  installationId: string
  userId: string
  skillId: string
  skillSlug: string

  config: Record<string, any>          // Installation config
  environment: Record<string, string>  // Env vars
  permissions: PermissionType[]        // Granted permissions

  manifest: SkillManifest
  variables: Record<string, any>       // Action outputs (shared)
  input: Record<string, any>           // Execution input

  onboardingData: Record<string, string>
}
```

### 5. Progress Events

Real-time streaming events during execution:

```typescript
type ProgressEventType =
  | 'start'      // Execution began
  | 'step'       // Named step started
  | 'action'     // Action state changed
  | 'log'        // Debug/info/warn/error
  | 'complete'   // Finished successfully
  | 'error'      // Failed

interface ProgressEvent {
  type: ProgressEventType
  timestamp: string

  // For 'action'
  actionId?: string
  actionType?: string
  actionName?: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

  // For results
  data?: any
  error?: string
  duration?: number
}
```

---

## Database Schema

### Skills System Tables

```sql
-- Skill Definitions
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  author TEXT,
  icon TEXT,
  icon_url TEXT,
  category TEXT DEFAULT 'general',
  manifest JSONB NOT NULL,
  source_url TEXT,
  is_marketplace BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Installations
CREATE TABLE skill_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES rocketopp_users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'installing', -- installing|installed|paused|error|uninstalling
  config JSONB DEFAULT '{}',
  permissions_granted JSONB DEFAULT '[]',
  environment JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT now(),
  last_run TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(user_id, skill_id)
);

-- Action Logs (for rollback)
CREATE TABLE skill_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES skill_installations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  reversible BOOLEAN DEFAULT true,
  reverted BOOLEAN DEFAULT false,
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding Data
CREATE TABLE skill_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES skill_installations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT,
  encrypted BOOLEAN DEFAULT false,
  collected_at TIMESTAMPTZ DEFAULT now()
);
```

### Ignition System Tables

```sql
-- Execution Records
CREATE TABLE skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES skill_installations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running', -- running|completed|failed|cancelled
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  progress JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Deployment Records
CREATE TABLE skill_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES skill_executions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES rocketopp_users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  provider TEXT DEFAULT 'vercel',
  provider_project_id TEXT,
  provider_deployment_id TEXT,
  deployment_url TEXT,
  custom_domain TEXT,
  status TEXT DEFAULT 'building', -- building|ready|error|deleted
  name TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generated Sites
CREATE TABLE rocket_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES rocketopp_users(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES skill_deployments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT, -- business|portfolio|saas|blog|ecommerce
  industry TEXT,
  description TEXT,
  vercel_project_id TEXT,
  vercel_url TEXT,
  custom_domain TEXT,
  status TEXT DEFAULT 'building',
  pages JSONB DEFAULT '[]',
  components JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Skill Templates

Pre-built templates for creating skills:

| Template | Category | Description |
|:---------|:---------|:------------|
| `blank` | general | Minimal skill structure |
| `api-integration` | integrations | External API connection |
| `dashboard-widget` | ui | Dashboard widget component |
| `cron-job` | automation | Scheduled task |
| `database-sync` | data | Sync external data to DB |

---

## Action Handlers

### File Actions (`file.ts`)

```typescript
// Create a new file
{
  type: 'file:create',
  path: '/app/pages/{{pageName}}.tsx',
  content: '...',
  encoding: 'utf-8'
}

// Create from template
{
  type: 'file:template',
  path: '/components/Header.tsx',
  templateId: 'react-component',
  variables: { ComponentName: 'Header' }
}
```

**Built-in Templates:**
- `nextjs-page` - Next.js page component
- `nextjs-layout` - Layout component
- `react-component` - React component
- `api-route` - API route handler
- `package-json` - package.json
- `tailwind-config` - Tailwind configuration
- `next-config` - Next.js configuration
- `tsconfig` - TypeScript configuration

### Database Actions (`database.ts`)

```typescript
// Query with conditions
{
  type: 'db:query',
  table: 'products',
  select: ['id', 'name', 'price'],
  where: { category: 'electronics', price: { lt: 1000 } },
  orderBy: { column: 'created_at', ascending: false },
  limit: 10
}

// Insert with auto user_id
{
  type: 'db:insert',
  table: 'orders',
  data: { product_id: '{{productId}}', quantity: 1 }
}
```

### AI Actions (`ai.ts`)

```typescript
// Generate content
{
  type: 'ai:generate',
  provider: 'anthropic',
  model: 'claude-3-sonnet',
  systemPrompt: 'You are a copywriter.',
  userPrompt: 'Write a tagline for {{companyName}}',
  outputFormat: 'text',
  outputTo: 'tagline'
}

// Analyze content
{
  type: 'ai:analyze',
  provider: 'openai',
  inputContent: '{{pageContent}}',
  userPrompt: 'Extract key themes and sentiment',
  outputFormat: 'json',
  outputTo: 'analysis'
}
```

### Deployment Actions (`deployment.ts`)

```typescript
// Create Vercel project
{
  type: 'deploy:vercel',
  operation: 'create-project',
  projectName: '{{siteName}}',
  framework: 'nextjs'
}

// Deploy files
{
  type: 'deploy:vercel',
  operation: 'deploy',
  projectId: '{{projectId}}',
  target: 'production'
}

// Add custom domain
{
  type: 'deploy:vercel',
  operation: 'add-domain',
  projectId: '{{projectId}}',
  domain: 'mysite.com'
}
```

---

## Usage Examples

### 1. Execute a Skill

```typescript
import { createIgnitionEngine } from '@/lib/skills/ignition'

const engine = createIgnitionEngine()

// Subscribe to progress
const unsubscribe = engine.onProgress((event) => {
  console.log(`[${event.type}] ${event.actionName || event.stepName}`)
})

// Execute
const result = await engine.execute(installationId, {
  input: { siteName: 'My Portfolio' }
})

unsubscribe()
```

### 2. Stream Execution

```typescript
const engine = createIgnitionEngine()

for await (const event of engine.executeWithStream(installationId)) {
  if (event.type === 'action') {
    updateUI(event.actionName, event.status)
  }
}
```

### 3. Check Permissions

```typescript
import { hasPermission, calculateOverallRisk } from '@/lib/skills/permissions'

const context = { permissions: ['api:read', 'database:products'] }

const canWrite = hasPermission(context, 'files:write')
// { allowed: false, reason: 'Permission "files:write" not granted' }

const risk = calculateOverallRisk(['database:*', 'files:write'])
// 'high'
```

### 4. Rollback Actions

```typescript
import { revertLog, getRevertibleLogs } from '@/lib/skills/rollback'

// Get revertible logs
const logs = await getRevertibleLogs(installationId)

// Revert specific action
const result = await revertLog(logs[0].id)
```

---

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (user-configurable via onboarding)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Deployment
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Session
SESSION_SECRET=
```

---

## Security Features

1. **Permission Validation** - All actions checked against granted permissions
2. **Sensitive File Protection** - Blocks writes to .env, credentials, secrets
3. **Database Scope** - Tables restricted to granted permissions
4. **Environment Isolation** - Each installation has isolated env vars
5. **Audit Trail** - Complete logging of all actions
6. **Rollback Support** - Reversible actions can be undone
7. **Risk Assessment** - Permissions categorized by risk level

---

## API Examples

### List Installed Skills

```bash
GET /api/skills/installed
Authorization: Bearer <session>
```

### Execute Skill

```bash
POST /api/skills/{id}/execute
Content-Type: application/json

{
  "input": {
    "siteName": "My Site",
    "industry": "technology"
  }
}
```

### Stream Execution Progress

```bash
GET /api/skills/{id}/execute/stream
Accept: text/event-stream
```

### Rollback Action

```bash
POST /api/skills/{id}/rollback/{logId}
```

---

## Related Projects

- **RocketOpp Marketplace** (rocketopp.com) - AI App Marketplace using this system
- **Rocket+** (rocketadd.com) - CRM enhancements
- **MCPFED** (mcpfed.com) - MCP server directory

---

## License

Proprietary - RocketOpp
