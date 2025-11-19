import 'dotenv/config';
import prisma from './src/config/database';

async function testConnection() {
  try {
    console.log('🔍 VocalStudio 데이터베이스 연결 테스트 중...\n');

    // 데이터베이스 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 테이블 존재 확인
    console.log('📊 데이터베이스 테이블 확인:\n');

    // 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}명`);

    // 학생 프로필 수 확인
    const profileCount = await prisma.studentProfile.count();
    console.log(`📝 Student Profiles: ${profileCount}개`);

    // 레슨 수 확인
    const lessonCount = await prisma.lesson.count();
    console.log(`📚 Lessons: ${lessonCount}개`);

    // 피드백 수 확인
    const feedbackCount = await prisma.feedback.count();
    console.log(`💬 Feedbacks: ${feedbackCount}개`);

    // 파일 수 확인
    const fileCount = await prisma.file.count();
    console.log(`📁 Files: ${fileCount}개\n`);

    console.log('✅ 모든 테이블이 정상적으로 생성되었습니다!');
    console.log('\n🎉 API 명세서에 맞는 데이터베이스 구조가 준비되었습니다.');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
