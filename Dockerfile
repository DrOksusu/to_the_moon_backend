# Stage 1: Build
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./
COPY prisma ./prisma/

# 의존성 설치 (devDependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# TypeScript 빌드
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# package.json 복사
COPY package*.json ./
COPY prisma ./prisma/

# 프로덕션 의존성만 설치
RUN npm ci --only=production

# Prisma Client 생성 (프로덕션용)
RUN npx prisma generate

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 포트 노출 (App Runner는 환경변수 PORT 사용)
EXPOSE 3007

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3007) + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "dist/index.js"]
