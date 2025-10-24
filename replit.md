# 컨테이너 DAMAGE 확인서 시스템

## 프로젝트 개요
천일국제물류(天一國際物流)의 컨테이너 파손 확인서 관리 시스템입니다. 운송기사, 현장 책임자, 사무실 책임자의 3단계 승인 워크플로우를 통해 컨테이너 파손 보고서를 체계적으로 관리합니다.

## 주요 기능

### 1. 역할 기반 시스템
- **운송기사**: 파손 보고서 작성 및 제출, 사진 업로드, 반려된 보고서 수정 및 재제출
- **현장 책임자**: 기사 보고서 검토, 승인 또는 반려
- **사무실 책임자**: 최종 승인 또는 반려, 확인서 문서 생성
- **관리자**: CSV 파일을 통한 마스터 데이터 일괄 업로드

### 2. 워크플로우
```
운송기사 제출 → 현장 검토 (승인/반려) → 사무실 최종 승인 (승인/반려) → 완료
                      ↓                          ↓
                  반려 시 재제출 가능           반려 시 현장 재검토
```

### 3. 보고서 상태
- `draft`: 작성중
- `driver_submitted`: 현장대기 (기사가 제출함, 또는 사무실이 반려함)
- `field_submitted`: 사무실대기 (현장이 승인함)
- `rejected`: 반려됨 (현장이 기사에게 반려함)
- `completed`: 완료 (사무실에서 최종 승인)

## 기술 스택

### Frontend
- React + TypeScript
- Tailwind CSS (Material Design 기반)
- Shadcn UI Components
- TanStack Query (React Query)
- Noto Sans KR 폰트 (한글 지원)

### Backend
- Express.js
- PostgreSQL (Neon serverless)
- Drizzle ORM
- Zod validation
- Multer (파일 업로드)

### 데이터 모델
- Reports: 파손 보고서
- Cargo: 컨테이너/화물 마스터 데이터
- Vehicles: 차량/운송기사 정보
- Field Staff: 현장 담당자 정보
- Office Staff: 사무실 담당자 정보
- Admin Staff: 관리자 정보

## 색상 시스템
- **운송기사 (Driver)**: 오렌지색 (`chart-3` / `driver`)
- **현장 책임자 (Field)**: 보라색 (`chart-2` / `field`)
- **사무실 책임자 (Office)**: 파란색 (`chart-1` / `office` / `primary`)
- **승인 (Success)**: 녹색 (`chart-4`)
- **반려 (Destructive)**: 빨간색 (`destructive`)

## API 엔드포인트

### Master Data
- `GET /api/data/cargo` - 컨테이너/화물 목록
- `GET /api/data/vehicles` - 차량/기사 목록
- `GET /api/data/field-staff` - 현장 담당자 목록
- `GET /api/data/office-staff` - 사무실 담당자 목록
- `GET /api/data/admin-staff` - 관리자 목록
- `POST /api/data/cargo/bulk` - 화물 일괄 업로드 (CSV, 기존 데이터에 추가)
- `POST /api/data/vehicles/bulk` - 차량 일괄 업로드 (CSV, 기존 데이터에 추가)
- `POST /api/data/field-staff/bulk` - 현장 담당자 일괄 업로드 (CSV, 기존 데이터에 추가)
- `POST /api/data/office-staff/bulk` - 사무실 담당자 일괄 업로드 (CSV, 기존 데이터에 추가)
- `POST /api/data/cargo/replace` - 화물 데이터 교체 (직접 편집, 전체 데이터 교체)
- `POST /api/data/vehicles/replace` - 차량 데이터 교체 (직접 편집, 전체 데이터 교체)
- `POST /api/data/field-staff/replace` - 현장 담당자 데이터 교체 (직접 편집, 전체 데이터 교체)
- `POST /api/data/office-staff/replace` - 사무실 담당자 데이터 교체 (직접 편집, 전체 데이터 교체)

### Reports
- `GET /api/reports` - 전체 보고서 조회
- `POST /api/reports` - 새 보고서 작성 (기사)
- `PUT /api/reports/:id/resubmit` - 보고서 재제출 (기사)
- `PUT /api/reports/:id/field-review` - 현장 검토 (승인/반려)
- `PUT /api/reports/:id/office-approve` - 사무실 최종 승인
- `GET /api/reports/:id/download` - 확인서 PDF 다운로드 (Noto Sans KR 폰트 사용)

### 파일 업로드
- `POST /api/upload/damage-photo` - 파손 사진 업로드 (최대 5MB, JPG/PNG/WEBP)

### Authentication
- `POST /api/auth/driver-login` - 운송기사 로그인
- `POST /api/auth/field-login` - 현장 책임자 로그인
- `POST /api/auth/office-login` - 사무실 책임자 로그인
- `POST /api/auth/admin-login` - 관리자 로그인

## 사용자 인증
모든 역할의 사용자가 로그인하여 시스템을 사용합니다:

### 운송기사 로그인
- 차량번호: 드롭다운에서 선택
- 비밀번호: 연락처 번호에서 하이픈(-)을 제거한 숫자

예시:
- 연락처: 010-9942-1118
- 비밀번호: 01099421118

### 현장 책임자 로그인
- 담당자: 드롭다운에서 선택
- 비밀번호: 연락처 번호에서 하이픈(-)을 제거한 숫자

예시:
- 연락처: 010-2384-1156
- 비밀번호: 01023841156

### 사무실 책임자 로그인
- 담당자: 드롭다운에서 선택
- 비밀번호: 연락처 번호에서 하이픈(-)을 제거한 숫자

예시:
- 연락처: 010-4941-7742
- 비밀번호: 01049417742

### 관리자 로그인
- 담당자: 드롭다운에서 선택
- 비밀번호: 연락처 번호에서 하이픈(-)을 제거한 숫자

예시:
- 이름: 천일요비
- 연락처: 010-1111-1111
- 비밀번호: 01011111111

## 샘플 데이터

### 컨테이너
- TCLU8239466 / CHL20251001
- MSKU4598321 / CHL20251002
- TEMU6198324 / CHL20251003

### 차량/기사
- 89하1234 - 박영호 (010-9942-1118)
- 81머5532 - 최민재 (010-7102-9983)
- 83기9224 - 오세민 (010-2994-8821)

### 현장 담당자
- 김도훈 (010-2384-1156)
- 장지윤 (010-5529-6681)
- 정현준 (010-7132-2248)

### 사무실 담당자
- 이수진 (010-4941-7742)
- 박지연 (010-9321-4482)
- 김민하 (010-844-9931)

### 관리자
- 천일요비 (010-1111-1111)

## 회사 정보
**천일국제물류 (株)天 一 國 際 物 流**
- 주소: 경기도 평택시 포승읍 평택항로 95
- 전화: 031-683-7040
- 팩스: 031-683-7044
- 슬로건: 수입에서 통관하여 배송까지 천일국제물류에서 책임집니다

## 최근 업데이트 (2025-10-24)

### 완료된 기능
1. **PostgreSQL 데이터베이스 마이그레이션** - Neon 서버리스 PostgreSQL로 전환, Drizzle ORM 사용
2. **CSV 일괄 업로드** - 관리자가 마스터 데이터를 CSV 파일로 일괄 등록/수정 가능
3. **파손 사진 업로드** - 운송기사가 보고서 작성 시 최대 5장의 파손 사진 첨부 가능
4. **탭 기반 대시보드 구성** - 모든 역할의 대시보드를 상태별 탭으로 재구성:
   - 운송기사: 검토대기, 검토완료, 승인완료, 반려 (4개 탭)
   - 현장 책임자: 검토대기, 승인대기, 승인완료, 반려 (4개 탭)
   - 사무실 책임자: 승인대기, 승인완료 (2개 탭)
5. **사무실 반려 기능** - 사무실에서 보고서를 반려하여 현장 재검토 요청 가능
6. **시간 정보 표시** - 모든 상세 다이얼로그에서 각 단계별 제출/승인/반려 시간 표시
7. **최신순 정렬** - 모든 탭의 보고서를 해당 상태의 시간 기준 최신순으로 정렬
8. **현장 및 사무실 로그인 기능** - 운송기사뿐만 아니라 현장 책임자와 사무실 책임자도 로그인하여 시스템 사용 가능
   - 현장 책임자: 담당자 선택 + 비밀번호(연락처) 입력으로 로그인
   - 사무실 책임자: 담당자 선택 + 비밀번호(연락처) 입력으로 로그인
   - 대시보드 헤더에 로그인한 사용자 정보 표시
   - 로그아웃 버튼으로 역할 선택 화면으로 복귀
9. **전체 액션 히스토리 시스템** - 모든 보고서의 전체 처리 이력을 JSONB 형태로 저장 및 표시
   - JSONB actionHistory 컬럼으로 여러 번의 반려/재제출 이력 누적 저장
   - 각 액션마다 담당자명, 역할, 타임스탬프, 반려 사유 기록
   - ReportCard에 시간 순서대로 액션 히스토리 표시 (아이콘, 담당자, 시간, 사유)
   - 로그인한 사용자 정보를 자동으로 히스토리에 포함
   - 서명은 제출/재제출/승인 시에만 입력, 반려 시에는 서명 불필요
10. **관리자 로그인 기능** - 관리자도 로그인하여 AdminDashboard 사용 가능
   - AdminStaff 테이블 추가 (id, name, phone)
   - POST /api/auth/admin-login 엔드포인트 추가
   - AdminLogin 컴포넌트 생성 (다른 역할과 동일한 디자인 패턴)
   - 초기 관리자 데이터: 천일요비 (010-1111-1111)
   - 비밀번호: 연락처 번호에서 하이픈 제거 (예: 01011111111)
11. **직접 편집 기능 (Excel 붙여넣기 지원)** - 관리자가 테이블에서 직접 데이터를 편집하고 Excel에서 복사한 데이터를 붙여넣을 수 있음
   - 편집 모드, 행 추가/삭제, 셀 편집 기능
   - Excel/Google Sheets에서 복사한 데이터를 Ctrl+V로 붙여넣기
   - POST /api/data/:type/replace 엔드포인트 - 트랜잭션 기반 전체 데이터 교체
   - CSV 업로드(/bulk)와 직접 편집(/replace)의 분리된 API 경로
   - 엄격한 검증: 필수 필드 누락 시 행 번호를 포함한 명확한 에러 메시지
   - Insert schema만 전송하여 데이터 중복 방지 (id, timestamp 제거)
12. **푸터 추가** - 모든 페이지 하단에 회사 정보 푸터 표시
   - "2025 ©CHUNIL. Copyright All Rights Reserved www.chunilkor.co.kr"
   - 웹사이트 링크는 새 탭에서 열림 (rel="noopener noreferrer")
   - flex-col min-h-screen 레이아웃으로 푸터가 항상 페이지 하단에 위치
   - Footer 컴포넌트를 생성하여 모든 페이지에 추가 완료
13. **PDF 다운로드 기능** - 완료된 보고서를 전문적인 PDF 문서로 다운로드
   - PDFKit 라이브러리 사용하여 PDF 생성
   - Noto Sans CJK 폰트 번들링으로 한글 및 한자 완벽 지원 (株天一國際物流)
   - 세련된 디자인: 적절한 여백, 줄 간격, 폰트 크기 차별화 (20/16/13/11/9pt)
   - 최적화된 간격: 주요 섹션 1.8, 서브 섹션 1.0, 최소 푸터 간격 0.8
   - 템플릿 내용: 회사 정보, 보고서 정보, 내용(운송기사/현장책임자/사무실책임자), 비고, 서명
   - 회사 슬로건 및 웹사이트 URL (www.chunilkor.co.kr) 포함
   - 구분선과 섹션 헤더로 명확한 정보 구조화
   - 파일명 형식: `DAMAGE_{컨테이너번호}.pdf`
   - 단일 A4 페이지에 최적화된 레이아웃
14. **완전한 반응형 디자인** - 모든 대시보드가 모바일, 태블릿, 데스크톱에서 최적화
   - 모든 탭에서 하드코딩된 픽셀 너비 제거 (768px, 512px 등)
   - Tailwind 반응형 클래스 사용: 모바일 `w-full`, 데스크톱 `md:max-w-*`
   - DriverDashboard: 4개 탭 + 버튼이 모바일에서 세로 배치, 데스크톱에서 가로 배치
   - FieldDashboard: 4개 탭 (검토대기/승인대기/승인완료/반려) 반응형
   - OfficeDashboard: 2개 탭 (승인대기/승인완료) 반응형
   - AdminDashboard: 4개 탭 (차량/화물/현장/사무실) 반응형
   - 모든 버튼과 컨트롤이 모바일에서 터치 친화적
15. **전자서명 기능** - HTML5 Canvas 기반 전자서명 입력 및 표시
   - SignatureCanvas 컴포넌트: 반응형 캔버스 드로잉, 터치/마우스 지원, base64 PNG 변환
   - 운송기사: 보고서 제출 및 재제출 시 서명 입력
   - 현장 책임자: 승인 시 서명 입력
   - 사무실 책임자: 최종 승인 시 서명 입력
   - actionHistory에 각 액션의 서명을 base64 이미지로 저장
   - ReportCard에서 액션 히스토리의 서명을 썸네일로 표시 (60x30px)
   - PDF 생성 시 각 역할(driver, field, office)별 마지막 서명을 이미지로 삽입
   - 반응형 캔버스: 컨테이너 크기에 맞춰 해상도 자동 조정
   - 리사이즈 이벤트 처리로 모바일/태블릿/데스크톱 모든 화면에서 정확한 좌표 드로잉
   - 터치 스크롤 방지 (touch-none) 및 crosshair 커서로 사용성 개선

### 보류된 기능
- **이메일 알림 시스템** - 사용자가 이메일 통합을 취소함. 향후 구현을 원하는 경우 Resend 또는 SendGrid 연동 필요

### 다음 단계
- 분석 대시보드 (통계 및 차트)
- 검색 및 필터링 시스템

## 푸터 (Footer)
- 모든 페이지 하단에 회사 정보 푸터 표시
- "2025 ©CHUNIL. Copyright All Rights Reserved www.chunilkor.co.kr"
- 웹사이트 링크는 새 탭에서 열림 (rel="noopener noreferrer")
- flex-col min-h-screen 레이아웃으로 푸터가 항상 페이지 하단에 위치
- 모든 페이지에 일관되게 적용:
  - RoleSelection
  - 모든 로그인 페이지 (Driver, Field, Office, Admin)
  - 모든 대시보드 페이지 (Driver, Field, Office, Admin)

## 개발 노트
- 한글 폰트: Noto Sans KR 사용
- 모든 UI 텍스트는 한글로 표시
- Material Design 원칙 적용
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 역할별 색상 구분으로 직관적인 UX
- 업로드된 사진은 `attached_assets/damage_photos/` 디렉토리에 저장됨
