-- Training console tables for Drafts MVP (legal_ai schema)

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typname = 'TrainingRunType' AND n.nspname='legal_ai') THEN
    CREATE TYPE "legal_ai"."TrainingRunType" AS ENUM ('RAG_EVAL', 'FINETUNE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typname = 'TrainingRunStatus' AND n.nspname='legal_ai') THEN
    CREATE TYPE "legal_ai"."TrainingRunStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typname = 'ReviewStatus' AND n.nspname='legal_ai') THEN
    CREATE TYPE "legal_ai"."ReviewStatus" AS ENUM ('UNREVIEWED', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- Dataset versions
CREATE TABLE IF NOT EXISTS "legal_ai"."dataset_versions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dataset_versions_pkey" PRIMARY KEY ("id")
);

-- Training examples
CREATE TABLE IF NOT EXISTS "legal_ai"."training_examples" (
  "id" TEXT NOT NULL,
  "dataset_version_id" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "court_type" TEXT,
  "state" TEXT,
  "facts" TEXT,
  "input_json" JSONB,
  "expected_draft_text" TEXT NOT NULL,
  "tags" TEXT[],
  "difficulty" TEXT,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_examples_pkey" PRIMARY KEY ("id")
);

-- Training runs
CREATE TABLE IF NOT EXISTS "legal_ai"."training_runs" (
  "id" TEXT NOT NULL,
  "type" "legal_ai"."TrainingRunType" NOT NULL,
  "status" "legal_ai"."TrainingRunStatus" NOT NULL DEFAULT 'DRAFT',
  "dataset_version_id" TEXT NOT NULL,
  "base_model" TEXT,
  "embedding_model" TEXT,
  "params_json" JSONB,
  "logs_text" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_runs_pkey" PRIMARY KEY ("id")
);

-- Evaluation results
CREATE TABLE IF NOT EXISTS "legal_ai"."evaluation_results" (
  "id" TEXT NOT NULL,
  "training_run_id" TEXT NOT NULL,
  "training_example_id" TEXT NOT NULL,
  "generated_text" TEXT NOT NULL,
  "score_overall" DOUBLE PRECISION NOT NULL,
  "score_format" DOUBLE PRECISION,
  "score_coverage" DOUBLE PRECISION,
  "score_similarity" DOUBLE PRECISION,
  "failure_reason" TEXT,
  "review_status" "legal_ai"."ReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
  "review_notes" TEXT,
  "retrieved_context_ids" TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "evaluation_results_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "training_examples_dataset_version_id_idx" ON "legal_ai"."training_examples"("dataset_version_id");
CREATE INDEX IF NOT EXISTS "training_runs_dataset_version_id_idx" ON "legal_ai"."training_runs"("dataset_version_id");
CREATE INDEX IF NOT EXISTS "evaluation_results_training_run_id_idx" ON "legal_ai"."evaluation_results"("training_run_id");
CREATE INDEX IF NOT EXISTS "evaluation_results_training_example_id_idx" ON "legal_ai"."evaluation_results"("training_example_id");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_examples_dataset_version_id_fkey') THEN
    ALTER TABLE "legal_ai"."training_examples"
    ADD CONSTRAINT "training_examples_dataset_version_id_fkey"
    FOREIGN KEY ("dataset_version_id") REFERENCES "legal_ai"."dataset_versions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_runs_dataset_version_id_fkey') THEN
    ALTER TABLE "legal_ai"."training_runs"
    ADD CONSTRAINT "training_runs_dataset_version_id_fkey"
    FOREIGN KEY ("dataset_version_id") REFERENCES "legal_ai"."dataset_versions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'evaluation_results_training_run_id_fkey') THEN
    ALTER TABLE "legal_ai"."evaluation_results"
    ADD CONSTRAINT "evaluation_results_training_run_id_fkey"
    FOREIGN KEY ("training_run_id") REFERENCES "legal_ai"."training_runs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'evaluation_results_training_example_id_fkey') THEN
    ALTER TABLE "legal_ai"."evaluation_results"
    ADD CONSTRAINT "evaluation_results_training_example_id_fkey"
    FOREIGN KEY ("training_example_id") REFERENCES "legal_ai"."training_examples"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

