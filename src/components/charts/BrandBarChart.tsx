import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';
import { Target, PieChart } from 'lucide-react';
import type { BrandSharePoint } from '../../lib/types';

interface BrandBarChartProps {
    data: BrandSharePoint[];
    onBrandClick?: (brand: string) => void;
}

const COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
];

export const BrandBarChart: React.FC<BrandBarChartProps> = ({ data, onBrandClick }) => {
    if (data.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl flex items-center justify-center h-[400px]">
                <p className="text-slate-400">No brand data found for analysis.</p>
            </div>
        );
    }

    const top3Share = data.slice(0, 3).reduce((acc, curr) => acc + curr.percentage, 0);
    const top10Share = data.slice(0, 10).reduce((acc, curr) => acc + curr.percentage, 0);

    return (
        <div className="group bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">品牌垄断分析 (Brand Monopoly)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Top 20 品牌销量分布及其市场占比</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/50 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-200">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400 leading-none mb-1">Top 3 市占率</p>
                            <p className="text-lg font-black text-blue-600 leading-none tabular-nums">{top3Share.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 backdrop-blur-sm">
                        <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-200">
                            <PieChart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 leading-none mb-1">Top 10 市占率</p>
                            <p className="text-lg font-black text-indigo-600 leading-none tabular-nums">{top10Share.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="brand"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={100}
                            tickMargin={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.toLocaleString()}
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
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value: any, name: any) => {
                                if (name === 'units') return [value.toLocaleString(), '销量'];
                                return [value, name];
                            }}
                        />
                        <Bar
                            dataKey="units"
                            radius={[8, 8, 0, 0]}
                            animationDuration={1500}
                            onClick={(data: any) => {
                                if (onBrandClick && data && data.brand) {
                                    onBrandClick(data.brand);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            <LabelList
                                dataKey="percentage"
                                position="top"
                                formatter={(val: any) => {
                                    const num = Number(val);
                                    return isNaN(num) ? '' : `${num.toFixed(1)}%`;
                                }}
                                style={{ fontSize: '11px', fill: '#64748b', fontWeight: 600 }}
                                offset={10}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
