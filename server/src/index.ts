import app from './app';
import prisma from './prisma/client';

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();
    const server = app.listen(port, () => {
      console.log(`🚀 Otomos server running on http://localhost:${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully.`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
};

void startServer();