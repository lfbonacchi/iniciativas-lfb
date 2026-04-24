import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { id: "u1" }, select: { display_name: true } });
  console.log("u1 display_name:", user?.display_name);
}
main().finally(() => prisma.$disconnect());
