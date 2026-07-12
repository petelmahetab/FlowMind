require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sop = await prisma.sop.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        include: { checklistItems: true },
        orderBy: { order: "asc" },
      },
    },
  });

  console.log("Latest SOP:", sop?.title, "| id:", sop?.id, "| slug:", sop?.shareSlug, "| createdAt:", sop?.createdAt);
  sop?.steps.forEach(step => {
    console.log(`- ${step.title}: ${step.checklistItems.length} checklist items`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);