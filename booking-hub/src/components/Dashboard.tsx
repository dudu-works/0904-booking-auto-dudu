import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { decide } from '../lib/decide';
import { WorkflowGraph } from './WorkflowGraph';
import { JudgeLog } from './JudgeLog';
import { StatusCards } from './StatusCards';

export function Dashboard() {
  const [autoJudge, setAutoJudge] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDecision, setLastDecision] = useState<{ timestamp: number; from: string; to: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auto-judge');
    if (saved !== null) {
      setAutoJudge(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('auto-judge', JSON.stringify(autoJudge));
  }, [autoJudge]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('bookings-board')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
      }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleJudgeAll = async () => {
    const pendingBookings = bookings.filter((b) => b.status === 'pending');

    for (const booking of pendingBookings) {
      const decideResult = decide(booking, bookings, autoJudge);

      const updateData: any = {
        decision: decideResult.decision,
      };

      if (decideResult.reason) updateData.reason = decideResult.reason;
      if (decideResult.options) updateData.options = decideResult.options;
      if (decideResult.candidate) updateData.candidate = decideResult.candidate;
      if (decideResult.trace.length > 0) updateData.trace = decideResult.trace.join('\n');

      try {
        await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', booking.id);

        setLastDecision({
          timestamp: Date.now(),
          from: 'pending',
          to: decideResult.decision,
        });
      } catch (err) {
        console.error('판정 저장 실패:', err);
      }
    }

    fetchBookings();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoJudge}
              onChange={(e) => setAutoJudge(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-semibold">자동 판정</span>
          </label>
        </div>
        <button
          onClick={handleJudgeAll}
          className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        >
          전부 판정
        </button>
      </div>

      {/* Workflow Graph */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">워크플로우</h2>
        <WorkflowGraph bookings={bookings} lastDecision={lastDecision || undefined} />
      </div>

      {/* Judge Log */}
      <JudgeLog />

      {/* Status Cards */}
      <StatusCards bookings={bookings} />
    </div>
  );
}
