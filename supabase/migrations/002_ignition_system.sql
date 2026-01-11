-- Ignition Execution System Tables
-- Migration: 002_ignition_system.sql

-- Execution Records
CREATE TABLE IF NOT EXISTS skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES skill_installations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
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
CREATE TABLE IF NOT EXISTS skill_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES skill_executions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  provider TEXT DEFAULT 'vercel',
  provider_project_id TEXT,
  provider_deployment_id TEXT,
  deployment_url TEXT,
  custom_domain TEXT,
  status TEXT DEFAULT 'building' CHECK (status IN ('building', 'ready', 'error', 'deleted')),
  name TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generated Sites
CREATE TABLE IF NOT EXISTS rocket_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deployment_id UUID REFERENCES skill_deployments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('business', 'portfolio', 'saas', 'blog', 'ecommerce')),
  industry TEXT,
  description TEXT,
  vercel_project_id TEXT,
  vercel_url TEXT,
  custom_domain TEXT,
  status TEXT DEFAULT 'building' CHECK (status IN ('building', 'deployed', 'error', 'deleted')),
  pages JSONB DEFAULT '[]',
  components JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_executions_installation ON skill_executions(installation_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_status ON skill_executions(status);
CREATE INDEX IF NOT EXISTS idx_skill_executions_started ON skill_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_skill_deployments_user ON skill_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_deployments_status ON skill_deployments(status);
CREATE INDEX IF NOT EXISTS idx_rocket_sites_user ON rocket_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_rocket_sites_status ON rocket_sites(status);

-- Updated at triggers
CREATE TRIGGER update_skill_deployments_updated_at
  BEFORE UPDATE ON skill_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rocket_sites_updated_at
  BEFORE UPDATE ON rocket_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
