# Rocket Skills - Import/Export System

> **Universal Plugin Architecture for AI-Powered Automation**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Skill Package Structure](#skill-package-structure)
4. [Skill Manifest Specification](#skill-manifest-specification)
5. [Action Types Reference](#action-types-reference)
6. [Import/Export Workflows](#importexport-workflows)
7. [Standalone Skill Importer](#standalone-skill-importer)
8. [Creating Custom Skills](#creating-custom-skills)
9. [Skill Templates](#skill-templates)
10. [Security & Permissions](#security--permissions)
11. [Best Practices](#best-practices)

---

## Overview

The **Rocket Skills System** is a universal plugin architecture that allows developers to create, package, share, and install modular automation capabilities into any compatible host application.

### What is a Skill?

A **Skill** is a self-contained package that:
- Defines a set of **actions** to perform
- Specifies required **permissions**
- Includes **onboarding configuration** for user setup
- Can include **UI components** for dashboards
- Is portable across any Rocket-compatible system

### Key Features

| Feature | Description |
|---------|-------------|
| **Portable** | Skills are JSON packages that work anywhere |
| **Versioned** | Semantic versioning for compatibility |
| **Secure** | Granular permissions system |
| **AI-Powered** | Built-in AI action handlers |
| **MCP-Ready** | Connect to 20+ external services |
| **Reversible** | Audit trail with rollback support |

---

## Core Concepts

### The Skill Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     SKILL LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE                    2. PACKAGE                        │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │ Write manifest  │ ──────► │ Export as JSON  │               │
│  │ Define actions  │         │ or .rskill file │               │
│  │ Set permissions │         │                 │               │
│  └─────────────────┘         └────────┬────────┘               │
│                                       │                         │
│  4. EXECUTE                   3. INSTALL                        │
│  ┌─────────────────┐         ┌────────▼────────┐               │
│  │ Run via Ignition│ ◄────── │ Import to host  │               │
│  │ Track progress  │         │ Grant permissions│               │
│  │ Log & rollback  │         │ Configure settings│              │
│  └─────────────────┘         └─────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Purpose |
|-----------|---------|
| **Manifest** | JSON definition of the skill |
| **Actions** | Steps the skill performs |
| **Permissions** | What the skill can access |
| **Onboarding** | User configuration fields |
| **Hooks** | Lifecycle callbacks |
| **Files** | Bundled assets/templates |

---

## Skill Package Structure

### File Format

Skills can be distributed as:

1. **JSON file** (`.json`) - Single manifest file
2. **Rocket Skill Package** (`.rskill`) - ZIP archive with assets
3. **URL** - Remote manifest hosted on CDN/GitHub

### Directory Structure

```
my-skill/
├── manifest.json          # Required - Skill definition
├── README.md              # Optional - Documentation
├── icon.png               # Optional - 256x256 icon
├── files/                 # Optional - Bundled templates
│   ├── page-template.tsx
│   ├── component.tsx
│   └── styles.css
├── schemas/               # Optional - Validation schemas
│   └── config.json
└── examples/              # Optional - Example configs
    └── default-config.json
```

### .rskill Package

A `.rskill` file is a ZIP archive containing the above structure:

```bash
# Create a .rskill package
zip -r my-skill.rskill manifest.json README.md icon.png files/

# Extract a .rskill package
unzip my-skill.rskill -d my-skill/
```

---

## Skill Manifest Specification

### Complete Schema

```typescript
interface SkillManifest {
  // ═══════════════════════════════════════════════════════════
  // IDENTIFICATION (Required)
  // ═══════════════════════════════════════════════════════════
  
  name: string                    // Human-readable name
  slug: string                    // URL-safe identifier (lowercase, hyphens)
  version: string                 // Semantic version (e.g., "1.0.0")
  description: string             // Brief description (max 160 chars)
  
  // ═══════════════════════════════════════════════════════════
  // METADATA (Optional)
  // ═══════════════════════════════════════════════════════════
  
  author?: string                 // Author name or organization
  authorUrl?: string              // Author website
  repository?: string             // Source code URL
  license?: string                // License identifier (e.g., "MIT")
  icon?: string                   // Icon name (from Lucide icons)
  iconUrl?: string                // Custom icon URL
  category?: SkillCategory        // Classification
  tags?: string[]                 // Searchable tags
  
  // ═══════════════════════════════════════════════════════════
  // COMPATIBILITY
  // ═══════════════════════════════════════════════════════════
  
  engineVersion?: string          // Minimum Ignition version required
  dependencies?: string[]         // Required skill slugs
  
  // ═══════════════════════════════════════════════════════════
  // SECURITY (Required)
  // ═══════════════════════════════════════════════════════════
  
  permissions: Permission[]       // Required permissions
  
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  onboarding: OnboardingField[]   // User configuration fields
  
  // ═══════════════════════════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════════════════════════
  
  actions?: Action[]              // Steps to execute
  hooks?: {
    onInstall?: Action[]          // Run on installation
    onUninstall?: Action[]        // Run on removal
    onUpdate?: Action[]           // Run on version update
    onEnable?: Action[]           // Run when enabled
    onDisable?: Action[]          // Run when disabled
  }
  
  // ═══════════════════════════════════════════════════════════
  // SCHEDULING
  // ═══════════════════════════════════════════════════════════
  
  schedules?: Schedule[]          // Cron-based execution
  
  // ═══════════════════════════════════════════════════════════
  // UI INTEGRATION
  // ═══════════════════════════════════════════════════════════
  
  dashboard?: {
    route?: string                // Dashboard page route
    sidebar?: {
      label: string
      icon: string
      position?: number
    }
    widgets?: Widget[]            // Dashboard widgets
  }
  
  // ═══════════════════════════════════════════════════════════
  // BUNDLED FILES
  // ═══════════════════════════════════════════════════════════
  
  files?: BundledFile[]           // Templates and assets
}
```

### Type Definitions

```typescript
// Categories
type SkillCategory = 
  | 'marketing'
  | 'sales'
  | 'content'
  | 'analytics'
  | 'automation'
  | 'integration'
  | 'communication'
  | 'commerce'
  | 'developer'
  | 'other'

// Permissions
type Permission =
  // File Operations
  | 'files:read'
  | 'files:write'
  | 'files:delete'
  // Database Operations
  | 'database:read'
  | 'database:write'
  | 'database:delete'
  // API Operations
  | 'api:read'
  | 'api:write'
  // Environment
  | 'env:read'
  | 'env:write'
  // Execution
  | 'exec:client'
  | 'exec:server'
  // Scheduling
  | 'cron:read'
  | 'cron:write'
  // MCP Integrations
  | 'mcp:ghl:*'
  | 'mcp:ghl:contacts'
  | 'mcp:ghl:blogs'
  | 'mcp:stripe:*'
  | 'mcp:canva:*'
  | 'mcp:notion:*'
  | 'mcp:slack:*'
  | 'mcp:google-drive:*'
  // Wildcards
  | '*'

// Onboarding Field
interface OnboardingField {
  id: string                      // Unique field identifier
  type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 
        'password' | 'select' | 'multiselect' | 'checkbox' |
        'toggle' | 'color' | 'date' | 'file' | 'json'
  label: string                   // Display label
  description?: string            // Help text
  placeholder?: string            // Input placeholder
  required?: boolean              // Is field required?
  default?: any                   // Default value
  options?: Array<{               // For select/multiselect
    value: string
    label: string
  }>
  validation?: {                  // Validation rules
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  dependsOn?: {                   // Conditional visibility
    field: string
    value: any
  }
}

// Action
interface Action {
  id?: string                     // Unique action identifier
  name?: string                   // Display name
  type: ActionType                // Action type
  description?: string            // What this action does
  
  // Conditional execution
  when?: {
    condition: string             // Template expression
    skipMessage?: string          // Message if skipped
  }
  
  // Dependencies
  dependsOn?: string[]            // Action IDs that must complete first
  
  // Error handling
  onError?: 'stop' | 'continue' | 'retry'
  retryCount?: number
  retryDelay?: number
  
  // Output
  outputTo?: string               // Store result in variable
  
  // Type-specific config
  [key: string]: any
}

// Schedule
interface Schedule {
  id: string
  name: string
  cron: string                    // Cron expression
  timezone?: string               // IANA timezone
  enabled?: boolean
  actions: Action[]
}

// Widget
interface Widget {
  id: string
  type: 'stat' | 'chart' | 'table' | 'list' | 'custom'
  title: string
  position: { x: number; y: number; w: number; h: number }
  dataSource: string              // Action ID or API endpoint
  config?: Record<string, any>
}

// Bundled File
interface BundledFile {
  path: string                    // Relative path in package
  type: 'template' | 'asset' | 'config'
  description?: string
}
```

---

## Action Types Reference

### File Actions

```typescript
// Create a new file
{
  type: 'file:create',
  path: '/pages/{{slug}}.tsx',
  content: '// Page content here',
  overwrite: false
}

// Modify existing file
{
  type: 'file:modify',
  path: '/config/settings.json',
  operations: [
    { type: 'replace', search: 'old-value', replace: 'new-value' },
    { type: 'append', content: '\n// Added by skill' },
    { type: 'prepend', content: '// Header\n' }
  ]
}

// Delete a file
{
  type: 'file:delete',
  path: '/temp/cache.json'
}

// Create from template
{
  type: 'file:template',
  template: 'nextjs-page',        // Built-in template name
  output: '/pages/{{pageName}}.tsx',
  variables: {
    title: '{{config.pageTitle}}',
    description: '{{config.pageDescription}}'
  }
}
```

### Database Actions

```typescript
// Query data
{
  type: 'db:query',
  table: 'posts',
  select: ['id', 'title', 'status'],
  where: { status: 'published' },
  orderBy: { created_at: 'desc' },
  limit: 10,
  outputTo: 'recentPosts'
}

// Insert data
{
  type: 'db:insert',
  table: 'posts',
  data: {
    title: '{{input.title}}',
    content: '{{generatedContent}}',
    status: 'draft'
  },
  outputTo: 'newPost'
}

// Update data
{
  type: 'db:update',
  table: 'posts',
  where: { id: '{{postId}}' },
  data: { status: 'published' },
  outputTo: 'updatedPost'
}

// Delete data
{
  type: 'db:delete',
  table: 'posts',
  where: { id: '{{postId}}' }
}

// Upsert (insert or update)
{
  type: 'db:upsert',
  table: 'settings',
  data: { key: 'theme', value: 'dark' },
  onConflict: 'key'
}
```

### AI Actions

```typescript
// Generate content
{
  type: 'ai:generate',
  prompt: 'Write a blog post about {{topic}}',
  systemPrompt: 'You are a professional content writer.',
  model: 'claude-sonnet-4-20250514',      // or 'gpt-4o'
  maxTokens: 2000,
  temperature: 0.7,
  outputFormat: 'text',           // or 'json', 'markdown', 'html'
  outputTo: 'generatedContent'
}

// Analyze content
{
  type: 'ai:analyze',
  content: '{{document}}',
  task: 'Extract key points and sentiment',
  outputFormat: 'json',
  schema: {
    keyPoints: 'string[]',
    sentiment: 'positive | negative | neutral',
    confidence: 'number'
  },
  outputTo: 'analysis'
}

// Transform content
{
  type: 'ai:transform',
  content: '{{originalContent}}',
  transformation: 'Rewrite for social media, max 280 characters',
  outputTo: 'tweetContent'
}
```

### MCP Actions

```typescript
// Call any MCP server tool
{
  type: 'mcp:call',
  server: 'gohighlevel',          // MCP server slug
  tool: 'create_contact',         // Tool name
  params: {
    email: '{{input.email}}',
    firstName: '{{input.firstName}}',
    tags: ['website-lead']
  },
  outputTo: 'newContact'
}

// GHL Examples
{
  type: 'mcp:call',
  server: 'gohighlevel',
  tool: 'create_blog_post',
  params: {
    title: '{{generatedTitle}}',
    content: '{{generatedContent}}',
    status: 'DRAFT'
  }
}

// Stripe Example
{
  type: 'mcp:call',
  server: 'stripe',
  tool: 'create_customer',
  params: {
    email: '{{contact.email}}',
    name: '{{contact.name}}'
  }
}

// Slack Example
{
  type: 'mcp:call',
  server: 'slack',
  tool: 'send_message',
  params: {
    channel: '#notifications',
    text: 'New lead: {{contact.name}}'
  }
}
```

### Deployment Actions

```typescript
// Deploy to Vercel
{
  type: 'deploy:vercel',
  operation: 'create-project',
  name: '{{projectName}}',
  framework: 'nextjs',
  outputTo: 'project'
}

{
  type: 'deploy:vercel',
  operation: 'deploy',
  projectId: '{{project.id}}',
  files: '{{generatedFiles}}',
  outputTo: 'deployment'
}

{
  type: 'deploy:vercel',
  operation: 'set-env',
  projectId: '{{project.id}}',
  envVars: {
    GHL_LOCATION_ID: '{{config.ghlLocationId}}',
    GHL_LOCATION_PIT: '{{config.ghlPit}}'
  }
}

{
  type: 'deploy:vercel',
  operation: 'add-domain',
  projectId: '{{project.id}}',
  domain: '{{config.customDomain}}'
}
```

---

## Import/Export Workflows

### Export a Skill

```typescript
// API: GET /api/skills/export/{skillId}
// Returns: skill-name-v1.0.0.json

// Programmatic export
import { exportSkill } from '@/lib/skills/package/exporter'

const skillPackage = await exportSkill(skillId, {
  includeFiles: true,      // Bundle templates
  includeReadme: true,     // Include docs
  format: 'json'           // or 'rskill'
})

// Save to file
fs.writeFileSync('my-skill.json', JSON.stringify(skillPackage, null, 2))
```

### Import a Skill

```typescript
// API: POST /api/skills/import
// Body: { url: "https://..." } or multipart file upload

// Programmatic import
import { importSkill } from '@/lib/skills/package/importer'

// From URL
const skill = await importSkill({
  source: 'https://example.com/skills/my-skill.json'
})

// From file
const skill = await importSkill({
  source: fs.readFileSync('my-skill.json', 'utf-8'),
  type: 'json'
})

// From .rskill package
const skill = await importSkill({
  source: fs.readFileSync('my-skill.rskill'),
  type: 'rskill'
})
```

### Import Validation

When importing, the system validates:

1. **Schema Compliance** - Manifest matches specification
2. **Permission Safety** - No dangerous permission combinations
3. **Version Compatibility** - Engine version requirements met
4. **Dependency Check** - Required skills are installed
5. **Signature Verification** - (Optional) Cryptographic signature

```typescript
// Validation result
interface ImportValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  riskLevel: 'low' | 'medium' | 'high'
  permissionSummary: {
    requested: string[]
    risky: string[]
  }
}
```

---

## Standalone Skill Importer

The **Rocket Skill Importer** is a standalone module that can be installed into any compatible application to enable skill import/export functionality.

### Installation

```bash
# NPM
npm install @rocket/skill-importer

# Or copy the standalone files into your project
cp -r rocket-skill-importer/ your-project/lib/skills/
```

### Required Host Interface

Your application must implement the **SkillHost** interface:

```typescript
interface SkillHost {
  // Storage
  storage: {
    saveSkill(skill: SkillManifest): Promise<string>      // Returns skill ID
    getSkill(id: string): Promise<SkillManifest | null>
    listSkills(): Promise<SkillManifest[]>
    deleteSkill(id: string): Promise<boolean>
  }
  
  // Execution
  executor: {
    executeAction(action: Action, context: ExecutionContext): Promise<ActionResult>
    executeSkill(skillId: string, input?: any): Promise<ExecutionResult>
  }
  
  // Permissions
  permissions: {
    checkPermission(permission: string): boolean
    requestPermissions(permissions: string[]): Promise<boolean>
    getGrantedPermissions(): string[]
  }
  
  // Environment
  environment: {
    getVariable(key: string): string | undefined
    setVariable(key: string, value: string): void
  }
  
  // Optional: UI Integration
  ui?: {
    showOnboarding(fields: OnboardingField[]): Promise<Record<string, any>>
    showProgress(progress: ExecutionProgress): void
    showError(error: Error): void
  }
}
```

### Basic Usage

```typescript
import { SkillImporter } from '@rocket/skill-importer'

// Initialize with your host
const importer = new SkillImporter({
  host: mySkillHost,
  options: {
    validateSignatures: false,
    allowUntrusted: true,
    maxFileSize: 10 * 1024 * 1024  // 10MB
  }
})

// Import from URL
const result = await importer.importFromUrl('https://example.com/skill.json')
if (result.success) {
  console.log('Installed:', result.skill.name)
}

// Import from file
const result = await importer.importFromFile(fileBuffer, 'skill.rskill')

// Export a skill
const exported = await importer.export(skillId)
```

### File Structure

```
rocket-skill-importer/
├── index.ts              # Main exports
├── importer.ts           # Import logic
├── exporter.ts           # Export logic
├── validator.ts          # Manifest validation
├── parser.ts             # JSON/RSKILL parsing
├── types.ts              # TypeScript definitions
├── actions/              # Action handlers
│   ├── index.ts
│   ├── file.ts
│   ├── database.ts
│   ├── ai.ts
│   ├── mcp.ts
│   └── deployment.ts
├── templates/            # Built-in templates
│   ├── index.ts
│   └── nextjs/
└── utils/
    ├── crypto.ts         # Signature verification
    └── permissions.ts    # Permission utilities
```

---

## Creating Custom Skills

### Step-by-Step Guide

#### 1. Create the Manifest

```json
{
  "name": "Lead Capture Form",
  "slug": "lead-capture-form",
  "version": "1.0.0",
  "description": "Add lead capture forms that sync to GHL",
  "author": "Your Name",
  "category": "marketing",
  "tags": ["leads", "forms", "ghl"],
  
  "permissions": [
    "mcp:ghl:create_contact",
    "mcp:ghl:add_to_workflow"
  ],
  
  "onboarding": [
    {
      "id": "formTitle",
      "type": "text",
      "label": "Form Title",
      "default": "Get Started",
      "required": true
    },
    {
      "id": "workflowId",
      "type": "text",
      "label": "GHL Workflow ID",
      "description": "Contacts will be added to this workflow",
      "required": false
    },
    {
      "id": "notifySlack",
      "type": "toggle",
      "label": "Send Slack Notification",
      "default": false
    },
    {
      "id": "slackChannel",
      "type": "text",
      "label": "Slack Channel",
      "placeholder": "#leads",
      "dependsOn": {
        "field": "notifySlack",
        "value": true
      }
    }
  ],
  
  "actions": [
    {
      "id": "create-contact",
      "name": "Create GHL Contact",
      "type": "mcp:call",
      "server": "gohighlevel",
      "tool": "create_contact",
      "params": {
        "email": "{{input.email}}",
        "firstName": "{{input.firstName}}",
        "lastName": "{{input.lastName}}",
        "phone": "{{input.phone}}",
        "tags": ["website-lead", "{{config.formTitle}}"]
      },
      "outputTo": "contact"
    },
    {
      "id": "add-to-workflow",
      "name": "Add to Workflow",
      "type": "mcp:call",
      "server": "gohighlevel",
      "tool": "add_to_workflow",
      "when": {
        "condition": "{{config.workflowId}}",
        "skipMessage": "No workflow configured"
      },
      "params": {
        "contactId": "{{contact.contact.id}}",
        "workflowId": "{{config.workflowId}}"
      },
      "dependsOn": ["create-contact"]
    },
    {
      "id": "notify-slack",
      "name": "Send Slack Notification",
      "type": "mcp:call",
      "server": "slack",
      "tool": "send_message",
      "when": {
        "condition": "{{config.notifySlack}}",
        "skipMessage": "Slack notifications disabled"
      },
      "params": {
        "channel": "{{config.slackChannel}}",
        "text": "🎉 New lead: {{input.firstName}} {{input.lastName}} ({{input.email}})"
      },
      "dependsOn": ["create-contact"]
    }
  ]
}
```

#### 2. Test Locally

```typescript
import { validateManifest } from '@rocket/skill-importer'

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'))
const validation = validateManifest(manifest)

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
} else {
  console.log('Manifest is valid!')
  console.log('Risk level:', validation.riskLevel)
}
```

#### 3. Package the Skill

```bash
# Simple JSON export
cp manifest.json lead-capture-form-v1.0.0.json

# Or create .rskill package with assets
zip -r lead-capture-form-v1.0.0.rskill \
  manifest.json \
  README.md \
  icon.png \
  files/
```

#### 4. Publish/Share

Options for distribution:
- **Direct URL** - Host JSON on CDN/GitHub
- **Marketplace** - Submit to Rocket Skills Marketplace
- **Private** - Share within organization

---

## Skill Templates

### Pre-built Templates

The system includes ready-to-use skill templates:

#### 1. Blank Template

```json
{
  "name": "My Skill",
  "slug": "my-skill",
  "version": "1.0.0",
  "description": "A blank skill template",
  "permissions": [],
  "onboarding": [],
  "actions": []
}
```

#### 2. API Integration Template

```json
{
  "name": "API Integration",
  "slug": "api-integration",
  "version": "1.0.0",
  "description": "Connect to an external API",
  "permissions": ["api:read", "api:write"],
  "onboarding": [
    {
      "id": "apiUrl",
      "type": "url",
      "label": "API Base URL",
      "required": true
    },
    {
      "id": "apiKey",
      "type": "password",
      "label": "API Key",
      "required": true
    }
  ],
  "actions": [
    {
      "id": "fetch-data",
      "type": "api:fetch",
      "url": "{{config.apiUrl}}/endpoint",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer {{config.apiKey}}"
      },
      "outputTo": "apiData"
    }
  ]
}
```

#### 3. Content Generator Template

```json
{
  "name": "Content Generator",
  "slug": "content-generator",
  "version": "1.0.0",
  "description": "Generate content using AI",
  "permissions": ["mcp:ghl:create_blog_post"],
  "onboarding": [
    {
      "id": "contentType",
      "type": "select",
      "label": "Content Type",
      "options": [
        { "value": "blog", "label": "Blog Post" },
        { "value": "social", "label": "Social Media" },
        { "value": "email", "label": "Email" }
      ]
    },
    {
      "id": "tone",
      "type": "select",
      "label": "Writing Tone",
      "options": [
        { "value": "professional", "label": "Professional" },
        { "value": "casual", "label": "Casual" },
        { "value": "friendly", "label": "Friendly" }
      ]
    }
  ],
  "actions": [
    {
      "id": "generate",
      "type": "ai:generate",
      "prompt": "Write a {{config.contentType}} about {{input.topic}} in a {{config.tone}} tone.",
      "outputTo": "content"
    },
    {
      "id": "publish",
      "type": "mcp:call",
      "server": "gohighlevel",
      "tool": "create_blog_post",
      "when": {
        "condition": "{{config.contentType === 'blog'}}"
      },
      "params": {
        "title": "{{input.topic}}",
        "content": "{{content}}",
        "status": "DRAFT"
      }
    }
  ]
}
```

#### 4. Scheduled Task Template

```json
{
  "name": "Scheduled Task",
  "slug": "scheduled-task",
  "version": "1.0.0",
  "description": "Run actions on a schedule",
  "permissions": ["cron:write", "database:read"],
  "onboarding": [
    {
      "id": "schedule",
      "type": "select",
      "label": "Run Frequency",
      "options": [
        { "value": "0 * * * *", "label": "Every hour" },
        { "value": "0 0 * * *", "label": "Daily at midnight" },
        { "value": "0 0 * * 1", "label": "Weekly on Monday" }
      ]
    }
  ],
  "schedules": [
    {
      "id": "main-schedule",
      "name": "Main Task",
      "cron": "{{config.schedule}}",
      "enabled": true,
      "actions": [
        {
          "id": "task",
          "type": "db:query",
          "table": "tasks",
          "where": { "status": "pending" },
          "outputTo": "pendingTasks"
        }
      ]
    }
  ]
}
```

#### 5. Dashboard Widget Template

```json
{
  "name": "Dashboard Widget",
  "slug": "dashboard-widget",
  "version": "1.0.0",
  "description": "Add custom widgets to dashboard",
  "permissions": ["database:read"],
  "dashboard": {
    "widgets": [
      {
        "id": "stats-widget",
        "type": "stat",
        "title": "Total Leads",
        "position": { "x": 0, "y": 0, "w": 2, "h": 1 },
        "dataSource": "fetch-stats"
      },
      {
        "id": "chart-widget",
        "type": "chart",
        "title": "Leads Over Time",
        "position": { "x": 2, "y": 0, "w": 4, "h": 2 },
        "dataSource": "fetch-chart-data",
        "config": {
          "chartType": "line",
          "xAxis": "date",
          "yAxis": "count"
        }
      }
    ]
  },
  "actions": [
    {
      "id": "fetch-stats",
      "type": "db:query",
      "table": "contacts",
      "select": ["count(*)"],
      "where": { "tags": { "contains": "lead" } }
    },
    {
      "id": "fetch-chart-data",
      "type": "db:query",
      "table": "contacts",
      "select": ["date_trunc('day', created_at) as date", "count(*)"],
      "where": { "tags": { "contains": "lead" } },
      "groupBy": ["date"],
      "orderBy": { "date": "asc" }
    }
  ]
}
```

---

## Security & Permissions

### Permission Levels

| Level | Permissions | Risk |
|-------|-------------|------|
| **Read-Only** | `*:read` | Low |
| **Write** | `*:write` | Medium |
| **Delete** | `*:delete` | High |
| **Execute** | `exec:*` | High |
| **Environment** | `env:*` | High |
| **Wildcard** | `*` | Critical |

### Risk Assessment

```typescript
function calculateRiskLevel(permissions: string[]): 'low' | 'medium' | 'high' | 'critical' {
  const highRisk = ['database:delete', 'files:delete', 'exec:server', 'env:write']
  const criticalRisk = ['*']
  
  if (permissions.some(p => criticalRisk.includes(p))) return 'critical'
  if (permissions.some(p => highRisk.includes(p))) return 'high'
  if (permissions.some(p => p.includes('write'))) return 'medium'
  return 'low'
}
```

### Permission Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  PERMISSION REQUEST FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Skill requests permissions                              │
│     ["mcp:ghl:contacts", "mcp:slack:send_message"]         │
│                                                             │
│  2. System calculates risk level                            │
│     Risk: MEDIUM                                            │
│                                                             │
│  3. User sees permission dialog                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │ "Lead Capture" wants access to:                  │    │
│     │                                                  │    │
│     │ ✓ Create and read GHL contacts                  │    │
│     │ ✓ Send Slack messages                           │    │
│     │                                                  │    │
│     │ Risk Level: Medium                              │    │
│     │                                                  │    │
│     │ [Deny]                        [Allow]           │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  4. Permissions stored with installation                    │
│                                                             │
│  5. Permissions checked before each action                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### DO ✅

- **Version your skills** using semantic versioning
- **Document permissions** clearly in README
- **Handle errors gracefully** with `onError` handlers
- **Use templates** for consistent file generation
- **Test thoroughly** before publishing
- **Provide defaults** for all onboarding fields
- **Use descriptive names** for actions

### DON'T ❌

- Don't request unnecessary permissions
- Don't hardcode secrets (use environment variables)
- Don't assume environment state
- Don't skip validation
- Don't use wildcard permissions unless necessary
- Don't create breaking changes without version bump

### Manifest Checklist

```markdown
- [ ] Unique slug (lowercase, hyphens only)
- [ ] Semantic version (x.y.z)
- [ ] Clear description (under 160 chars)
- [ ] Minimum required permissions
- [ ] All onboarding fields have defaults
- [ ] Actions have descriptive names
- [ ] Error handling configured
- [ ] README included
- [ ] Tested in development
```

---

## API Reference

### Import Endpoints

```
POST /api/skills/import
Content-Type: application/json

{
  "url": "https://example.com/skill.json"
}

// Or multipart upload
POST /api/skills/import
Content-Type: multipart/form-data

file: [skill.json or skill.rskill]
```

### Export Endpoints

```
GET /api/skills/export/{skillId}
Accept: application/json

// Returns
{
  "manifest": { ... },
  "files": [ ... ],
  "exportedAt": "2024-01-15T10:00:00Z"
}
```

### Execute Endpoints

```
POST /api/skills/{skillId}/execute
Content-Type: application/json

{
  "input": {
    "email": "user@example.com",
    "firstName": "John"
  }
}

// Stream progress
GET /api/skills/{skillId}/execute/stream
Accept: text/event-stream
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Skill** | A packaged set of actions and configuration |
| **Manifest** | JSON definition of a skill |
| **Action** | A single step in skill execution |
| **Ignition** | The execution engine that runs actions |
| **MCP** | Model Context Protocol - external service integration |
| **Onboarding** | User configuration collected during installation |
| **Hook** | Lifecycle callback (install, uninstall, etc.) |
| **Permission** | Authorization to perform specific operations |

---

## Support

- **Documentation**: https://docs.rocketskills.dev
- **GitHub**: https://github.com/rocket/skills
- **Discord**: https://discord.gg/rocketskills
- **Email**: support@rocketskills.dev
