# 🚀 무료 배포 가이드

이 애플리케이션을 무료로 안전하게 배포하는 방법입니다.

## 📋 배포 전 준비사항

1. **GitHub 저장소 생성**
   - 이 프로젝트를 GitHub에 푸시
   - `.env` 파일은 커밋하지 않기 (이미 .gitignore에 포함됨)

2. **데이터베이스 백업 (선택사항)**
   - 로컬 데이터베이스의 데이터를 백업하려면:
   ```bash
   pg_dump -U aaron cdc_damage > backup.sql
   ```

---

## 🎯 방법 1: Railway 배포 (가장 추천 ⭐)

### 장점
- ✅ 가장 간단한 설정
- ✅ PostgreSQL 자동 설정
- ✅ 자동 HTTPS
- ✅ GitHub 연동 (자동 배포)
- ✅ 월 $5 무료 크레딧
- ✅ 좋은 성능

### 단계

#### 1. Railway 계정 생성
1. https://railway.app 접속
2. "Start a New Project" 클릭
3. "Login with GitHub" 선택
4. GitHub 계정으로 로그인

#### 2. 프로젝트 배포
1. "New Project" → "Deploy from GitHub repo" 선택
2. 이 저장소 선택
3. Railway가 자동으로 배포 시작

#### 3. PostgreSQL 데이터베이스 추가
1. 프로젝트 대시보드에서 "New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 자동으로 `DATABASE_URL` 환경 변수가 설정됨

#### 4. 환경 변수 확인
Railway 대시보드 → Variables 탭에서 확인:
- `DATABASE_URL`: 자동 설정됨 ✅
- `PORT`: 자동 설정됨 ✅
- `NODE_ENV`: `production`으로 설정 (선택사항)

#### 5. 데이터베이스 마이그레이션 및 시드
1. Railway 터미널에서 실행:
   ```bash
   npm run db:push
   npx tsx server/seed.ts
   ```

또는 Railway의 Deploy Logs에서 자동으로 실행되도록 설정할 수 있습니다.

#### 6. 배포 완료
Railway가 제공하는 URL로 접속하여 확인하세요!
예: `https://your-app-name.railway.app`

---

## 🌐 방법 2: Render 배포

### 장점
- ✅ 완전 무료 (일부 제한 있음)
- ✅ PostgreSQL 무료 플랜
- ✅ 자동 HTTPS
- ✅ GitHub 연동

### 단점
- ⚠️ 15분 동안 요청이 없으면 sleep (무료 플랜)
- ⚠️ PostgreSQL 무료 플랜은 90일 후 삭제됨

### 단계

#### 1. Render 계정 생성
1. https://render.com 접속
2. "Get Started for Free" 클릭
3. GitHub로 로그인

#### 2. PostgreSQL 데이터베이스 생성
1. "New +" → "PostgreSQL" 클릭
2. 설정:
   - Name: `cdc-damage-db`
   - Database: `cdc_damage`
   - User: 자동 생성
   - Region: `Singapore` (가장 가까운 지역)
   - Plan: `Free`
3. "Create Database" 클릭
4. "Connections" 탭에서 "Internal Database URL" 복사

#### 3. Web Service 배포
1. "New +" → "Web Service" 클릭
2. GitHub 저장소 연결
3. 설정:
   - Name: `cdc-damage-app`
   - Region: `Singapore`
   - Branch: `main` (또는 `master`)
   - Root Directory: (비워둠)
   - Runtime: `Node`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
4. "Advanced" → "Add Environment Variable":
   - Key: `DATABASE_URL`
   - Value: PostgreSQL 연결 문자열 (2단계에서 복사한 것)
   - Key: `NODE_ENV`
   - Value: `production`
5. "Create Web Service" 클릭

#### 4. 데이터베이스 마이그레이션
Render의 Shell에서:
```bash
npm run db:push
npx tsx server/seed.ts
```

---

## 🚁 방법 3: Fly.io 배포 (영구 볼륨 필요 시)

### 장점
- ✅ 영구 볼륨 지원 (파일 업로드에 유리)
- ✅ 월 3GB 스토리지 무료
- ✅ 좋은 성능

### 단점
- ⚠️ 설정이 복잡함
- ⚠️ PostgreSQL은 별도 비용 (최소 $1.94/월)

### 단계

#### 1. Fly.io CLI 설치
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Fly.io 로그인
```bash
flyctl auth login
```

#### 3. PostgreSQL 데이터베이스 생성
```bash
flyctl postgres create --name cdc-damage-db --region sea
flyctl postgres attach cdc-damage-db
```

#### 4. 앱 초기화
```bash
flyctl launch
```

#### 5. 영구 볼륨 생성 (파일 업로드용)
```bash
flyctl volumes create damage_photos --size 1 --region sea
```

---

## ⚠️ 중요: 파일 업로드 문제 해결

현재 애플리케이션은 로컬 파일 시스템에 파일을 저장합니다. 
클라우드 배포 시 다음 옵션을 고려하세요:

### 옵션 1: 클라우드 스토리지 사용 (추천)
- **AWS S3** (무료 티어: 5GB)
- **Cloudflare R2** (무료: 10GB)
- **Supabase Storage** (무료: 1GB)
- **Railway Volumes** (유료 플랜 필요)

### 옵션 2: 데이터베이스에 저장
- 작은 파일(서명 이미지 등)은 base64로 데이터베이스에 저장
- 큰 파일(파손 사진)은 클라우드 스토리지 사용

### 옵션 3: 임시 해결책
- Railway/Render에서 파일 업로드는 작동하지만, 
- 서버 재시작 시 파일이 삭제될 수 있음
- 프로덕션 환경에서는 클라우드 스토리지 사용 권장

---

## 🔒 보안 체크리스트

배포 전 확인사항:

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있음
- [ ] 민감한 정보가 코드에 하드코딩되지 않음
- [ ] 데이터베이스 비밀번호가 환경 변수로 관리됨
- [ ] HTTPS가 활성화되어 있음 (Railway/Render 자동 제공)
- [ ] 파일 업로드 크기 제한이 설정되어 있음 (현재 5MB)
- [ ] 파일 타입 검증이 되어 있음 (현재 JPG, PNG, WEBP만 허용)

---

## 📊 비용 비교

### Railway
- **무료 크레딧**: 월 $5
- **PostgreSQL**: 포함 (무료 크레딧 사용)
- **스토리지**: 1GB (무료 크레딧 사용)
- **예상 비용**: $0-5/월 (사용량에 따라)

### Render
- **Web Service**: 무료 (sleep 있음)
- **PostgreSQL**: 무료 (90일 후 삭제)
- **예상 비용**: $0/월 (무료 플랜 사용 시)

### Fly.io
- **앱 호스팅**: 무료
- **스토리지**: 3GB 무료
- **PostgreSQL**: $1.94/월 (최소)
- **예상 비용**: $1.94/월 이상

---

## 🎉 배포 후 할 일

1. **데이터베이스 시드**
   ```bash
   npx tsx server/seed.ts
   ```

2. **테스트**
   - 모든 기능 테스트
   - 파일 업로드 테스트
   - 로그인 테스트

3. **모니터링 설정**
   - Railway: 자동 로그 제공
   - Render: 로그 대시보드 제공
   - Fly.io: `flyctl logs` 명령어

4. **백업 설정**
   - 데이터베이스 정기 백업
   - 파일 백업 (클라우드 스토리지 사용 시)

---

## 🆘 문제 해결

### 배포 실패
- 빌드 로그 확인
- 환경 변수 확인
- 데이터베이스 연결 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 환경 변수 확인
- 데이터베이스가 실행 중인지 확인
- 방화벽 설정 확인

### 파일 업로드 실패
- 디렉토리 권한 확인
- 스토리지 공간 확인
- 파일 크기 제한 확인

---

## 📚 추가 자료

- [Railway 문서](https://docs.railway.app)
- [Render 문서](https://render.com/docs)
- [Fly.io 문서](https://fly.io/docs)

---

**추천**: 처음 배포하는 경우 **Railway**를 추천합니다. 가장 간단하고 안정적입니다! 🚀

