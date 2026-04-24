import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { id: "u1" },
    data: { display_name: "Roberto Méndez" },
  });
  console.log("✓ Roberto Méndez restored");
}
main().finally(() => prisma.$disconnect());
