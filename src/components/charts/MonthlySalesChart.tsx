import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { YearlyTrendData } from '../../lib/types';

interface MonthlySalesChartProps {
    data: YearlyTrendData[];
}

const MONTH_LABELS = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
];

// Colors for different years
const COLORS = [
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
];

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ data }) => {
    const [hiddenYears, setHiddenYears] = useState<Set<string>>(new Set());

    const toggleYear = (year: string) => {
        setHiddenYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) {
                next.delete(year);
            } else {
                next.add(year);
            }
            return next;
        });
    };

    const handleLegendClick = (o: any) => {
        const { dataKey } = o;
        toggleYear(dataKey);
    };

    // Transform data for Recharts (merge years into one array of objects with month as index)
    // Recharts usually expects: [{ month: 1, '2024': 100, '2025': 120 }, ...]
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const entry: any = {
            month: monthNum,
            label: MONTH_LABELS[i]
        };
        data.forEach(yearData => {
            const point = yearData.data.find(d => d.month === monthNum);
            entry[yearData.year] = point ? point.units : 0;
        });
        return entry;
    });

    const activeYears = data.map(d => d.year);

    if (data.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl flex items-center justify-center h-[400px]">
                <p className="text-slate-400">未在上传的文件中找到月度销量数据。</p>
            </div>
        );
    }

    return (
        <div className="group bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">月度销量趋势 (Monthly Sales Trend)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">各个年份的月度销量分布图</p>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.toLocaleString()}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                padding: '12px 16px',
                                backdropFilter: 'blur(8px)',
                            }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                            formatter={(value: any) => [value.toLocaleString(), '销量']}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                            verticalAlign="top"
                            align="right"
                            onClick={handleLegendClick}
                            content={(props) => {
                                const { payload } = props;
                                return (
                                    <ul className="flex justify-end gap-6 list-none p-0 m-0">
                                        {payload?.map((entry: any, index: number) => {
                                            const isHidden = hiddenYears.has(entry.dataKey);
                                            return (
                                                <li
                                                    key={`item-${index}`}
                                                    className={`flex items-center gap-2 cursor-pointer transition-opacity duration-300 ${isHidden ? 'opacity-30' : 'opacity-100'}`}
                                                    onClick={() => toggleYear(entry.dataKey)}
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-slate-600 select-none">{entry.value}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            }}
                        />
                        {activeYears.map((year, index) => (
                            <Line
                                key={year}
                                type="monotone"
                                dataKey={year}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1500}
                                connectNulls={false} // Crucial: don't connect nulls so the line stops
                                hide={hiddenYears.has(year)}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
