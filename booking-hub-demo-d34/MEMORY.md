# booking-hub-demo-d34 - 시연용 완성본 (Day 34)

## 현재 상태
- **프로젝트**: Day 34 - 시연용 완성본 (강사용 데모)
- **목적**: 학생이 Day 32-33 프롬프트로 만든 것과 동일 결과 제시
- **배포**: http://localhost:5173 (npm run dev 실행 중)

## 시연 준비 체크리스트 [2/3] ⏳

### ✅ 완료
1. [x] **코드 준비** - 빌드 + npm install 완료
2. [x] **환경변수** - `.env` 복사 완료 (강사 Supabase 열쇠)
3. [x] **개발 서버** - http://localhost:5173 실행 중

### ⏳ 대기 (강사 Supabase 콘솔에서)
4. [ ] **SQL 초기화** - 2개 스크립트 순서대로 실행
   - `10_판정_컬럼.sql` - 테이블에 decision, reason, options 컬럼 추가
   - `20_리얼타임_켜기.sql` - bookings 테이블 Realtime 활성화
5. [ ] **서버 재시작** - SQL 적용 후 `npm run dev`

## 시연 순서 (7분)

### 판정 1 - 빈 칸 검증
1. **예약추가** 폼에서 고객사 칸을 비운다
2. 버튼이 파랑(ask) / 잠김
3. 고객사를 채우면 초록(book) / 활성화

### 판정 2 - 자동 판정 + 실시간 대시보드
1. **브라우저 창 2개** - 왼쪽 대시보드 / 오른쪽 예약목록
2. **예약추가** 4줄 (20_오후.md 표 참고)
   - 대조 카드 가/나/다/라
   - 날짜: 2026-09-08, 2026-09-10
3. **줄마다 판정 버튼** 클릭
   - 노랑(needs_human) = 만석 - 가능한 곳 옵션 목록
   - 초록(auto) = 자동 확정 + 상태도 confirmed로 변경
   - 빨강(blocked) = 취소 / 모순
   - 파랑(asking) = 시간 정보 부족
4. **왼쪽 대시보드** - 새로고침 없이 실시간 갱신 (Realtime)
5. **"전부 판정" 버튼** - 대기 카드들 한 번에 처리

### 스토리 마무리
- 노랑 카드 클릭 → 옵션 목록 표시
- "고르는 건 사람, 월요일부터 예측" (머신러닝 예고)

## 필요한 기능별 파일

| 기능 | 파일 | 상태 |
|------|------|------|
| 빈 칸 검증 | `src/lib/judge.ts` + `BookingForm.tsx` | ✅ 구현됨 |
| 리소스 상수 | `src/lib/resources.ts` | ✅ 구현됨 |
| 판정 로직 | `src/lib/decide.ts` + `BookingTable.tsx` | ✅ 구현됨 |
| 실시간 보드 | `src/components/StatusBoard.tsx` | ✅ 구현됨 |
| Google OAuth | `src/components/LoginPage.tsx` | ✅ (변경 없음) |
| Google Calendar | `src/lib/googleCalendarService.ts` | ✅ (변경 없음) |
| Slack 알림 | 벡엔드 | ✅ (변경 없음) |

## 만약 깨진다면

**증상 1**: "Supabase에 연결할 수 없음" 
- → SQL 초기화가 안 된 것
- → Supabase 콘솔 SQL Editor에서 두 파일을 순서대로 Run

**증상 2**: "대시보드가 갱신 안 된다"
- → `20_리얼타임_켜기.sql`이 안 됐거나 부분 실행됨
- → 콘솔에서 `ALTER TABLE bookings REPLICA IDENTITY FULL` 확인

**증상 3**: 기타 에러
- → 브라우저 개발자 도구 F12 Console 탭 확인
- → `/tmp/vite-demo.log` 콘솔 로그 확인

## 핵심 코드 차이 (Day 32 vs Day 34)

Day 32 프롬프트 결과 기준으로, Day 34에 추가:
- `decide()` 함수에 `allBookings` 인자 (규칙 4 - 같은 시각 같은 곳 대조)
- `now` 인자 (검증용 고정 시각)
- 학생 코드와 동작은 같음

## 최종 체크

서버가 http://localhost:5173 에서 떠있고, 폼이 보이면 시연 시작 준비 완료입니다.

