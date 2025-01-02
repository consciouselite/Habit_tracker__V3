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
