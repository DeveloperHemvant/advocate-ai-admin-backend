import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import lawsRoutes from './routes/laws.js';
import judgmentsRoutes from './routes/judgments.js';
import draftsRoutes from './routes/drafts.js';
import templatesRoutes from './routes/templates.js';
import questionsRoutes from './routes/questions.js';
import datasetsRoutes from './routes/datasets.js';
import trainingRunsRoutes from './routes/trainingRuns.js';
import embeddingsRoutes from './routes/embeddings.js';
import evalsRoutes from './routes/evals.js';
import reasoningRoutes from './routes/reasoning.js';
import argumentsRoutes from './routes/arguments.js';
import documentsRoutes from './routes/documents.js';
import judgmentAnalysisRoutes from './routes/judgmentAnalysis.js';
import knowledgeGraphRoutes from './routes/knowledgeGraph.js';

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

const openApi = {
  openapi: '3.0.0',
  info: {
    title: 'Legal AI Admin API',
    version: '1.0.0',
    description:
      'Admin console for managing legal knowledge, drafts, datasets and training runs for the Legal AI agent.',
  },
  servers: [{ url: `http://localhost:${config.port}`, description: 'Local' }],
  paths: {
    '/api/auth/login': { post: { summary: 'Admin login', tags: ['Auth'] } },
    '/api/laws': { get: { summary: 'List laws', tags: ['Knowledge'] } },
    '/api/judgments': { get: { summary: 'List judgments', tags: ['Knowledge'] } },
    '/api/drafts': { get: { summary: 'List drafts', tags: ['Drafts'] } },
    '/api/datasets': { get: { summary: 'List dataset versions', tags: ['Training'] } },
    '/api/training-runs': { get: { summary: 'List training runs', tags: ['Training'] } },
    '/api/evals/{{datasetVersionId}}/run': {
      post: { summary: 'Run evaluation for a dataset version', tags: ['Training'] },
    },
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApi));

app.use('/api/auth', authRoutes);
app.use('/api/laws', lawsRoutes);
app.use('/api/judgments', judgmentsRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/datasets', datasetsRoutes);
app.use('/api/training-runs', trainingRunsRoutes);
app.use('/api/embeddings', embeddingsRoutes);
app.use('/api/evals', evalsRoutes);
app.use('/api/reasoning', reasoningRoutes);
app.use('/api/arguments', argumentsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/judgment-analysis', judgmentAnalysisRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;
