# AWS App Runner 배포 가이드

## 목차
1. [사전 준비](#사전-준비)
2. [AWS RDS 데이터베이스 설정](#aws-rds-데이터베이스-설정)
3. [AWS S3 버킷 설정](#aws-s3-버킷-설정)
4. [GitHub Repository 연결](#github-repository-연결)
5. [AWS App Runner 서비스 생성](#aws-app-runner-서비스-생성)
6. [환경 변수 설정](#환경-변수-설정)
7. [배포 확인](#배포-확인)
8. [트러블슈팅](#트러블슈팅)

---

## 사전 준비

### 필요한 것들
- ✅ AWS 계정
- ✅ GitHub 계정 (코드가 이미 푸시됨: https://github.com/DrOksusu/to_the_moon_backend.git)
- ✅ AWS CLI 설치 (선택사항)

---

## AWS RDS 데이터베이스 설정

### 1. RDS 콘솔 접속
1. AWS Console → **RDS** 검색 → **RDS 대시보드** 이동
2. **데이터베이스 생성** 클릭

### 2. 데이터베이스 설정

#### 기본 설정
```
엔진 유형: MySQL
버전: MySQL 8.0.x (최신 버전)
템플릿: 프리 티어 (테스트용) 또는 프로덕션
```

#### 설정
```
DB 인스턴스 식별자: to-the-moon-db (원하는 이름)
마스터 사용자 이름: admin (또는 원하는 이름)
마스터 암호: [안전한 암호 설정] (최소 8자)
```

#### 인스턴스 구성
```
프리 티어 사용 시:
- db.t3.micro (또는 db.t4g.micro)

프로덕션 사용 시:
- db.t3.small 이상 권장
```

#### 스토리지
```
스토리지 유형: 범용 SSD (gp3)
할당된 스토리지: 20 GB (시작용)
스토리지 자동 조정: 활성화 (선택사항)
```

#### 연결
```
VPC: 기본 VPC 선택
퍼블릭 액세스: 예 (App Runner에서 접근하려면 필요)
VPC 보안 그룹: 새로 생성 또는 기존 그룹 선택
```

#### 데이터베이스 인증
```
데이터베이스 인증 옵션: 암호 인증
```

#### 추가 구성
```
초기 데이터베이스 이름: vocalstudio (중요!)
포트: 3306 (기본값)
백업 보존 기간: 7일 (권장)
```

### 3. 보안 그룹 설정

데이터베이스 생성 후:
1. **RDS 대시보드** → 생성한 DB 클릭
2. **연결 & 보안** 탭에서 **VPC 보안 그룹** 클릭
3. **인바운드 규칙 편집** 클릭
4. 규칙 추가:
   ```
   유형: MySQL/Aurora
   프로토콜: TCP
   포트 범위: 3306
   소스: 0.0.0.0/0 (테스트용) 또는 App Runner IP 범위 (프로덕션)
   ```
   ⚠️ **프로덕션**: `0.0.0.0/0`은 보안상 위험하니 App Runner VPC로 제한 권장

### 4. 데이터베이스 엔드포인트 확인

생성 완료 후 (약 5-10분 소요):
1. **RDS 대시보드** → 생성한 DB 클릭
2. **연결 & 보안** 탭에서 **엔드포인트** 복사
   ```
   예: to-the-moon-db.abcdefghijk.ap-northeast-2.rds.amazonaws.com
   ```

### 5. DATABASE_URL 생성

다음 형식으로 DATABASE_URL을 만듭니다:
```
mysql://[사용자명]:[암호]@[엔드포인트]:3306/[데이터베이스명]?charset=utf8mb4

예시:
mysql://admin:MySecurePassword123@to-the-moon-db.abcdefghijk.ap-northeast-2.rds.amazonaws.com:3306/vocalstudio?charset=utf8mb4
```

---

## AWS S3 버킷 설정

### 1. S3 콘솔 접속
1. AWS Console → **S3** 검색 → **S3 대시보드** 이동
2. **버킷 만들기** 클릭

### 2. 버킷 설정
```
버킷 이름: to-the-moon-files (고유한 이름 필요)
AWS 리전: ap-northeast-2 (서울)
객체 소유권: ACL 비활성화됨 (권장)
퍼블릭 액세스 차단: 모두 차단 해제 (또는 필요에 따라 설정)
버킷 버전 관리: 비활성화 (선택사항)
```

### 3. CORS 설정

버킷 생성 후:
1. 생성한 버킷 클릭
2. **권한** 탭 → **CORS(Cross-Origin Resource Sharing)** → **편집**
3. 다음 설정 추가:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### 4. IAM 사용자 생성 (S3 액세스용)

1. AWS Console → **IAM** 검색
2. **사용자** → **사용자 추가**
3. 사용자 이름: `to-the-moon-s3-user`
4. **액세스 키 - 프로그래밍 방식 액세스** 선택
5. **권한 설정** → **기존 정책 직접 연결**
6. `AmazonS3FullAccess` 검색 후 선택 (또는 특정 버킷만 접근 가능한 커스텀 정책)
7. 사용자 생성 완료 후 **액세스 키 ID**와 **비밀 액세스 키** 복사 (⚠️ 한 번만 표시됨!)

---

## GitHub Repository 연결

코드가 이미 GitHub에 푸시되어 있습니다:
```
https://github.com/DrOksusu/to_the_moon_backend.git
```

App Runner는 이 저장소를 자동으로 연결하고 배포합니다.

---

## AWS App Runner 서비스 생성

### 1. App Runner 콘솔 접속
1. AWS Console → **App Runner** 검색
2. **서비스 생성** 클릭

### 2. 소스 구성

#### 소스 유형 선택
```
리포지토리 유형: 소스 코드 리포지토리
리포지토리 공급자: GitHub
```

#### GitHub 연결
1. **GitHub에 연결** 클릭
2. GitHub 인증 완료
3. 리포지토리 선택: `DrOksusu/to_the_moon_backend`
4. 브랜치: `master`

#### 배포 설정
```
배포 트리거: 자동 (커밋할 때마다 자동 배포)
또는
수동 (수동으로 배포 트리거)
```

### 3. 빌드 설정

#### 구성 파일 사용
```
방법 1: 구성 파일 사용
- "구성 파일 사용" 선택
- 파일 경로: apprunner.yaml

방법 2: 직접 구성 (권장)
- "여기에서 모든 설정 구성" 선택
- 런타임: Node.js 20
- 빌드 명령:
  npm ci
  npx prisma generate
  npm run build

- 시작 명령: node dist/index.js
- 포트: 3007
```

### 4. 서비스 설정

#### 서비스 이름
```
서비스 이름: to-the-moon-backend
```

#### 인스턴스 구성
```
CPU: 1 vCPU
메모리: 2 GB
```

#### 환경 변수 (다음 섹션에서 설정)

#### 자동 조정
```
최소 인스턴스: 1
최대 인스턴스: 3 (트래픽에 따라 조정)
동시성: 100 (인스턴스당 동시 요청 수)
```

#### 상태 확인
```
프로토콜: HTTP
경로: /api/health
간격: 10초
제한 시간: 5초
비정상 임계값: 3
정상 임계값: 1
```

### 5. 네트워킹
```
송신 네트워크 구성: 퍼블릭 엔드포인트 (RDS 퍼블릭 액세스 시)
```

---

## 환경 변수 설정

App Runner 서비스 생성 중 **환경 변수** 섹션에서 다음 변수들을 추가:

### 필수 환경 변수

#### 데이터베이스 설정
```
이름: DATABASE_URL
값: mysql://admin:암호@엔드포인트:3306/vocalstudio?charset=utf8mb4

이름: NODE_ENV
값: production

이름: PORT
값: 3007
```

#### JWT 설정
```
이름: JWT_SECRET
값: [32자 이상의 랜덤 문자열 생성]
생성 방법: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

이름: JWT_ACCESS_EXPIRY
값: 1h

이름: JWT_REFRESH_EXPIRY
값: 7d
```

#### AWS S3 설정
```
이름: AWS_REGION
값: ap-northeast-2

이름: AWS_ACCESS_KEY_ID
값: [IAM 사용자의 액세스 키 ID]

이름: AWS_SECRET_ACCESS_KEY
값: [IAM 사용자의 비밀 액세스 키]

이름: S3_BUCKET_NAME
값: to-the-moon-files (생성한 버킷 이름)
```

#### 파일 업로드 설정
```
이름: MAX_FILE_SIZE
값: 10485760

이름: ALLOWED_FILE_TYPES
값: image/jpeg,image/png,image/svg+xml
```

### 환경 변수 추가 방법

App Runner 콘솔에서:
1. **구성** 탭 → **환경 변수** → **편집**
2. 각 변수를 **일반 텍스트** 또는 **보안 문자열**(민감한 정보)로 추가
3. 변경 사항 저장

---

## 배포 확인

### 1. 배포 진행 상황 확인
1. App Runner 콘솔에서 서비스 선택
2. **배포** 탭에서 진행 상황 확인
3. 배포 완료까지 약 5-10분 소요

### 2. 서비스 URL 확인
배포 완료 후:
1. **개요** 탭에서 **기본 도메인** 확인
   ```
   예: https://abcdefgh.ap-northeast-2.awsapprunner.com
   ```

### 3. 헬스체크 테스트
브라우저 또는 curl로 테스트:
```bash
curl https://your-app-url.awsapprunner.com/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### 4. 데이터베이스 마이그레이션

**중요**: 처음 배포 시 데이터베이스 테이블이 생성되어 있지 않습니다.

#### 로컬에서 마이그레이션 실행:

1. `.env` 파일에 프로덕션 DATABASE_URL 설정
2. 마이그레이션 실행:
```bash
npx prisma migrate deploy
```

또는

3. Prisma Studio로 확인:
```bash
npx prisma studio
```

#### 시드 데이터 추가 (선택사항):
```bash
npm run prisma:seed
```

---

## API 테스트

### 1. 회원가입 테스트
```bash
curl -X POST https://your-app-url.awsapprunner.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 선생님",
    "email": "teacher@test.com",
    "password": "password123",
    "phone": "010-1234-5678",
    "role": "teacher"
  }'
```

### 2. 로그인 테스트
```bash
curl -X POST https://your-app-url.awsapprunner.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123",
    "role": "teacher"
  }'
```

---

## 트러블슈팅

### 배포 실패

#### 1. 빌드 오류
- **로그 확인**: App Runner 콘솔 → **로그** 탭
- **일반적인 원인**:
  - `package.json` 오류
  - Prisma 생성 실패
  - TypeScript 컴파일 오류

#### 2. 데이터베이스 연결 실패
- **확인 사항**:
  - DATABASE_URL 형식이 올바른가?
  - RDS 보안 그룹에서 3306 포트 허용되었나?
  - RDS 퍼블릭 액세스가 활성화되었나?
  - 사용자명/암호가 정확한가?

#### 3. 환경 변수 문제
- App Runner 콘솔에서 환경 변수 다시 확인
- 특수 문자가 포함된 경우 URL 인코딩 필요할 수 있음

### 로그 확인 방법

App Runner 콘솔:
1. 서비스 선택
2. **로그** 탭
3. **애플리케이션 로그** 또는 **배포 로그** 확인

### 재배포

변경사항 적용 후:
1. GitHub에 코드 푸시
2. 자동 배포 활성화한 경우: 자동으로 배포
3. 수동 배포 설정한 경우: App Runner 콘솔에서 **새 배포** 클릭

---

## 비용 관리

### App Runner 비용
- vCPU 및 메모리 사용량에 따라 청구
- 프리 티어: 월 $5 USD 크레딧 제공
- 예상 비용: 월 $15-30 (1 vCPU, 2 GB, 상시 가동 시)

### RDS 비용
- 프리 티어: 12개월 동안 db.t3.micro 750시간/월 무료
- 프로덕션: 인스턴스 유형과 스토리지에 따라 청구

### S3 비용
- 프리 티어: 12개월 동안 5GB 스토리지 무료
- 스토리지 및 요청 수에 따라 청구

---

## 보안 권장사항

1. **환경 변수**: 민감한 정보는 **보안 문자열**로 저장
2. **RDS 보안 그룹**: 프로덕션에서는 App Runner VPC만 허용
3. **CORS**: S3와 API 모두 필요한 도메인만 허용
4. **JWT_SECRET**: 충분히 긴 랜덤 문자열 사용
5. **데이터베이스 암호**: 복잡한 암호 사용

---

## 다음 단계

1. **커스텀 도메인 연결**:
   - App Runner 콘솔 → **커스텀 도메인**
   - Route 53 또는 다른 DNS 공급자에서 설정

2. **HTTPS 활성화**:
   - App Runner는 기본적으로 HTTPS 제공

3. **모니터링 설정**:
   - CloudWatch로 로그 및 메트릭 모니터링
   - 알람 설정

4. **CI/CD 개선**:
   - GitHub Actions로 테스트 자동화
   - 스테이징 환경 구성

---

## 참고 자료

- [AWS App Runner 공식 문서](https://docs.aws.amazon.com/apprunner/)
- [Prisma 마이그레이션 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [AWS RDS 보안 그룹 설정](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)
