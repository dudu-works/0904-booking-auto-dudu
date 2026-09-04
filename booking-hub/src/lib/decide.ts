import { SlotType, SLOTS, NEED, requiredSlots, occupied } from './slots';

export type DecisionType = 'asking' | 'rejected' | 'review' | 'pending' | 'confirmed_auto' | 'confirmed_human';

export interface DecideResult {
  decision: DecisionType;
  reason: string;
  options?: string;
  candidate?: string;
  trace: string[];
}

export function decide(booking: any, allBookings: any[], autoOn: boolean): DecideResult {
  const trace: string[] = [];
  const result: Partial<DecideResult> = {};

  const { kind, date, slots_wanted: slotsWantedStr, customer } = booking;
  const slots_wanted: SlotType[] = slotsWantedStr
    ? slotsWantedStr.split(',').filter((s: string) => SLOTS.includes(s as SlotType)) as SlotType[]
    : [];

  trace.push('1 빈 칸 검사');
  const missing: string[] = [];
  if (!kind) missing.push('종류');
  if (!date) missing.push('날짜');
  if (slots_wanted.length === 0) missing.push('희망 슬롯');

  if (missing.length > 0) {
    trace[trace.length - 1] += `: ${missing.join(', ')}`;
    return {
      decision: 'asking',
      reason: `빈 칸: ${missing.join(', ')}`,
      trace,
    };
  }
  trace[trace.length - 1] += ': 없음';

  trace.push(`2 종류 ${kind} -> 필요한 칸 ${NEED[kind] || 1}개 (희망 ${slots_wanted.join(', ')})`);

  const occupiedSlots = occupied(date, allBookings.filter((b) => b.id !== booking.id && (b.decision === 'confirmed_auto' || b.decision === 'confirmed_human')));
  const availableSlots = SLOTS.filter((s) => !occupiedSlots.has(s));

  trace.push(`3 ${date} 달력: ${SLOTS.map((s) => `${s} ${occupiedSlots.has(s) ? 'X' : 'O'}`).join(', ')}`);

  const candidates: SlotType[][] = [];
  slots_wanted.forEach((wanted) => {
    const required = requiredSlots(kind, [wanted]);
    const canUse = required.every((r) => !occupiedSlots.has(r));
    if (canUse) {
      candidates.push(required);
    }
  });

  trace.push(`4 희망 순서대로 필요한 칸이 전부 O 인 후보: ${candidates.length > 0 ? candidates.map((c) => c.join('+')).join(' / ') : '없음'}`);

  if (candidates.length === 0) {
    const emptySlots = availableSlots.join(', ') || '없음';
    trace.push(`결과: 거절 - 희망 슬롯 전부 찼음. 빈 칸: ${emptySlots}`);
    return {
      decision: 'rejected',
      reason: '희망 슬롯 전부 찼음',
      options: emptySlots,
      trace,
    };
  }

  const firstCandidate = candidates[0];

  trace.push(`5 같은 날 대기 요청 비교`);
  const pendingOnSameDay = allBookings.filter(
    (b) => b.id !== booking.id && b.date === date && b.decision === 'pending' && b.candidate
  );

  let conflictFound = false;
  let conflictCustomer = '';

  for (const other of pendingOnSameDay) {
    const otherCandidates: SlotType[][] = [
      other.candidate.split('+') as SlotType[],
    ];
    if (otherCandidates.length === 1) {
      const otherCandidate = otherCandidates[0];
      const hasConflict = firstCandidate.some((slot) => otherCandidate.includes(slot));
      if (hasConflict) {
        conflictFound = true;
        conflictCustomer = other.customer;
        break;
      }
    }
  }

  if (conflictFound) {
    trace[trace.length - 1] += `: 겹치는 유일 후보 있음 (${conflictCustomer})`;
    trace.push(`결과: 검토 - 동점 (${conflictCustomer}) 도 같은 칸이 유일 후보`);
    return {
      decision: 'review',
      reason: `동점 - ${conflictCustomer} 도 같은 칸이 유일 후보`,
      options: `${customer},${conflictCustomer}`,
      trace,
    };
  }
  trace[trace.length - 1] += ': 겹치는 유일 후보 없음';

  const candidateStr = firstCandidate.join('+');
  if (autoOn) {
    trace.push(`결과: 확정-자동 - 빈 칸 ${candidateStr} 확정`);
    return {
      decision: 'confirmed_auto',
      reason: `빈 칸 ${candidateStr} 확정`,
      candidate: candidateStr,
      trace,
    };
  } else {
    trace.push(`결과: 대기 - 후보 ${candidateStr} (확정 버튼 대기)`);
    return {
      decision: 'pending',
      reason: `후보 ${candidateStr} - 확정 버튼 대기`,
      candidate: candidateStr,
      trace,
    };
  }
}
