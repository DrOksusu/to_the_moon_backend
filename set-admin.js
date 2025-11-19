const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Set teacher@vocalstudio.com as admin
  const teacher = await prisma.user.update({
    where: { email: 'teacher@vocalstudio.com' },
    data: { is_admin: true }
  });

  console.log('Admin set successfully!');
  console.log('Teacher:', teacher.name, '(', teacher.email, ')');
  console.log('is_admin:', teacher.is_admin);

  await prisma.$disconnect();
}

main().catch(console.error);
