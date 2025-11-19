@echo off
REM Production Database Migration Script (Windows)
REM 프로덕션 데이터베이스 마이그레이션 스크립트 (Windows)

echo ================================================
echo 🚀 To The Moon Backend - Production Migration
echo ================================================
echo.

echo 📌 Step 1: Checking migration status...
call npx prisma migrate status

echo.
echo 📌 Step 2: Deploying migrations to production...
call npx prisma migrate deploy

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migrations deployed successfully!
    echo.
    echo 📌 Step 3: Generating Prisma Client...
    call npx prisma generate

    if %errorlevel% equ 0 (
        echo.
        echo ================================================
        echo ✅ Production migration completed successfully!
        echo ================================================
        echo.
        echo Next steps:
        echo 1. Open Prisma Studio to verify: npx prisma studio
        echo 2. Or run seed data: npm run prisma:seed
    ) else (
        echo.
        echo ❌ Failed to generate Prisma Client
        exit /b 1
    )
) else (
    echo.
    echo ❌ Migration failed. Please check the error above.
    exit /b 1
)

pause
