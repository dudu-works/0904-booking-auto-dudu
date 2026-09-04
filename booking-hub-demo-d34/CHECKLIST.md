# 시연 준비 체크리스트

## 현재 상태

```
✅ 코드 준비
  - npm install 완료
  - build 완료  
  - dev 서버 실행: http://localhost:5173

✅ 환경설정
  - .env 복사 완료 (강사 Supabase 열쇠)

⏳ Supabase SQL 초기화 (아래 단계 진행 중)
```

---

## 📋 시연 전 체크리스트 (5분)

### [ ] 1단계: Supabase SQL 초기화

**가이드**: `SUPABASE_SETUP_STEP_BY_STEP.md` 참고

1. [ ] Supabase 대시보드 접속
   - https://supabase.com 로그인
   - 강사 프로젝트 선택

2. [ ] SQL Editor에서 첫 번째 SQL 실행
   ```sql
   ALTER TABLE bookings
   ADD COLUMN decision VARCHAR DEFAULT NULL,
   ADD COLUMN reason TEXT DEFAULT NULL,
   ADD COLUMN options TEXT DEFAULT NULL;
   ```
   - 버튼: ▶ 또는 Ctrl+Enter
   - 확인: "Query executed successfully" ✅

3. [ ] SQL Editor에서 두 번째 SQL 실행
   ```sql
   ALTER TABLE bookings REPLICA IDENTITY FULL;
   ```
   - 확인: "Query executed successfully" ✅

4. [ ] SQL Editor에서 세 번째 SQL 실행
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
   ```
   - 확인: "Query executed successfully" ✅

5. [ ] Table Editor에서 확인
   - bookings 테이블 선택
   - decision, reason, options 컬럼 있는지 확인 ✅

### [ ] 2단계: 브라우저 확인

1. [ ] http://localhost:5173 열기
2. [ ] F5 새로고침
3. [ ] 화면 확인
   - [ ] "예약 관리 허브" 제목 보임
   - [ ] 탭 5개 보임 (예약, 지도, 상태, 관리, 소개)
   - [ ] 예약추가 폼 보임

**이 상태면 시연 시작 가능!** ✅

---

## 🎬 시연 플로우

위 체크리스트 완료 후 → `DEMO_GUIDE.md` 참고

### Scene 1: 판정 1 - 빈 칸 검증 (2분)

### Scene 2: 판정 2 - 자동 판정 + Realtime 대시보드 (5분)

---

## 📚 참고 자료

| 파일 | 용도 |
|------|------|
| `SUPABASE_SETUP_STEP_BY_STEP.md` | SQL 초기화 단계별 가이드 ← 지금 이거 |
| `DEMO_GUIDE.md` | 7분 시연 플로우 |
| `sql_init.md` | SQL 코드만 모아놓은 파일 |
| `MEMORY.md` | 프로젝트 상태 요약 |

---

## 🆘 트러블슈팅

| 증상 | 해결법 |
|------|--------|
| "Column already exists" | 이미 컬럼이 있다 → 그냥 OK, 진행 |
| "Permission denied" | Supabase 권한 없음 → 관리자 확인 |
| 브라우저에 아무것도 안 보임 | `npm run dev` 재실행 → F5 새로고침 |
| "Supabase에 연결할 수 없음" | SQL 초기화 안 됨 → 다시 확인 |

---

## 최종 확인

```bash
# 서버 실행 확인
curl http://localhost:5173 | head -5
# → HTML이 나오면 OK ✅
```

