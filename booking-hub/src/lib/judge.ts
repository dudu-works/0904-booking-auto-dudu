type SlotType = '오전' | '오후-1' | '오후-2';

interface JudgeInput {
  customer: string;
  kind: string;
  form: string;
  address: string;
  date: string;
  slots_wanted: SlotType[];
}

interface JudgeResult {
  route: 'ask' | 'book';
  message: string;
}

export function judge(input: JudgeInput): JudgeResult {
  const missing: string[] = [];

  if (!input.customer) missing.push('고객사');
  if (!input.kind) missing.push('종류');
  if (!input.form) missing.push('형태');
  if (!input.date) missing.push('날짜');
  if (input.slots_wanted.length === 0) missing.push('희망 슬롯');
  if (input.form === '외근' && !input.address) missing.push('위치');

  if (missing.length > 0) {
    return {
      route: 'ask',
      message: `빈 칸: ${missing.join(', ')}`,
    };
  }

  return {
    route: 'book',
    message: '예약 준비 완료',
  };
}
