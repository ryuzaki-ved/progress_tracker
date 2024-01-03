/*
  # Personal Productivity Tracking Database Schema

  1. New Tables
    - `users` - User profiles and authentication
    - `stocks` - Life categories (Job Prep, Fitness, etc.)
    - `tasks` - Individual tasks linked to stocks
    - `index_history` - Daily index value tracking
    - `stock_performance_history` - Daily stock performance tracking
    - `task_dependencies` - Task dependency relationships
    - `task_tags` - Tagging system for tasks
    - `user_settings` - User preferences and configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Cascade deletes for data integrity

  3. Indexes
    - Performance indexes on frequently queried columns
    - Composite indexes for common query patterns
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stocks table (Life categories)
CREATE TABLE IF NOT EXISTS stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  weight decimal(3,2) NOT NULL DEFAULT 0.20 CHECK (weight >= 0 AND weight <= 1),
  color text NOT NULL DEFAULT '#3B82F6',
  icon text DEFAULT 'activity',
  category text,
  volatility_score decimal(3,2) DEFAULT 0.5 CHECK (volatility_score >= 0 AND volatility_score <= 1),
  momentum_score decimal(5,2) DEFAULT 0,
  current_score integer DEFAULT 500 CHECK (current_score >= 0),
  last_activity_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, name)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring', 'milestone', 'habit')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  complexity integer DEFAULT 3 CHECK (complexity >= 1 AND complexity <= 5),
  estimated_duration integer, -- in minutes
  points integer DEFAULT 10 CHECK (points > 0),
  due_date timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'skipped', 'cancelled')),
  completed_at timestamptz,
  skipped_at timestamptz,
  cancelled_at timestamptz,
  recurring_pattern jsonb, -- For recurring tasks: {frequency: 'daily', interval: 1, days_of_week: [1,2,3]}
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL, -- For recurring task instances
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure completed_at is set when status is completed
  CONSTRAINT completed_at_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Index history table
CREATE TABLE IF NOT EXISTS index_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  index_value decimal(8,2) NOT NULL CHECK (index_value >= 0),
  daily_change decimal(8,2) DEFAULT 0,
  change_percent decimal(5,2) DEFAULT 0,
  commentary text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Stock performance history table
CREATE TABLE IF NOT EXISTS stock_performance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  date date NOT NULL,
  daily_score integer NOT NULL CHECK (daily_score >= 0),
  score_delta integer DEFAULT 0,
  delta_percent decimal(5,2) DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  tasks_overdue integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(stock_id, date)
);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type text DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'enables', 'related')),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(task_id, depends_on_task_id),
  -- Prevent self-referencing dependencies
  CHECK (task_id != depends_on_task_id)
);

-- Task tags table
CREATE TABLE IF NOT EXISTS task_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(task_id, tag)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, setting_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_user_active ON stocks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stocks_last_activity ON stocks(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_tasks_stock_id ON tasks(stock_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_stock_status ON tasks(stock_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_stock_due ON tasks(stock_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_index_history_user_date ON index_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_stock_date ON stock_performance_history(stock_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, setting_key);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for stocks table
CREATE POLICY "Users can read own stocks"
  ON stocks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stocks"
  ON stocks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stocks"
  ON stocks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own stocks"
  ON stocks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for tasks table
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert tasks for own stocks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

-- RLS Policies for index_history table
CREATE POLICY "Users can read own index history"
  ON index_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own index history"
  ON index_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for stock_performance_history table
CREATE POLICY "Users can read own stock performance history"
  ON stock_performance_history
  FOR SELECT
  TO authenticated
  USING (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert stock performance history"
  ON stock_performance_history
  FOR INSERT
  TO authenticated
  WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id = auth.uid()));

-- RLS Policies for task_dependencies table
CREATE POLICY "Users can read own task dependencies"
  ON task_dependencies
  FOR SELECT
  TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t 
    JOIN stocks s ON t.stock_id = s.id 
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own task dependencies"
  ON task_dependencies
  FOR ALL
  TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t 
    JOIN stocks s ON t.stock_id = s.id 
    WHERE s.user_id = auth.uid()
  ));

-- RLS Policies for task_tags table
CREATE POLICY "Users can read own task tags"
  ON task_tags
  FOR SELECT
  TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t 
    JOIN stocks s ON t.stock_id = s.id 
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own task tags"
  ON task_tags
  FOR ALL
  TO authenticated
  USING (task_id IN (
    SELECT t.id FROM tasks t 
    JOIN stocks s ON t.stock_id = s.id 
    WHERE s.user_id = auth.uid()
  ));

-- RLS Policies for user_settings table
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user's index value
CREATE OR REPLACE FUNCTION calculate_user_index(user_uuid uuid)
RETURNS decimal AS $$
DECLARE
  total_weighted_score decimal := 0;
  total_weight decimal := 0;
  stock_record RECORD;
BEGIN
  FOR stock_record IN 
    SELECT current_score, weight 
    FROM stocks 
    WHERE user_id = user_uuid AND is_active = true
  LOOP
    total_weighted_score := total_weighted_score + (stock_record.current_score * stock_record.weight);
    total_weight := total_weight + stock_record.weight;
  END LOOP;
  
  IF total_weight > 0 THEN
    RETURN total_weighted_score / total_weight;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock score based on task completion
CREATE OR REPLACE FUNCTION update_stock_score_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  stock_record RECORD;
  score_change integer := 0;
BEGIN
  -- Get the stock record
  SELECT * INTO stock_record FROM stocks WHERE id = NEW.stock_id;
  
  -- Calculate score change based on task completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    score_change := NEW.points;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    score_change := -NEW.points;
  ELSIF NEW.status = 'overdue' AND OLD.status = 'pending' THEN
    score_change := -(NEW.points / 2); -- Penalty for overdue tasks
  END IF;
  
  -- Update stock score and last activity
  IF score_change != 0 THEN
    UPDATE stocks 
    SET 
      current_score = GREATEST(0, current_score + score_change),
      last_activity_at = now()
    WHERE id = NEW.stock_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stock score updates
CREATE TRIGGER update_stock_on_task_change
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_stock_score_on_task_completion();

-- Insert default user settings
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES
    (NEW.id, 'theme', '"light"'),
    (NEW.id, 'notifications_enabled', 'true'),
    (NEW.id, 'auto_decay_enabled', 'true'),
    (NEW.id, 'decay_rate', '1.0'),
    (NEW.id, 'default_task_points', '10'),
    (NEW.id, 'work_hours_start', '"09:00"'),
    (NEW.id, 'work_hours_end', '"17:00"');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for default settings
CREATE TRIGGER create_user_defaults
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();