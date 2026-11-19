import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#EAB308', '#D946EF', '#64748B'
];

export function ExerciseDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 text-sm">
        No exercise distribution data available yet.
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.exercise_type.replace('_', ' ').toUpperCase(),
    value: item.total_reps
  })).filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 text-sm">
        Log repetitions to visualize exercise breakdown.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#181920',
              borderColor: '#262833',
              borderRadius: '12px',
              color: '#F3F4F6'
            }}
            formatter={(val) => [`${val} reps`, 'Completed']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-neutral-300 capitalize">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
