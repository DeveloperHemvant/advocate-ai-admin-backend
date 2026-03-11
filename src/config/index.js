import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  embeddingServiceUrl: process.env.EMBEDDING_SERVICE_URL || '',
  legalAiApiUrl: process.env.LEGAL_AI_API_URL || process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
