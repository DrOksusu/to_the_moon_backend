import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 중...\n');

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 선생님 계정 생성
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@vocalstudio.com',
      name: '김선생',
      password: hashedPassword,
      role: 'teacher',
      phone: '010-1234-5678',
    },
  });
  console.log('✅ 선생님 계정 생성:', teacher.email);

  // 학생 계정 1
  const student1 = await prisma.user.create({
    data: {
      email: 'student@vocalstudio.com',
      name: '이학생',
      password: hashedPassword,
      role: 'student',
      phone: '010-2345-6789',
    },
  });
  console.log('✅ 학생 계정 1 생성:', student1.email);

  // 학생 계정 2
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@vocalstudio.com',
      name: '박학생',
      password: hashedPassword,
      role: 'student',
      phone: '010-3456-7890',
    },
  });
  console.log('✅ 학생 계정 2 생성:', student2.email);

  // 학생 프로필 1
  void await prisma.studentProfile.create({
    data: {
      user_id: student1.id,
      teacher_id: teacher.id,
      voice_type: 'Soprano',
      level: 'Intermediate',
      start_date: new Date('2024-01-15'),
      goals: '팝송 마스터하기',
    },
  });
  console.log('✅ 학생 프로필 1 생성');

  // 학생 프로필 2
  void await prisma.studentProfile.create({
    data: {
      user_id: student2.id,
      teacher_id: teacher.id,
      voice_type: 'Tenor',
      level: 'Beginner',
      start_date: new Date('2024-02-01'),
      goals: '뮤지컬 오디션 준비',
    },
  });
  console.log('✅ 학생 프로필 2 생성');

  // 완료된 수업 1
  const lesson1 = await prisma.lesson.create({
    data: {
      teacher_id: teacher.id,
      student_id: student1.id,
      title: '발성 기초',
      scheduled_at: new Date('2024-03-01T14:00:00'),
      duration: 60,
      status: 'completed',
      location: '스튜디오 A',
      notes: '호흡 연습 집중',
    },
  });
  console.log('✅ 레슨 1 생성');

  // 완료된 수업 2
  const lesson2 = await prisma.lesson.create({
    data: {
      teacher_id: teacher.id,
      student_id: student1.id,
      title: '고음 연습',
      scheduled_at: new Date('2024-03-08T14:00:00'),
      duration: 60,
      status: 'completed',
      location: '스튜디오 A',
      notes: '고음역대 강화',
    },
  });
  console.log('✅ 레슨 2 생성');

  // 예정된 수업
  void await prisma.lesson.create({
    data: {
      teacher_id: teacher.id,
      student_id: student2.id,
      title: '첫 수업',
      scheduled_at: new Date('2024-12-20T15:00:00'),
      duration: 60,
      status: 'scheduled',
      location: '스튜디오 B',
      notes: '레벨 테스트 및 목표 설정',
    },
  });
  console.log('✅ 레슨 3 생성');

  // 피드백 1
  void await prisma.feedback.create({
    data: {
      lesson_id: lesson1.id,
      teacher_id: teacher.id,
      student_id: student1.id,
      rating: 5,
      content: '매우 좋은 진전이 있었습니다. 호흡 조절이 많이 개선되었어요.',
      strengths: '고음 처리가 안정적',
      improvements: '저음역대 공명 개선 필요',
      homework: '매일 30분 발성 연습',
    },
  });
  console.log('✅ 피드백 1 생성');

  // 피드백 2
  void await prisma.feedback.create({
    data: {
      lesson_id: lesson2.id,
      teacher_id: teacher.id,
      student_id: student1.id,
      rating: 4,
      content: '고음역대가 많이 좋아졌습니다. 계속 연습하면 더 발전할 수 있어요.',
      strengths: '음색이 깨끗해짐',
      improvements: '고음에서 긴장 풀기',
      homework: '고음 스케일 연습',
    },
  });
  console.log('✅ 피드백 2 생성');

  console.log('\n🎉 시드 데이터 생성 완료!');
  console.log('\n📊 생성된 데이터:');
  console.log('- 선생님: 1명 (teacher@vocalstudio.com)');
  console.log('- 학생: 2명 (student@vocalstudio.com, student2@vocalstudio.com)');
  console.log('- 학생 프로필: 2개');
  console.log('- 레슨: 3개 (완료 2개, 예정 1개)');
  console.log('- 피드백: 2개');
  console.log('\n🔑 모든 계정 비밀번호: password123');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
