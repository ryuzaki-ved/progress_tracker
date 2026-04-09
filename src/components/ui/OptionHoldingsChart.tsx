import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserOptionHolding, OptionContract } from '../../types';
import { formatIndianCurrency } from '../../utils/stockUtils';

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
  currentIndexValue: _currentIndexValue
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

  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white/5 border border-white/10 rounded-3xl">
        <div className="text-4xl mb-4 opacity-20">📊</div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
          Liquidity Check
        </h3>
        <p className="text-xs text-gray-500">
          No active option holdings detected in the matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative py-4">
      <div className="h-[280px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={`options-chart-v2-${userOptionHoldings.length}`}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={4}
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const ang = midAngle || 0;
                const x = (cx || 0) + radius * Math.cos(-ang * RADIAN);
                const y = (cy || 0) + radius * Math.sin(-ang * RADIAN);
                const p = percent || 0;

                if (p < 0.05) return null; // Don't show labels for tiny segments to avoid clutter

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[10px] font-bold pointer-events-none"
                    style={{ textShadow: '0 0 4px rgba(0,0,0,0.5)' }}
                  >
                    {`${name} (${(p * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
              labelLine={false}
            >
              {chartData.map((_entry, idx) => (
                <Cell 
                  key={`cell-${idx}`} 
                  fill={pieColors[idx % pieColors.length]} 
                  style={{ filter: `drop-shadow(0 0 8px ${pieColors[idx % pieColors.length]}40)` }}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(12px)',
                color: '#fff',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                padding: '12px 16px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value: number, name: string) => [formatIndianCurrency(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Summary */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Value</span>
          <span className="text-2xl font-bold font-display text-white tracking-tighter">
            {formatIndianCurrency(totalValue)}
          </span>
          <div className="w-8 h-1 bg-indigo-500/50 rounded-full mt-2" />
        </div>
      </div>

      {/* Mini Legend Area */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 truncate w-24">{item.name}</span>
              <span className="text-[11px] font-bold text-white">
                {((item.value / totalValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
