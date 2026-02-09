import React from 'react';
import { FileUpload } from '../components/FileUpload';
import { MonthlySalesChart } from '../components/charts/MonthlySalesChart';
import { PriceScatterChart } from '../components/charts/PriceScatterChart';
import { BrandBarChart } from '../components/charts/BrandBarChart';
import { BrandProductList } from '../components/charts/BrandProductList';
import type { ParsedData } from '../lib/types';

interface MarketAnalysisProps {
    data: ParsedData | null;
    file: File | null;
    isParsing: boolean;
    onFileUpload: (file: File) => void;
    onClear: () => void;
}
export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({
    data,
    file,
    isParsing,
    onFileUpload,
    onClear
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
        // Use setTimeout to ensure the DOM has rendered the dashboard before scrolling back
        // The dashboard has a 1000ms animation, but the layout structure should be present quickly.
        setTimeout(() => {
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
                mainContainer.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
            } else {
                window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
            }
        }, 100);
    };
    return (
        <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 p-6 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-all">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">市场分析 (Market Analysis)</h2>
                    {data ? (
                        <p className="text-sm text-slate-500 font-medium">
                            文件: <span className="text-slate-800">{file?.name}</span> • 已加载 {data.totalRows} 个产品
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500">上传并分析亚马逊导出的 Excel 数据</p>
                    )}
                </div>
                {data && (
                    <button
                        onClick={onClear}
                        className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-medium transition-all border border-slate-200 shadow-sm active:scale-95"
                    >
                        上传新文件
                    </button>
                )}
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
