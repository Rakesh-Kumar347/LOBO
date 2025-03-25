-- Create a table in supabase for storing chat histories
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'General'
);

-- Set up Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own chat histories
CREATE POLICY "Users can view their own chat histories" 
  ON chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own chat histories
CREATE POLICY "Users can insert their own chat histories" 
  ON chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own chat histories
CREATE POLICY "Users can update their own chat histories" 
  ON chat_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own chat histories
CREATE POLICY "Users can delete their own chat histories" 
  ON chat_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function for updating the updated_at column
CREATE OR REPLACE FUNCTION update_chat_history_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the modified column
CREATE TRIGGER update_chat_history_modified
  BEFORE UPDATE ON chat_history
  FOR EACH ROW EXECUTE FUNCTION update_chat_history_modified_column();

-- Create an index for faster lookups by user_id
CREATE INDEX chat_history_user_id_idx ON chat_history(user_id);

-- Create index for searching by title and category
CREATE INDEX chat_history_search_idx ON chat_history USING GIN (to_tsvector('english', title || ' ' || category));

-- Function to search chats
CREATE OR REPLACE FUNCTION search_user_chats(user_uuid UUID, search_query TEXT)
RETURNS SETOF chat_history AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM chat_history
  WHERE user_id = user_uuid
  AND (
    to_tsvector('english', title || ' ' || category) @@ to_tsquery('english', search_query)
    OR search_query IS NULL OR search_query = ''
  )
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;