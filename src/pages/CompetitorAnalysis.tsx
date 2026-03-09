import React, { useState } from 'react';
import { Search, ChevronUp, Maximize2, Target, HelpCircle } from 'lucide-react';

interface CompetitorAnalysisProps {
    results: any[];
    onResultsChange: (results: any[]) => void;
    asinInput: string;
    onAsinInputChange: (value: string) => void;
}

export const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({
    results,
    onResultsChange,
    asinInput,
    onAsinInputChange
}) => {
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(results.length === 0);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSearch = async () => {
        // 1. 初步分割与清洗
        let rawAsins = asinInput.split(/[\n,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);

        // 2. 格式校验 (10位字母数字)
        const asinRegex = /^[A-Z0-9]{10}$/;
        const validFormatAsins = rawAsins.filter(asin => asinRegex.test(asin));
        const invalidCount = rawAsins.length - validFormatAsins.length;

        // 3. 自动去重
        const uniqueAsins = Array.from(new Set(validFormatAsins));
        const duplicateCount = validFormatAsins.length - uniqueAsins.length;

        if (uniqueAsins.length === 0) {
            alert(invalidCount > 0 ? '输入的 ASIN 格式不正确（需为10位字符）' : '请输入至少一个 ASIN');
            return;
        }

        if (uniqueAsins.length > 10) {
            alert('最多支持对比 10 个唯一的 ASIN');
            return;
        }

        // 提示去重或格式错误（可选，为了用户体验）
        // 提示去重或格式错误（可选，为了用户体验）
        if (invalidCount > 0 || duplicateCount > 0) {
            console.log(`已过滤: ${invalidCount} 个无效格式, ${duplicateCount} 个重复项`);
            onAsinInputChange(uniqueAsins.join('\n'));
        }

        const asins = uniqueAsins;

        setIsLoading(true);
        setProgress(10);
        try {
            const { scrapeAmazonProducts } = await import('../lib/apify');

            // 进度模拟
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 2;
                });
            }, 1000);

            const data = await scrapeAmazonProducts(asins);
            clearInterval(timer);
            setProgress(100);

            onResultsChange(data || []);
            if (data && data.length > 0) {
                setIsHeaderExpanded(false);
            }
        } catch (error: any) {
            console.error('Analysis failed:', error);
            alert(`分析失败: ${error.message || '未知错误'}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    return (
        <div className="flex flex-col h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#f8fafc]">
            {/* Progress Bar */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            {/* Collapsible Search Bar Layer */}
            <div
                className={`transition-all duration-500 ease-in-out relative group/header
                    ${isHeaderExpanded
                        ? 'bg-white p-6 pt-10 rounded-b-[2rem] border-b border-slate-100 shadow-xl shadow-slate-200/50 translate-y-0 opacity-100'
                        : 'bg-white/80 py-3 px-8 rounded-b-2xl backdrop-blur-xl border-b border-slate-200/50 shadow-lg shadow-slate-200/30 opacity-95 hover:opacity-100'
                    } sticky top-0 z-30 flex flex-col gap-1.5`}
            >
                {/* Expandable Content Wrapper */}
                <div className={`transition-all duration-500 origin-top flex flex-col gap-6
                    ${isHeaderExpanded ? 'scale-100 h-auto opacity-100' : 'scale-95 h-0 opacity-0 overflow-hidden pointer-events-none'}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">竞品维度对比分析</h2>
                                <p className="text-slate-500 text-sm">输入多个 ASIN，一键生成全维度数据对比矩阵与 AI 深度洞察。</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">支持多行或逗号分隔，上限 10 个</span>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="relative group">
                            <textarea
                                value={asinInput}
                                onChange={(e) => onAsinInputChange(e.target.value)}
                                placeholder="请输入 ASIN 列表，例如：&#10;B08P1HFRK8&#10;B096VBSVHF"
                                className="block w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500/20 transition-all outline-none min-h-[120px] resize-none text-lg font-mono"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-3">
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !asinInput.trim()}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 translate-y-0 hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        采集数据并分析中...
                                    </span>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        开始对比分析
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toggle Bar */}
                <div
                    onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                    className={`flex items-center justify-between cursor-pointer select-none transition-all group/toggle ${isHeaderExpanded ? 'mt-4 border-t border-slate-50 pt-3' : ''}`}
                >
                    {!isHeaderExpanded && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                <Target className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2 leading-none">
                                    竞品对比控制台
                                    {results.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-black uppercase tracking-tighter">
                                            {results.length} PRODUCT MIX
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">点击展开重新输入 ASIN 或调整参数</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover/toggle:text-blue-600 group-hover/toggle:bg-blue-50 transition-all ml-auto">
                        {isHeaderExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>收起面板</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" />
                                <span>展开搜索</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-auto p-8 pt-4">
                {results.length > 0 ? (
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-8 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em] w-48 sticky left-0 bg-slate-50/90 backdrop-blur-md z-10">对比维度</th>
                                        {results.map((product, idx) => (
                                            <th key={idx} className="px-6 py-8 text-center min-w-[280px] border-l border-slate-100/50">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mb-2">
                                                    {idx + 1}
                                                </span>
                                                <div className="text-sm font-bold text-slate-900 line-clamp-1 px-4">
                                                    {product.asin || '未知 ASIN'}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {/* Product Images */}
                                    <tr>
                                        <td className="px-6 py-8 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">产品主图</td>
                                        {results.map((product, idx) => (
                                            <td key={idx} className="px-6 py-8 border-l border-slate-100/50">
                                                <div className="flex justify-center">
                                                    <div className="w-40 h-40 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group flex items-center justify-center">
                                                        {product.mainImage?.imageUrl ? (
                                                            <img
                                                                src={product.mainImage.imageUrl}
                                                                alt="Product"
                                                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">暂无图片</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Price */}
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">当前价格</td>
                                        {results.map((product, idx) => (
                                            <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                                <span className="text-2xl font-black text-blue-600">
                                                    {product.price != null ? `$${product.price}` : 'N/A'}
                                                </span>
                                                {product.retailPrice && (
                                                    <div className="text-xs text-slate-400 line-through mt-1">
                                                        ${product.retailPrice}
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* BSR */}
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">BSR 排名</td>
                                        {results.map((product, idx) => {
                                            const bsrDetail = product.productDetails?.find((d: any) => d.name.includes('Best Sellers Rank'));
                                            return (
                                                <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                                    <div className="text-xs font-medium text-slate-700 max-w-[220px] mx-auto">
                                                        {bsrDetail?.value || 'N/A'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {/* Sales */}
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">上月销量</td>
                                        {results.map((product, idx) => (
                                            <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                                                    {product.pastSales || '暂无数据'}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Availability Date */}
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">上架时间</td>
                                        {results.map((product, idx) => {
                                            const firstAvailable = product.productDetails?.find((d: any) => d.name.includes('Date First Available'))?.value;
                                            return (
                                                <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50 text-slate-600 text-sm">
                                                    {firstAvailable || 'N/A'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {/* Ratings */}
                                    <tr>
                                        <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">评分评价</td>
                                        {results.map((product, idx) => {
                                            const ratingStr = product.productRating || ''; // e.g. '4.7 out of 5 stars'
                                            const ratingNum = parseFloat(ratingStr);
                                            return (
                                                <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {isNaN(ratingNum) ? 'N/A' : ratingNum.toFixed(1)}
                                                        </span>
                                                        {!isNaN(ratingNum) && (
                                                            <div className="flex text-yellow-400 text-xs">
                                                                {'★'.repeat(Math.round(ratingNum))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        ({product.countReview ?? 0} 条评价)
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {/* AI Review Insight (Preview) */}
                                    <tr>
                                        <td className="px-6 py-8 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">口碑核心亮点</td>
                                        {results.map((product, idx) => (
                                            <td key={idx} className="px-6 py-8 border-l border-slate-100/50">
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 italic">
                                                    {product.reviewInsights?.summary || '暂无 AI 评价总结'}
                                                </p>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                            <Target className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">准备就绪</h3>
                        <p className="text-slate-400 mt-2 max-w-sm">
                            请在上方输入需要分析的亚马逊 ASIN 编码，系统将为您拉取全量数据。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
