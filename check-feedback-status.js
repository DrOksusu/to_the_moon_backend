const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFeedbackStatus() {
  try {
    // 완료된 레슨 조회
    const completedLessons = await prisma.lessons.findMany({
      where: { status: 'completed' },
      include: {
        feedbacks: true,
        users_lessons_student_idTousers: {
          select: { name: true }
        }
      },
      orderBy: { scheduled_at: 'desc' }
    });

    console.log('\n=== 완료된 레슨 현황 ===');
    console.log(`총 완료된 레슨: ${completedLessons.length}개`);

    const withoutFeedback = completedLessons.filter(l => !l.feedbacks);
    console.log(`피드백 없는 레슨: ${withoutFeedback.length}개\n`);

    console.log('피드백이 필요한 레슨:');
    withoutFeedback.forEach((lesson, index) => {
      const date = new Date(lesson.scheduled_at);
      console.log(`${index + 1}. ${lesson.users_lessons_student_idTousers.name} - ${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkFeedbackStatus();
