import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { addEventToCalendar, getCalendarAccessToken } from '../lib/googleCalendarService';
import { judge } from '../lib/judge';
import { SLOTS, type Slot } from '../lib/slots';

interface BookingFormProps {
  onSuccess?: () => void;
  isAdmin?: boolean;
}

const KIND_OPTIONS = ['서울', '경기', '지방', '내부'] as const;
const FORM_OPTIONS = ['외근', '온라인'] as const;

const SLOT_LABELS: Record<Slot, string> = {
  '오전': '오전 10-12',
  '오후-1': '오후-1 13-15',
  '오후-2': '오후-2 15-17',
};

export function BookingForm({ onSuccess, isAdmin = false }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer: '',
    kind: '',
    form: '',
    memo: '',
    address: '',
    date: '',
  });
  const [slotsWanted, setSlotsWanted] = useState<Slot[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSlot = (slot: Slot) => {
    setSlotsWanted((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  // 일곱 칸 값이 하나라도 바뀔 때마다(= 매 렌더마다) 다시 판정한다
  const verdict = judge({
    customer: formData.customer,
    kind: formData.kind,
    form: formData.form,
    memo: formData.memo,
    address: formData.address,
    date: formData.date,
    slotsWanted,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 판정 1 - route가 book일 때만 저장한다
    if (verdict.route !== 'book') {
      setError(verdict.message);
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            customer: formData.customer,
            kind: formData.kind,
            form: formData.form,
            memo: formData.memo,
            service: formData.memo,
            address: formData.address,
            date: formData.date,
            time: '',
            slots_wanted: slotsWanted.join(','),
            decision: 'pending',
            status: 'pending',
            via: 'form',
          },
        ]);

      if (insertError) {
        setError(`예약 추가 실패: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Admin 유저만 Google Calendar에 등록
      if (isAdmin) {
        try {
          const accessToken = await getCalendarAccessToken();
          if (accessToken) {
            await addEventToCalendar(accessToken, {
              customer: formData.customer,
              service: formData.memo,
              date: formData.date,
              time: '',
              address: formData.address,
            });
          }
        } catch (calendarError) {
          console.warn('Google Calendar 등록 실패:', calendarError);
          // Calendar 등록 실패는 무시하고 예약만 진행
        }
      }

      setFormData({ customer: '', kind: '', form: '', memo: '', address: '', date: '' });
      setSlotsWanted([]);
      onSuccess?.();
    } catch (err) {
      setError(`예약 추가 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">새 예약 추가</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="customer"
          placeholder="고객사"
          value={formData.customer}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <select
          name="kind"
          value={formData.kind}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">종류 선택</option>
          {KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          name="form"
          value={formData.form}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">형태 선택</option>
          {FORM_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <input
        type="text"
        name="memo"
        placeholder="메모 (예: 미팅, 기획 회의)"
        value={formData.memo}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
      />

      <input
        type="text"
        name="address"
        placeholder={formData.form === '외근' ? '위치 (외근이면 필수)' : '위치 (온라인이면 비워도 됨)'}
        value={formData.address}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
      />

      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          희망 슬롯 (체크한 순서 = 우선순위)
        </div>
        <div className="flex gap-4">
          {SLOTS.map((slot) => {
            const order = slotsWanted.indexOf(slot);
            return (
              <label key={slot} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={order !== -1} onChange={() => toggleSlot(slot)} />
                {SLOT_LABELS[slot]}
                {order !== -1 && (
                  <span className="text-xs font-bold text-blue-600">({order + 1})</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 판정 줄 - route가 book이면 초록, ask이면 파랑 */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-2 py-1 rounded text-xs font-bold ${
            verdict.route === 'book'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {verdict.route}
        </span>
        <span className="text-sm text-gray-600">{verdict.message}</span>
      </div>

      <button
        type="submit"
        disabled={loading || verdict.route === 'ask'}
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '추가 중...' : '예약하기'}
      </button>
    </form>
  );
}
