import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.MONGODB_URI ?? process.env.MONGO_DATABASE_URI;
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const prisma = new PrismaClient();

export default prisma;