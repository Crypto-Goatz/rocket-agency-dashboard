-- Skills System Tables
-- Migration: 001_skills_system.sql

-- Skill Definitions
CREATE TABLE IF NOT EXISTS skills (
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
CREATE TABLE IF NOT EXISTS skill_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'installing' CHECK (status IN ('installing', 'installed', 'paused', 'error', 'uninstalling')),
  config JSONB DEFAULT '{}',
  permissions_granted JSONB DEFAULT '[]',
  environment JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT now(),
  last_run TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(user_id, skill_id)
);

-- Action Logs (for rollback)
CREATE TABLE IF NOT EXISTS skill_logs (
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
CREATE TABLE IF NOT EXISTS skill_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES skill_installations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT,
  encrypted BOOLEAN DEFAULT false,
  collected_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_marketplace ON skills(is_marketplace) WHERE is_marketplace = true;
CREATE INDEX IF NOT EXISTS idx_skill_installations_user ON skill_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_installations_status ON skill_installations(status);
CREATE INDEX IF NOT EXISTS idx_skill_logs_installation ON skill_logs(installation_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_action ON skill_logs(action);
CREATE INDEX IF NOT EXISTS idx_skill_logs_reversible ON skill_logs(reversible) WHERE reversible = true AND reverted = false;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
