require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Using URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connected:", result);
  } catch (e) {
    console.error("❌ Failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();