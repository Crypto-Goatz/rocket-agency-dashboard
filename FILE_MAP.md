# File Extraction Map

Extract these files from `/Users/rocketopp/Desktop/GitHub/rocketopp-live/` to create the standalone project.

## Core Skills Library

```
lib/skills/
├── types.ts
├── permissions.ts
├── parser.ts
├── logger.ts
├── rollback.ts
├── runtime.ts
├── index.ts
│
├── ignition/
│   ├── types.ts
│   ├── engine.ts
│   ├── context.ts
│   ├── index.ts
│   │
│   ├── actions/
│   │   ├── registry.ts
│   │   ├── file.ts
│   │   ├── database.ts
│   │   ├── ai.ts
│   │   ├── deployment.ts
│   │   └── index.ts
│   │
│   └── providers/
│       ├── ai.ts
│       ├── vercel.ts
│       └── index.ts
│
└── package/
    ├── types.ts
    ├── templates.ts
    ├── creator.ts
    ├── exporter.ts
    ├── importer.ts
    └── index.ts
```

## API Routes

```
app/api/skills/
├── installed/route.ts
├── marketplace/route.ts
├── install/route.ts
├── import/route.ts
├── create/route.ts
├── export/[id]/route.ts
│
└── [id]/
    ├── route.ts
    ├── execute/route.ts
    ├── execute/stream/route.ts
    ├── logs/route.ts
    ├── onboarding/route.ts
    └── rollback/[logId]/route.ts
```

## Dashboard Pages (if extracting UI)

```
app/dashboard/skills/
├── page.tsx
├── marketplace/page.tsx
├── create/page.tsx
├── install/page.tsx
└── [id]/page.tsx
```

## Database Dependency

```
lib/db/supabase.ts  # Supabase client (shared)
```

## Full File List (Absolute Paths)

### Core Library (44 files)
```
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/types.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/permissions.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/parser.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/logger.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/rollback.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/runtime.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/index.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/types.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/engine.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/context.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/index.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/registry.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/file.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/database.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/ai.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/deployment.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/actions/index.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/providers/ai.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/providers/vercel.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/ignition/providers/index.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/types.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/templates.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/creator.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/exporter.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/importer.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/lib/skills/package/index.ts
```

### API Routes (12 files)
```
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/installed/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/marketplace/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/install/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/import/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/create/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/export/[id]/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/execute/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/execute/stream/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/logs/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/onboarding/route.ts
/Users/rocketopp/Desktop/GitHub/rocketopp-live/app/api/skills/[id]/rollback/[logId]/route.ts
```

## Import Dependencies to Update

When extracting, update these imports in the files:

```typescript
// Current (rocketopp-live)
import { supabaseAdmin } from '@/lib/db/supabase'

// Updated (standalone)
import { supabaseAdmin } from '@/lib/supabase'
```

## Extraction Script

```bash
#!/bin/bash
# Run from rocket-site-builder directory

SOURCE="/Users/rocketopp/Desktop/GitHub/rocketopp-live"
DEST="/Users/rocketopp/Desktop/GitHub/rocket-site-builder"

# Create directory structure
mkdir -p $DEST/lib/skills/ignition/actions
mkdir -p $DEST/lib/skills/ignition/providers
mkdir -p $DEST/lib/skills/package
mkdir -p $DEST/app/api/skills/installed
mkdir -p $DEST/app/api/skills/marketplace
mkdir -p $DEST/app/api/skills/install
mkdir -p $DEST/app/api/skills/import
mkdir -p $DEST/app/api/skills/create
mkdir -p $DEST/app/api/skills/export/\[id\]
mkdir -p $DEST/app/api/skills/\[id\]/execute/stream
mkdir -p $DEST/app/api/skills/\[id\]/logs
mkdir -p $DEST/app/api/skills/\[id\]/onboarding
mkdir -p $DEST/app/api/skills/\[id\]/rollback/\[logId\]

# Copy lib/skills
cp $SOURCE/lib/skills/*.ts $DEST/lib/skills/
cp $SOURCE/lib/skills/ignition/*.ts $DEST/lib/skills/ignition/
cp $SOURCE/lib/skills/ignition/actions/*.ts $DEST/lib/skills/ignition/actions/
cp $SOURCE/lib/skills/ignition/providers/*.ts $DEST/lib/skills/ignition/providers/
cp $SOURCE/lib/skills/package/*.ts $DEST/lib/skills/package/

# Copy API routes
cp $SOURCE/app/api/skills/installed/route.ts $DEST/app/api/skills/installed/
cp $SOURCE/app/api/skills/marketplace/route.ts $DEST/app/api/skills/marketplace/
cp $SOURCE/app/api/skills/install/route.ts $DEST/app/api/skills/install/
cp $SOURCE/app/api/skills/import/route.ts $DEST/app/api/skills/import/
cp $SOURCE/app/api/skills/create/route.ts $DEST/app/api/skills/create/
cp "$SOURCE/app/api/skills/export/[id]/route.ts" "$DEST/app/api/skills/export/[id]/"
cp "$SOURCE/app/api/skills/[id]/route.ts" "$DEST/app/api/skills/[id]/"
cp "$SOURCE/app/api/skills/[id]/execute/route.ts" "$DEST/app/api/skills/[id]/execute/"
cp "$SOURCE/app/api/skills/[id]/execute/stream/route.ts" "$DEST/app/api/skills/[id]/execute/stream/"
cp "$SOURCE/app/api/skills/[id]/logs/route.ts" "$DEST/app/api/skills/[id]/logs/"
cp "$SOURCE/app/api/skills/[id]/onboarding/route.ts" "$DEST/app/api/skills/[id]/onboarding/"
cp "$SOURCE/app/api/skills/[id]/rollback/[logId]/route.ts" "$DEST/app/api/skills/[id]/rollback/[logId]/"

echo "Extraction complete!"
```

## Database Migrations

Create these in your new project:

```
supabase/migrations/
├── 001_skills_system.sql
└── 002_ignition_system.sql
```

Content is in the README.md database schema section.
