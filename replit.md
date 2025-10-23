# 컨테이너 DAMAGE 확인서 시스템

## 프로젝트 개요
천일국제물류(天一國際物流)의 컨테이너 파손 확인서 관리 시스템입니다. 운송기사, 현장 책임자, 사무실 책임자의 3단계 승인 워크플로우를 통해 컨테이너 파손 보고서를 체계적으로 관리합니다.

## 주요 기능

### 1. 역할 기반 시스템
- **운송기사**: 파손 보고서 작성 및 제출, 반려된 보고서 수정 및 재제출
- **현장 책임자**: 기사 보고서 검토, 승인 또는 반려
- **사무실 책임자**: 최종 승인 및 확인서 문서 생성

### 2. 워크플로우
```
운송기사 제출 → 현장 검토 (승인/반려) → 사무실 최종 승인 → 완료
                      ↓
                  반려 시 재제출 가능
```

### 3. 보고서 상태
- `draft`: 작성중
- `driver_submitted`: 현장대기 (기사가 제출함)
- `field_submitted`: 사무실대기 (현장이 승인함)
- `rejected`: 반려됨 (현장에서 반려)
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
- In-memory storage (MemStorage)
- Zod validation

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

### Reports
- `GET /api/reports` - 전체 보고서 조회
- `POST /api/reports` - 새 보고서 작성 (기사)
- `PUT /api/reports/:id/resubmit` - 보고서 재제출 (기사)
- `PUT /api/reports/:id/field-review` - 현장 검토 (승인/반려)
- `PUT /api/reports/:id/office-approve` - 사무실 최종 승인
- `GET /api/reports/:id/download` - 확인서 다운로드

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

## 개발 노트
- 한글 폰트: Noto Sans KR 사용
- 모든 UI 텍스트는 한글로 표시
- Material Design 원칙 적용
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 역할별 색상 구분으로 직관적인 UX
