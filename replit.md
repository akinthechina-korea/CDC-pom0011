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
- `POST /api/data/cargo/bulk` - 화물 일괄 업로드 (CSV)
- `POST /api/data/vehicles/bulk` - 차량 일괄 업로드 (CSV)
- `POST /api/data/field-staff/bulk` - 현장 담당자 일괄 업로드 (CSV)
- `POST /api/data/office-staff/bulk` - 사무실 담당자 일괄 업로드 (CSV)

### Reports
- `GET /api/reports` - 전체 보고서 조회
- `POST /api/reports` - 새 보고서 작성 (기사)
- `PUT /api/reports/:id/resubmit` - 보고서 재제출 (기사)
- `PUT /api/reports/:id/field-review` - 현장 검토 (승인/반려)
- `PUT /api/reports/:id/office-approve` - 사무실 최종 승인
- `GET /api/reports/:id/download` - 확인서 다운로드

### 파일 업로드
- `POST /api/upload/damage-photo` - 파손 사진 업로드 (최대 5MB, JPG/PNG/WEBP)

## 사용자 인증
운송기사는 차량번호와 비밀번호로 로그인합니다:
- 차량번호: 드롭다운에서 선택
- 비밀번호: 연락처 번호에서 하이픈(-)을 제거한 숫자

예시:
- 연락처: 010-9942-1118
- 비밀번호: 01099421118

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

## 회사 정보
**천일국제물류 (株)天 一 國 際 物 流**
- 주소: 경기도 평택시 포승읍 평택항로 95
- 전화: 031-683-7040
- 팩스: 031-683-7044
- 슬로건: 수입에서 통관하여 배송까지 천일국제물류에서 책임집니다

## 최근 업데이트 (2025-10-23)

### 완료된 기능
1. **PostgreSQL 데이터베이스 마이그레이션** - Neon 서버리스 PostgreSQL로 전환, Drizzle ORM 사용
2. **CSV 일괄 업로드** - 관리자가 마스터 데이터를 CSV 파일로 일괄 등록/수정 가능
3. **파손 사진 업로드** - 운송기사가 보고서 작성 시 최대 5장의 파손 사진 첨부 가능
4. **탭 기반 대시보드 구성** - 모든 역할의 대시보드를 상태별 탭으로 재구성:
   - 운송기사: 검토대기, 검토완료, 승인완료, 반려 (4개 탭)
   - 현장 책임자: 검토대기, 승인대기, 승인완료, 반려 (4개 탭)
   - 사무실 책임자: 승인대기, 승인완료, 반려 (3개 탭)
5. **사무실 반려 기능** - 사무실에서 보고서를 반려하여 현장 재검토 요청 가능
6. **시간 정보 표시** - 모든 상세 다이얼로그에서 각 단계별 제출/승인/반려 시간 표시
7. **최신순 정렬** - 모든 탭의 보고서를 해당 상태의 시간 기준 최신순으로 정렬

### 보류된 기능
- **이메일 알림 시스템** - 사용자가 이메일 통합을 취소함. 향후 구현을 원하는 경우 Resend 또는 SendGrid 연동 필요

### 다음 단계
- 분석 대시보드 (통계 및 차트)
- 검색 및 필터링 시스템

## 개발 노트
- 한글 폰트: Noto Sans KR 사용
- 모든 UI 텍스트는 한글로 표시
- Material Design 원칙 적용
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 역할별 색상 구분으로 직관적인 UX
- 업로드된 사진은 `attached_assets/damage_photos/` 디렉토리에 저장됨
