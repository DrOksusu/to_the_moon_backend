# AWS App Runner 배포 가이드 (GitHub Actions + ECR)

이 가이드는 GitHub Actions를 사용하여 Docker 이미지를 ECR에 푸시하고, App Runner에서 실행하는 방법을 설명합니다.

## 1단계: AWS ECR 리포지토리 생성

1. AWS Console에서 **ECR (Elastic Container Registry)** 서비스로 이동
2. **리전: ap-northeast-2 (서울)** 선택
3. **"리포지토리 생성"** 클릭
4. 리포지토리 이름: `to-the-moon-backend` 입력
5. **"리포지토리 생성"** 클릭

## 2단계: GitHub Secrets 설정

GitHub 리포지토리에 AWS 자격 증명을 안전하게 저장합니다:

1. GitHub 리포지토리 페이지로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **"New repository secret"** 클릭하여 다음 Secrets 추가:

   - **Name:** `AWS_ACCESS_KEY_ID`
     **Value:** `.env 파일에서 복사`

   - **Name:** `AWS_SECRET_ACCESS_KEY`
     **Value:** `.env 파일에서 복사`

## 3단계: GitHub Actions 실행

코드를 푸시하면 GitHub Actions가 자동으로 실행됩니다:

```bash
git add .
git commit -m "Setup GitHub Actions deployment"
git push
```

GitHub Actions는 다음 작업을 수행합니다:
1. Docker 이미지 빌드
2. ECR에 로그인
3. 이미지를 ECR에 푸시 (태그: latest 및 커밋 SHA)

**Actions 탭에서 진행 상황을 확인하세요!**

## 4단계: App Runner 서비스 재설정

### 기존 App Runner 서비스 삭제 (선택 사항)

현재 소스 코드 방식으로 만든 서비스가 환경 변수 문제가 있다면 삭제하고 새로 만드는 것이 좋습니다:

1. AWS Console → **App Runner** (리전: 도쿄 ap-northeast-1)
2. 기존 서비스 선택 → **작업** → **서비스 삭제**

### 새 App Runner 서비스 생성 (ECR 이미지 사용)

1. **App Runner** 서비스로 이동 (리전: **도쿄 ap-northeast-1**)
2. **"서비스 생성"** 클릭
3. **소스 유형 선택:**
   - **"컨테이너 레지스트리"** 선택
   - **"Amazon ECR"** 선택
4. **이미지 리포지토리:**
   - **"이미지 리포지토리 찾아보기"** 클릭
   - 리전: **ap-northeast-2 (서울)** 선택
   - 리포지토리: **to-the-moon-backend** 선택
   - 이미지 태그: **latest** 선택
5. **배포 트리거:**
   - **"자동"** 선택 (ECR에 새 이미지가 푸시되면 자동 배포)
6. **ECR 액세스 역할:**
   - **"새 서비스 역할 생성"** 선택
7. **다음** 클릭

### 서비스 설정

1. **서비스 이름:** `to-the-moon-backend` 입력
2. **가상 CPU 및 메모리:**
   - vCPU: 1
   - 메모리: 2GB
3. **포트:** `3007` 입력
4. **환경 변수:** 다음 환경 변수들을 **하나씩** 추가:

   | 키 | 값 |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `.env 파일에서 복사` |
   | `JWT_SECRET` | `.env 파일에서 복사` |
   | `JWT_ACCESS_EXPIRY` | `1h` |
   | `JWT_REFRESH_EXPIRY` | `7d` |
   | `AWS_REGION` | `ap-northeast-2` |
   | `AWS_ACCESS_KEY_ID` | `.env 파일에서 복사` |
   | `AWS_SECRET_ACCESS_KEY` | `.env 파일에서 복사` |
   | `S3_BUCKET_NAME` | `koco-dental-files` |
   | `MAX_FILE_SIZE` | `10485760` |
   | `ALLOWED_FILE_TYPES` | `image/jpeg,image/png,image/svg+xml` |
   | `FRONTEND_URL` | `*` |

5. **상태 확인:**
   - 경로: `/api/health`
   - 간격: 5초
   - 시간 초과: 2초
   - 정상 임계값: 1
   - 비정상 임계값: 5

6. **보안:**
   - 기본 설정 사용

7. **다음** → **생성 및 배포** 클릭

## 5단계: RDS 보안 그룹 설정

App Runner에서 RDS에 접근할 수 있도록 보안 그룹을 설정합니다:

1. **RDS Console** → 데이터베이스 선택
2. **보안 그룹** 클릭
3. **인바운드 규칙 편집**:
   - 유형: MySQL/Aurora (3306)
   - 소스: 0.0.0.0/0 (모든 IP 허용)
   - 설명: App Runner access

   > **참고:** 프로덕션 환경에서는 App Runner VPC Connector를 사용하여 더 안전하게 설정하는 것이 좋습니다.

## 6단계: 배포 확인

1. App Runner 서비스 페이지에서 **"로그"** 탭 확인
2. 다음 메시지가 표시되어야 합니다:
   ```
   ========== ENVIRONMENT DEBUG ==========
   NODE_ENV: production
   DATABASE_URL: SET
   PORT: 3007
   =======================================
   Production mode: using injected environment variables
   ✓ Database connected successfully
   ✓ Server is running on port 3007
   ```

3. **기본 도메인 URL** 확인 (예: `https://xxxxx.ap-northeast-1.awsapprunner.com`)
4. 헬스체크 테스트: `https://your-url/api/health`

## 이후 배포

코드를 수정한 후:

```bash
git add .
git commit -m "Your changes"
git push
```

GitHub Actions가 자동으로:
1. Docker 이미지 빌드
2. ECR에 푸시
3. App Runner가 자동으로 새 이미지 감지하여 배포

## 문제 해결

### GitHub Actions 실패 시
- Actions 탭에서 로그 확인
- AWS Secrets가 올바르게 설정되었는지 확인

### App Runner 배포 실패 시
- App Runner 로그 탭에서 에러 확인
- 환경 변수가 모두 설정되었는지 확인
- RDS 보안 그룹이 열려있는지 확인
