import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const initiatives = await prisma.initiative.findMany({ select: { id: true, name: true } });
  const members = await prisma.initiativeMember.count();
  const forms = await prisma.form.count();
  console.log(`Initiatives (${initiatives.length}):`, initiatives.map(i => i.name));
  console.log(`Members: ${members}`);
  console.log(`Forms: ${forms}`);
}
main().finally(() => prisma.$disconnect());
