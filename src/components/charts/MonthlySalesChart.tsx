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

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ data: rawData }) => {
    const [hiddenYears, setHiddenYears] = useState<Set<string>>(new Set());

    // 1. Adaptive Logic: Only show the last 3 years found in the data
    const sortedRawData = [...rawData].sort((a, b) => b.year.localeCompare(a.year));
    const data = sortedRawData.slice(0, 3); // Take the most recent 3 years
    const activeYears = data.map(d => d.year);

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

    // Transform data for Recharts
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

    // Color scheme synchronized with price charts
    const getYearStyle = (index: number) => {
        // index 0 is newest (sortedRawData descends)
        if (index === 0) return { color: '#2563eb', width: 3, opacity: 1 }; // Blue
        if (index === 1) return { color: '#9333ea', width: 2, opacity: 0.9 }; // Purple
        if (index === 2) return { color: '#94a3b8', width: 2, opacity: 0.7 }; // Gray
        return { color: '#cbd5e1', width: 2, opacity: 0.5 };
    };

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
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">月度销量趋势 (近三年对比)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">各个年份的历史月度销量分布对比</p>
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
                            verticalAlign="bottom"
                            align="center"
                            onClick={handleLegendClick}
                            content={(props) => {
                                const { payload } = props;
                                return (
                                    <ul className="flex justify-center gap-8 list-none p-0 m-0 mt-4">
                                        {payload?.map((entry: any, index: number) => {
                                            const isHidden = hiddenYears.has(entry.dataKey);
                                            // Use the color already assigned to the legend entry by Recharts
                                            return (
                                                <li
                                                    key={`item-${index}`}
                                                    className={`flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100'}`}
                                                    onClick={() => toggleYear(entry.dataKey)}
                                                >
                                                    <div
                                                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className={`text-sm ${isHidden ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>
                                                        {entry.value}年
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            }}
                        />
                        {[...activeYears].reverse().map((year) => {
                            const index = activeYears.indexOf(year);
                            const style = getYearStyle(index);
                            return (
                                <Line
                                    key={year}
                                    type="monotone"
                                    dataKey={year}
                                    stroke={style.color}
                                    strokeWidth={style.width}
                                    strokeOpacity={style.opacity}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: style.color }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: style.color }}
                                    animationDuration={1500}
                                    connectNulls
                                    hide={hiddenYears.has(year)}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
