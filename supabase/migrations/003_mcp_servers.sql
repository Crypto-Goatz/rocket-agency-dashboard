-- MCP Servers System Tables
-- Migration: 003_mcp_servers.sql
-- Stores custom MCP server configurations and connection state

-- Custom MCP Server Definitions
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Other',
  
  -- Connection Config
  endpoint TEXT NOT NULL,
  connection_type TEXT DEFAULT 'http' CHECK (connection_type IN ('http', 'stdio', 'sse')),
  
  -- Authentication
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('api_key', 'oauth', 'token', 'pit', 'none')),
  auth_config JSONB DEFAULT '{}',
  -- auth_config structure:
  -- {
  --   "envKey": "API_KEY_NAME",
  --   "headerName": "Authorization",
  --   "headerPrefix": "Bearer"
  -- }
  
  -- Available Tools
  tools JSONB DEFAULT '[]',
  -- tools structure:
  -- [
  --   {
  --     "name": "tool_name",
  --     "description": "What it does",
  --     "inputSchema": { "type": "object", ... },
  --     "requiresAuth": true
  --   }
  -- ]
  
  -- Metadata
  logo TEXT,
  website TEXT,
  docs_url TEXT,
  
  -- Status
  is_builtin BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User MCP Server Connections (stores auth tokens per user)
CREATE TABLE IF NOT EXISTS mcp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  -- Connection Status
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  
  -- Credentials (encrypted)
  credentials JSONB DEFAULT '{}',
  -- Stores encrypted tokens, API keys, etc.
  -- In production, use proper encryption
  
  -- OAuth Tokens (if applicable)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Environment Variables for this connection
  environment JSONB DEFAULT '{}',
  
  -- Usage Tracking
  last_used_at TIMESTAMPTZ,
  total_calls INTEGER DEFAULT 0,
  
  -- Error State
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Timestamps
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, server_id)
);

-- MCP Call Logs (for debugging and analytics)
CREATE TABLE IF NOT EXISTS mcp_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES mcp_connections(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  server_slug TEXT NOT NULL,
  
  -- Call Details
  tool_name TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  
  -- Response
  success BOOLEAN DEFAULT false,
  response JSONB,
  error_message TEXT,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Context
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES skill_executions(id) ON DELETE SET NULL,
  
  -- Timestamp
  called_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcp_servers_slug ON mcp_servers(slug);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_category ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_mcp_connections_user ON mcp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_connections_status ON mcp_connections(status);
CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_user ON mcp_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_server ON mcp_call_logs(server_slug);
CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_called ON mcp_call_logs(called_at);

-- Updated at trigger
CREATE TRIGGER update_mcp_servers_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_connections_updated_at
  BEFORE UPDATE ON mcp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert built-in GHL server
INSERT INTO mcp_servers (
  slug, name, description, category,
  endpoint, connection_type,
  auth_type, auth_config,
  tools,
  is_builtin, is_enabled, is_verified
) VALUES (
  'gohighlevel',
  'GoHighLevel',
  'Complete CRM - contacts, blogs, workflows, Voice AI, and more',
  'CRM & Sales',
  'internal://ghl',
  'http',
  'pit',
  '{"envKey": "GHL_LOCATION_PIT"}',
  '[
    {"name": "get_contacts", "description": "Get contacts from CRM", "requiresAuth": true},
    {"name": "create_contact", "description": "Create a new contact", "requiresAuth": true},
    {"name": "update_contact", "description": "Update a contact", "requiresAuth": true},
    {"name": "add_tags", "description": "Add tags to contact", "requiresAuth": true},
    {"name": "send_sms", "description": "Send SMS message", "requiresAuth": true},
    {"name": "send_email", "description": "Send email", "requiresAuth": true},
    {"name": "create_blog_post", "description": "Create blog post", "requiresAuth": true},
    {"name": "get_blog_posts", "description": "List blog posts", "requiresAuth": true},
    {"name": "get_workflows", "description": "List workflows", "requiresAuth": true},
    {"name": "add_to_workflow", "description": "Add contact to workflow", "requiresAuth": true},
    {"name": "get_pipelines", "description": "List pipelines", "requiresAuth": true},
    {"name": "create_opportunity", "description": "Create opportunity", "requiresAuth": true},
    {"name": "get_opportunities", "description": "List opportunities", "requiresAuth": true},
    {"name": "get_calendars", "description": "List calendars", "requiresAuth": true},
    {"name": "get_appointments", "description": "Get appointments", "requiresAuth": true},
    {"name": "create_appointment", "description": "Book appointment", "requiresAuth": true},
    {"name": "get_location", "description": "Get location info", "requiresAuth": true},
    {"name": "get_custom_fields", "description": "Get custom fields", "requiresAuth": true},
    {"name": "get_custom_values", "description": "Get custom values", "requiresAuth": true},
    {"name": "get_products", "description": "List products", "requiresAuth": true},
    {"name": "create_product", "description": "Create product", "requiresAuth": true},
    {"name": "get_voice_agents", "description": "List Voice AI agents", "requiresAuth": true},
    {"name": "create_voice_agent", "description": "Create Voice AI agent", "requiresAuth": true}
  ]'::jsonb,
  true, true, true
) ON CONFLICT (slug) DO UPDATE SET
  tools = EXCLUDED.tools,
  updated_at = now();
