# 🚀 빠른 배포 가이드

## 1단계: GitHub 저장소 생성

1. https://github.com/new 접속
2. 저장소 이름: `CDC-pom0011` (또는 원하는 이름)
3. "Public" 또는 "Private" 선택
4. "Create repository" 클릭

## 2단계: 코드 푸시

터미널에서 실행:

```bash
# GitHub 원격 저장소 추가 (아직 안 했다면)
git remote add origin https://github.com/akinthechina/CDC-pom0011.git

# 변경사항 커밋
git add -A
git commit -m "Prepare for deployment"

# GitHub에 푸시
git push -u origin main
```

또는 자동화 스크립트 사용:

```bash
./deploy.sh
```

## 3단계: Railway 배포

### 3.1 Railway 계정 생성 및 로그인
1. https://railway.app 접속
2. "Start a New Project" 클릭
3. "Login with GitHub" 선택
4. GitHub 계정(akinthechina@gmail.com)으로 로그인

### 3.2 프로젝트 배포
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `akinthechina/CDC-pom0011` 저장소 선택
4. Railway가 자동으로 배포 시작

### 3.3 PostgreSQL 데이터베이스 추가
1. 프로젝트 대시보드에서 "New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 자동으로 `DATABASE_URL` 환경 변수 설정됨

### 3.4 데이터베이스 마이그레이션
1. Railway 프로젝트 대시보드에서 "Variables" 탭 클릭
2. "New Variable" 클릭하여 추가 (필요시):
   - `NODE_ENV` = `production`
3. Railway 터미널에서 실행:
   ```bash
   npm run db:push
   npx tsx server/seed.ts
   ```

또는 Railway Deploy Logs에서 자동으로 실행되도록 설정할 수 있습니다.

### 3.5 배포 완료 확인
1. Railway가 제공하는 URL로 접속
2. 예: `https://your-app-name.up.railway.app`
3. 애플리케이션이 정상 작동하는지 확인

## 4단계: 커스텀 도메인 (선택사항)

1. Railway 프로젝트 → "Settings" → "Domains"
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 도메인 설정

## 🎉 완료!

이제 애플리케이션이 인터넷에서 접근 가능합니다!

## ⚠️ 중요 사항

### 파일 업로드
- 현재는 로컬 파일 시스템 사용
- Railway에서는 파일이 서버 재시작 시 삭제될 수 있음
- 프로덕션 환경에서는 클라우드 스토리지(AWS S3, Cloudflare R2 등) 사용 권장

### 환경 변수
- Railway가 자동으로 `DATABASE_URL` 설정
- `PORT`도 자동 설정
- 추가 환경 변수가 필요하면 Railway 대시보드에서 설정

### 비용
- Railway 무료 크레딧: 월 $5
- PostgreSQL: 무료 크레딧 사용
- 예상 비용: $0-5/월 (사용량에 따라)

## 🆘 문제 해결

### 배포 실패
- Railway Deploy Logs 확인
- 환경 변수 확인
- 데이터베이스 연결 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 환경 변수 확인
- Railway 터미널에서 연결 테스트

### 파일 업로드 문제
- 디렉토리 권한 확인
- 스토리지 공간 확인

## 📞 도움이 필요하시면

- Railway 문서: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

