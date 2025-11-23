const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserData() {
  try {
    const userIds = [
      '24ac196c-d5f0-4565-9ff1-fdf8f2ea8339', // 01090184192@tothemoon.com
      'abb882b1-a9de-4c73-a02c-57072e86b67c', // ok4192@hanmail.net
    ];

    for (const userId of userIds) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          student_profiles_student_profiles_user_idTousers: true,
          lessons_lessons_student_idTousers: true,
          feedbacks_feedbacks_student_idTousers: true,
        },
      });

      console.log(`\n========================================`);
      console.log(`사용자: ${user.name} (${user.email})`);
      console.log(`ID: ${user.id}`);
      console.log(`전화번호: ${user.phone}`);
      console.log(`생성일: ${user.created_at}`);
      console.log(`----------------------------------------`);
      console.log(`프로필: ${user.student_profiles_student_profiles_user_idTousers ? '있음' : '없음'}`);
      if (user.student_profiles_student_profiles_user_idTousers) {
        const profile = user.student_profiles_student_profiles_user_idTousers;
        console.log(`  - 선생님 ID: ${profile.teacher_id}`);
        console.log(`  - 시작일: ${profile.start_date}`);
        console.log(`  - 레벨: ${profile.level || '없음'}`);
      }
      console.log(`레슨 수: ${user.lessons_lessons_student_idTousers.length}`);
      console.log(`피드백 수: ${user.feedbacks_feedbacks_student_idTousers.length}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
