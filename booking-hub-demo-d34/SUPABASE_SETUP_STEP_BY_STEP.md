# Supabase SQL 초기화 (강사용) - 단계별 가이드

## 상황

`bookings` 테이블에 3개 컬럼(decision, reason, options)이 필요하고, Realtime 구독을 활성화해야 합니다.

---

## 1단계: Supabase 대시보드 접속

1. **브라우저**에서 https://supabase.com 로그인
2. **강사 프로젝트** 선택 (이름 또는 URL: mlnnnfrpjpuomhhzwuiv)
3. 왼쪽 사이드바 메뉴에서 **SQL Editor** 클릭

   ![위치: 왼쪽 메뉴 > SQL Editor]

---

## 2단계: 첫 번째 SQL - 판정 컬럼 추가

### 쿼리 작성

SQL Editor에 아래 코드를 **복사 붙여넣기**:

```sql
ALTER TABLE bookings
ADD COLUMN decision VARCHAR DEFAULT NULL,
ADD COLUMN reason TEXT DEFAULT NULL,
ADD COLUMN options TEXT DEFAULT NULL;
```

### 실행

- **실행 버튼** 클릭 (우측 상단의 ▶ 버튼 또는 `Ctrl+Enter`)

### 확인

- 메시지 확인: "Query executed successfully" ✅
- 에러 없으면 OK

---

## 3단계: 두 번째 SQL - Realtime 활성화

### 새 쿼리창 만들기

SQL Editor 상단의 **+ New Query** 버튼 클릭 (또는 새 탭)

### 3-1. REPLICA IDENTITY 설정

다음 코드를 붙여넣기:

```sql
ALTER TABLE bookings REPLICA IDENTITY FULL;
```

**실행** → "Query executed successfully" 확인

### 3-2. 리플리케이션 활성화

새 쿼리창에 다음 코드를 붙여넣기:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

**실행** → "Query executed successfully" 확인

---

## 4단계: 확인 (Table Editor)

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 테이블 목록에서 **bookings** 선택
3. **Columns** 탭 확인

### 보이는 컬럼 (예상)

```
✓ id
✓ created_at
✓ customer
✓ service
✓ date
✓ time
✓ status
✓ address
✓ decision       ← 새로 추가됨
✓ reason         ← 새로 추가됨
✓ options        ← 새로 추가됨
```

---

## ✅ 완료

이제 돌아와서 **브라우저**를 열어서:

```
http://localhost:5173 → F5 새로고침
```

"예약 관리 허브" 화면이 정상 로드되면 시연 준비 완료!

---

## 🆘 에러 나면?

| 에러 | 해결법 |
|------|--------|
| "Column already exists" | 이미 컬럼이 있다는 뜻 → OK, 다음 단계로 |
| "Permission denied" | SQL Editor 권한 없음 → Supabase 관리자 권한 확인 |
| 다른 에러 | 메시지 전체 복사 후 물어보기 |

