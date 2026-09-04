import { useState, useEffect } from 'react';

interface WorkflowGraphProps {
  bookings: any[];
  lastDecision?: { timestamp: number; from: string; to: string };
}

const nodeColors: { [key: string]: string } = {
  'intake': '#f3f4f6',
  'pending': '#e5e7eb',
  'judge': '#ffffff',
  'confirmed_auto': '#dcfce7',
  'confirmed_human': '#dcfce7',
  'review': '#fef3c7',
  'rejected': '#fee2e2',
  'asking': '#dbeafe',
};

const nodeBorders: { [key: string]: string } = {
  'intake': '#000000',
  'pending': '#000000',
  'judge': '#000000',
  'confirmed_auto': '#16a34a',
  'confirmed_human': '#16a34a',
  'review': '#000000',
  'rejected': '#000000',
  'asking': '#000000',
};

export function WorkflowGraph({ bookings, lastDecision }: WorkflowGraphProps) {
  const nodes = [
    { id: 'intake', label: '접수', x: 50, y: 150 },
    { id: 'pending', label: '대기', x: 150, y: 150 },
    { id: 'judge', label: '판정', x: 250, y: 150 },
    { id: 'confirmed_auto', label: '확정-자동', x: 350, y: 50 },
    { id: 'confirmed_human', label: '확정-수동', x: 350, y: 150 },
    { id: 'review', label: '검토', x: 350, y: 250 },
    { id: 'rejected', label: '기각', x: 450, y: 100 },
    { id: 'asking', label: '질문', x: 450, y: 200 },
  ];

  const edges = [
    { from: 'intake', to: 'pending' },
    { from: 'pending', to: 'judge' },
    { from: 'judge', to: 'confirmed_auto' },
    { from: 'judge', to: 'confirmed_human' },
    { from: 'judge', to: 'review' },
    { from: 'judge', to: 'rejected' },
    { from: 'judge', to: 'asking' },
    { from: 'review', to: 'confirmed_human' },
    { from: 'asking', to: 'pending' },
    { from: 'confirmed_human', to: 'pending' },
  ];

  const countByDecision: { [key: string]: number } = {
    'intake': 0,
    'pending': 0,
    'confirmed_auto': 0,
    'confirmed_human': 0,
    'review': 0,
    'rejected': 0,
    'asking': 0,
  };

  bookings.forEach((b) => {
    if (b.status === 'confirmed' && b.decision === 'confirmed_auto') {
      countByDecision['confirmed_auto']++;
    } else if (b.status === 'confirmed' && b.decision === 'confirmed_human') {
      countByDecision['confirmed_human']++;
    } else if (b.decision === 'review') {
      countByDecision['review']++;
    } else if (b.decision === 'rejected') {
      countByDecision['rejected']++;
    } else if (b.decision === 'asking') {
      countByDecision['asking']++;
    } else {
      countByDecision['pending']++;
    }
  });

  const isRecentTransition = (from: string, to: string) => {
    if (!lastDecision) return false;
    const now = Date.now();
    return lastDecision.from === from && lastDecision.to === to && now - lastDecision.timestamp < 2000;
  };

  return (
    <svg width="100%" height="400" className="bg-white border border-gray-300 rounded-lg">
      {/* Draw edges */}
      {edges.map((edge, idx) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return null;

        const isRecent = isRecentTransition(edge.from, edge.to);
        const strokeWidth = isRecent ? 4 : 2;
        const strokeDasharray = isRecent ? 'none' : 'none';

        return (
          <g key={idx}>
            <line
              x1={fromNode.x + 40}
              y1={fromNode.y}
              x2={toNode.x - 40}
              y2={toNode.y}
              stroke="#000"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      })}

      {/* Arrow marker */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#000" />
        </marker>
      </defs>

      {/* Draw nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="35"
            fill={nodeColors[node.id]}
            stroke={nodeBorders[node.id]}
            strokeWidth="2"
          />
          <text x={node.x} y={node.y - 10} textAnchor="middle" fontSize="11" fontWeight="bold">
            {node.label}
          </text>
          <text x={node.x} y={node.y + 8} textAnchor="middle" fontSize="16" fontWeight="bold">
            {countByDecision[node.id] || 0}
          </text>
        </g>
      ))}
    </svg>
  );
}
