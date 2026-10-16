import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.MONGODB_URI || process.env.MONGO_DATABASE_URI || process.env.DATABASE_URL || '',
  },
});