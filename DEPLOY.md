# 배포 가이드

## Railway로 배포하기 (추천 - 가장 간단)

### 1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub로 로그인
3. 무료 플랜 선택 (월 $5 크레딧 무료 제공)

### 2. 프로젝트 배포
1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 이 저장소 선택
4. 자동으로 배포 시작

### 3. PostgreSQL 데이터베이스 추가
1. Railway 프로젝트에서 "New" → "Database" → "Add PostgreSQL" 클릭
2. 자동으로 DATABASE_URL 환경 변수 설정됨

### 4. 환경 변수 설정
Railway 대시보드에서 Variables 탭에서 설정:
- `PORT`: 자동 설정됨 (Railway가 자동으로 설정)
- `DATABASE_URL`: PostgreSQL 추가 시 자동 설정됨
- `NODE_ENV`: `production`

### 5. 파일 스토리지 설정
Railway는 영구 볼륨을 지원하지 않으므로, 파일 업로드를 클라우드 스토리지로 변경해야 합니다:
- 옵션 1: Railway의 영구 볼륨 사용 (유료 플랜 필요)
- 옵션 2: AWS S3, Cloudflare R2, 또는 Supabase Storage 사용 (무료 티어 있음)
- 옵션 3: 데이터베이스에 base64로 저장 (작은 파일에 적합)

### 6. 배포 확인
Railway가 자동으로 생성한 URL로 접속하여 확인

---

## Render로 배포하기

### 1. Render 계정 생성
1. https://render.com 접속
2. GitHub로 로그인
3. 무료 플랜 선택

### 2. PostgreSQL 데이터베이스 생성
1. Render 대시보드에서 "New +" → "PostgreSQL" 클릭
2. 무료 플랜 선택
3. 데이터베이스 생성

### 3. Web Service 배포
1. "New +" → "Web Service" 클릭
2. GitHub 저장소 연결
3. 설정:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment: `Node`
4. 환경 변수 설정:
   - `DATABASE_URL`: PostgreSQL 연결 문자열
   - `NODE_ENV`: `production`
   - `PORT`: Render가 자동 설정

### 4. 파일 스토리지
Render는 영구 볼륨을 지원하지 않으므로 클라우드 스토리지 사용 필요

---

## Fly.io로 배포하기 (영구 볼륨 지원)

### 1. Fly.io 계정 생성
1. https://fly.io 접속
2. 회원가입
3. 무료 플랜 선택 (월 3GB 스토리지 무료)

### 2. Fly.io CLI 설치
```bash
curl -L https://fly.io/install.sh | sh
```

### 3. PostgreSQL 데이터베이스 생성
```bash
flyctl postgres create --name cdc-damage-db
flyctl postgres attach cdc-damage-db
```

### 4. Dockerfile 생성 필요
Fly.io는 Docker를 사용하므로 Dockerfile이 필요합니다.

### 5. 영구 볼륨 생성 (파일 업로드용)
```bash
flyctl volumes create damage_photos --size 1 --region sea
```

---

## 보안 강화 사항

### 1. 환경 변수
- 민감한 정보는 환경 변수로 관리
- `.env` 파일은 Git에 커밋하지 않기

### 2. HTTPS
- Railway, Render, Fly.io 모두 자동 HTTPS 제공

### 3. 데이터베이스 보안
- 데이터베이스 접근 제한
- 정기적인 백업

### 4. 파일 업로드 보안
- 파일 크기 제한
- 파일 타입 검증
- 바이러스 스캔 (가능한 경우)

---

## 무료 플랜 제한사항

### Railway
- 월 $5 크레딧 무료
- 512MB RAM
- 1GB 디스크

### Render
- 무료 티어는 15분 동안 요청이 없으면 sleep
- 512MB RAM
- PostgreSQL 무료 플랜: 90일 후 삭제 (유료 플랜 필요)

### Fly.io
- 월 3GB 스토리지 무료
- 월 160GB 네트워크 전송 무료
- PostgreSQL은 별도 비용 (최소 $1.94/월)

---

## 추천 배포 방법

**가장 추천: Railway**
- 가장 간단한 설정
- 자동 HTTPS
- PostgreSQL 포함
- GitHub 연동
- 월 $5 무료 크레딧

**파일 업로드가 중요한 경우: Fly.io**
- 영구 볼륨 지원
- 무료 스토리지 제공
- 하지만 설정이 복잡함

**비용이 중요하고 파일 업로드가 적은 경우: Render**
- 완전 무료 (sleep 있음)
- PostgreSQL 무료 (90일)
- 클라우드 스토리지로 파일 저장

