import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Label
} from 'recharts';
import type { ScatterDataPoint } from '../../lib/types';
import { RotateCcw, Move } from 'lucide-react';

interface PriceScatterChartProps {
    data: ScatterDataPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 border border-slate-200 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden max-w-sm">
                <div className="flex gap-3 p-3">
                    {/* Left: Image Section */}
                    <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
                        {data.imageUrl ? (
                            <img
                                src={data.imageUrl}
                                alt={data.title || 'Product'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%23f1f5f9" width="96" height="96"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                No Image
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info Section */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1 truncate" title={data.title}>
                            {data.brand}
                        </h4>
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-2 leading-tight">
                            {data.title || 'No title available'}
                        </p>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">价格:</span>
                                <span className="font-semibold text-blue-600">${data.price}</span>
                            </div>

                            {data.rating != null && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">评分:</span>
                                    <span className="font-medium text-amber-600">
                                        ⭐ {data.rating} ({data.reviewCount || 0})
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">子体销量:</span>
                                <span className="font-semibold text-emerald-600">{data.units}</span>
                            </div>

                            {data.coupon && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">Coupon:</span>
                                    <span className="font-medium text-rose-600">{data.coupon}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 text-center">点击数据点查看详情页</p>
                </div>
            </div>
        );
    }
    return null;
};

export function PriceScatterChart({ data }: PriceScatterChartProps) {
    // 安全计算：空数组时 Math.max(...[]) = -Infinity，需加保护
    const defaultMaxPrice = useMemo(() => {
        if (data.length === 0) return 100;
        return Math.max(...data.map(d => d.price)) * 1.1 || 100;
    }, [data]);
    const defaultMaxUnits = useMemo(() => {
        if (data.length === 0) return 100;
        return Math.max(...data.map(d => d.units)) * 1.1 || 100;
    }, [data]);

    const [xDomain, setXDomain] = useState<[number, number]>([0, defaultMaxPrice]);
    const [yDomain, setYDomain] = useState<[number, number]>([0, defaultMaxUnits]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Panning state
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handlePointClick = useCallback((point: any) => {
        if (point.url) {
            window.open(point.url, '_blank', 'noopener,noreferrer');
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;

        lastPos.current = { x: e.clientX, y: e.clientY };

        const rect = containerRef.current.getBoundingClientRect();

        setXDomain(prev => {
            const range = prev[1] - prev[0];
            const dataToPixel = rect.width / range;
            const deltaData = dx / dataToPixel;
            const newStart = Math.max(0, prev[0] - deltaData);
            const newEnd = newStart + range;
            return [newStart, newEnd];
        });

        setYDomain(prev => {
            const range = prev[1] - prev[0];
            const dataToPixel = rect.height / range;
            const deltaData = dy / dataToPixel;
            const newStart = Math.max(0, prev[0] + deltaData);
            const newEnd = newStart + range;
            return [newStart, newEnd];
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;

            setXDomain(prev => {
                const center = (prev[0] + prev[1]) / 2;
                const range = (prev[1] - prev[0]) * scaleFactor;
                const newStart = Math.max(0, center - range / 2);
                const newEnd = newStart + range;
                return [newStart, newEnd];
            });

            setYDomain(prev => {
                const center = (prev[0] + prev[1]) / 2;
                const range = (prev[1] - prev[0]) * scaleFactor;
                const newStart = Math.max(0, center - range / 2);
                const newEnd = newStart + range;
                return [newStart, newEnd];
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // 当 data 变化时（如外部筛选），同步重置视图域
    useEffect(() => {
        setXDomain([0, defaultMaxPrice]);
        setYDomain([0, defaultMaxUnits]);
    }, [defaultMaxPrice, defaultMaxUnits]);

    const resetZoom = useCallback(() => {
        setXDomain([0, defaultMaxPrice]);
        setYDomain([0, defaultMaxUnits]);
    }, [defaultMaxPrice, defaultMaxUnits]);

    const formatAxisNumber = useCallback((val: number) => {
        if (Math.abs(val) > 1000) return `${(val / 1000).toFixed(1)}k`;
        return Math.round(val).toString();
    }, []);

    // Memoize cells to prevent re-creation on every render
    const scatterCells = useMemo(() => {
        return data.map((_, index) => (
            <Cell
                key={`cell-${index}`}
                fill="rgba(37, 99, 235, 0.4)"
                stroke="#2563eb"
                strokeWidth={1}
            />
        ));
    }, [data]);

    return (
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative group select-none">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        价格分布 (Price vs. Sales)
                        <Move className="w-4 h-4 text-slate-300" />
                    </h3>
                    <p className="text-sm text-slate-500">滚轮缩放视角,按住鼠标拖拽平移</p>
                </div>
                <button
                    onClick={resetZoom}
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    title="重置视角"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={containerRef}
                className="h-[500px] w-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} />
                        <XAxis
                            type="number"
                            dataKey="price"
                            name="价格"
                            unit="$"
                            domain={xDomain}
                            stroke="#cbd5e1"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickFormatter={formatAxisNumber}
                            allowDataOverflow
                        >
                            <Label value="价格 ($)" offset={-25} position="insideBottom" fill="#64748b" style={{ fontSize: '12px', fontWeight: 500 }} />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="units"
                            name="销量"
                            domain={yDomain}
                            stroke="#cbd5e1"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickFormatter={formatAxisNumber}
                            allowDataOverflow
                        >
                            <Label value="子体销量" angle={-90} position="insideLeft" fill="#64748b" style={{ textAnchor: 'middle', fontSize: '12px', fontWeight: 500 }} />
                        </YAxis>
                        <Tooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ outline: 'none' }}
                            isAnimationActive={false}
                        />
                        <Scatter
                            name="Products"
                            data={data}
                            fill="#3b82f6"
                            onClick={(data) => handlePointClick(data)}
                            isAnimationActive={false}
                        >
                            {scatterCells}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 pointer-events-none">
                滚轮缩放 • 拖拽平移 • 点击点跳转详情
            </div>
        </div>
    );
}
