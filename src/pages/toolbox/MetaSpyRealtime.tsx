import React, { useState } from 'react';
import { Search, Loader2, ArrowLeft, Play, ExternalLink, Copy } from 'lucide-react';

interface MetaSpyRealtimeProps {
    onBack?: () => void;
}

export const MetaSpyRealtime: React.FC<MetaSpyRealtimeProps> = ({ onBack }) => {
    const [url, setUrl] = useState('');
    const [maxResults, setMaxResults] = useState(50);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!url) {
            alert('请输入 Meta 广告库 URL');
            return;
        }
        setIsLoading(true);
        try {
            const { scrapeMetaAds } = await import('../../lib/apify');
            const data = await scrapeMetaAds({ adLibraryUrl: url, maxResults });
            console.log('Fetched data:', data);
            setResults(data || []);
        } catch (error: any) {
            console.error('Search failed:', error);
            alert(`查询失败: ${error.message || '未知错误'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">实时查询</h2>
                    <p className="text-slate-500 text-sm">输入 Meta 广告库链接，即时抓取最新广告数据。</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Meta 广告库 URL
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.facebook.com/ads/library/..."
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            抓取数量
                        </label>
                        <select
                            value={maxResults}
                            onChange={(e) => setMaxResults(Number(e.target.value))}
                            className="block w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                        >
                            <option value={10}>10 条</option>
                            <option value={50}>50 条</option>
                            <option value={100}>100 条</option>
                            <option value={200}>200 条</option>
                            <option value={400}>400 条</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 translate-y-0 hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                        开始查询
                    </button>
                </div>
            </div>

            {/* Step 2: 增加简单的反馈，用于测试数据是否返回 */}
            {results.length > 0 && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-2 animate-in zoom-in-95 duration-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>
                        成功抓取到 <span className="font-bold">{results.length}</span> 条广告数据！(控制台已打印)
                    </span>
                </div>
            )}

            {/* Step 3: 基础表格结构渲染 */}
            {results.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-32">资料库编号</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-32">素材预览</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-48">公共主页</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-32">投放日期</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">广告文案摘要</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-24">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {results.map((ad, index) => {
                                    const adArchiveId = ad.metadata?.ad_archive_id || '-';
                                    const startDate = ad.timing?.start_date
                                        ? new Date(ad.timing.start_date * 1000).toLocaleDateString()
                                        : '-';
                                    const body = ad.ad_content?.body || '';
                                    const isActive = ad.status?.is_active;

                                    // 素材预览逻辑
                                    const videoThumbnail = ad.ad_content?.videos?.[0]?.video_preview_image_url;
                                    const imageThumbnail = ad.ad_content?.images?.[0]?.resized_image_url || ad.ad_content?.images?.[0]?.original_image_url;
                                    const previewUrl = videoThumbnail || imageThumbnail;
                                    const isVideo = !!videoThumbnail;

                                    return (
                                        <tr key={ad.metadata?.ad_archive_id || index} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                                                    {adArchiveId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform">
                                                    {previewUrl ? (
                                                        <>
                                                            <img
                                                                src={previewUrl}
                                                                alt="Ad Preview"
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                            {isVideo && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                    <Play className="w-6 h-6 text-white fill-white" />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <div className="text-[10px] font-bold">无素材</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 text-sm truncate max-w-[180px]">
                                                    {ad.metadata?.page_name || '未知主页'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-500 text-xs font-medium tabular-nums">
                                                    {startDate}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600 text-[13px] line-clamp-2 leading-relaxed">
                                                    {body}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                                    <span className={`text-[11px] font-bold ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                                        {isActive ? '投放中' : '已结束'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results Table Placeholder */}
            {results.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">暂无数据</h3>
                    <p className="text-slate-400 mt-1 max-w-xs">
                        在上方输入 URL 后点击“开始查询”
                    </p>
                </div>
            )}
        </div>
    );
};
