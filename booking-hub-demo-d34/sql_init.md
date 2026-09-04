# booking-hub-demo-d34 Supabase 초기화

## 상황

현재 `booking-hub` 강사 프로젝트의 Supabase `bookings` 테이블에 아래 컬럼이 있습니다:

```
- id (PK)
- customer
- service
- date
- time
- address
- status
- created_at
```

이 데모에 필요한 추가 컬럼 3개를 만들어야 합니다.

## 초기화 순서 (강사 Supabase 콘솔에서)

### 1단계: 판정 컬럼 추가

Supabase 대시보드 → SQL Editor → 아래 코드 실행

```sql
-- 10_판정_컬럼.sql
ALTER TABLE bookings
ADD COLUMN decision VARCHAR DEFAULT NULL,
ADD COLUMN reason TEXT DEFAULT NULL,
ADD COLUMN options TEXT DEFAULT NULL;
```

**확인**: Table Editor에서 bookings 테이블에 3개 컬럼이 보이면 OK

---

### 2단계: Realtime 활성화

SQL Editor → 아래 코드 순서대로 실행

```sql
-- 20_리얼타임_켜기.sql
-- Step 1: REPLICA IDENTITY 설정 (INSERT/UPDATE/DELETE 추적 가능)
ALTER TABLE bookings REPLICA IDENTITY FULL;

-- Step 2: 리플리케이션 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

**확인**: 실행 후 에러 없으면 OK

---

## 시연 시작 전 마지막 체크

```bash
# 터미널에서 (demo-d34 폴더)
npm run dev
```

브라우저에서 http://localhost:5173 열어서:
- 예약추가 폼이 보이면 ✅ 준비 완료

---

## 만약 이미 bookings 테이블에 있는 컬럼이 있다면?

SQL Editor에서 이 코드로 확인:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

결과에 `decision`, `reason`, `options`이 있으면 생략 가능합니다.

