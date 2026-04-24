import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const initiatives = await prisma.initiative.findMany({ select: { id: true, name: true } });
  console.log("Initiatives in DB:", JSON.stringify(initiatives, null, 2));
}
main().finally(() => prisma.$disconnect());
