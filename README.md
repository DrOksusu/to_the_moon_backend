# To The Moon Backend

Express + TypeScript + Prisma + MySQL 기반 백엔드 프로젝트

## 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL (AWS RDS)
- **File Storage**: AWS S3
- **Authentication**: JWT
- **Password Hashing**: bcrypt

## 프로젝트 구조

```
to_the_moon_backend/
├── src/
│   ├── config/              # 설정 파일
│   │   ├── database.ts      # Prisma 클라이언트
│   │   ├── s3.ts            # AWS S3 설정
│   │   └── jwt.ts           # JWT 설정
│   ├── controllers/         # 비즈니스 로직
│   │   ├── authController.ts
│   │   └── uploadController.ts
│   ├── middlewares/         # 미들웨어
│   │   ├── auth.ts          # JWT 인증
│   │   ├── upload.ts        # 파일 업로드
│   │   └── errorHandler.ts
│   ├── routes/              # 라우트 정의
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   └── uploadRoutes.ts
│   ├── types/               # TypeScript 타입 정의
│   │   ├── index.ts
│   │   └── express.d.ts
│   ├── utils/               # 유틸리티
│   │   ├── jwt.ts
│   │   └── bcrypt.ts
│   ├── app.ts               # Express 앱 설정
│   └── index.ts             # 엔트리 포인트
├── prisma/
│   └── schema.prisma        # Prisma 스키마
├── .env                     # 환경 변수 (git에서 제외)
├── .env.example             # 환경 변수 예시
├── tsconfig.json            # TypeScript 설정
└── package.json
```

## 시작하기

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정하세요.

```bash
cp .env.example .env
```

`.env` 파일에서 MySQL 데이터베이스 연결 정보를 수정하세요:

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
NODE_ENV=development
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 설정

Prisma 스키마에 모델을 정의한 후 마이그레이션을 실행하세요:

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# Prisma Studio 실행 (선택사항)
npm run prisma:studio
```

### 4. 개발 서버 실행

```bash
npm run dev
```

서버가 시작되면 `http://localhost:3000`에서 접근할 수 있습니다.

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행 (hot reload)
- `npm run build` - TypeScript 컴파일
- `npm start` - 프로덕션 서버 실행
- `npm run prisma:generate` - Prisma 클라이언트 생성
- `npm run prisma:migrate` - 데이터베이스 마이그레이션
- `npm run prisma:studio` - Prisma Studio 실행

## API 엔드포인트

### Health Check

```
GET /api/health
```

응답:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 인증 (Authentication)

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

응답:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### 현재 사용자 정보 조회
```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

### 파일 업로드 (AWS S3)

#### 단일 파일 업로드
```
POST /api/upload/single
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [file]
```

응답:
```json
{
  "success": true,
  "data": {
    "file": {
      "fieldName": "file",
      "originalName": "image.jpg",
      "filename": "uploads/1234567890-123456789.jpg",
      "mimetype": "image/jpeg",
      "size": 102400,
      "url": "https://bucket-name.s3.amazonaws.com/uploads/1234567890-123456789.jpg",
      "key": "uploads/1234567890-123456789.jpg"
    }
  }
}
```

#### 다중 파일 업로드 (최대 10개)
```
POST /api/upload/multiple
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

## Prisma 모델 예시

`prisma/schema.prisma` 파일에 모델을 정의하세요:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

모델을 정의한 후:

1. `npm run prisma:generate` - Prisma 클라이언트 재생성
2. `npm run prisma:migrate` - 마이그레이션 실행

## 개발 가이드

### 새로운 라우트 추가

1. `src/routes/` 디렉토리에 라우트 파일 생성
2. `src/routes/index.ts`에서 라우트 등록
3. 컨트롤러는 `src/controllers/` 디렉토리에 작성

### 인증이 필요한 엔드포인트 만들기

```typescript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/protected', authenticate, (req, res) => {
  // req.user에서 인증된 사용자 정보 접근 가능
  res.json({ user: req.user });
});
```

### 파일 업로드 기능 추가

```typescript
import { upload } from '../middlewares/upload';

router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  const file = req.file as Express.MulterS3.File;
  res.json({ url: file.location });
});
```

### 에러 처리

모든 에러는 `src/middlewares/errorHandler.ts`에서 처리됩니다.

## 보안 주의사항

⚠️ **중요**: 다음 설정을 프로덕션 환경에 배포하기 전에 반드시 변경하세요:

1. **JWT_SECRET**: 강력한 랜덤 문자열로 변경
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **AWS 자격 증명**: IAM 사용자의 최소 권한 원칙 적용
   - S3 버킷에 대한 PutObject, GetObject 권한만 부여
   - 액세스 키는 정기적으로 교체

3. **데이터베이스 비밀번호**: 강력한 비밀번호 사용

4. **.env 파일**: 절대 버전 관리에 포함하지 마세요

5. **CORS 설정**: 프로덕션에서는 허용된 도메인만 지정
   ```typescript
   // src/app.ts
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
   }));
   ```

## 환경 변수 설명

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | MySQL 연결 문자열 | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT 토큰 서명 키 | `your-secret-key` |
| `JWT_ACCESS_EXPIRY` | Access Token 만료 시간 | `1h`, `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh Token 만료 시간 | `7d`, `30d` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 액세스 키 | `...` |
| `S3_BUCKET_NAME` | S3 버킷 이름 | `my-bucket` |
| `MAX_FILE_SIZE` | 최대 파일 크기 (bytes) | `10485760` (10MB) |
| `ALLOWED_FILE_TYPES` | 허용 파일 타입 | `image/jpeg,image/png` |
