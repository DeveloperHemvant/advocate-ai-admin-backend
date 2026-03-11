FROM node:20

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Prisma schema
COPY prisma ./prisma
RUN npx prisma generate

# Application source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4100

# Run migrations for legal_ai schema, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

