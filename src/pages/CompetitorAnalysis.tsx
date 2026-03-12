import React, { useState } from 'react';
import { Search, ChevronUp, Maximize2, Target, HelpCircle } from 'lucide-react';

// Helper function to format Amazon product date string (e.g., "January 15, 2024") to "YYYY/M/D"
const formatDateToChinese = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return dateStr; // Fallback to original string if parsing fails
    }
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

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
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Close lightbox on Esc key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxImage(null);
        };
        if (lightboxImage) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [lightboxImage]);

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
                        ? 'bg-white p-6 pt-10 border-b border-slate-100 shadow-xl shadow-slate-200/50 translate-y-0 opacity-100'
                        : 'bg-white/80 py-3 px-8 backdrop-blur-xl border-b border-slate-200/50 shadow-lg shadow-slate-200/30 opacity-95 hover:opacity-100'
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
            <div className="flex-1 overflow-auto p-0">
                {results.length > 0 ? (
                    <div className="bg-white border-b border-slate-100 animate-in fade-in zoom-in-95 duration-500 w-max min-w-full">
                        <table className="w-full border-collapse">
                            <tbody className="divide-y divide-slate-50">
                                {/* Product Sequence */}
                                <tr>
                                    <td className="px-6 pt-6 pb-2 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10 w-48">序号</td>
                                    {results.map((_, idx) => (
                                        <td key={idx} className="px-6 pt-6 pb-2 text-center border-l border-slate-100/50 min-w-[280px]">
                                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100/50">
                                                竞品 {idx + 1}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                {/* Product Images */}
                                <tr>
                                    <td className="px-6 pt-4 pb-8 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">主图</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 pt-4 pb-8 border-l border-slate-100/50">
                                            <div className="flex justify-center">
                                                <div className="w-40 h-40 rounded-2xl overflow-visible bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                    {product.imageUrlList?.[0] ? (
                                                        <img
                                                            src={product.imageUrlList[0]}
                                                            alt="Product"
                                                            className="w-full h-full object-contain mix-blend-multiply hover:scale-150 transition-transform duration-300 origin-center relative z-10 hover:z-50 will-change-transform cursor-pointer"
                                                            onClick={() => setLightboxImage(product.imageUrlList[0])}
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
                                {/* ASIN */}
                                <tr>
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">ASIN</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-4 text-center border-l border-slate-100/50 font-mono text-sm text-slate-600">
                                            {product.asin || 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                                {/* Brand */}
                                <tr>
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">品牌</td>
                                    {results.map((product, idx) => {
                                        const brand = product.manufacturer
                                            ? product.manufacturer.replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '')
                                            : 'N/A';
                                        return (
                                            <td key={idx} className="px-6 py-4 text-center border-l border-slate-100/50 text-sm text-slate-600">
                                                {brand}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {/* Price */}
                                <tr>
                                    <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">价格</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                            <span className="text-2xl font-black text-blue-600">
                                                {product.price != null ? `$${product.price}` : 'N/A'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                {/* Sales */}
                                <tr>
                                    <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">子体销量</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                                                {product.pastSales ? product.pastSales.split(' ')[0] : '暂无数据'}
                                            </div>
                                        </td>
                                    ))}
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
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    ({product.countReview ?? 0} 条评价)
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                                {/* Availability Date */}
                                <tr>
                                    <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">上架时间</td>
                                    {results.map((product, idx) => {
                                        const firstAvailableRaw = product.productDetails?.find((d: any) => d.name.includes('Date First Available'))?.value;
                                        const formattedDate = formatDateToChinese(firstAvailableRaw);
                                        return (
                                            <td key={idx} className="px-6 py-6 text-center border-l border-slate-100/50 text-slate-600 text-sm">
                                                {formattedDate}
                                            </td>
                                        );
                                    })}
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
                                {/* AI Review Insight (Preview) */}
                                <tr>
                                    <td className="px-6 py-8 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">口碑核心亮点</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-8 border-l border-slate-100/50 text-center">
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 italic max-w-[280px] mx-auto text-left">
                                                {product.reviewInsights?.summary || '暂无 AI 评价总结'}
                                            </p>
                                        </td>
                                    ))}
                                </tr>
                                {/* Title */}
                                <tr>
                                    <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">标题</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-6 border-l border-slate-100/50 text-center">
                                            <p className="text-sm text-slate-700 leading-relaxed max-w-[280px] mx-auto text-left">
                                                {product.title || 'N/A'}
                                            </p>
                                        </td>
                                    ))}
                                </tr>
                                {/* Bullet Points / Features */}
                                <tr>
                                    <td className="px-6 py-6 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">五点</td>
                                    {results.map((product, idx) => (
                                        <td key={idx} className="px-6 py-6 border-l border-slate-100/50 text-center">
                                            {product.features && product.features.length > 0 ? (
                                                <ul className="space-y-2 max-w-[280px] mx-auto text-left">
                                                    {product.features.map((feature: string, fIdx: number) => (
                                                        <li key={fIdx} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex-shrink-0 mt-0.5">{fIdx + 1}</span>
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-xs text-slate-400">暂无数据</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* Secondary Images (Dynamic Rows) */}
                                {Array.from({
                                    length: Math.max(...results.map(product => product.imageUrlList?.length || 0))
                                }).map((_, imgIdx) => (
                                    <tr key={`img-row-${imgIdx}`}>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm sticky left-0 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
                                            主图 {imgIdx + 1}
                                        </td>
                                        {results.map((product, pIdx) => {
                                            const imgUrl = product.imageUrlList?.[imgIdx];
                                            return (
                                                <td key={`${pIdx}-${imgIdx}`} className="px-6 py-4 border-l border-slate-100/50">
                                                    <div className="flex justify-center">
                                                        {imgUrl ? (
                                                            <div className="w-40 h-40 rounded-2xl overflow-visible bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={`Secondary Image ${imgIdx + 1}`}
                                                                    className="w-full h-full object-contain mix-blend-multiply hover:scale-150 transition-transform duration-300 origin-center relative z-10 hover:z-50 cursor-pointer will-change-transform"
                                                                    onClick={() => setLightboxImage(imgUrl)}
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-40 h-40 rounded-2xl bg-slate-50/50 border border-slate-100/50 flex items-center justify-center">
                                                                <span className="text-slate-300 text-xs">无图片</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* Lightbox Overlay */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setLightboxImage(null)}
                >
                    <img
                        src={lightboxImage}
                        alt="Preview"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-90 duration-300 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
                    />
                </div>
            )}
        </div>
    );
};
