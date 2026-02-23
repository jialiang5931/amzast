import React from 'react';
import { FileUpload } from '../components/FileUpload';
import { MonthlySalesChart } from '../components/charts/MonthlySalesChart';
import { PriceScatterChart } from '../components/charts/PriceScatterChart';
import { BrandBarChart } from '../components/charts/BrandBarChart';
import { BrandProductList } from '../components/charts/BrandProductList';
import { ArrowLeft, BarChart3, Binary, Sparkles, FileSpreadsheet } from 'lucide-react';
import type { ParsedData } from '../lib/types';

interface MarketAnalysisProps {
    data: ParsedData | null;
    file: File | null;
    isParsing: boolean;
    onFileUpload: (file: File) => void;
    onClear: () => void;
    hasSearchListData?: boolean;
    onBackToSearch?: () => void;
}
export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({
    data,
    file,
    isParsing,
    onFileUpload,
    onClear,
    hasSearchListData,
    onBackToSearch
}) => {
    const [selectedBrand, setSelectedBrand] = React.useState<string | null>(null);
    const scrollPosRef = React.useRef(0);

    // Filter products for the selected brand
    const brandProducts = React.useMemo(() => {
        if (!selectedBrand || !data) return [];
        return data.rows.filter(row => (row['品牌'] || 'Unknown') === selectedBrand);
    }, [selectedBrand, data]);

    // Scroll to top when entering drilldown view
    React.useEffect(() => {
        if (selectedBrand) {
            // Delay scroll to ensure the product list DOM is fully rendered
            setTimeout(() => {
                const mainContainer = document.querySelector('main');
                if (mainContainer) {
                    mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
        }
    }, [selectedBrand]);

    const handleBrandClick = (brand: string) => {
        const mainContainer = document.querySelector('main');
        scrollPosRef.current = mainContainer ? mainContainer.scrollTop : window.scrollY;
        setSelectedBrand(brand);
    };

    const handleBack = () => {
        setSelectedBrand(null);
        setTimeout(() => {
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
                mainContainer.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
            } else {
                window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
            }
        }, 100);
    };

    const isFromSearchList = file?.name?.startsWith('SearchList_');

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
            {/* Navigation & Header */}
            <div className="space-y-4">
                {hasSearchListData && onBackToSearch && (
                    <button
                        onClick={onBackToSearch}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all text-sm group/back bg-white/40 px-4 py-2 rounded-xl border border-white/60 hover:border-blue-200"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                        返回搜索列表
                    </button>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm transition-all relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 text-white">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">市场分析</h2>
                        </div>
                        {data ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isFromSearchList
                                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {isFromSearchList ? <Sparkles className="w-3 h-3" /> : <FileSpreadsheet className="w-3 h-3" />}
                                    {isFromSearchList ? '来源: 搜索列表内存推送' : `来源: ${file?.name}`}
                                </div>
                                <span className="text-sm text-slate-400 font-medium">• 已加载 {data.totalRows} 个产品</span>
                            </div>
                        ) : (
                            <p className="text-slate-500 font-medium ml-1">上传并一键生成亚马逊市场多维可视化分析报告</p>
                        )}
                    </div>

                    {data && (
                        <div className="flex items-center gap-3 relative z-10">
                            <button
                                onClick={onClear}
                                className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all border border-slate-200 shadow-sm active:scale-95 flex items-center gap-2"
                            >
                                <Binary className="w-4 h-4" />
                                重新分析新文件
                            </button>
                        </div>
                    )}

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
                </div>
            </div>

            {/* Main Content */}
            {!data ? (
                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <FileUpload onFileUpload={onFileUpload} />
                </div>
            ) : selectedBrand ? (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                    <BrandProductList
                        brand={selectedBrand}
                        products={brandProducts}
                        onBack={handleBack}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <MonthlySalesChart data={data.monthlyData} />
                    <BrandBarChart
                        data={data.brandData}
                        onBrandClick={handleBrandClick}
                    />
                    <PriceScatterChart data={data.scatterData} />
                </div>
            )}

            {/* Status */}
            {isParsing && (
                <div className="fixed bottom-10 right-10 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-blue-100 animate-bounce flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-blue-600 font-medium">分析引擎处理中...</span>
                </div>
            )}
        </div>
    );
};
