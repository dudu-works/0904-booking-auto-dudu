import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { DecisionType } from '../lib/decide';
import { decide } from '../lib/decide';

interface Booking {
  id: number;
  customer: string;
  kind: string;
  date: string;
  slots_wanted: string;
  decision: DecisionType;
  reason: string;
  options?: string;
  candidate?: string;
  trace?: string;
  slot_assigned?: string;
}

interface StatusBoardProps {
  refreshKey?: number;
  onRefresh?: () => void;
}

const decisionBadgeColor: { [key in DecisionType]: string } = {
  'pending': 'bg-gray-200 text-gray-800',
  'confirmed_auto': 'bg-green-100 text-green-800',
  'confirmed_human': 'border-2 border-green-600 text-green-800 bg-white',
  'review': 'bg-yellow-100 text-yellow-800',
  'rejected': 'bg-red-100 text-red-800',
  'asking': 'bg-blue-100 text-blue-800',
};

export function StatusBoard({ refreshKey = 0, onRefresh }: StatusBoardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .in('decision', ['pending', 'review', 'rejected', 'asking'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('조회 실패:', error);
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [refreshKey]);

  const handleConfirm = async (id: number) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking || !booking.candidate) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        decision: 'confirmed_human',
        slot_assigned: booking.candidate,
      })
      .eq('id', id);

    if (!error) {
      fetchBookings();
      onRefresh?.();
    }
  };

  const handleReviewChoice = async (id: number, chosenCustomer: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking || !booking.options) return;

    const customers = booking.options.split(',');
    const otherCustomer = customers.find((c) => c !== chosenCustomer);

    const chosenBooking = bookings.find((b) => b.customer === chosenCustomer && b.date === booking.date);
    const otherBooking = bookings.find((b) => b.customer === otherCustomer && b.date === booking.date);

    if (chosenBooking) {
      const { error: chosenError } = await supabase
        .from('bookings')
        .update({
          decision: 'confirmed_human',
          slot_assigned: chosenBooking.candidate,
        })
        .eq('id', chosenBooking.id);

      if (chosenError) {
        console.error('확정 실패:', chosenError);
        return;
      }
    }

    if (otherBooking) {
      const { error: otherError } = await supabase
        .from('bookings')
        .update({
          decision: 'pending',
          candidate: otherBooking.candidate,
        })
        .eq('id', otherBooking.id);

      if (otherError) {
        console.error('초기화 실패:', otherError);
      }
    }

    fetchBookings();
    onRefresh?.();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-600">미확정 예약이 없습니다</div>;
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">{booking.customer}</div>
              <button
                className={`px-3 py-1 rounded font-semibold cursor-pointer ${decisionBadgeColor[booking.decision]}`}
              >
                {booking.decision === 'pending' && '대기'}
                {booking.decision === 'confirmed_auto' && '자동확정'}
                {booking.decision === 'confirmed_human' && '확정'}
                {booking.decision === 'review' && '검토'}
                {booking.decision === 'rejected' && '거절'}
                {booking.decision === 'asking' && '질문'}
              </button>
            </div>
            <button
              onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {expandedId === booking.id ? '과정 숨기기' : '과정 보기'}
            </button>
          </div>

          <div className="text-gray-700 mb-3">{booking.reason}</div>

          {booking.decision === 'pending' && booking.candidate && (
            <button
              onClick={() => handleConfirm(booking.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              확정
            </button>
          )}

          {booking.decision === 'review' && booking.options && (
            <div className="space-y-2">
              {booking.options.split(',').map((customer) => (
                <button
                  key={customer}
                  onClick={() => handleReviewChoice(booking.id, customer)}
                  className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition text-left"
                >
                  {customer} - 이 쪽으로 확정
                </button>
              ))}
            </div>
          )}

          {expandedId === booking.id && booking.trace && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-1">
                {booking.trace.split('\n').map((line, idx) => (
                  <div key={idx}>
                    {line.match(/^\d+/) && <span className="font-semibold">{line.split(' ')[0]}.</span>} {line.replace(/^\d+ /, '')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
