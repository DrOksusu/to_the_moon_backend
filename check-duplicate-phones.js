const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicatePhones() {
  try {
    // 모든 사용자의 전화번호 조회
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    console.log('총 사용자 수:', users.length);

    // 전화번호가 있는 사용자만 필터링
    const usersWithPhone = users.filter(u => u.phone);
    console.log('전화번호가 있는 사용자 수:', usersWithPhone.length);

    // 전화번호별로 그룹화
    const phoneGroups = {};
    usersWithPhone.forEach(user => {
      if (!phoneGroups[user.phone]) {
        phoneGroups[user.phone] = [];
      }
      phoneGroups[user.phone].push(user);
    });

    // 중복된 전화번호 찾기
    const duplicates = Object.entries(phoneGroups).filter(([phone, users]) => users.length > 1);

    if (duplicates.length > 0) {
      console.log('\n⚠️  중복된 전화번호 발견:');
      duplicates.forEach(([phone, users]) => {
        console.log(`\n전화번호: ${phone}`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, 이름: ${user.name}, 이메일: ${user.email}`);
        });
      });
    } else {
      console.log('\n✅ 중복된 전화번호가 없습니다!');
    }

    // NULL 또는 빈 전화번호 확인
    const nullPhones = users.filter(u => !u.phone);
    console.log(`\n전화번호가 없는 사용자 수: ${nullPhones.length}`);
    if (nullPhones.length > 0 && nullPhones.length <= 10) {
      console.log('전화번호가 없는 사용자:');
      nullPhones.forEach(user => {
        console.log(`  - ID: ${user.id}, 이름: ${user.name}, 이메일: ${user.email}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicatePhones();
