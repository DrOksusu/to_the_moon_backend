const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'student'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true
    }
  });

  console.log('\n=== All Student Users in Database ===');
  console.log('Total student users:', users.length);
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
  });

  const profiles = await prisma.studentProfile.findMany({
    select: {
      user_id: true,
      teacher_id: true
    }
  });

  console.log('\n=== Student Profiles ===');
  console.log('Total profiles:', profiles.length);
  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. User ID: ${profile.user_id}, Teacher ID: ${profile.teacher_id}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
