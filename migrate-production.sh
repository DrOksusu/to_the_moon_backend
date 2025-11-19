#!/bin/bash

# Production Database Migration Script
# 프로덕션 데이터베이스 마이그레이션 스크립트

echo "================================================"
echo "🚀 To The Moon Backend - Production Migration"
echo "================================================"
echo ""

# 현재 DATABASE_URL 확인
echo "📌 Step 1: Checking DATABASE_URL..."
if grep -q "ls-1ec41c8ce559af427653b60e97baaa3f70f60df3.c0zy4csz1exi.ap-northeast-2.rds.amazonaws.com" .env; then
    echo "✅ Production DATABASE_URL detected"
else
    echo "⚠️  Warning: DATABASE_URL might not be pointing to production"
    echo "Please check your .env file"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📌 Step 2: Checking migration status..."
npx prisma migrate status

echo ""
echo "📌 Step 3: Deploying migrations to production..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations deployed successfully!"
    echo ""
    echo "📌 Step 4: Generating Prisma Client..."
    npx prisma generate

    if [ $? -eq 0 ]; then
        echo ""
        echo "================================================"
        echo "✅ Production migration completed successfully!"
        echo "================================================"
        echo ""
        echo "Next steps:"
        echo "1. Open Prisma Studio to verify: npx prisma studio"
        echo "2. Or run seed data: npm run prisma:seed"
    else
        echo ""
        echo "❌ Failed to generate Prisma Client"
        exit 1
    fi
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
