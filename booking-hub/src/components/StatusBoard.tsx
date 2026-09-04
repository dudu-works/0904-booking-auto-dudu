import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Booking {
  id: number;
  customer: string;
  kind: string;
  form: string;
  memo: string;
  date: string;
  slots_wanted: string;
  status: string;
}

interface StatusBoardProps {
  refreshKey?: number;
  onRefresh?: () => void;
}

export function StatusBoard({ refreshKey = 0, onRefresh }: StatusBoardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
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

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchBookings();
      onRefresh?.();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-600">예약이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">고객사</th>
            <th className="border border-gray-300 px-4 py-2 text-left">종류</th>
            <th className="border border-gray-300 px-4 py-2 text-left">형태</th>
            <th className="border border-gray-300 px-4 py-2 text-left">메모</th>
            <th className="border border-gray-300 px-4 py-2 text-left">날짜</th>
            <th className="border border-gray-300 px-4 py-2 text-left">희망 슬롯</th>
            <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{booking.customer}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.kind}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.form}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.memo}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.date}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.slots_wanted || '-'}</td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  onClick={() => handleStatusToggle(booking.id, booking.status)}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer transition ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {booking.status === 'confirmed' ? 'confirmed' : 'pending'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
