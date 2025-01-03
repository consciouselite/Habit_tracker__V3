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

-- Create table for likes
CREATE TABLE IF NOT EXISTS flexbook_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES flexbook_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create table for comments
CREATE TABLE IF NOT EXISTS flexbook_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES flexbook_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE flexbook_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexbook_comments ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Users can manage their own likes"
  ON flexbook_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Users can manage their own comments"
  ON flexbook_comments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add likes_count and comments_count to flexbook_posts
ALTER TABLE flexbook_posts
ADD COLUMN likes_count integer DEFAULT 0,
ADD COLUMN comments_count integer DEFAULT 0;

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'DELETE') THEN
    -- Update likes count
    UPDATE flexbook_posts
    SET likes_count = (
      SELECT COUNT(*) FROM flexbook_likes WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    
    -- Update comments count
    UPDATE flexbook_posts
    SET comments_count = (
      SELECT COUNT(*) FROM flexbook_comments WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for count updates
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON flexbook_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON flexbook_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counts();