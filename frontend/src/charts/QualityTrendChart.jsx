import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function QualityTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 text-sm">
        Complete workouts to view form quality score trajectory.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262833" vertical={false} />
          <XAxis
            dataKey="day_name"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            domain={[40, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#181920',
              borderColor: '#262833',
              borderRadius: '12px',
              color: '#F3F4F6'
            }}
            formatter={(value) => [`${value} / 100`, 'Avg Quality']}
          />
          <Line
            type="monotone"
            dataKey="avg_quality"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6, fill: '#34D399' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
