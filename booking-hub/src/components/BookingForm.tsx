import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { addEventToCalendar, getCalendarAccessToken } from '../lib/googleCalendarService';
import { judge } from '../lib/judge';
import { decide } from '../lib/decide';

type SlotType = '오전' | '오후-1' | '오후-2';

interface BookingFormProps {
  onSuccess?: () => void;
  isAdmin?: boolean;
}

export function BookingForm({ onSuccess, isAdmin = false }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [judgeResult, setJudgeResult] = useState({ route: '', message: '' });
  const [formData, setFormData] = useState({
    customer: '',
    kind: '',
    form: '',
    memo: '',
    address: '',
    date: '',
    slots_wanted: [] as SlotType[],
  });
  const [slotOrder, setSlotOrder] = useState<{ [key in SlotType]: number }>({
    '오전': 0,
    '오후-1': 0,
    '오후-2': 0,
  });

  const slots: SlotType[] = ['오전', '오후-1', '오후-2'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSlotToggle = (slot: SlotType) => {
    const isChecked = formData.slots_wanted.includes(slot);
    let newSlots: SlotType[];
    let newOrder: { [key in SlotType]: number } = { '오전': 0, '오후-1': 0, '오후-2': 0 };

    if (isChecked) {
      newSlots = formData.slots_wanted.filter((s) => s !== slot);
      newSlots.forEach((s, idx) => {
        newOrder[s] = idx + 1;
      });
    } else {
      newSlots = [...formData.slots_wanted, slot];
      newSlots.forEach((s, idx) => {
        newOrder[s] = idx + 1;
      });
    }

    setFormData((prev) => ({
      ...prev,
      slots_wanted: newSlots,
    }));
    setSlotOrder(newOrder);

    const result = judge({
      customer: formData.customer,
      kind: formData.kind,
      form: formData.form,
      address: formData.address,
      date: formData.date,
      slots_wanted: newSlots,
    });
    setJudgeResult(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = judge({
      customer: formData.customer,
      kind: formData.kind,
      form: formData.form,
      address: formData.address,
      date: formData.date,
      slots_wanted: formData.slots_wanted,
    });

    if (result.route !== 'book') {
      setJudgeResult(result);
      return;
    }

    const slotsWantedStr = formData.slots_wanted.map((slot) => slot).join(',');

    setLoading(true);
    try {
      const newBooking = {
        customer: formData.customer,
        kind: formData.kind,
        form: formData.form,
        memo: formData.memo,
        address: formData.address,
        date: formData.date,
        time: '',
        slots_wanted: slotsWantedStr,
        status: 'pending',
        service: formData.memo,
        via: 'form',
      };

      const { data: allBookingsData } = await supabase.from('bookings').select('*');
      const decideResult = decide(newBooking, allBookingsData || [], false);

      const { error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            ...newBooking,
            decision: decideResult.decision,
            reason: decideResult.reason,
            options: decideResult.options || null,
            candidate: decideResult.candidate || null,
            trace: decideResult.trace.join('\n'),
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
          await addEventToCalendar(accessToken, {
            customer: formData.customer,
            service: formData.memo,
            date: formData.date,
            time: '',
            address: formData.address,
          });
        } catch (calendarError) {
          console.warn('Google Calendar 등록 실패:', calendarError);
        }
      }

      setFormData({
        customer: '',
        kind: '',
        form: '',
        memo: '',
        address: '',
        date: '',
        slots_wanted: [],
      });
      setSlotOrder({ '오전': 0, '오후-1': 0, '오후-2': 0 });
      setJudgeResult({ route: '', message: '' });
      onSuccess?.();
    } catch (err) {
      setError(`예약 추가 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setLoading(false);
  };

  const result = judgeResult.route ? judgeResult : judge({
    customer: formData.customer,
    kind: formData.kind,
    form: formData.form,
    address: formData.address,
    date: formData.date,
    slots_wanted: formData.slots_wanted,
  });

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">새 예약 추가</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="customer"
          placeholder="고객사 *"
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
          <option value="">종류 선택 *</option>
          <option value="서울">서울</option>
          <option value="경기">경기</option>
          <option value="지방">지방</option>
          <option value="내부">내부</option>
        </select>
        <select
          name="form"
          value={formData.form}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">형태 선택 *</option>
          <option value="외근">외근</option>
          <option value="온라인">온라인</option>
        </select>
        <input
          type="text"
          name="memo"
          placeholder="메모 (예: 미팅, 기획 회의)"
          value={formData.memo}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          name="address"
          placeholder={`위치 ${formData.form === '외근' ? '*' : ''}`}
          value={formData.address}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 ${
            formData.form === '외근' ? 'border-gray-300' : 'border-gray-300'
          }`}
        />
      </div>

      <div className="mb-4">
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      <div className="mb-6">
        <p className="font-semibold mb-2">희망 슬롯 (체크 순서 = 우선순위) *</p>
        <div className="space-y-2">
          {slots.map((slot) => (
            <label key={slot} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.slots_wanted.includes(slot)}
                onChange={() => handleSlotToggle(slot)}
                className="mr-2"
              />
              <span className="mr-2">{slot} {slot === '오전' && '10-12'} {slot === '오후-1' && '13-15'} {slot === '오후-2' && '15-17'}</span>
              {slotOrder[slot] > 0 && <span className="text-blue-600 font-semibold">{slotOrder[slot]}</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        {result.message && (
          <div
            className={`px-4 py-3 rounded font-semibold ${
              result.route === 'ask'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {result.route === 'ask' && '⚠️'} {result.message}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || result.route !== 'book'}
        className={`w-full font-bold py-2 rounded transition ${
          result.route === 'book'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? '추가 중...' : '예약하기'}
      </button>
    </form>
  );
}
