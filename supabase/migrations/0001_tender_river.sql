/*
  # Initial Schema for Atomic Habits 2025

  1. Custom Types
    - age_category: Age ranges for user categorization
    - habit_category: Types of habits users can create

  2. Tables
    - profiles: User profiles linked to auth.users
    - onboarding_surveys: Initial user survey data
    - goals: User goals
    - habits: User habits with categories
    - assessments: User assessments (old me/new me)
    - habit_logs: Daily habit completion tracking
    - habit_stats: Habit statistics and streaks

  3. Security
    - RLS enabled on all tables
    - Policies for authenticated users to manage their own data
*/

-- Create custom types

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'age_category') THEN
        CREATE TYPE age_category AS ENUM ('18-25', '26-35', '36-45', '46+');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'habit_category') THEN
        CREATE TYPE habit_category AS ENUM ('Health', 'Productivity', 'Finance', 'Relationships', 'Learning', 'Spiritual/Mental');
    END IF;
END $$;


-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onboarding surveys table
CREATE TABLE IF NOT EXISTS onboarding_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  age_category age_category NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  importance text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  category habit_category NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  assessment_type text NOT NULL,
  limiting_beliefs text,
  bad_habits text,
  time_wasters text,
  energy_drainers text,
  growth_blockers text,
  new_beliefs text,
  empowering_habits text,
  time_investment text,
  energy_gains text,
  growth_areas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Onboarding survey policies
CREATE POLICY "Users can manage own survey"
  ON onboarding_surveys FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Assessments policies
CREATE POLICY "Users can manage own assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_surveys_updated_at
  BEFORE UPDATE ON onboarding_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create habit_stats table
CREATE TABLE IF NOT EXISTS habit_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  completion_rate decimal DEFAULT 0.0,
  last_completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for habit_logs
CREATE POLICY "Users can manage own habit logs"
  ON habit_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for habit_stats
CREATE POLICY "Users can view own habit stats"
  ON habit_stats FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_stats.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own habit stats"
  ON habit_stats FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_stats.habit_id
    AND habits.user_id = auth.uid()
  ));

-- Function to update habit statistics
CREATE OR REPLACE FUNCTION update_habit_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_habit_user_id uuid;
BEGIN
  -- Get the habit's user_id
  SELECT user_id INTO v_habit_user_id
  FROM habits
  WHERE id = NEW.habit_id;

  -- Insert or update habit stats
  INSERT INTO habit_stats (habit_id)
  VALUES (NEW.habit_id)
  ON CONFLICT (habit_id) DO UPDATE
  SET
    current_streak = (
      SELECT COUNT(*)
      FROM habit_logs
      WHERE habit_id = NEW.habit_id
      AND completed_at >= (
        SELECT COALESCE(MAX(completed_at), NOW() - INTERVAL '1 year')
        FROM habit_logs
        WHERE habit_id = NEW.habit_id
        AND completed_at < NEW.completed_at
      )
    ),
    longest_streak = GREATEST(
      habit_stats.longest_streak,
      (
        SELECT COUNT(*)
        FROM habit_logs
        WHERE habit_id = NEW.habit_id
        AND completed_at >= (
          SELECT COALESCE(MAX(completed_at), NOW() - INTERVAL '1 year')
          FROM habit_logs
          WHERE habit_id = NEW.habit_id
          AND completed_at < NEW.completed_at
        )
      )
    ),
    completion_rate = (
      SELECT (COUNT(*) * 100.0 / GREATEST(1, (
        SELECT COUNT(DISTINCT DATE_TRUNC('day', completed_at))
        FROM habit_logs
        WHERE habit_id = NEW.habit_id
        AND completed_at >= NOW() - INTERVAL '30 days'
      )))
      FROM habit_logs
      WHERE habit_id = NEW.habit_id
      AND completed_at >= NOW() - INTERVAL '30 days'
    ),
    last_completed_at = NEW.completed_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for habit stats
CREATE TRIGGER update_habit_stats_on_log
  AFTER INSERT ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_stats();

ALTER TABLE goals
    ADD COLUMN image_url TEXT DEFAULT 'https://res.cloudinary.com/dzkqpbwya/image/upload/v1735751911/dc36bb83-9d6d-45f9-9c49-401b88da62f5_pt0y7j.jpg';

-- Create flexbook_posts table
    CREATE TABLE IF NOT EXISTS flexbook_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) NOT NULL,
      title text NOT NULL,
      image_url text NOT NULL,
      caption text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE flexbook_posts ENABLE ROW LEVEL SECURITY;

    -- Create policies for flexbook_posts
    CREATE POLICY "Users can manage own posts"
      ON flexbook_posts FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    -- Create functions for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create triggers for updated_at
    CREATE TRIGGER update_flexbook_posts_updated_at
      BEFORE UPDATE ON flexbook_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

-- Function to get habit statistics for a user
    CREATE OR REPLACE FUNCTION get_user_habit_stats(p_user_id uuid)
    RETURNS TABLE (
      habit_id uuid,
      name text,
      current_streak integer,
      longest_streak integer,
      completion_rate numeric
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        h.id AS habit_id,
        h.name,
        COALESCE(hs.current_streak, 0) AS current_streak,
        COALESCE(hs.longest_streak, 0) AS longest_streak,
        COALESCE(hs.completion_rate, 0) AS completion_rate
      FROM
        habits h
      LEFT JOIN
        habit_stats hs ON h.id = hs.habit_id
      WHERE
        h.user_id = p_user_id;
    END;
    $$ LANGUAGE plpgsql;


-- Enable Storage 
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;

-- Policy to allow authenticated users to upload files to the images bucket
CREATE POLICY "Allow authenticated uploads to images bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND 
  auth.uid() = owner
);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND 
  auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'images' AND 
  auth.uid() = owner
);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND 
  auth.uid() = owner
);

-- Policy to allow public read access to files
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can view own habit stats" ON habit_stats;
DROP POLICY IF EXISTS "Users can update own habit stats" ON habit_stats;

-- Recreate habit_logs policies with more specific permissions
CREATE POLICY "Users can insert own habit logs"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own habit logs"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recreate habit_stats policies
CREATE POLICY "Users can view own habit stats"
  ON habit_stats FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_stats.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own habit stats"
  ON habit_stats FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_stats.habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own habit stats"
  ON habit_stats FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_stats.habit_id
    AND habits.user_id = auth.uid()
  ));
  
  
  CREATE OR REPLACE FUNCTION update_habit_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_habit_user_id uuid;
BEGIN
  -- Get the habit's user_id
  SELECT user_id INTO v_habit_user_id
  FROM habits
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
    ELSE NEW.habit_id 
  END;

  -- Insert or update habit stats
  INSERT INTO habit_stats (habit_id)
  VALUES (CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
    ELSE NEW.habit_id 
  END)
  ON CONFLICT (habit_id) DO UPDATE
  SET
    current_streak = (
      SELECT COUNT(*)
      FROM habit_logs
      WHERE habit_id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
        ELSE NEW.habit_id 
      END
      AND completed_at >= (
        SELECT COALESCE(MAX(completed_at), NOW() - INTERVAL '1 year')
        FROM habit_logs
        WHERE habit_id = CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
          ELSE NEW.habit_id 
        END
        AND completed_at < CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.completed_at 
          ELSE NEW.completed_at 
        END
      )
    ),
    longest_streak = GREATEST(
      habit_stats.longest_streak,
      (
        SELECT COUNT(*)
        FROM habit_logs
        WHERE habit_id = CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
          ELSE NEW.habit_id 
        END
        AND completed_at >= (
          SELECT COALESCE(MAX(completed_at), NOW() - INTERVAL '1 year')
          FROM habit_logs
          WHERE habit_id = CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
            ELSE NEW.habit_id 
          END
          AND completed_at < CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.completed_at 
            ELSE NEW.completed_at 
          END
        )
      )
    ),
    completion_rate = (
      SELECT (COUNT(*) * 100.0 / GREATEST(1, (
        SELECT COUNT(DISTINCT DATE_TRUNC('day', completed_at))
        FROM habit_logs
        WHERE habit_id = CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
          ELSE NEW.habit_id 
        END
        AND completed_at >= NOW() - INTERVAL '30 days'
      )))
      FROM habit_logs
      WHERE habit_id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.habit_id 
        ELSE NEW.habit_id 
      END
      AND completed_at >= NOW() - INTERVAL '30 days'
    ),
    last_completed_at = CASE 
      WHEN TG_OP = 'DELETE' THEN (
        SELECT MAX(completed_at) 
        FROM habit_logs 
        WHERE habit_id = OLD.habit_id
      )
      ELSE NEW.completed_at 
    END,
    updated_at = NOW();

  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD 
    ELSE NEW 
  END;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to handle both INSERT and DELETE
DROP TRIGGER IF EXISTS update_habit_stats_on_log ON habit_logs;
CREATE TRIGGER update_habit_stats_on_log
  AFTER INSERT OR DELETE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_stats();

  -- Add expiry_date column to goals table
ALTER TABLE goals
ADD COLUMN expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days');

-- Update existing goals to have an expiry date
UPDATE goals
SET expiry_date = created_at::date + INTERVAL '30 days'
WHERE expiry_date IS NULL;