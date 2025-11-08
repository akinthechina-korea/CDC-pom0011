# 🚀 배포 안내서

## 빠른 시작 (3단계)

### 1단계: GitHub 저장소 생성 및 푸시

터미널에서 실행:

```bash
# 1. GitHub 저장소 생성 (웹에서)
# https://github.com/new 접속
# 저장소 이름: CDC-pom0011
# Public 또는 Private 선택
# "Create repository" 클릭

# 2. GitHub 원격 저장소 추가
git remote add origin https://github.com/akinthechina/CDC-pom0011.git

# 3. 변경사항 커밋
git add -A
git commit -m "Prepare for Railway deployment"

# 4. GitHub에 푸시
git push -u origin main
```

### 2단계: Railway 배포

1. **Railway 계정 생성**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - "Login with GitHub" 선택
   - GitHub 계정으로 로그인 (akinthechina@gmail.com)

2. **프로젝트 배포**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - `akinthechina/CDC-pom0011` 저장소 선택
   - Railway가 자동으로 배포 시작 (약 2-3분 소요)

3. **PostgreSQL 데이터베이스 추가**
   - 프로젝트 대시보드에서 "New" 클릭
   - "Database" → "Add PostgreSQL" 선택
   - 자동으로 `DATABASE_URL` 환경 변수 설정됨

4. **데이터베이스 마이그레이션**
   - Railway 프로젝트 → "Deployments" 탭 클릭
   - 최신 배포 로그 확인
   - 또는 Railway 터미널에서:
     ```bash
     npm run db:push
     npx tsx server/seed.ts
     ```

### 3단계: 배포 완료 확인

1. Railway가 제공하는 URL로 접속
   - 예: `https://your-app-name.up.railway.app`
2. 애플리케이션이 정상 작동하는지 확인

---

## 자동화 스크립트 사용

더 간편하게 배포하려면:

```bash
./deploy.sh
```

스크립트가 자동으로:
- 변경사항 커밋
- GitHub 원격 저장소 확인
- GitHub에 푸시
- 배포 안내 제공

---

## 문제 해결

### 배포 실패
- Railway Deploy Logs 확인
- 환경 변수 확인 (`DATABASE_URL` 등)
- 빌드 로그 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 환경 변수 확인
- PostgreSQL 서비스가 실행 중인지 확인

### 파일 업로드 문제
- 현재는 로컬 파일 시스템 사용
- 서버 재시작 시 파일이 삭제될 수 있음
- 프로덕션에서는 클라우드 스토리지 사용 권장

---

## 추가 정보

더 자세한 내용은 `README_DEPLOY.md` 파일을 참조하세요.

