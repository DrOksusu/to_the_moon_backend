const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const profiles = await prisma.student_profiles.findMany({
      include: {
        users_student_profiles_user_idTousers: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        users_student_profiles_teacher_idTousers: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    console.log('\n=== Student Profiles ===');
    console.log('Total profiles:', profiles.length);
    console.log('\n');

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Student: ${profile.users_student_profiles_user_idTousers.name}`);
      console.log(`   Phone: ${profile.users_student_profiles_user_idTousers.phone}`);
      console.log(`   Teacher: ${profile.users_student_profiles_teacher_idTousers.name}`);
      console.log(`   Voice Type: ${profile.voice_type || 'Not set'}`);
      console.log(`   Level: ${profile.level || 'Not set'}`);
      console.log(`   Active: ${profile.is_active}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
