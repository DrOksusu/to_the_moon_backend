const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDuplicateAccount() {
  try {
    const userId = 'abb882b1-a9de-4c73-a02c-57072e86b67c'; // ok4192@hanmail.net

    // 삭제 전 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        student_profiles_student_profiles_user_idTousers: true,
        lessons_lessons_student_idTousers: true,
        feedbacks_feedbacks_student_idTousers: true,
      },
    });

    if (!user) {
      console.log('사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('삭제할 사용자:');
    console.log(`  이름: ${user.name}`);
    console.log(`  이메일: ${user.email}`);
    console.log(`  전화번호: ${user.phone}`);
    console.log(`  레슨 수: ${user.lessons_lessons_student_idTousers.length}`);
    console.log(`  피드백 수: ${user.feedbacks_feedbacks_student_idTousers.length}`);
    console.log(`  프로필: ${user.student_profiles_student_profiles_user_idTousers ? '있음' : '없음'}`);

    // 삭제 실행
    console.log('\n계정 삭제 중...');
    await prisma.users.delete({
      where: { id: userId },
    });

    console.log('✅ 계정이 성공적으로 삭제되었습니다.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateAccount();
