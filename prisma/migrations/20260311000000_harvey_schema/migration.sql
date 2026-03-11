-- Harvey-level Legal Intelligence schema extensions for legal_ai

-- LegalReasoning, LegalDocument, LegalCitation, LegalArgument, LegalChunk,
-- JudgmentAnalysis, LegalEntity, LegalRelationship, and advanced evaluation metrics.

-- EvaluationResult advanced metrics
ALTER TABLE "legal_ai"."evaluation_results"
  ADD COLUMN IF NOT EXISTS "legal_accuracy"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "citation_accuracy"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "argument_quality"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "structure_quality"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "language_quality"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "judge_feedback_json" JSONB;

-- LegalReasoning
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_reasoning" (
  "id"          TEXT PRIMARY KEY,
  "case_type"   TEXT NOT NULL,
  "issue"       TEXT NOT NULL,
  "rule"        TEXT NOT NULL,
  "application" TEXT NOT NULL,
  "conclusion"  TEXT NOT NULL,
  "citations"   TEXT,
  "metadata"    JSONB,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LegalDocument
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_documents" (
  "id"            TEXT PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "court"         TEXT,
  "year"          INTEGER,
  "jurisdiction"  TEXT,
  "document_type" TEXT NOT NULL,
  "text"          TEXT NOT NULL,
  "embedding"     public.vector(384),
  "metadata"      JSONB,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LegalCitation
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_citations" (
  "id"                TEXT PRIMARY KEY,
  "document_id"       TEXT NOT NULL REFERENCES "legal_ai"."legal_documents"("id") ON DELETE CASCADE,
  "citation_text"     TEXT NOT NULL,
  "section_reference" TEXT,
  "metadata"          JSONB,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "legal_citations_document_id_idx"
  ON "legal_ai"."legal_citations"("document_id");

-- LegalArgument
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_arguments" (
  "id"                TEXT PRIMARY KEY,
  "case_type"         TEXT NOT NULL,
  "argument_title"    TEXT NOT NULL,
  "argument_points"   JSONB NOT NULL,
  "supporting_cases"  JSONB,
  "counter_arguments" JSONB,
  "metadata"          JSONB,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LegalChunk
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_chunks" (
  "id"          TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "legal_ai"."legal_documents"("id") ON DELETE CASCADE,
  "chunk_text"  TEXT NOT NULL,
  "embedding"   public.vector(384),
  "metadata"    JSONB,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "legal_chunks_document_id_idx"
  ON "legal_ai"."legal_chunks"("document_id");

-- JudgmentAnalysis
CREATE TABLE IF NOT EXISTS "legal_ai"."judgment_analysis" (
  "id"              TEXT PRIMARY KEY,
  "document_id"     TEXT NOT NULL REFERENCES "legal_ai"."legal_documents"("id") ON DELETE CASCADE,
  "facts_summary"   TEXT NOT NULL,
  "legal_issues"    TEXT NOT NULL,
  "court_reasoning" TEXT NOT NULL,
  "final_decision"  TEXT NOT NULL,
  "key_citations"   TEXT,
  "metadata"        JSONB,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "judgment_analysis_document_id_idx"
  ON "legal_ai"."judgment_analysis"("document_id");

-- LegalEntity
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_entities" (
  "id"          TEXT PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "external_id" TEXT,
  "metadata"    JSONB,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LegalRelationship
CREATE TABLE IF NOT EXISTS "legal_ai"."legal_relationships" (
  "id"             TEXT PRIMARY KEY,
  "from_entity_id" TEXT NOT NULL REFERENCES "legal_ai"."legal_entities"("id") ON DELETE CASCADE,
  "to_entity_id"   TEXT NOT NULL REFERENCES "legal_ai"."legal_entities"("id") ON DELETE CASCADE,
  "relation_type"  TEXT NOT NULL,
  "metadata"       JSONB,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "legal_relationships_from_idx"
  ON "legal_ai"."legal_relationships"("from_entity_id");

CREATE INDEX IF NOT EXISTS "legal_relationships_to_idx"
  ON "legal_ai"."legal_relationships"("to_entity_id");

-- Vector index for fast similarity search on chunks
CREATE INDEX IF NOT EXISTS "legal_chunks_embedding_ivfflat"
  ON "legal_ai"."legal_chunks" USING ivfflat ("embedding" public.vector_cosine_ops)
  WITH (lists = 100);

