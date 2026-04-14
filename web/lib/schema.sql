-- Design with Claude — Database Schema
-- Run this in your Supabase SQL Editor

-- Designer profiles (linked to Clerk users)
CREATE TABLE designer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  monthly_message_count INTEGER DEFAULT 0,
  monthly_message_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New conversation',
  mission_id TEXT,
  mission_step INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designer memory (onboarding + evolving context)
CREATE TABLE designer_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID UNIQUE NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
  product_type TEXT,
  product_description TEXT,
  design_tools TEXT[],
  design_system TEXT,
  tech_stack TEXT[],
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  project_status TEXT,
  tone_preference TEXT CHECK (tone_preference IN ('concise', 'detailed', 'conversational')),
  custom_context TEXT,
  claude_md_content TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission progress tracking
CREATE TABLE mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES designer_profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed_steps JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  conversation_id UUID REFERENCES conversations(id),
  UNIQUE(designer_id, mission_id)
);

-- Indexes
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_conversations_designer ON conversations(designer_id, updated_at DESC);
CREATE INDEX idx_profiles_clerk ON designer_profiles(clerk_user_id);
CREATE INDEX idx_memory_designer ON designer_memory(designer_id);
CREATE INDEX idx_mission_designer ON mission_progress(designer_id, mission_id);
