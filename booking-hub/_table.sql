-- bookings 표 하나. Supabase SQL Editor 에 통째로 붙여넣고 Run.
-- 마지막 policy 두 줄까지 한 번에 붙여넣는다. 표만 만들고 멈추면 앱에서 아무것도 안 보인다.

create table bookings (
  id bigint generated always as identity primary key,
  customer text not null,
  service text not null,
  date text not null,
  time text not null,
  address text,
  status text not null default 'pending',
  via text not null default 'form',
  created_at timestamptz not null default now()
);

-- 슬롯 모델 마이그레이션 (260904 추가) - 예약추가 폼을 7칸 슬롯 모델로 바꾸면서
-- 필요해진 컬럼들. 코드는 이 컬럼들을 계속 요청해왔지만 표에는 없어서
-- INSERT/UPDATE가 400으로 계속 실패했다. 아래 6줄을 반드시 함께 실행한다.
alter table bookings add column if not exists kind text;
alter table bookings add column if not exists form text;
alter table bookings add column if not exists memo text;
alter table bookings add column if not exists slots_wanted text;
alter table bookings add column if not exists candidate text;
alter table bookings add column if not exists slot_assigned text;
alter table bookings add column if not exists decision text;
alter table bookings add column if not exists reason text;
alter table bookings add column if not exists options text;
alter table bookings add column if not exists trace text;

-- 원본 표는 service/date/time 을 not null 로 만들었는데, 슬롯 모델에서는
-- date 만 필수고 time 은 항상 빈 문자열, service 는 memo 를 복사해 넣는다.
-- 그래도 혹시 다른 경로로 NULL 이 들어오는 걸 막기 위해 제약은 유지한다.

-- 잠금을 켠다. 켜기만 하면 아무도 못 쓴다 - 그래서 필요한 문만 아래에서 연다.
alter table bookings enable row level security;

-- 오늘 만드는 앱은 로그인이 없다. 실습용으로 읽기·쓰기·수정 세 문을 연다.
-- 실제 서비스에서는 이렇게 열어두지 않는다. 로그인을 붙이는 회차에서 내 것만 보이게 좁힌다.
create policy "demo read" on bookings
  for select to anon
  using (true);

create policy "demo insert" on bookings
  for insert to anon
  with check (true);

create policy "demo update" on bookings
  for update to anon
  using (true)
  with check (true);
