# Rocket Site Builder - How It Works

> **One Platform. GHL Backend. Infinite Possibilities.**

---

## 🎯 The Core Concept

Rocket Site Builder deploys **Next.js websites** that use **GoHighLevel (GHL)** as the entire backend:

- **Users** → GHL Contacts (with custom fields for passwords)
- **Content** → GHL Blogs + Custom Values
- **CRM** → GHL Contacts, Pipelines, Opportunities
- **Payments** → GHL Products + Stripe (via MCP)
- **Automations** → GHL Workflows + Voice AI
- **Admins** → GHL Team Members

**Result:** Clients manage everything from GHL. The deployed site just *displays* and *interacts* with GHL data.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S WEBSITE                                  │
│                         (Deployed on Vercel)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Pages     │  │   Auth      │  │  Dashboard  │  │   API       │       │
│   │  (Public)   │  │  (Login)    │  │  (Members)  │  │  Routes     │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
│          └────────────────┴────────────────┴────────────────┘               │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      IGNITION ENGINE                                 │   │
│   │                                                                      │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│   │  │  file:  │ │   db:   │ │   ai:   │ │ deploy: │ │  mcp:   │       │   │
│   │  │ create  │ │  query  │ │generate │ │ vercel  │ │  call   │       │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────┬────┘       │   │
│   │                                                        │            │   │
│   └────────────────────────────────────────────────────────┼────────────┘   │
│                                                            │                 │
└────────────────────────────────────────────────────────────┼─────────────────┘
                                                             │
                    ┌────────────────────────────────────────┼────────────────┐
                    │                                        │                │
                    ▼                                        ▼                ▼
        ┌───────────────────┐              ┌───────────────────┐    ┌─────────────┐
        │        GHL        │              │   MCP Registry    │    │   Vercel    │
        │  (Your Backend)   │              │                   │    │   (Host)    │
        │                   │              │  • Stripe         │    │             │
        │  • Contacts       │              │  • Canva          │    │  • Deploy   │
        │  • Blogs          │              │  • Google Drive   │    │  • Domains  │
        │  • Products       │              │  • Notion         │    │  • SSL      │
        │  • Workflows      │              │  • Slack          │    │             │
        │  • Voice AI       │              │  • 20+ more...    │    │             │
        │  • Calendars      │              │                   │    │             │
        │  • Team Members   │              └───────────────────┘    └─────────────┘
        └───────────────────┘
```

---

## 🔑 GHL as User Database

Instead of a separate auth system, we use **GHL Contacts** as users:

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    GHL CONTACT = USER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Standard Fields:                                           │
│  ├── email ────────────────► Login identifier               │
│  ├── firstName ────────────► Display name                   │
│  ├── lastName                                               │
│  └── phone                                                  │
│                                                             │
│  Custom Fields:                                             │
│  ├── password_hash ────────► bcrypt hashed password         │
│  ├── user_role ────────────► "admin" | "member" | "guest"   │
│  ├── subscription_tier ────► "free" | "pro" | "enterprise"  │
│  ├── last_login ───────────► ISO timestamp                  │
│  └── preferences ──────────► JSON string                    │
│                                                             │
│  Tags:                                                      │
│  ├── "site-user" ──────────► Identifies as website user     │
│  ├── "verified" ───────────► Email verified                 │
│  └── "premium" ────────────► Paid subscriber                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Auth Flow

```
1. SIGNUP
   User submits form → Create GHL Contact → Hash password → Store in custom field → Add "site-user" tag

2. LOGIN
   User submits email/password → Fetch contact by email → Verify password hash → Issue JWT → Set cookie

3. PROTECTED ROUTES
   Request comes in → Verify JWT → Fetch contact from GHL → Check role/permissions → Allow or deny

4. ADMIN ACCESS
   GHL Team Members = Site Admins → Full dashboard access → Manage all contacts/content
```

### Benefits

✅ **Single source of truth** - All users in GHL CRM  
✅ **No separate database** - GHL handles storage  
✅ **CRM features built-in** - Tags, workflows, pipelines  
✅ **Admins use GHL** - Familiar interface for clients  
✅ **Automations ready** - Trigger workflows on signup  

---

## 📝 GHL as Content CMS

Website content comes from GHL:

### Blog Posts

```typescript
// Fetch from GHL
const { posts } = await ghl.blogs.list({ status: 'PUBLISHED', limit: 10 })

// Each post has:
{
  id: "abc123",
  title: "How to Grow Your Business",
  blogContent: "<p>Content here...</p>",
  urlSlug: "how-to-grow-your-business",
  status: "PUBLISHED",
  author: { name: "John Smith" },
  createdAt: "2024-01-15T10:00:00Z",
  featuredImage: "https://..."
}

// Display on site
<BlogPost post={post} />
```

### Custom Values (Site Config)

```typescript
// GHL Custom Values = Site Settings
const { customValues } = await ghl.location.getCustomValues()

// Store site config as custom values:
{
  "site_name": "Acme Corp",
  "site_tagline": "Building the Future",
  "primary_color": "#3B82F6",
  "hero_headline": "Welcome to Acme",
  "hero_subheadline": "We make things happen",
  "footer_text": "© 2024 Acme Corp",
  "social_twitter": "https://twitter.com/acme",
  "social_linkedin": "https://linkedin.com/company/acme"
}

// Use in components
<Hero 
  headline={config.hero_headline}
  subheadline={config.hero_subheadline}
/>
```

### Custom Fields (Structured Data)

```typescript
// For complex data, use contact custom fields or create "data" contacts
// Example: Testimonials stored as contacts with tag "testimonial"

const { contacts: testimonials } = await ghl.contacts.list({ 
  query: 'tag:testimonial' 
})

// Custom fields on testimonial contacts:
{
  testimonial_text: "Great service!",
  testimonial_rating: "5",
  testimonial_company: "Tech Inc"
}
```

---

## 🔌 MCP Integration

The **MCP Registry** connects to 20+ external services:

### How MCP Works

```
┌──────────────────────────────────────────────────────────────────┐
│                         MCP REGISTRY                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Built-in Servers:                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GHL        │ 30+ tools │ Contacts, Blogs, Voice AI, etc.   │ │
│  │ Stripe     │ 7 tools   │ Customers, Products, Payments     │ │
│  │ Canva      │ 4 tools   │ Designs, Templates, Exports       │ │
│  │ Google     │ 5 tools   │ Drive files, Docs, Sheets         │ │
│  │ Notion     │ 5 tools   │ Pages, Databases, Blocks          │ │
│  │ Slack      │ 4 tools   │ Messages, Channels                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Custom Servers (Import your own):                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Your CRM   │ N tools   │ Custom integration                │ │
│  │ Your API   │ N tools   │ Custom integration                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Calling MCP from Skills

```typescript
// In a skill manifest:
{
  "actions": [
    {
      "type": "mcp:call",
      "server": "ghl",
      "tool": "create_contact",
      "params": {
        "email": "{{userEmail}}",
        "firstName": "{{userName}}",
        "tags": ["site-user", "new-signup"]
      },
      "outputTo": "newContact"
    },
    {
      "type": "mcp:call",
      "server": "stripe",
      "tool": "create_customer",
      "params": {
        "email": "{{userEmail}}",
        "name": "{{userName}}"
      },
      "outputTo": "stripeCustomer"
    },
    {
      "type": "mcp:call",
      "server": "slack",
      "tool": "send_message",
      "params": {
        "channel": "#new-signups",
        "text": "New user: {{userName}} ({{userEmail}})"
      }
    }
  ]
}
```

### Adding Custom MCP Servers

```typescript
// Register via API or dashboard
await mcpRegistry.registerServer({
  slug: 'my-api',
  name: 'My Custom API',
  endpoint: 'https://api.myservice.com',
  connectionType: 'http',
  authType: 'api_key',
  authConfig: {
    envKey: 'MY_API_KEY',
    headerName: 'X-API-Key'
  },
  tools: [
    { 
      name: 'get_data', 
      description: 'Fetch data from my API',
      inputSchema: { /* ... */ }
    }
  ]
})
```

---

## ⚡ Ignition Engine

The execution runtime that powers everything:

### Action Types

| Action | Description | Example |
|--------|-------------|---------|
| `file:create` | Create a file | Generate a page component |
| `file:template` | Create from template | Scaffold entire Next.js pages |
| `db:query` | Query Supabase | Fetch site config |
| `db:insert` | Insert data | Save form submission |
| `ai:generate` | AI content generation | Write blog post, generate code |
| `ai:analyze` | AI analysis | Analyze user feedback |
| `deploy:vercel` | Deploy to Vercel | Push site live |
| `mcp:call` | Call any MCP server | GHL, Stripe, Canva, etc. |

### Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL EXECUTION                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. LOAD CONTEXT                                            │
│     ├── Installation config                                 │
│     ├── User permissions                                    │
│     ├── Environment variables                               │
│     └── Onboarding data                                     │
│                                                             │
│  2. PARSE ACTIONS                                           │
│     └── Extract from manifest                               │
│                                                             │
│  3. FOR EACH ACTION:                                        │
│     ├── Check dependencies (dependsOn)                      │
│     ├── Evaluate conditions (when)                          │
│     ├── Verify permissions                                  │
│     ├── Resolve templates ({{variables}})                   │
│     ├── Execute via handler                                 │
│     ├── Log to audit trail                                  │
│     ├── Store output in context                             │
│     └── Emit progress event                                 │
│                                                             │
│  4. ON COMPLETE                                             │
│     ├── Update installation status                          │
│     └── Return results                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Progress Streaming

```typescript
// Subscribe to real-time progress
const engine = createIgnitionEngine()

for await (const event of engine.executeWithStream(installationId)) {
  switch (event.type) {
    case 'start':
      console.log('Execution started')
      break
    case 'action':
      console.log(`${event.actionName}: ${event.status}`)
      // "Create homepage: running"
      // "Create homepage: completed"
      break
    case 'complete':
      console.log('All done!', event.data)
      break
    case 'error':
      console.error('Failed:', event.error)
      break
  }
}
```

---

## 📦 Skills System

### What's a Skill?

A **Skill** is a packaged set of actions + UI + config that extends the platform:

```typescript
// Example: "Lead Capture" Skill
{
  "name": "Lead Capture Form",
  "slug": "lead-capture",
  "version": "1.0.0",
  "description": "Add lead capture forms to your site",
  
  "permissions": [
    "mcp:ghl:create_contact",
    "mcp:ghl:add_to_workflow"
  ],
  
  "onboarding": [
    { "field": "form_title", "type": "text", "label": "Form Title" },
    { "field": "success_message", "type": "text", "label": "Success Message" },
    { "field": "workflow_id", "type": "select", "label": "Add to Workflow" }
  ],
  
  "actions": [
    {
      "type": "mcp:call",
      "server": "ghl",
      "tool": "create_contact",
      "params": {
        "email": "{{submission.email}}",
        "firstName": "{{submission.name}}",
        "tags": ["website-lead"]
      }
    },
    {
      "type": "mcp:call",
      "server": "ghl", 
      "tool": "add_to_workflow",
      "params": {
        "contactId": "{{newContact.id}}",
        "workflowId": "{{config.workflow_id}}"
      }
    }
  ]
}
```

### Import/Export Skills

```bash
# Export a skill
GET /api/skills/export/{id}
# Returns: skill-name-v1.0.0.json

# Import a skill
POST /api/skills/import
Body: { url: "https://example.com/skill.json" }
# Or upload file directly
```

### Skill Marketplace

Skills can be:
- **Built-in** - Shipped with platform
- **Marketplace** - Installed from marketplace
- **Custom** - Created by user
- **Imported** - Loaded from URL/file

---

## 🚀 Deployment Flow

When Nova builds a site:

```
┌─────────────────────────────────────────────────────────────┐
│                    SITE DEPLOYMENT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ONBOARDING (Nova-guided)                                │
│     ├── Business type & industry                            │
│     ├── Design preferences                                  │
│     ├── GHL connection (PIT token)                          │
│     └── Additional MCPs (Stripe, etc.)                      │
│                                                             │
│  2. AI GENERATION                                           │
│     ├── Site structure (pages, components)                  │
│     ├── Content from GHL or AI-generated                    │
│     └── Code generation (Next.js)                           │
│                                                             │
│  3. FILE CREATION                                           │
│     ├── Pages (/, /about, /blog, etc.)                      │
│     ├── Components (Header, Footer, etc.)                   │
│     ├── API routes (/api/auth, /api/contact)                │
│     └── Config files (next.config, tailwind)                │
│                                                             │
│  4. VERCEL DEPLOYMENT                                       │
│     ├── Create project                                      │
│     ├── Set environment variables                           │
│     │   └── GHL_LOCATION_ID, GHL_LOCATION_PIT, etc.        │
│     ├── Deploy files                                        │
│     └── Wait for build                                      │
│                                                             │
│  5. POST-DEPLOY                                             │
│     ├── Add custom domain (optional)                        │
│     ├── Configure GHL webhooks                              │
│     └── Test integrations                                   │
│                                                             │
│  RESULT: Live site at https://sitename.vercel.app          │
│          Managed entirely from GHL                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Environment Variables

Each deployed site needs:

```env
# GHL Connection (Required)
GHL_LOCATION_ID=xxx
GHL_LOCATION_PIT=pit-xxx
GHL_COMPANY_ID=xxx

# Optional - For agency-level features
GHL_AGENCY_PIT=pit-xxx

# Vercel (For deployments)
VERCEL_TOKEN=xxx
VERCEL_TEAM_ID=xxx

# AI (For content generation)
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx

# Additional MCPs (As needed)
STRIPE_SECRET_KEY=xxx
CANVA_ACCESS_TOKEN=xxx
NOTION_TOKEN=xxx
SLACK_BOT_TOKEN=xxx
GOOGLE_ACCESS_TOKEN=xxx

# Session
SESSION_SECRET=xxx
NEXT_PUBLIC_SITE_URL=https://mysite.com
```

---

## 📊 Database Tables

### Core Tables

```sql
-- Skills definitions
skills (id, slug, name, manifest, is_marketplace, ...)

-- User installations  
skill_installations (id, user_id, skill_id, status, config, ...)

-- Audit log (for rollback)
skill_logs (id, installation_id, action, before_state, after_state, ...)

-- Execution tracking
skill_executions (id, installation_id, status, progress, ...)

-- MCP servers (custom)
mcp_servers (id, slug, name, endpoint, auth_config, tools, ...)

-- Deployed sites
rocket_sites (id, user_id, name, vercel_url, ghl_location_id, ...)
```

---

## 🎯 Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js + Tailwind | User-facing website |
| **Backend** | GHL | Users, Content, CRM, Automations |
| **Orchestration** | Ignition Engine | Execute skills & actions |
| **Integrations** | MCP Registry | Connect to 20+ services |
| **Deployment** | Vercel | Host sites with auto-SSL |
| **AI** | Anthropic/OpenAI | Content & code generation |

**The magic:** Build once, deploy anywhere, manage everything from GHL.

---

## 🔗 Quick Links

- [Ignition Actions Reference](./docs/ignition-actions.md)
- [MCP Registry Guide](./docs/mcp-registry.md)
- [GHL Integration](./docs/ghl-integration.md)
- [Skill Development](./docs/skill-development.md)
- [API Reference](./docs/api-reference.md)
