import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartData {
    date: string; // 'yyyy-mm-dd'
    open: number;
    high: number;
    low: number;
    close: number;
}

interface IndexCandlestickChartProps {
    data: ChartData[];
    height?: number;
}

export const IndexCandlestickChart: React.FC<IndexCandlestickChartProps> = ({ data, height = 384 }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { isDark } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            timeScale: {
                borderColor: 'transparent',
                timeVisible: false,
            },
            rightPriceScale: {
                borderColor: 'transparent',
            },
            crosshair: {
                mode: 0,
            }
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981', // emerald-500
            downColor: '#ef4444', // red-500
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        // Formatting data for lightweight charts (requires time format string e.g., '2023-01-01')
        const formattedData = data.map(d => ({
            time: d.date,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close
        }))
            // Needs to be sorted by time ascending strictly
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        // Deduplicate if needed (lightweight charts throws error on duplicate time)
        const uniqueData = formattedData.filter((v, i, a) => a.findIndex(t => (t.time === v.time)) === i);

        candlestickSeries.setData(uniqueData);
        chart.timeScale().fitContent();

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, isDark, height]);

    return <div ref={chartContainerRef} className="w-full h-full" />;
};

