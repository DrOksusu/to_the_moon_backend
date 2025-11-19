# AWS App Runner 배포 실행 가이드

## ✅ 현재 상태 확인

### 이미 준비된 것들
- ✅ AWS RDS 데이터베이스 (to_the_moon)
- ✅ AWS S3 버킷 (koco-dental-files)
- ✅ GitHub Repository (https://github.com/DrOksusu/to_the_moon_backend.git)
- ✅ Dockerfile 및 배포 설정 파일

---

## 📋 App Runner 배포 단계별 가이드

### 1단계: AWS Console 로그인

1. AWS Console 접속: https://console.aws.amazon.com
2. 리전 확인: **서울 (ap-northeast-2)** 선택 (우측 상단)

---

### 2단계: App Runner 서비스 생성

#### 2-1. App Runner로 이동
1. AWS Console 검색창에 **"App Runner"** 입력
2. **AWS App Runner** 클릭
3. **서비스 생성** 버튼 클릭

#### 2-2. 소스 및 배포 구성

**리포지토리 유형:**
```
✓ 소스 코드 리포지토리 선택
```

**공급자:**
```
✓ GitHub 선택
```

**GitHub 연결:**
1. **GitHub에 연결** 버튼 클릭
2. GitHub 로그인 및 권한 승인
3. 리포지토리 선택:
   - Repository: `DrOksusu/to_the_moon_backend`
   - Branch: `master`

**배포 설정:**
```
✓ 자동 (권장) - 코드 푸시할 때마다 자동 배포
또는
○ 수동 - 수동으로 배포 트리거
```

**다음** 버튼 클릭

---

### 3단계: 빌드 설정

#### 3-1. 구성 방법 선택
```
✓ 여기에서 모든 설정 구성 (권장)
```

#### 3-2. 빌드 설정 입력

**런타임:**
```
Node.js 20
```

**빌드 명령:**
```bash
npm ci
npx prisma generate
npm run build
```

**시작 명령:**
```bash
node dist/index.js
```

**포트:**
```
3007
```

**다음** 버튼 클릭

---

### 4단계: 서비스 구성

#### 4-1. 서비스 이름
```
서비스 이름: to-the-moon-backend
```

#### 4-2. CPU 및 메모리
```
vCPU: 1
메모리: 2 GB
```

#### 4-3. 환경 변수 추가

**중요: 다음 환경 변수들을 정확히 입력하세요**

**환경 변수 추가** 버튼을 클릭하고 아래 항목들을 하나씩 추가:

| 이름 | 값 | 유형 |
|------|-----|------|
| `DATABASE_URL` | `.env` 파일의 값 사용 | 일반 텍스트 |
| `NODE_ENV` | `production` | 일반 텍스트 |
| `PORT` | `3007` | 일반 텍스트 |
| `JWT_SECRET` | `.env` 파일의 값 사용 | 보안 문자열 |
| `JWT_ACCESS_EXPIRY` | `1h` | 일반 텍스트 |
| `JWT_REFRESH_EXPIRY` | `7d` | 일반 텍스트 |
| `AWS_REGION` | `ap-northeast-2` | 일반 텍스트 |
| `AWS_ACCESS_KEY_ID` | `.env` 파일의 값 사용 | 보안 문자열 |
| `AWS_SECRET_ACCESS_KEY` | `.env` 파일의 값 사용 | 보안 문자열 |
| `S3_BUCKET_NAME` | `.env` 파일의 값 사용 | 일반 텍스트 |
| `MAX_FILE_SIZE` | `10485760` | 일반 텍스트 |
| `ALLOWED_FILE_TYPES` | `image/jpeg,image/png,image/svg+xml` | 일반 텍스트 |

**⚠️ 중요:** 실제 값은 로컬 `.env` 파일을 참조하세요. 보안을 위해 실제 자격 증명은 문서에 기록하지 않습니다.

⚠️ **주의사항:**
- 민감한 정보 (JWT_SECRET, AWS 자격 증명)는 **보안 문자열** 유형으로 선택
- DATABASE_URL은 특수문자(`!`)가 포함되어 있으므로 정확히 복사
- 띄어쓰기나 줄바꿈 없이 입력

#### 4-4. 자동 조정 구성
```
최소 인스턴스: 1
최대 인스턴스: 3
동시성: 100
```

---

### 5단계: 상태 확인 설정

```
프로토콜: HTTP
경로: /api/health
간격: 10초
제한 시간: 5초
비정상 임계값: 3
정상 임계값: 1
```

---

### 6단계: 네트워킹 구성

```
송신 네트워크 구성: 퍼블릭 엔드포인트
```
(RDS가 퍼블릭 액세스 가능하므로 이 옵션 선택)

---

### 7단계: 태그 추가 (선택사항)

```
키: Environment
값: Production

키: Project
값: ToTheMoon
```

---

### 8단계: 검토 및 생성

1. 모든 설정 확인
2. **생성 및 배포** 버튼 클릭
3. 배포 진행 상황 확인 (약 5-10분 소요)

---

## 🔍 배포 진행 상황 확인

### 배포 단계
1. **프로비저닝** - 인프라 준비
2. **빌드 중** - Docker 이미지 빌드
3. **배포 중** - 서비스 배포
4. **실행 중** - 서비스 가동 ✅

### 로그 확인
1. App Runner 서비스 페이지에서 **로그** 탭 클릭
2. **배포 로그** 또는 **애플리케이션 로그** 확인

---

## 🌐 서비스 URL 확인 및 테스트

### 1. 서비스 URL 확인
배포 완료 후:
1. App Runner 콘솔 → 서비스 선택
2. **개요** 탭에서 **기본 도메인** 복사
   ```
   예시: https://abc123xyz.ap-northeast-2.awsapprunner.com
   ```

### 2. 헬스체크 테스트

**브라우저에서:**
```
https://your-service-url.awsapprunner.com/api/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### 3. API 테스트

#### 회원가입 테스트
```bash
curl -X POST https://your-service-url.awsapprunner.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 선생님",
    "email": "teacher@test.com",
    "password": "password123",
    "phone": "010-1234-5678",
    "role": "teacher"
  }'
```

#### 로그인 테스트
```bash
curl -X POST https://your-service-url.awsapprunner.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123",
    "role": "teacher"
  }'
```

---

## 🗄️ 데이터베이스 마이그레이션

### 방법 1: 로컬에서 프로덕션 DB로 마이그레이션

1. 로컬 `.env` 파일 백업
2. `.env` 파일의 `DATABASE_URL`이 프로덕션 DB를 가리키는지 확인
3. 마이그레이션 실행:

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 배포
npx prisma migrate deploy

# Prisma Client 재생성
npx prisma generate
```

### 방법 2: 데이터베이스 확인

```bash
# Prisma Studio로 데이터 확인
npx prisma studio
```

브라우저에서 http://localhost:5555 열림

---

## 🔧 환경 변수 수정 방법

배포 후 환경 변수를 변경해야 하는 경우:

1. App Runner 콘솔 → 서비스 선택
2. **구성** 탭 클릭
3. **환경 변수** 섹션에서 **편집** 클릭
4. 변수 추가/수정/삭제
5. **저장** 클릭
6. 자동으로 **새 배포** 시작됨

---

## ⚠️ 트러블슈팅

### 배포 실패 시

#### 1. 빌드 오류
**증상:** 빌드 단계에서 실패
**해결:**
- **로그 탭** → **배포 로그** 확인
- `npm ci` 실패: package.json 확인
- Prisma 오류: DATABASE_URL 확인

#### 2. 서비스 시작 실패
**증상:** 빌드 성공했지만 서비스 실행 안됨
**해결:**
- **애플리케이션 로그** 확인
- 데이터베이스 연결 오류 확인
- 환경 변수 누락 확인

#### 3. 데이터베이스 연결 실패
**증상:** `Error: Can't reach database server`
**확인 사항:**
1. RDS 보안 그룹 설정
   - RDS 콘솔 → 데이터베이스 선택
   - **연결 & 보안** → VPC 보안 그룹 클릭
   - **인바운드 규칙** 확인: 포트 3306이 `0.0.0.0/0` 또는 App Runner IP에서 허용되어야 함

2. DATABASE_URL 형식 확인
   ```
   mysql://사용자명:암호@엔드포인트:3306/데이터베이스명?charset=utf8mb4
   ```

3. RDS 퍼블릭 액세스 확인
   - RDS 콘솔 → 데이터베이스 선택
   - **연결 & 보안** → **퍼블릭 액세스 가능성**: "예"여야 함

#### 4. S3 업로드 실패
**증상:** 파일 업로드 시 Access Denied
**해결:**
- AWS_ACCESS_KEY_ID 확인
- AWS_SECRET_ACCESS_KEY 확인
- IAM 사용자 권한 확인 (S3FullAccess 필요)

---

## 📊 모니터링

### CloudWatch 로그 확인
1. CloudWatch 콘솔 열기
2. **로그 그룹** → `/aws/apprunner/to-the-moon-backend` 검색
3. 실시간 로그 스트림 확인

### 메트릭 확인
App Runner 콘솔:
- **메트릭** 탭
- CPU, 메모리, 요청 수 확인

---

## 🔄 재배포 방법

### 자동 배포 (설정한 경우)
```bash
# 코드 변경 후 GitHub에 푸시
git add .
git commit -m "Update feature"
git push origin master
```
→ App Runner가 자동으로 새 배포 시작

### 수동 배포
1. App Runner 콘솔 → 서비스 선택
2. **새 배포** 버튼 클릭
3. 배포 완료 대기

---

## 💰 예상 비용

### App Runner
- 기본 요금: 시간당 약 $0.007 (1 vCPU, 2 GB)
- 예상 월 비용: 약 $5-15 (사용량에 따라 다름)
- 프리 티어: 월 $5 크레딧 제공

### RDS (이미 실행 중)
- 인스턴스 유형에 따라 청구

### S3 (이미 사용 중)
- 스토리지 및 요청 수에 따라 청구

---

## ✅ 배포 후 확인 사항

- [ ] 헬스체크 엔드포인트 정상 작동
- [ ] 회원가입 API 테스트
- [ ] 로그인 API 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 파일 업로드 테스트 (S3)
- [ ] 로그 모니터링 설정

---

## 🌟 다음 단계

1. **커스텀 도메인 연결**
   - 도메인이 있다면 App Runner에 연결 가능
   - Route 53 또는 다른 DNS 공급자 사용

2. **HTTPS 설정**
   - App Runner는 기본적으로 HTTPS 제공
   - 커스텀 도메인 연결 시 인증서 자동 발급

3. **프론트엔드 연결**
   - App Runner URL을 프론트엔드 API_URL로 설정

---

## 📞 지원

문제 발생 시:
1. App Runner 로그 확인
2. CloudWatch 로그 확인
3. 환경 변수 재확인
4. 데이터베이스 연결 테스트

---

## 📚 참고 자료

- [AWS App Runner 공식 문서](https://docs.aws.amazon.com/apprunner/)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment/deployment-guides)
