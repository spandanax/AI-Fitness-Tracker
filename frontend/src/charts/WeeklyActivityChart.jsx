import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function WeeklyActivityChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 text-sm">
        No weekly activity recorded yet. Complete a workout to see stats!
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#181920',
              borderColor: '#262833',
              borderRadius: '12px',
              color: '#F3F4F6',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }}
            formatter={(value, name) => {
              if (name === 'total_reps') return [`${value} reps`, 'Reps'];
              if (name === 'calories') return [`${value} kcal`, 'Calories'];
              if (name === 'total_duration_minutes') return [`${value} mins`, 'Duration'];
              return [value, name];
            }}
          />
          <Bar
            dataKey="total_reps"
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
