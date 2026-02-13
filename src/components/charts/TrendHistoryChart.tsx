import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface TrendHistoryChartProps {
    data: any;
    dataKeyPattern: RegExp; // e.g. /^(\d{4})-(\d{2})-子-P$/
    title: string;
    valuePrefix?: string;
}

interface ChartDataPoint {
    month: string;
    [year: string]: number | string;
}

export const TrendHistoryChart: React.FC<TrendHistoryChartProps> = ({
    data,
    dataKeyPattern,
    title,
    valuePrefix = ''
}) => {
    // 1. Process data: Extract history for the last 3 dynamic years
    const chartData = useMemo(() => {
        const historyMap: Record<string, ChartDataPoint> = {};
        const yearsFound = new Set<string>();

        // Calculate dynamic year window
        const currentYear = new Date().getFullYear();
        const targetYears = [
            currentYear.toString(),
            (currentYear - 1).toString(),
            (currentYear - 2).toString()
        ];

        Object.keys(data).forEach(key => {
            const match = key.match(dataKeyPattern);
            if (match) {
                const year = match[1];
                const month = match[2];

                // Only process if year is within our 3-year window
                if (targetYears.includes(year)) {
                    const price = parseFloat(data[key]);

                    if (!isNaN(price)) {
                        yearsFound.add(year);
                        if (!historyMap[month]) {
                            historyMap[month] = { month };
                        }
                        historyMap[month][year] = price;
                    }
                }
            }
        });

        // Convert map to array and sort by month
        const result = Object.values(historyMap).sort((a, b) => parseInt(a.month) - parseInt(b.month));

        // Ensure all months 01-12 are present for a complete X-axis
        const fullYearData: ChartDataPoint[] = [];
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            const existing = result.find(d => d.month === monthStr);
            fullYearData.push(existing || { month: monthStr });
        }

        return {
            data: fullYearData,
            years: Array.from(yearsFound).sort((a, b) => parseInt(b) - parseInt(a)),
            targetYears
        };
    }, [data, dataKeyPattern]);

    if (chartData.years.length === 0) {
        return (
            <div className="w-[600px] h-[450px] bg-white rounded-xl shadow-2xl border border-slate-100 p-6 flex flex-col items-center justify-center text-slate-400 text-sm">
                近三年暂无历史数据
            </div>
        );
    }

    // Define unified colors based on year offset
    const currentYear = new Date().getFullYear();
    const getColorForYear = (yearStr: string) => {
        const year = parseInt(yearStr);
        if (year === currentYear) return '#2563eb'; // Blue (Current)
        if (year === currentYear - 1) return '#9333ea'; // Purple (Last Year)
        if (year === currentYear - 2) return '#94a3b8'; // Gray (2 Years Ago)
        return '#cbd5e1'; // Fallback
    };

    return (
        <div className="w-[600px] h-[450px] bg-white rounded-xl shadow-2xl border border-slate-100 p-6 flex flex-col">
            <h4 className="text-lg font-bold text-slate-700 mb-4">{title}</h4>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => `${parseInt(val)}月`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            width={40}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                            formatter={(value: number | undefined, name: any) => (value !== undefined ? [`${valuePrefix}${value}`, name] : ['N/A', name])}
                            labelFormatter={(label) => `${parseInt(label)}月份`}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                        {/* Always render lines in specific order if data exists */}
                        {chartData.targetYears.map(year => {
                            if (!chartData.years.includes(year)) return null;
                            return (
                                <Line
                                    key={year}
                                    type="monotone"
                                    dataKey={year}
                                    name={`${year}年`}
                                    stroke={getColorForYear(year)}
                                    // Make current year thicker
                                    strokeWidth={parseInt(year) === currentYear ? 3 : 2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                    connectNulls
                                    // Lower opacity for older years to emphasize current
                                    opacity={parseInt(year) === currentYear ? 1 : (parseInt(year) === currentYear - 1 ? 0.8 : 0.6)}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
