const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminPhone() {
  try {
    // 문정은 관리자의 전화번호 업데이트
    const result = await prisma.users.update({
      where: { email: 'wjddms2767@naver.com' },
      data: {
        phone: '01050282767',
        updated_at: new Date()
      },
    });

    console.log('✅ 관리자 전화번호가 업데이트되었습니다:');
    console.log('이메일:', result.email);
    console.log('이름:', result.name);
    console.log('전화번호:', result.phone);
    console.log('역할:', result.role);
    console.log('관리자:', result.is_admin);
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPhone();
