-- Add pgvector column to legal_ai.embeddings (requires vector extension installed in public schema)
-- Embedding dimension 384 is common for sentence-transformers/all-MiniLM; use 768 if your model outputs 768.
ALTER TABLE "legal_ai"."embeddings" ADD COLUMN IF NOT EXISTS "embedding" public.vector(384);

-- Backfill: "vector" column stores JSON array string like '[0.1,0.2,...]'. Cast to public.vector(384).
-- Adjust dimension (384/768) to match your embedding model. Invalid rows leave embedding NULL.
UPDATE "legal_ai"."embeddings"
SET embedding = NULLIF(trim(vector), '')::public.vector(384)
WHERE vector IS NOT NULL AND trim(vector) != '' AND vector ~ '^\[.*\]$';

-- Optional: index for approximate nearest neighbor (run after backfill; uncomment when you have enough rows)
-- CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON "legal_ai"."embeddings" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
