import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@legalai.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Admin',
      email,
      password: hashed,
      role: 'admin',
    },
  });
  console.log('Seed: admin user created (or already exists)');

  // 9 additional sample users so the User table has at least 10 records
  const extraUsers = Array.from({ length: 9 }, (_v, i) => ({
    name: `Sample Admin ${i + 1}`,
    email: `admin+${i + 1}@legalai.com`,
    role: 'admin',
  }));
  for (const u of extraUsers) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      },
    });
  }
  console.log(`Seed: ensured ${extraUsers.length + 1} User records (admin + samples)`);
}

function makeSamples(count) {
  return Array.from({ length: count }, (_v, i) => i + 1);
}

async function seedCoreTables() {
  // 10 sample laws
  const laws = makeSamples(10).map((i) => ({
    lawType: i % 2 === 0 ? 'IPC' : 'CrPC',
    sectionNumber: `Section ${400 + i}`,
    title: `Sample Section ${400 + i}`,
    description: `Sample description for Section ${400 + i}.`,
    punishment: 'Sample punishment description.',
    bailable: i % 2 === 0 ? 'Bailable' : 'Non-bailable',
    cognizable: i % 2 === 0 ? 'Cognizable' : 'Non-cognizable',
    courtType: 'Sessions Court',
  }));
  for (const law of laws) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.law.create({ data: law });
  }
  console.log(`Seed: created ${laws.length} Law records`);

  // 10 sample judgments
  const judgments = makeSamples(10).map((i) => ({
    courtName: 'High Court of Sample State',
    caseTitle: `Sample Case ${i} v. State`,
    year: 2015 + (i % 8),
    judgeName: `Justice Sample ${i}`,
    summary: `Brief summary of sample judgment ${i}.`,
    fullText: `Full text of sample judgment ${i}. This would normally contain the reasoning and holdings of the court.`,
    citation: `202${i % 3} SCC OnLine Sample ${100 + i}`,
  }));
  const createdJudgments = [];
  for (const j of judgments) {
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.judgment.create({ data: j });
    createdJudgments.push(created);
  }
  console.log(`Seed: created ${createdJudgments.length} Judgment records`);

  // 10 sample legal drafts
  const drafts = makeSamples(10).map((i) => ({
    documentType: 'Bail Application',
    title: `Sample bail draft ${i}`,
    facts: `Sample facts for bail draft ${i}.`,
    draftText: `Full sample draft text for bail application ${i}. Contains headings, body, and prayer.`,
    courtType: 'Sessions Court',
    state: 'Sample State',
  }));
  const createdDrafts = [];
  for (const d of drafts) {
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.legalDraft.create({ data: d });
    createdDrafts.push(created);
  }
  console.log(`Seed: created ${createdDrafts.length} LegalDraft records`);

  // 10 sample legal templates
  const templates = makeSamples(10).map((i) => ({
    documentType: 'bail_application',
    templateText: `Template ${i}: \nIN THE COURT OF {court_name}\n\nBail Application for {client_name} under {section}...\n\n[Template body here]\n`,
  }));
  for (const t of templates) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.legalTemplate.create({ data: t });
  }
  console.log(`Seed: created ${templates.length} LegalTemplate records`);

  // 10 sample legal Q&A
  const questions = makeSamples(10).map((i) => ({
    question: `What is anticipatory bail in sample scenario ${i}?`,
    answer: 'Anticipatory bail is pre-arrest bail granted under Section 438 CrPC in appropriate cases.',
    source: 'Sample drafting guide',
  }));
  for (const q of questions) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.legalQuestion.create({ data: q });
  }
  console.log(`Seed: created ${questions.length} LegalQuestion records`);

  // 10 legacy Embedding rows (for compatibility; main RAG now uses pgvector)
  const embeddings = makeSamples(10).map((i) => ({
    contentType: 'legal_draft',
    contentId: createdDrafts[i - 1]?.id || `draft_${i}`,
    vector: JSON.stringify({ placeholder: true, index: i }),
  }));
  for (const e of embeddings) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.embedding.upsert({
      where: {
        contentType_contentId: {
          contentType: e.contentType,
          contentId: e.contentId,
        },
      },
      update: {},
      create: e,
    });
  }
  console.log(`Seed: created ${embeddings.length} Embedding records`);
}

async function seedLegalKnowledge() {
  // 10 sample legal documents (e.g. drafting book chapters / judgments)
  const docs = makeSamples(10).map((i) => ({
    title: `Sample Bail Drafting Chapter ${i}`,
    court: 'Sample Court',
    year: 2020 + (i % 4),
    jurisdiction: 'India',
    documentType: 'bail_application',
    text: `This is sample legal drafting text for bail application example ${i}. It demonstrates headings, grounds, and prayer as per typical practice.`,
    metadata: { sample: true, index: i },
  }));

  const createdDocs = [];
  for (const d of docs) {
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.legalDocument.create({ data: d });
    createdDocs.push(created);
  }
  console.log(`Seed: created ${createdDocs.length} LegalDocument records`);

  // 10 sample chunks referencing the first document
  const baseDoc = createdDocs[0];
  if (baseDoc) {
    const chunks = makeSamples(10).map((i) => ({
      documentId: baseDoc.id,
      chunkText: `Chunk ${i} of sample bail drafting text. This part explains a specific ground or paragraph for anticipatory bail.`,
      metadata: { sample: true, index: i },
    }));
    for (const c of chunks) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.legalChunk.create({ data: c });
    }
    console.log(`Seed: created ${chunks.length} LegalChunk records for document ${baseDoc.id}`);
  }

  // 10 sample IRAC-style reasoning records
  const reasonings = makeSamples(10).map((i) => ({
    caseType: 'anticipatory_bail',
    issue: `Whether anticipatory bail should be granted in sample case ${i}?`,
    rule: 'Court considers gravity of offence, antecedents, and likelihood of misuse of liberty.',
    application: 'Applying the rule to the sample facts, the applicant cooperates with investigation and no custodial interrogation is required.',
    conclusion: 'Anticipatory bail may be granted with suitable conditions.',
    citations: 'Sample citation: 2020 SCC OnLine SC 123',
    metadata: { sample: true, index: i },
  }));
  for (const r of reasonings) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.legalReasoning.create({ data: r });
  }
  console.log(`Seed: created ${reasonings.length} LegalReasoning records`);

  // 10 sample arguments
  const argumentsData = makeSamples(10).map((i) => ({
    caseType: 'anticipatory_bail',
    argumentTitle: `Grounds for anticipatory bail ${i}`,
    argumentPoints: {
      points: [
        'Applicant has deep roots in society and is not a flight risk.',
        'No custodial interrogation is required.',
        'False implication cannot be ruled out at this stage.',
      ],
    },
    supportingCases: {
      citations: ['Example v. State, 2020 SCC OnLine 100'],
    },
    counterArguments: {
      points: ['State may argue gravity of offence, but mitigating factors exist.'],
    },
    metadata: { sample: true, index: i },
  }));
  for (const a of argumentsData) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.legalArgument.create({ data: a });
  }
  console.log(`Seed: created ${argumentsData.length} LegalArgument records`);

  // 10 sample judgment analyses referencing createdDocs where possible
  const judgments = [];
  for (const [i, doc] of createdDocs.entries()) {
    if (i >= 10) break;
    judgments.push({
      documentId: doc.id,
      factsSummary: `Facts summary for sample judgment ${i + 1}.`,
      legalIssues: 'Whether bail should be granted in the circumstances of the case.',
      courtReasoning: 'Court balances individual liberty with the need for fair investigation.',
      finalDecision: 'Bail granted subject to conditions.',
      keyCitations: 'Sample citation: 2019 SCC OnLine 200',
      metadata: { sample: true, index: i + 1 },
    });
  }
  for (const j of judgments) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.judgmentAnalysis.create({ data: j });
  }
  console.log(`Seed: created ${judgments.length} JudgmentAnalysis records`);

  // 10 sample entities and relationships in the legal knowledge graph
  const entities = [];
  for (const i of makeSamples(5)) {
    entities.push({
      entityType: 'CASE',
      name: `Sample Bail Case ${i}`,
      externalId: `CASE_${i}`,
      metadata: { sample: true, type: 'case' },
    });
  }
  for (const i of makeSamples(5)) {
    entities.push({
      entityType: 'SECTION',
      name: `Section 438 CrPC Example ${i}`,
      externalId: `SEC_438_${i}`,
      metadata: { sample: true, type: 'section' },
    });
  }
  const createdEntities = [];
  for (const e of entities) {
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.legalEntity.create({ data: e });
    createdEntities.push(created);
  }
  console.log(`Seed: created ${createdEntities.length} LegalEntity records`);

  if (createdEntities.length >= 4) {
    const relationships = [
      {
        fromEntityId: createdEntities[0].id,
        toEntityId: createdEntities[5].id,
        relationType: 'APPLIES_SECTION',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[1].id,
        toEntityId: createdEntities[6].id,
        relationType: 'APPLIES_SECTION',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[2].id,
        toEntityId: createdEntities[7].id,
        relationType: 'APPLIES_SECTION',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[3].id,
        toEntityId: createdEntities[8].id,
        relationType: 'APPLIES_SECTION',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[4].id,
        toEntityId: createdEntities[9].id,
        relationType: 'APPLIES_SECTION',
        metadata: { sample: true },
      },
      // Additional relationships so the table has at least 10 sample rows
      {
        fromEntityId: createdEntities[5].id,
        toEntityId: createdEntities[0].id,
        relationType: 'FOLLOWS',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[6].id,
        toEntityId: createdEntities[1].id,
        relationType: 'FOLLOWS',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[7].id,
        toEntityId: createdEntities[2].id,
        relationType: 'FOLLOWS',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[8].id,
        toEntityId: createdEntities[3].id,
        relationType: 'FOLLOWS',
        metadata: { sample: true },
      },
      {
        fromEntityId: createdEntities[9].id,
        toEntityId: createdEntities[4].id,
        relationType: 'FOLLOWS',
        metadata: { sample: true },
      },
    ];
    for (const rel of relationships) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.legalRelationship.create({ data: rel });
    }
    console.log(`Seed: created ${relationships.length} LegalRelationship records`);
  }
}

async function seedTrainingAndEval() {
  // 10 dataset versions
  const datasetVersions = [];
  for (const i of makeSamples(10)) {
    // eslint-disable-next-line no-await-in-loop
    const dv = await prisma.datasetVersion.create({
      data: {
        name: `Sample dataset version ${i}`,
        notes: `Sample notes for dataset version ${i}.`,
      },
    });
    datasetVersions.push(dv);
  }
  console.log(`Seed: created ${datasetVersions.length} DatasetVersion records`);

  // 10 training examples
  const trainingExamples = [];
  for (const i of makeSamples(10)) {
    const dv = datasetVersions[(i - 1) % datasetVersions.length];
    // eslint-disable-next-line no-await-in-loop
    const ex = await prisma.trainingExample.create({
      data: {
        datasetVersionId: dv.id,
        documentType: 'bail_application',
        courtType: 'Sessions Court',
        state: 'Sample State',
        facts: `Sample training example facts ${i}.`,
        inputJson: { sample: true, index: i },
        expectedDraftText: `Expected draft text for training example ${i}.`,
        tags: ['sample', 'bail', `ex_${i}`],
        difficulty: i <= 5 ? 'easy' : 'medium',
        source: 'seed',
      },
    });
    trainingExamples.push(ex);
  }
  console.log(`Seed: created ${trainingExamples.length} TrainingExample records`);

  // 10 training runs
  const trainingRuns = [];
  for (const i of makeSamples(10)) {
    const dv = datasetVersions[(i - 1) % datasetVersions.length];
    // eslint-disable-next-line no-await-in-loop
    const run = await prisma.trainingRun.create({
      data: {
        type: i % 2 === 0 ? 'RAG_EVAL' : 'FINETUNE',
        status: 'SUCCEEDED',
        datasetVersionId: dv.id,
        baseModel: 'llama3-8b-instruct',
        embeddingModel: 'bge-small-en-v1.5',
        paramsJson: { sample: true, lr: 1e-4, batch_size: 4 },
        logsText: `Logs for training run ${i}.`,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
    trainingRuns.push(run);
  }
  console.log(`Seed: created ${trainingRuns.length} TrainingRun records`);

  // 10 evaluation results
  const evalResults = [];
  for (const i of makeSamples(10)) {
    const run = trainingRuns[(i - 1) % trainingRuns.length];
    const ex = trainingExamples[(i - 1) % trainingExamples.length];
    // eslint-disable-next-line no-await-in-loop
    const er = await prisma.evaluationResult.create({
      data: {
        trainingRunId: run.id,
        trainingExampleId: ex.id,
        generatedText: `Generated draft text for evaluation result ${i}.`,
        scoreOverall: 0.7 + i * 0.02,
        scoreFormat: 0.8,
        scoreCoverage: 0.75,
        scoreSimilarity: 0.7,
        legalAccuracy: 0.8,
        citationAccuracy: 0.7,
        argumentQuality: 0.78,
        structureQuality: 0.82,
        languageQuality: 0.76,
        judgeFeedbackJson: { sample: true, notes: `Feedback for result ${i}` },
        failureReason: null,
        reviewStatus: 'UNREVIEWED',
        reviewNotes: null,
        retrievedContextIds: ['ctx1', 'ctx2'],
      },
    });
    evalResults.push(er);
  }
  console.log(`Seed: created ${evalResults.length} EvaluationResult records`);
}

async function main() {
  await seedAdminUser();
  await seedCoreTables();
  await seedLegalKnowledge();
  await seedTrainingAndEval();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
