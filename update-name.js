const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 전화번호로 사용자 찾기
    const user = await prisma.users.update({
      where: {
        phone: '01023456666'
      },
      data: {
        name: '옥용주'
      }
    });

    console.log('✅ 이름 변경 완료!');
    console.log('변경 후:', user.name);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
