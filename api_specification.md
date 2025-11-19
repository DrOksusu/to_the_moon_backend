# VocalStudio Backend API 계획서

## 개요
VocalStudio는 선생님과 학생 간의 성악/보컬 레슨 관리를 위한 웹 애플리케이션입니다.

## 기술 스택 권장사항
- **Backend Framework**: Python (FastAPI/Django) 또는 Node.js (Express)
- **Database**: PostgreSQL 또는 MySQL
- **Authentication**: JWT 기반 토큰 인증
- **File Storage**: AWS S3 또는 로컬 스토리지

---

## 데이터 모델

### 1. User (사용자)
```typescript
{
  id: string
  email: string (unique)
  name: string
  password: string (hashed)
  role: 'teacher' | 'student'
  avatar?: string
  created_at: datetime
  updated_at: datetime
}
```

### 2. StudentProfile (학생 프로필)
```typescript
{
  id: string
  user_id: string (FK -> User.id)
  teacher_id: string (FK -> User.id)
  voice_type: string (예: Soprano, Alto, Tenor, Bass)
  level: string (예: Beginner, Intermediate, Advanced)
  start_date: date
  goals?: string
  created_at: datetime
  updated_at: datetime
}
```

### 3. Lesson (수업)
```typescript
{
  id: string
  teacher_id: string (FK -> User.id)
  student_id: string (FK -> User.id)
  title?: string
  scheduled_at: datetime
  duration: number (분 단위)
  status: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  notes?: string
  created_at: datetime
  updated_at: datetime
}
```

### 4. Feedback (피드백)
```typescript
{
  id: string
  lesson_id: string (FK -> Lesson.id)
  teacher_id: string (FK -> User.id)
  student_id: string (FK -> User.id)
  rating: number (1-5)
  content: string
  strengths?: string
  improvements?: string
  homework?: string
  created_at: datetime
  updated_at: datetime
}
```

### 5. File (파일)
```typescript
{
  id: string
  uploader_id: string (FK -> User.id)
  student_id?: string (FK -> User.id, null이면 전체 공유)
  file_type: string (MIME type)
  file_name: string (저장된 파일명)
  original_name: string (원본 파일명)
  file_size: number (bytes)
  file_url: string
  uploaded_at: datetime
}
```

---

## API 엔드포인트

### 인증 (Authentication)

#### 1. 회원가입
```
POST /api/auth/signup
Content-Type: application/json

Request Body:
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "phone": "010-1234-5678",
  "role": "teacher" | "student"
}

Response (201 Created):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "teacher"
  },
  "token": "jwt_token_here"
}

Error Response (400 Bad Request):
{
  "error": "Email already exists"
}
```

#### 2. 로그인
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "role": "teacher" | "student"
}

Response (200 OK):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "teacher"
  },
  "token": "jwt_token_here"
}

Error Response (401 Unauthorized):
{
  "error": "Invalid credentials"
}
```

#### 3. 현재 사용자 정보
```
GET /api/auth/me
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "홍길동",
  "role": "teacher",
  "avatar": "url_to_avatar"
}
```

#### 4. 로그아웃
```
POST /api/auth/logout
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

---

### 학생 관리 (Student Management) - 선생님 전용

#### 1. 학생 목록 조회
```
GET /api/teacher/students
Authorization: Bearer {token}
Query Params: ?search=김민수 (선택사항)

Response (200 OK):
[
  {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "name": "김민수",
      "email": "student@example.com"
    },
    "voice_type": "Tenor",
    "level": "Intermediate",
    "start_date": "2024-01-15",
    "goals": "팝송 마스터하기"
  }
]
```

#### 2. 학생 상세 정보
```
GET /api/teacher/students/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "name": "김민수",
    "email": "student@example.com",
    "phone": "010-1234-5678"
  },
  "voice_type": "Tenor",
  "level": "Intermediate",
  "start_date": "2024-01-15",
  "goals": "팝송 마스터하기",
  "total_lessons": 15,
  "completed_lessons": 12,
  "upcoming_lessons": 3
}
```

#### 3. 학생 등록
```
POST /api/teacher/students
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "name": "김민수",
  "email": "student@example.com",
  "phone": "010-1234-5678",
  "password": "temporary_password",
  "voice_type": "Tenor",
  "level": "Beginner",
  "start_date": "2024-01-15",
  "goals": "팝송 마스터하기"
}

Response (201 Created):
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "name": "김민수",
    "email": "student@example.com"
  },
  "voice_type": "Tenor",
  "level": "Beginner",
  "start_date": "2024-01-15"
}
```

#### 4. 학생 정보 수정
```
PUT /api/teacher/students/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "voice_type": "Tenor",
  "level": "Intermediate",
  "goals": "뮤지컬 오디션 준비"
}

Response (200 OK):
{
  "id": "uuid",
  "voice_type": "Tenor",
  "level": "Intermediate",
  "goals": "뮤지컬 오디션 준비"
}
```

#### 5. 학생 삭제
```
DELETE /api/teacher/students/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "Student deleted successfully"
}
```

---

### 수업 관리 (Lesson Management)

#### 1. 수업 목록 조회
```
GET /api/lessons
Authorization: Bearer {token}
Query Params:
  ?status=scheduled|completed|cancelled
  &from_date=2024-01-01
  &to_date=2024-12-31

Response (200 OK):
[
  {
    "id": "uuid",
    "teacher": {
      "id": "uuid",
      "name": "김선생"
    },
    "student": {
      "id": "uuid",
      "name": "이학생"
    },
    "title": "발성 연습",
    "scheduled_at": "2024-03-15T14:00:00Z",
    "duration": 60,
    "status": "scheduled",
    "location": "스튜디오 A",
    "notes": "호흡 집중 연습"
  }
]
```

#### 2. 수업 상세 정보
```
GET /api/lessons/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "uuid",
  "teacher": {
    "id": "uuid",
    "name": "김선생",
    "email": "teacher@example.com"
  },
  "student": {
    "id": "uuid",
    "name": "이학생",
    "email": "student@example.com"
  },
  "title": "발성 연습",
  "scheduled_at": "2024-03-15T14:00:00Z",
  "duration": 60,
  "status": "scheduled",
  "location": "스튜디오 A",
  "notes": "호흡 집중 연습",
  "feedback": {
    "id": "uuid",
    "rating": 5,
    "content": "매우 좋은 진전..."
  } // 피드백이 있는 경우에만
}
```

#### 3. 수업 등록 (선생님 전용)
```
POST /api/lessons
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "student_id": "uuid",
  "title": "발성 연습",
  "date": "2024-03-15",
  "time": "14:00",
  "duration": 60,
  "location": "스튜디오 A",
  "notes": "호흡 집중 연습"
}

Response (201 Created):
{
  "id": "uuid",
  "teacher_id": "uuid",
  "student_id": "uuid",
  "title": "발성 연습",
  "scheduled_at": "2024-03-15T14:00:00Z",
  "duration": 60,
  "status": "scheduled",
  "location": "스튜디오 A",
  "notes": "호흡 집중 연습"
}
```

#### 4. 수업 수정 (선생님 전용)
```
PUT /api/lessons/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "scheduled_at": "2024-03-16T15:00:00Z",
  "duration": 90,
  "status": "scheduled",
  "notes": "수정된 노트"
}

Response (200 OK):
{
  "id": "uuid",
  "scheduled_at": "2024-03-16T15:00:00Z",
  "duration": 90,
  "status": "scheduled"
}
```

#### 5. 수업 취소/삭제 (선생님 전용)
```
DELETE /api/lessons/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "Lesson deleted successfully"
}

또는 상태만 변경:
PATCH /api/lessons/:id/cancel
Response (200 OK):
{
  "id": "uuid",
  "status": "cancelled"
}
```

---

### 피드백 관리 (Feedback Management)

#### 1. 피드백 목록 조회
```
GET /api/feedback
Authorization: Bearer {token}
Query Params: ?student_id=uuid (선택사항)

Response (200 OK):
[
  {
    "id": "uuid",
    "lesson": {
      "id": "uuid",
      "scheduled_at": "2024-03-15T14:00:00Z"
    },
    "teacher": {
      "id": "uuid",
      "name": "김선생"
    },
    "student": {
      "id": "uuid",
      "name": "이학생"
    },
    "rating": 5,
    "content": "매우 좋은 진전이 있었습니다...",
    "strengths": "고음 처리가 안정적",
    "improvements": "저음역대 공명 개선 필요",
    "homework": "매일 30분 발성 연습",
    "created_at": "2024-03-15T16:00:00Z"
  }
]
```

#### 2. 피드백 상세 정보
```
GET /api/feedback/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "uuid",
  "lesson": {
    "id": "uuid",
    "title": "발성 연습",
    "scheduled_at": "2024-03-15T14:00:00Z",
    "duration": 60
  },
  "teacher": {
    "id": "uuid",
    "name": "김선생"
  },
  "student": {
    "id": "uuid",
    "name": "이학생"
  },
  "rating": 5,
  "content": "매우 좋은 진전이 있었습니다...",
  "strengths": "고음 처리가 안정적",
  "improvements": "저음역대 공명 개선 필요",
  "homework": "매일 30분 발성 연습",
  "created_at": "2024-03-15T16:00:00Z"
}
```

#### 3. 피드백 작성 (선생님 전용)
```
POST /api/feedback
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "lesson_id": "uuid",
  "student_id": "uuid",
  "rating": 5,
  "content": "매우 좋은 진전이 있었습니다...",
  "strengths": "고음 처리가 안정적",
  "improvements": "저음역대 공명 개선 필요",
  "homework": "매일 30분 발성 연습"
}

Response (201 Created):
{
  "id": "uuid",
  "lesson_id": "uuid",
  "rating": 5,
  "content": "매우 좋은 진전이 있었습니다...",
  "created_at": "2024-03-15T16:00:00Z"
}
```

#### 4. 피드백 수정 (선생님 전용)
```
PUT /api/feedback/:id
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "rating": 4,
  "content": "수정된 피드백 내용...",
  "homework": "수정된 과제"
}

Response (200 OK):
{
  "id": "uuid",
  "rating": 4,
  "content": "수정된 피드백 내용...",
  "updated_at": "2024-03-15T17:00:00Z"
}
```

---

### 파일 관리 (File Management)

#### 1. 파일 목록 조회
```
GET /api/files
Authorization: Bearer {token}
Query Params:
  ?student_id=uuid (선택사항)
  &file_type=audio|pdf|video (선택사항)

Response (200 OK):
[
  {
    "id": "uuid",
    "uploader": {
      "id": "uuid",
      "name": "김선생"
    },
    "student": {
      "id": "uuid",
      "name": "이학생"
    } // null이면 전체 공유
    "file_type": "audio/mpeg",
    "file_name": "vocal_practice.mp3",
    "original_name": "발성연습.mp3",
    "file_size": 5242880,
    "file_url": "https://storage.example.com/files/...",
    "uploaded_at": "2024-03-15T10:00:00Z"
  }
]
```

#### 2. 파일 업로드
```
POST /api/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body (form-data):
- file: [파일 데이터]
- student_id: "uuid" (선택사항, 특정 학생용)
- description: "파일 설명" (선택사항)

Response (201 Created):
{
  "id": "uuid",
  "file_type": "audio/mpeg",
  "file_name": "vocal_practice_20240315.mp3",
  "original_name": "발성연습.mp3",
  "file_size": 5242880,
  "file_url": "https://storage.example.com/files/...",
  "uploaded_at": "2024-03-15T10:00:00Z"
}

Error Response (413 Payload Too Large):
{
  "error": "File size exceeds maximum limit (50MB)"
}
```

#### 3. 파일 다운로드
```
GET /api/files/:id/download
Authorization: Bearer {token}

Response (200 OK):
- Content-Type: {파일의 MIME type}
- Content-Disposition: attachment; filename="original_filename.ext"
- 파일 바이너리 데이터
```

#### 4. 파일 삭제
```
DELETE /api/files/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "File deleted successfully"
}
```

---

### 대시보드 (Dashboard)

#### 1. 대시보드 통계 조회
```
GET /api/dashboard/stats
Authorization: Bearer {token}

선생님용 Response (200 OK):
{
  "total_students": 15,
  "upcoming_lessons": 8,
  "pending_feedback": 3,
  "recent_students": [
    {
      "id": "uuid",
      "name": "이학생",
      "voice_type": "Soprano",
      "level": "Intermediate"
    }
  ],
  "upcoming_lessons_list": [
    {
      "id": "uuid",
      "student_name": "이학생",
      "scheduled_at": "2024-03-16T14:00:00Z",
      "duration": 60
    }
  ]
}

학생용 Response (200 OK):
{
  "profile": {
    "voice_type": "Soprano",
    "level": "Intermediate"
  },
  "upcoming_lessons": 3,
  "total_feedback": 12,
  "recent_feedback": [
    {
      "id": "uuid",
      "rating": 5,
      "content": "매우 좋은 진전...",
      "created_at": "2024-03-15T16:00:00Z"
    }
  ],
  "upcoming_lessons_list": [
    {
      "id": "uuid",
      "teacher_name": "김선생",
      "scheduled_at": "2024-03-16T14:00:00Z",
      "duration": 60,
      "location": "스튜디오 A"
    }
  ]
}
```

---

## 에러 처리

모든 API는 다음과 같은 에러 응답 형식을 따릅니다:

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {} // 추가 에러 상세 정보 (선택사항)
}
```

### HTTP 상태 코드
- `200 OK`: 요청 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `413 Payload Too Large`: 파일 크기 초과
- `500 Internal Server Error`: 서버 에러

---

## 보안 요구사항

1. **비밀번호**: bcrypt 또는 argon2로 해싱
2. **JWT 토큰**:
   - Access Token: 15분~1시간 유효
   - Refresh Token: 7일~30일 유효 (선택사항)
3. **CORS**: 프론트엔드 도메인만 허용
4. **Rate Limiting**: API 요청 제한 (예: 분당 100회)
5. **파일 업로드**:
   - 최대 파일 크기: 50MB
   - 허용 파일 형식: audio/*, video/*, application/pdf, image/*

---

## 추가 권장사항

1. **Pagination**: 목록 조회 API에 페이지네이션 구현
   ```
   Query Params: ?page=1&limit=20
   Response에 total_count, total_pages 포함
   ```

2. **검색 및 필터링**: 학생, 수업, 피드백 목록에 검색 기능

3. **알림 시스템**: 수업 시작 전 알림 (선택사항)
   ```
   GET /api/notifications
   POST /api/notifications/:id/read
   ```

4. **로깅**: 모든 API 요청과 에러 로깅

5. **데이터베이스 인덱싱**:
   - User.email (unique)
   - Lesson.teacher_id, student_id, scheduled_at
   - Feedback.lesson_id
   - File.uploader_id, student_id

6. **소프트 삭제**: 중요 데이터는 완전 삭제 대신 deleted_at 컬럼으로 관리

---

## 테스트 계정

개발 및 테스트를 위한 초기 데이터:

**선생님 계정:**
- Email: teacher@vocalstudio.com
- Password: password123

**학생 계정:**
- Email: student@vocalstudio.com
- Password: password123
