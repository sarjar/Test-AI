-- Remove document_chunks table and related functionality
-- This migration cleans up the vector database components

-- Drop the search function
DROP FUNCTION IF EXISTS search_similar_documents(vector(1536), float, int);

-- Remove table from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'document_chunks'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE document_chunks;
  END IF;
END $$;

-- Drop the document_chunks table
DROP TABLE IF EXISTS public.document_chunks;

-- Note: We keep the vector extension as it might be useful for future features
-- DROP EXTENSION IF EXISTS vector;
