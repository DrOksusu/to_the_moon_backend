const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 옥동자(옥용주) 사용자 찾기
    const user = await prisma.users.findFirst({
      where: {
        phone: '01023456666'
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.name, user.phone);

    // 학생 프로필 업데이트 - 활성화 및 정보 추가
    const profile = await prisma.student_profiles.update({
      where: {
        user_id: user.id
      },
      data: {
        is_active: true,
        voice_type: 'Soprano',
        level: 'Beginner',
        goals: '노래 실력 향상'
      }
    });

    console.log('\n✅ Student profile activated!');
    console.log('Profile:', profile);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
