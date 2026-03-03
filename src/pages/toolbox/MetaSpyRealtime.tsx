import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, ArrowLeft, Play, ChevronUp, Maximize2, Copy, Check } from 'lucide-react';

interface MetaSpyRealtimeProps {
    onBack?: () => void;
}

const IdCell: React.FC<{ id: string }> = ({ id }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-1.5 group/id relative">
            <a
                href={`https://www.facebook.com/ads/library/?id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 underline decoration-slate-300 hover:decoration-blue-600 hover:text-blue-600 transition-colors font-medium text-[11px] flex items-center gap-0.5 group/link text-nowrap"
                title="在 Meta 广告库中查看"
            >
                {id}
                <ArrowLeft className="w-2.5 h-2.5 rotate-135 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            <button
                onClick={handleCopy}
                className={`p-1 rounded-md transition-all ${copied
                    ? 'text-green-500 bg-green-50'
                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover/id:opacity-100'
                    }`}
                title={copied ? "已复制" : "点击复制编号"}
            >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            {copied && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-50">
                    复制成功
                </div>
            )}
        </div>
    );
};

// ----- VideoPreviewCell -----
interface VideoPreviewCellProps {
    videoUrl?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    isVideo: boolean;
}

const VideoPreviewCell: React.FC<VideoPreviewCellProps> = ({ videoUrl, thumbnailUrl, imageUrl, isVideo }) => {
    const [hovered, setHovered] = useState(false);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewUrl = thumbnailUrl || imageUrl;
    const hasPopup = isVideo ? !!videoUrl : !!imageUrl;

    const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const popupWidth = 240;
        const viewportWidth = window.innerWidth;
        const x = (rect.right + 8 + popupWidth > viewportWidth) ? rect.left - popupWidth - 8 : rect.right + 8;
        const y = Math.min(rect.top - 10, window.innerHeight - 280);
        setPopupPos({ x, y });
        hoverTimer.current = setTimeout(() => setHovered(true), 150);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, []);

    return (
        <>
            <div
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform cursor-pointer"
                onMouseEnter={hasPopup ? handleMouseEnter : undefined}
                onMouseLeave={hasPopup ? handleMouseLeave : undefined}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Ad Preview"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                            }}
                        />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-[10px] font-bold text-slate-300">无素材</div>
                    </div>
                )}
            </div>

            {/* Floating popup via Portal */}
            {hasPopup && hovered && createPortal(
                <div
                    className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
                    style={{ left: popupPos.x, top: popupPos.y }}
                    onMouseEnter={() => {
                        if (hoverTimer.current) clearTimeout(hoverTimer.current);
                        setHovered(true);
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    {isVideo ? (
                        /* Video popup */
                        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 w-56">
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full max-h-[360px] object-contain block"
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                            <div className="px-3 py-2 bg-black/80 flex items-center justify-center gap-1.5">
                                <Play className="w-3 h-3 text-white/50 fill-white/50" />
                                <p className="text-[10px] text-white/50">悬停自动播放</p>
                            </div>
                        </div>
                    ) : (
                        /* Image zoom popup */
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-100 w-56">
                            <img
                                src={imageUrl}
                                alt="Ad Image"
                                className="w-full object-contain max-h-[280px] block"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/240x240?text=Error';
                                }}
                            />
                            <div className="px-3 py-2 bg-slate-50 flex items-center justify-center">
                                <p className="text-[10px] text-slate-400">广告图片预览</p>
                            </div>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
};

export const MetaSpyRealtime: React.FC<MetaSpyRealtimeProps> = ({ onBack }) => {
    const [url, setUrl] = useState('');
    const [maxResults, setMaxResults] = useState(50);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

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
            // 搜索完成后自动收起面板以便查看数据
            if (data && data.length > 0) {
                setIsHeaderExpanded(false);
            }
        } catch (error: any) {
            console.error('Search failed:', error);
            alert(`查询失败: ${error.message || '未知错误'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Collapsible Search Bar Layer */}
            <div
                className={`transition-all duration-500 ease-in-out relative group/header
                    ${isHeaderExpanded
                        ? 'bg-white p-6 pt-10 rounded-b-[2rem] border-b border-slate-100 shadow-xl shadow-slate-200/50 translate-y-0 opacity-100'
                        : 'bg-white/80 py-3 px-8 rounded-b-2xl backdrop-blur-xl border-b border-slate-200/50 shadow-lg shadow-slate-200/30 opacity-95 hover:opacity-100'
                    } sticky top-0 z-30 flex flex-col gap-1.5`}
            >
                {/* Expandable Content Wrapper */}
                <div className={`transition-all duration-500 origin-top flex flex-col gap-3
                    ${isHeaderExpanded ? 'scale-100 h-auto opacity-100' : 'scale-95 h-0 opacity-0 overflow-hidden pointer-events-none'}`}>

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">实时查询</h2>
                            <p className="text-slate-500 text-[11px]">输入 Meta 广告库链接，即时抓取最新广告数据。</p>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                                        className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
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
                                    className="block w-full px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                >
                                    <option value={10}>10 条</option>
                                    <option value={50}>50 条</option>
                                    <option value={100}>100 条</option>
                                    <option value={200}>200 条</option>
                                    <option value={400}>400 条</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 translate-y-0 hover:-translate-y-0.5"
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
                </div>

                {/* Toggle Bar / Mini Header (shown when collapsed or always as a footer) */}
                <div
                    onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                    className={`flex items-center justify-between cursor-pointer select-none transition-all group/toggle ${isHeaderExpanded ? 'mt-2 border-t border-slate-50 pt-2' : ''}`}
                >
                    {!isHeaderExpanded && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 shadow-sm">
                                <Search className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2 leading-none">
                                    MetaSpy 实时查询控制台
                                    {results.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-black uppercase tracking-tighter">
                                            LIVE: {results.length} 条
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">点击展开调整查询参数</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover/toggle:text-blue-600 group-hover/toggle:bg-blue-50 transition-all">
                        {isHeaderExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>收起面板</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" />
                                <span>展开选项</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Feedback */}
            {results.length > 0 && isHeaderExpanded && (
                <div className="m-6 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-2 animate-in zoom-in-95 duration-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>
                        成功抓取到 <span className="font-bold">{results.length}</span> 条广告数据！(控制台已打印)
                    </span>
                </div>
            )}

            {/* Step 3: 基础表格结构渲染 */}
            {results.length > 0 && (
                <div className="bg-white border-t border-slate-200 border-b-0 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 mb-0 flex-grow">
                    <div className="overflow-x-auto h-full overflow-y-auto pb-40">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                                    <th className="px-3 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-12 text-center">序号</th>
                                    <th className="px-3 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-32">资料库编号</th>
                                    <th className="px-3 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-32">素材预览</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-48">公共主页</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-32">投放日期</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-24">投放时长</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-64">广告标题</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest">广告文案摘要</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest w-24">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {results.map((ad, index) => {
                                    const adArchiveId = ad.metadata?.ad_archive_id || '-';
                                    const startDateObj = ad.timing?.start_date ? new Date(ad.timing.start_date * 1000) : null;
                                    const startDate = startDateObj ? startDateObj.toLocaleDateString() : '-';

                                    // 计算投放时长（天）
                                    const durationDays = startDateObj
                                        ? Math.floor((new Date().getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
                                        : null;

                                    const body = ad.ad_content?.body || '';
                                    const isActive = ad.status?.is_active;

                                    // 共创信息逻辑
                                    const snapshot = ad.additional_info?.raw_data?.snapshot;
                                    const brandedContent = snapshot?.branded_content;
                                    const influencerName = snapshot?.page_name || ad.metadata?.page_name || '未知主页';
                                    const brandName = brandedContent?.page_name;

                                    // 素材预览逻辑
                                    const videoThumbnail = ad.ad_content?.videos?.[0]?.video_preview_image_url;
                                    const isVideo = !!videoThumbnail;

                                    return (
                                        <tr key={ad.metadata?.ad_archive_id || index} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-3 py-4 text-center">
                                                <span className="font-bold text-slate-400 tabular-nums text-sm">{index + 1}</span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <IdCell id={adArchiveId} />
                                            </td>
                                            <td className="px-3 py-4">
                                                <VideoPreviewCell
                                                    videoUrl={ad.ad_content?.videos?.[0]?.video_sd_url || ad.ad_content?.videos?.[0]?.video_url || ad.ad_content?.extra_videos?.[0]?.video_sd_url}
                                                    thumbnailUrl={ad.ad_content?.videos?.[0]?.video_preview_image_url}
                                                    imageUrl={ad.ad_content?.images?.[0]?.resized_image_url || ad.ad_content?.images?.[0]?.original_image_url}
                                                    isVideo={isVideo}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-slate-900 text-[13px] leading-relaxed">
                                                    {brandName ? (
                                                        <>
                                                            <div className="truncate max-w-[180px]">
                                                                {brandName}
                                                            </div>
                                                            <div className="truncate max-w-[180px]">
                                                                {influencerName}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="truncate max-w-[180px]">
                                                            {influencerName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-900 text-[13px] leading-relaxed tabular-nums">
                                                    {startDate}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-900 text-[13px] leading-relaxed tabular-nums">
                                                    {durationDays !== null ? `${durationDays} 天` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-900 text-[13px] line-clamp-2 leading-relaxed">
                                                    {ad.ad_content?.title || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900 text-[13px] line-clamp-2 leading-relaxed">
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
