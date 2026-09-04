interface StatusCardsProps {
  bookings: any[];
}

const statusConfig: { [key: string]: { label: string; color: string } } = {
  'pending': { label: '대기', color: 'bg-gray-200 text-gray-800' },
  'confirmed_auto': { label: '확정-자동', color: 'bg-green-100 text-green-800' },
  'confirmed_human': { label: '확정-수동', color: 'bg-green-100 text-green-800' },
  'review': { label: '검토', color: 'bg-yellow-100 text-yellow-800' },
  'rejected': { label: '기각', color: 'bg-red-100 text-red-800' },
  'asking': { label: '질문', color: 'bg-blue-100 text-blue-800' },
};

export function StatusCards({ bookings }: StatusCardsProps) {
  const groupedByDecision: { [key: string]: any[] } = {
    'pending': [],
    'confirmed_auto': [],
    'confirmed_human': [],
    'review': [],
    'rejected': [],
    'asking': [],
  };

  bookings.forEach((b) => {
    const decision = b.decision || 'pending';
    if (groupedByDecision[decision]) {
      groupedByDecision[decision].push(b);
    }
  });

  return (
    <div className="grid grid-cols-6 gap-4 mt-6">
      {Object.entries(statusConfig).map(([key, config]) => {
        const items = groupedByDecision[key] || [];
        return (
          <div key={key} className="border border-gray-300 rounded-lg p-4">
            <div className={`${config.color} px-3 py-1 rounded font-semibold mb-3 text-center text-sm`}>
              {config.label} ({items.length})
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((booking) => (
                <div key={booking.id} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-semibold truncate">{booking.customer}</div>
                  <div className="text-gray-600">{booking.date}</div>
                  <div className="text-gray-600">{booking.kind} / {booking.form}</div>
                  <div className="text-gray-600 truncate">{booking.memo}</div>
                  {booking.slot_assigned && <div className="text-blue-600 font-semibold">{booking.slot_assigned}</div>}
                  {booking.reason && <div className="text-gray-600 line-clamp-2">{booking.reason}</div>}
                  {booking.options && <div className="text-gray-500 text-xs">{booking.options}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
