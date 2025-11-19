const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the teacher
  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher@vocalstudio.com' }
  });

  // Find the student without profile
  const student = await prisma.user.findUnique({
    where: { email: 'ok4192@hanmail.net' }
  });

  if (!teacher) {
    console.log('Teacher not found');
    return;
  }

  if (!student) {
    console.log('Student not found');
    return;
  }

  // Check if profile already exists
  const existingProfile = await prisma.studentProfile.findFirst({
    where: { user_id: student.id }
  });

  if (existingProfile) {
    console.log('Profile already exists for this student');
    return;
  }

  // Create profile
  const profile = await prisma.studentProfile.create({
    data: {
      user_id: student.id,
      teacher_id: teacher.id,
      start_date: new Date(),
    }
  });

  console.log('Profile created successfully!');
  console.log('Student:', student.name);
  console.log('Teacher:', teacher.name);
  console.log('Profile ID:', profile.id);

  await prisma.$disconnect();
}

main().catch(console.error);
