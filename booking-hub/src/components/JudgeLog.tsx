import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LogEntry {
  id: number;
  customer: string;
  decision: string;
  trace: string;
  timestamp: number;
}

const decisionBadgeColor: { [key: string]: string } = {
  'pending': 'bg-gray-200 text-gray-800',
  'confirmed_auto': 'bg-green-100 text-green-800',
  'confirmed_human': 'bg-green-100 text-green-800',
  'review': 'bg-yellow-100 text-yellow-800',
  'rejected': 'bg-red-100 text-red-800',
  'asking': 'bg-blue-100 text-blue-800',
};

export function JudgeLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Realtime 구독 비활성화 (decision/trace 필드 미존재)
  }, []);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-3">판정 로그 (최근 12건)</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={`${log.id}-${log.timestamp}`} className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{log.customer}</span>
              <span className={`px-2 py-1 rounded text-sm font-semibold ${decisionBadgeColor[log.decision] || 'bg-gray-100'}`}>
                {log.decision}
              </span>
              <span className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            {log.trace && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {log.trace.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
