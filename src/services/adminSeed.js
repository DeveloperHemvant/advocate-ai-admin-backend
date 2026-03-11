import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

const DEFAULT_EMAIL = 'admin@gmail.com';
const DEFAULT_PASSWORD = '12345678';

export async function ensureDefaultAdmin() {
  const email = process.env.AI_ADMIN_EMAIL || DEFAULT_EMAIL;
  const password = process.env.AI_ADMIN_PASSWORD || DEFAULT_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: 'AI Admin',
      email,
      password: hashed,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  // eslint-disable-next-line no-console
  console.log(`AI Admin user created: ${email} / ${password}`);
}

