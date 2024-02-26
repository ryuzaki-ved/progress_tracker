import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserOptionHolding, OptionContract } from '../../types';

interface OptionHoldingsChartProps {
  userOptionHoldings: UserOptionHolding[];
  optionContracts: OptionContract[];
  currentIndexValue: number | null;
}

const pieColors = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E42', // orange
  '#EF4444', // red
  '#8B5CF6', // violet
  '#FBBF24', // amber
  '#3B82F6', // blue
  '#F472B6', // pink
  '#22D3EE', // cyan
  '#A3E635', // lime
];

export const OptionHoldingsChart: React.FC<OptionHoldingsChartProps> = ({
  userOptionHoldings,
  optionContracts,
  currentIndexValue
}) => {
  // Memoize the chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    return userOptionHoldings.map(h => {
      const contract = optionContracts.find(c => c.id === h.contractId);
      return {
        name: contract ? `${contract.strikePrice} ${contract.optionType}` : `Contract ${h.contractId}`,
        value: contract ? Math.abs(contract.strikePrice * h.quantity) : 0,
      };
    });
  }, [userOptionHoldings.length, userOptionHoldings.map(h => `${h.contractId}-${h.quantity}`).join(',')]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Option Holdings
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start trading options to see your holdings distribution
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart key={`options-chart-${userOptionHoldings.length}-${userOptionHoldings.map(h => h.contractId).join('-')}`}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}; 