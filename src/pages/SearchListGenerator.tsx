import React, { useState } from 'react';
import { MultiFileUpload } from '../components/MultiFileUpload';
import { SearchListResults } from '../components/SearchListResults';
import { mergeSearchListData } from '../lib/data-parser';
import { Play, Sparkles, FileText, Settings2, AlertCircle } from 'lucide-react';

interface SearchListGeneratorProps {
    persistedData: any[] | null;
    persistedSite: string;
    onDataChange: (rows: any[] | null, site: string) => void;
    onRemoveRow: (asin: string) => void;
    onGenerateMarketAnalysis: (rows: any[], site: string) => void;
}

export const SearchListGenerator: React.FC<SearchListGeneratorProps> = ({
    persistedData,
    persistedSite,
    onDataChange,
    onRemoveRow,
    onGenerateMarketAnalysis
}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [site, setSite] = useState<string>(persistedSite);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = (files: File[]) => {
        setSelectedFiles(files);
        setError(null);
    };

    const handleGenerate = async () => {
        if (selectedFiles.length === 0) return;

        setIsGenerating(true);
        setError(null);

        try {
            const { rows, site: identifiedSite } = await mergeSearchListData(selectedFiles);
            setSite(identifiedSite);
            onDataChange(rows, identifiedSite);
            console.log(`[SearchList] Identified Marketplace: ${identifiedSite}`);
        } catch (err: any) {
            console.error("[SearchList] Merge Error:", err);
            setError(err.message || '合并文件时发生未知错误');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBack = () => {
        setSite('');
        onDataChange(null, '');
    };

    if (persistedData) {
        return (
            <div className="w-full h-full p-0">
                <SearchListResults
                    data={persistedData}
                    site={site}
                    onBack={handleBack}
                    onRemoveRow={onRemoveRow}
                    onGenerateMarketAnalysis={() => onGenerateMarketAnalysis(persistedData, site)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-10 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-xl shadow-lg shadow-purple-200">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">生成搜索列表 (Search List)</h2>
                    </div>
                    <p className="text-slate-500 font-medium">
                        通过 ASIN 交叉合并“产品列表”与“关键词分析”文件，生成高转化分析矩阵。
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start gap-4 animate-in shake duration-500">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-red-800 font-bold text-sm">合并失败</h4>
                        <p className="text-red-600 text-sm whitespace-pre-line leading-relaxed">{error}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                    <div className="bg-white/40 p-1 rounded-[2.5rem] border border-white/20">
                        <MultiFileUpload onFilesChange={handleFilesChange} />
                    </div>
                </div>

                {/* Configuration / Action Section */}
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Settings2 className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">配置选项</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 mb-1">匹配基准</p>
                                    <p className="text-sm text-slate-700 font-semibold tracking-wide">按 ASIN 水平合并</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button
                                onClick={handleGenerate}
                                disabled={selectedFiles.length === 0 || isGenerating}
                                className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 shadow-lg ${selectedFiles.length === 0 || isGenerating
                                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 hover:scale-[1.02] active:scale-95"
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>正在解析并合并数据...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        <span>开始自动合并</span>
                                    </>
                                )}
                            </button>

                            {selectedFiles.length > 0 && (
                                <p className="text-center text-xs text-slate-400 animate-in fade-in duration-300">
                                    已载入 {selectedFiles.length} 个数据载体
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Step Guide */}
                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> 智能识别说明
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-xs text-slate-600">
                                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">1</span>
                                产品文件: 形如 <code className="text-blue-600 bg-blue-100/50 px-1 rounded">Product-US-20260206</code> (自动排除 -sales 文件)
                            </li>
                            <li className="flex items-start gap-3 text-xs text-slate-600">
                                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">2</span>
                                关键词文件: 以 <code className="text-blue-600 bg-blue-100/50 px-1 rounded">关键词分析_</code> 开头
                            </li>
                            <li className="flex items-start gap-3 text-xs text-slate-600">
                                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">3</span>
                                销量文件 (可选): 形如 <code className="text-blue-600 bg-blue-100/50 px-1 rounded">product-US-sales-*.xlsx</code> (支持多个)
                            </li>
                            <li className="flex items-start gap-3 text-xs text-slate-600 italic mt-2 text-slate-400">
                                * 系统将自动定位文件，无需手动排序上传顺序。
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
