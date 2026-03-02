import { useState } from 'react';
import { Search, Info, Filter, ExternalLink, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { scrapeMetaAds } from '../../lib/apify';


export default function MetaSpy() {
    const [isSearching, setIsSearching] = useState(false);
    const [hasResults, setHasResults] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [ads, setAds] = useState<any[]>([]);

    // 从数据库获取数据
    const fetchAdsFromSupabase = async (searchKeyword: string) => {
        try {
            const { data, error } = await supabase
                .from('metaspy_ads')
                .select('*')
                .ilike('page_name', `%${searchKeyword}%`) // 优先匹配品牌名
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching ads:', err);
            return [];
        }
    };

    // 将 Apify 结果同步到 Supabase
    const syncToSupabase = async (items: any[]) => {
        const formattedAds = items.map(item => ({
            ad_id: item.libraryID || item.id || `temp_${Math.random()}`,
            page_name: item.brand || item.pageName,
            page_id: item.pageID,
            title: item.title || item.brand,
            content: item.body || item.content,
            media_url: item.resized_image_url || item.original_image_url || item.mediaUrl,
            landing_page: item.link || item.landingPage,
            is_active: item.active !== false,
            start_date: item.startDate || null,
            platforms: item.platforms || []
        }));

        try {
            const { error } = await supabase
                .from('metaspy_ads')
                .upsert(formattedAds, { onConflict: 'ad_id' }); // 如果 ID 重复则更新

            if (error) console.error('Error syncing to Supabase:', error);
        } catch (err) {
            console.error('Unexpected sync error:', err);
        }
    };

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setIsSearching(true);
        setHasResults(false);

        // 1. 先查数据库
        const existingResults = await fetchAdsFromSupabase(keyword);

        if (existingResults.length > 0) {
            setAds(existingResults);
            setIsSearching(false);
            setHasResults(true);
            return;
        }

        // 2. 如果库中没有，去 Apify 抓取
        try {
            const items = await scrapeMetaAds(keyword, 'US'); // 默认抓取美国市场
            if (items && items.length > 0) {
                await syncToSupabase(items);
                const newResults = await fetchAdsFromSupabase(keyword);
                setAds(newResults);
            } else {
                setAds([]);
            }
        } catch (err) {
            console.error('Full search flow error:', err);
            setAds([]);
        } finally {
            setIsSearching(false);
            setHasResults(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <nav className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">MetaSpy 广告监测</h1>
                    <p className="text-slate-500 font-medium">深度同步 Meta 广告图书馆，洞察全球竞品投放策略。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" /> 导出表格
                    </button>
                </div>
            </nav>

            {/* Search Controls */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">关键词 (品牌或产品)</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="例如: megeline, Anker..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all text-slate-900 font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !keyword.trim()}
                            className={cn(
                                "w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-white transition-all shadow-lg min-w-[200px]",
                                isSearching || !keyword.trim()
                                    ? "bg-slate-300 shadow-none cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:shadow-blue-200 active:scale-[0.98]"
                            )}
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    正在侦察云端...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    探测最新广告
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> 自动去重</span>
                        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> 更新频率: 每周一次</span>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {!hasResults && !isSearching ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-slate-800">暂无探测结果</h3>
                        <p className="text-slate-500">输入品牌 or 产品关键词，我们将通过 Apify 实时同步 Meta 广告图书馆的数据。</p>
                    </div>
                </div>
            ) : isSearching ? (
                <div className="py-20 text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">正在调集 Apify 资源 (上限 400 条)...</h3>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium">正在按展现量排序抓取最新广告。由于数量提升至 400 条，这通常需要 2-5 分钟，请耐心等待。</p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : ads.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4 shadow-xl animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <Info className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-slate-800">云端未命中数据</h3>
                        <p className="text-slate-500 mb-6">Apify 抓取任务已完成，但未发现该关键词对应的广告记录。请尝试更换更通用的关键词或拼写。</p>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm font-medium">
                            提示：MetaAds 可能会对某些品牌名称有不同的索引策略。
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700">资料库编码</th>
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700">开始投放时间</th>
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700">标题/品牌</th>
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700 max-w-xs">广告文案</th>
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700">落地页</th>
                                    <th className="px-6 py-5 text-sm font-bold text-slate-700 text-center">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ads.map(ad => (
                                    <tr key={ad.id || ad.ad_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                ID: {ad.ad_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                            {ad.start_date || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{ad.title || ad.page_name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{ad.page_name}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs text-sm text-slate-600 leading-relaxed italic">
                                            <div className="line-clamp-2">"{ad.content}"</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ad.landing_page ? (
                                                <a
                                                    href={ad.landing_page}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold group-hover:translate-x-1 transition-transform"
                                                >
                                                    访问页面 <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">暂无链接</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {ad.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                                                    INACTIVE
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
