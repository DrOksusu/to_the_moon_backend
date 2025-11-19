const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  console.log('\n=== All Students in Database ===');
  console.log('Total students:', students.length);
  students.forEach((student, index) => {
    console.log(`\n${index + 1}. Student: ${student.user.name} (${student.user.email})`);
    console.log(`   Teacher: ${student.teacher.name} (${student.teacher.email})`);
    console.log(`   Teacher ID: ${student.teacher_id}`);
    console.log(`   Profile ID: ${student.id}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
