-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "legal_ai";

-- CreateTable
CREATE TABLE "legal_ai"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."laws" (
    "id" TEXT NOT NULL,
    "law_type" TEXT NOT NULL,
    "section_number" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "punishment" TEXT,
    "bailable" TEXT,
    "cognizable" TEXT,
    "court_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."judgments" (
    "id" TEXT NOT NULL,
    "court_name" TEXT NOT NULL,
    "case_title" TEXT NOT NULL,
    "year" INTEGER,
    "judge_name" TEXT,
    "summary" TEXT,
    "full_text" TEXT,
    "citation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."legal_drafts" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT,
    "facts" TEXT,
    "draft_text" TEXT NOT NULL,
    "court_type" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."legal_templates" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "template_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."legal_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ai"."embeddings" (
    "id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "legal_ai"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_content_type_content_id_key" ON "legal_ai"."embeddings"("content_type", "content_id");
