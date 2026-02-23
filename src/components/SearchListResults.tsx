import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, Table, Search, Maximize2, ChevronUp, X, Copy, Check, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { PriceHistoryChart } from './charts/PriceHistoryChart';
import { TrendHistoryChart } from './charts/TrendHistoryChart';
import { createPortal } from 'react-dom';

interface SearchListResultsProps {
    data: any[];
    site?: string;
    onBack: () => void;
    onRemoveRow: (asin: string) => void;
    onGenerateMarketAnalysis: () => void;
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc' | null;
};

const AsinCell: React.FC<{ val: string; row: any; onRemove: (asin: string) => void }> = ({ val, row, onRemove }) => {
    const [copied, setCopied] = React.useState(false);
    const link = row['商品详情页链接'] || row['url'] || '#';

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard.writeText(val);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-center gap-1 group/asin relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemove(val);
                }}
                className="p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover/asin:opacity-100 transition-all flex-shrink-0"
                title="删除该产品"
            >
                <X className="w-3.5 h-3.5" />
            </button>
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 underline decoration-slate-300 hover:decoration-blue-600 hover:text-blue-600 transition-colors font-medium text-[13px] flex items-center gap-0.5 group/link"
                onClick={(e) => e.stopPropagation()}
            >
                {val}
                <ArrowLeft className="w-2 h-2 rotate-135 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            <button
                onClick={handleCopy}
                className={`p-1 rounded-md transition-all flex-shrink-0 ${copied
                    ? 'text-green-500 bg-green-50 scale-110'
                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-40 hover:opacity-100'
                    }`}
                title={copied ? "已复制" : "点击复制 ASIN"}
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


// Columns that are collapsed by default
const DETAIL_COLUMNS = ['包装尺寸分段', '商品重量', '商品尺寸', '包装重量', '包装尺寸', '类目路径', '大类目', '小类目', '父ASIN'];

export const SearchListResults: React.FC<SearchListResultsProps> = ({ data, site = 'US', onBack, onRemoveRow, onGenerateMarketAnalysis }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: '', direction: null });
    const [visibleCount, setVisibleCount] = React.useState(500);
    const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(true);
    const [isDetailColumnsExpanded, setIsDetailColumnsExpanded] = useState(false);

    // Hover state for Trend History (Price or Sales)
    const [hoveredChartData, setHoveredChartData] = useState<{
        data: any,
        type: 'price' | 'sales' | 'parentSales',
        position: { x: number, y: number }
    } | null>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 🚀 Performance: Debounce search input
    const deferredSearchTerm = React.useDeferredValue(searchTerm);

    // 🚀 Performance: Step 1 - Normalize data (only when raw data changes)
    const normalizedData = React.useMemo(() => {
        const CHAR_MAP: Record<string, string> = { '，': ',', '：': ':', '；': ';' };
        const normalizeKey = (k: string) => {
            const s = k.toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (!s) return '';
            return s.replace(/[（【［]/g, '(')
                .replace(/[）】］]/g, ')')
                .replace(/[，：；]/g, m => CHAR_MAP[m] || m)
                .replace(/\(\$\)/g, '')
                .trim();
        };

        return data.map(row => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                let cleanKey = normalizeKey(key);
                // Specific rename for Natural Ranking
                if (cleanKey === '自然排名(页码-页内排名)') {
                    cleanKey = '自然排名';
                }
                // Specific rename for Monthly Sales
                if (cleanKey === '月销量') {
                    cleanKey = '父体销量';
                }

                // Specific rename for Unit Conversions
                if (cleanKey === '商品重量(单位换算)') cleanKey = '商品重量';
                if (cleanKey === '商品尺寸(单位换算)') cleanKey = '商品尺寸';
                if (cleanKey === '包装重量(单位换算)') cleanKey = '包装重量';
                if (cleanKey === '包装尺寸(单位换算)') cleanKey = '包装尺寸';
                // Specific rename for Seller column
                if (cleanKey === 'BuyBox卖家') cleanKey = '卖家';

                if (cleanKey && !cleanKey.startsWith('__EMPTY') && !cleanKey.toLowerCase().includes('unnamed')) {
                    newRow[cleanKey] = row[key];
                }
            });

            // Calculate "自然:广告"
            const organic = newRow['流量分布(自然)'];
            const advertising = newRow['流量分布(广告)'];
            if (organic !== undefined && advertising !== undefined) {
                const formatPercent = (val: any) => {
                    const s = val?.toString() || '0';
                    return s.includes('%') ? s : `${(parseFloat(s) * 100).toFixed(0)}%`;
                };
                newRow['自然:广告'] = `${formatPercent(organic)}:${formatPercent(advertising)}`;
            }

            // Calculate Listing Period (上架时段)
            const listingDateVal = newRow['上架时间'] || newRow['Date First Available'];
            if (listingDateVal) {
                const listingDate = new Date(listingDateVal);
                if (!isNaN(listingDate.getTime())) {
                    const now = new Date();
                    const diffMonths = (now.getFullYear() - listingDate.getFullYear()) * 12 + (now.getMonth() - listingDate.getMonth());

                    let period = '1年+';
                    if (diffMonths <= 3) period = '3个月';
                    else if (diffMonths <= 6) period = '6个月';
                    else if (diffMonths <= 9) period = '9个月';
                    else if (diffMonths <= 12) period = '12个月';

                    newRow['上架时段'] = period;
                }
            }

            // Logic for Shipping Method (配送方式)
            // If "配送方式" is FBM, then "FBA" should display "FBM"
            const shippingMethod = row['配送方式'];
            if (shippingMethod && shippingMethod.toString().trim().toUpperCase() === 'FBM') {
                // Find which key corresponds to FBA in newRow
                // It could be 'FBA', 'FBA费用', or 'FBA Fee' (after normalization)
                const fbaKeys = ['FBA', 'FBA费用', 'FBA Fee'];
                for (const fbaKey of fbaKeys) {
                    if (newRow[fbaKey] !== undefined) {
                        newRow[fbaKey] = 'FBM';
                    }
                }
                // If neither exists but we want to ensure it shows up correctly if FBA column is present
                // The priorityGroups logic handles which one is actually shown.
            }

            return newRow;
        });
    }, [data]);

    // 🚀 Performance: Step 2 - Extract all keys (only when normalized data changes)
    const allPossibleKeys = React.useMemo(() => {
        const keys = new Set<string>();
        normalizedData.forEach(row => {
            Object.keys(row).forEach(k => keys.add(k));
        });
        return Array.from(keys);
    }, [normalizedData]);

    // 🚀 Performance: Step 3 - Filter by search term (uses deferred value)
    const filteredData = React.useMemo(() => {
        if (!deferredSearchTerm.trim()) {
            return normalizedData;
        }
        const term = deferredSearchTerm.toLowerCase();
        return normalizedData.filter(row =>
            Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(term)
            )
        );
    }, [normalizedData, deferredSearchTerm]);

    // 🚀 Performance: Step 4 - Sort filtered data
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return filteredData;
        }

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // Attempt numeric sort
            const aNum = parseFloat(aVal?.toString().replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(bVal?.toString().replace(/[^0-9.-]/g, ''));

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Fallback to string sort
            const aStr = aVal?.toString().toLowerCase() || '';
            const bStr = bVal?.toString().toLowerCase() || '';
            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 🚀 Performance: Step 5 - Limit displayed rows (pagination)
    const displayData = React.useMemo(() => {
        return sortedData.slice(0, visibleCount);
    }, [sortedData, visibleCount]);

    if (data.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-12 rounded-[2.5rem] shadow-xl text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <Table className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">未找到可合并的数据，请检查 ASIN 是否匹配。</p>
                <button onClick={onBack} className="text-blue-600 font-semibold hover:underline">返回上传</button>
            </div>
        );
    }

    const originalHeaders = allPossibleKeys;

    // Define priority column groups to ensure only ONE match per category is added
    const priorityGroups = [
        ['序号'],
        ['ASIN'],
        ['主图'],
        ['价格', 'Price'],
        ['子体销量', '子体历史月销量', 'Sub-item Sales'],
        ['父体销量', '月销量', '月度销量', '近30天销量', 'Monthly Sales'],
        ['变体数', '变体', 'Variations'],
        ['评分数', '评论数', 'Reviews'],
        ['评分', 'Rating'],
        ['上架时段'],
        ['上架时间', 'Date First Available'],
        ['品牌', 'Brand'],
        ['自然排名'],
        ['自然:广告'],
        ['卖家', 'BuyBox卖家'],
        ['卖家所属地'],
        ['FBA', 'FBA费用', 'FBA Fee'],
        ['包装尺寸分段'],
        ['商品重量'],
        ['商品尺寸'],
        ['包装重量'],
        ['包装尺寸'],
        ['类目路径'],
        ['大类目'],
        ['小类目'],
        ['父ASIN', 'Parent ASIN']
    ];

    const headers = React.useMemo(() => {
        const normalizeForMatch = (s: string) => s.toString().trim().replace(/\s+/g, '').toLowerCase()
            .replace(/[（【［(]/g, '').replace(/[）】］)]/g, '').replace(/(\$|￥)/g, '');

        const remainingHeaders = new Set(originalHeaders);
        const orderedHeaders: string[] = [];

        // 1. Process priority groups
        priorityGroups.forEach(group => {
            if (group[0] === '序号' || group[0] === '主图') {
                orderedHeaders.push(group[0]);
                return;
            }

            // Find the first member of the group that exists in the data
            let categoryMatched = false;

            for (const priorityName of group) {
                const normP = normalizeForMatch(priorityName);
                const found = Array.from(remainingHeaders).find(h => normalizeForMatch(h) === normP);
                if (found) {
                    if (!categoryMatched) {
                        orderedHeaders.push(found);
                        categoryMatched = true;
                    }
                    remainingHeaders.delete(found); // Remove ALL variants of this category from remaining
                }
            }
        });

        // 2. Add remaining columns (already filtered of system ones in memo 1)
        // const suffixOrder = ['-父-U', '-父-M', '-子-U', '-子-M', '-子-P'];
        // const sortedRemaining = Array.from(remainingHeaders).sort((a: string, b: string) => {
        //     const datePattern = /^(\d{4}-\d{2})/;
        //     const matchA = a.match(datePattern);
        //     const matchB = b.match(datePattern);

        //     if (matchA && matchB) {
        //         const suffixA = a.replace(matchA[1], '');
        //         const suffixB = b.replace(matchB[1], '');
        //         const indexA = suffixOrder.indexOf(suffixA);
        //         const indexB = suffixOrder.indexOf(suffixB);

        //         // Sort by suffix priority first
        //         if (indexA !== indexB) {
        //             if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        //             if (indexA !== -1) return -1;
        //             if (indexB !== -1) return 1;
        //         }

        //         // Then by date (Reverse Chronological)
        //         return matchB[1].localeCompare(matchA[1]);
        //     }

        //     // Dates go after non-date columns
        //     if (matchA) return 1;
        //     if (matchB) return -1;

        //     return a.localeCompare(b);
        // });

        // orderedHeaders.push(...sortedRemaining);

        return orderedHeaders;
    }, [originalHeaders]);

    // visibleHeaders: filter detail columns when collapsed, then inject __TOGGLE__ button after FBA
    const visibleHeaders = React.useMemo(() => {
        const filtered = isDetailColumnsExpanded
            ? headers
            : headers.filter(h => !DETAIL_COLUMNS.includes(h));

        // Insert __TOGGLE__ virtual column right after the FBA column
        const fbaIdx = filtered.findIndex(h => ['FBA', 'FBA费用', 'FBA Fee'].includes(h));
        if (fbaIdx !== -1) {
            const result = [...filtered];
            result.splice(fbaIdx + 1, 0, '__TOGGLE__');
            return result;
        }
        return filtered;
    }, [headers, isDetailColumnsExpanded]);

    const handleSort = (key: string) => {
        if (key === '序号' || key === '主图' || key === '__TOGGLE__') return;
        setSortConfig(prev => {
            if (prev.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' };
                return { key: '', direction: null };
            }
            return { key, direction: 'asc' };
        });
    };

    const renderCell = (header: string, row: any, index: number) => {
        const val = row[header];

        if (header === '序号') {
            return <span className="font-bold text-slate-400 tabular-nums">{index + 1}</span>;
        }

        if (header.toUpperCase() === 'ASIN') {
            return <AsinCell val={val} row={row} onRemove={onRemoveRow} />;
        }

        if (header === '主图') {
            const imgUrl = row['商品主图'] || row['imageUrl'] || row['image'];
            if (!imgUrl) return <span className="text-slate-300">-</span>;
            return (
                <div className="w-32 h-32 rounded-xl border border-slate-200 bg-white p-2 overflow-visible hover:scale-150 transition-transform duration-300 origin-center relative z-10 hover:z-50 shadow-sm hover:shadow-2xl flex items-center justify-center will-change-transform">
                    <img
                        src={imgUrl}
                        alt="Product"
                        loading="lazy"
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        const displayVal = val?.toString()?.trim() || '-';
        const isBrand = header === '品牌' || header.toLowerCase() === 'brand';

        if (isBrand) {
            const brandLink = row['品牌链接'];
            if (brandLink && brandLink !== '#') {
                return (
                    <a
                        href={brandLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 underline decoration-slate-300 hover:decoration-blue-600 hover:text-blue-600 transition-colors font-medium line-clamp-2 whitespace-normal break-words leading-tight"
                        onClick={(e) => e.stopPropagation()}
                        title={displayVal}
                    >
                        {displayVal}
                    </a>
                );
            }
        }

        if (header === '卖家') {
            const sellerLink = row['卖家首页'];
            if (sellerLink && sellerLink !== '#') {
                return (
                    <a
                        href={sellerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 underline decoration-slate-300 hover:decoration-blue-600 hover:text-blue-600 transition-colors font-medium line-clamp-2 whitespace-normal break-words leading-tight"
                        onClick={(e) => e.stopPropagation()}
                        title={displayVal}
                    >
                        {displayVal}
                    </a>
                );
            }
        }

        if (header === '自然排名') {
            const asin = row['ASIN'] || row['asin'];
            const rankingLink = `https://www.xiyouzhaoci.com/detail/asin/look_up/${site}/${asin}`;
            return (
                <a
                    href={rankingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 underline decoration-slate-300 hover:decoration-blue-600 hover:text-blue-600 transition-colors font-medium truncate block"
                    onClick={(e) => e.stopPropagation()}
                    title={displayVal}
                >
                    {displayVal}
                </a>
            );
        }

        return (
            <span
                className={`${isBrand ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate block'}`}
                title={displayVal}
            >
                {displayVal}
            </span>
        );
    };

    const [isExporting, setIsExporting] = React.useState(false);
    const [selectedAsins, setSelectedAsins] = React.useState<Set<string>>(new Set());

    const toggleRowSelection = (asin: string) => {
        setSelectedAsins(prev => {
            const next = new Set(prev);
            if (next.has(asin)) {
                next.delete(asin);
            } else {
                next.add(asin);
            }
            return next;
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { exportToExcelWithImages } = await import('../lib/export-utils');
            const filename = `merged_search_list_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Start with visible headers (excluding 序号)
            const exportHeaders = headers.filter(h => h !== '序号');

            // Find "父ASIN" or "Parent ASIN" to insert extra columns after it
            const parentAsinIndex = exportHeaders.findIndex(h => h === '父ASIN' || h === 'Parent ASIN');
            const extraColumns = ['商品标题', 'Coupon', '商品主图'];

            if (parentAsinIndex !== -1) {
                exportHeaders.splice(parentAsinIndex + 1, 0, ...extraColumns);
            } else {
                // Fallback: append at the end of visible headers if Parent ASIN not found
                exportHeaders.push(...extraColumns);
            }

            // Extract all historical data columns from normalizedData
            const historicalPattern = /^(\d{4})-(\d{2})-([父子])-(U|M|P)$/;
            const historicalColumns = new Set<string>();

            normalizedData.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (historicalPattern.test(key)) {
                        historicalColumns.add(key);
                    }
                });
            });

            // Sort historical columns: group by suffix first, then by date descending within each group
            const suffixOrder = ['-父-U', '-父-M', '-子-U', '-子-M', '-子-P'];
            const sortedHistorical = Array.from(historicalColumns).sort((a, b) => {
                const matchA = a.match(historicalPattern);
                const matchB = b.match(historicalPattern);

                if (!matchA || !matchB) return 0;

                const dateA = `${matchA[1]}-${matchA[2]}`;
                const dateB = `${matchB[1]}-${matchB[2]}`;
                const suffixA = `-${matchA[3]}-${matchA[4]}`;
                const suffixB = `-${matchB[3]}-${matchB[4]}`;

                // First, sort by suffix order
                const indexA = suffixOrder.indexOf(suffixA);
                const indexB = suffixOrder.indexOf(suffixB);
                if (indexA !== indexB) {
                    return indexA - indexB;
                }

                // Within same suffix, sort by date descending (newest first)
                return dateB.localeCompare(dateA);
            });

            // Append historical columns to export headers
            const finalHeaders = [...exportHeaders, ...sortedHistorical];

            await exportToExcelWithImages(normalizedData, filename, finalHeaders, site);
        } catch (error) {
            console.error('Export failed:', error);
            alert('导出失败，请检查网络或重试');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Action Bar */}
            <div
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className={`transition-all duration-500 ease-in-out relative group/header cursor-pointer select-none
                    ${isHeaderExpanded
                        ? 'bg-white/60 pt-3 pb-1 px-6 rounded-3xl backdrop-blur-xl border border-white/60 shadow-md translate-y-0 opacity-100 mb-0'
                        : 'bg-white/40 py-1.5 px-4 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm -mt-2 opacity-80 hover:opacity-100 mb-[-1.8rem]'
                    } -mx-2 sticky top-0 z-30 flex flex-col gap-0.5`}
            >
                {/* Header Content Wrapper */}
                <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 w-full transition-all duration-500 origin-top
                    ${isHeaderExpanded ? 'scale-100 h-auto opacity-100' : 'scale-95 h-0 opacity-0 overflow-hidden pointer-events-none'}`}>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); onBack(); }}
                            className="rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200 p-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="transition-all duration-500">
                            <h3 className="font-bold text-slate-800 text-base">合并结果预览</h3>
                            <p className="text-xs text-slate-400 font-medium whitespace-nowrap">共 {sortedData.length} 条数据，当前显示前 {displayData.length} 条</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="搜索产品、ASIN 或关键词..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 pl-10 pr-10 py-2 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Data Statistics */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-xl border border-slate-200/50 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            <Table className="w-3 h-3 text-blue-500" />
                            <span>
                                {deferredSearchTerm ? (
                                    <>已筛选 <span className="text-blue-600">{filteredData.length}</span> / {normalizedData.length} 条</>
                                ) : (
                                    <>共 <span className="text-blue-600">{normalizedData.length}</span> 条产品</>
                                )}
                                {displayData.length < sortedData.length && (
                                    <span className="ml-1 text-slate-400 font-medium">(显示前 {displayData.length} 条)</span>
                                )}
                            </span>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70 ${isExporting
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
                                    正在打包图片...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" /> 下载搜索列表
                                </>
                            )}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onGenerateMarketAnalysis(); }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-2xl font-bold transition-all shadow-lg active:scale-95 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-200"
                        >
                            <ArrowLeft className="w-4 h-4 rotate-180" /> 生成市场分析
                        </button>
                    </div>
                </div>

                {/* Toggle Button / Bar Indicator */}
                <div className={`flex items-center justify-center transition-all ${isHeaderExpanded ? 'h-5' : 'h-6'}`}>
                    <div
                        className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest
                            ${isHeaderExpanded
                                ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-100/50'
                                : 'text-blue-500 bg-blue-50/50 group-hover/header:bg-blue-100/80 tracking-widest'
                            }`}
                    >
                        {isHeaderExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                <span>收起面板</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3 h-3" />
                                <span>点击展开搜索与下载</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container - Fixed Height */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-sm overflow-hidden border-collapse">
                <div
                    className="overflow-x-auto overflow-y-auto transition-all duration-500"
                    style={{ maxHeight: isHeaderExpanded ? 'calc(100vh - 160px)' : 'calc(100vh - 80px)' }}
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        const bottomScrollbar = target.nextElementSibling as HTMLElement;
                        if (bottomScrollbar) {
                            bottomScrollbar.scrollLeft = target.scrollLeft;
                        }
                    }}
                >
                    <table className="w-auto text-left table-auto border-collapse">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-50/95 backdrop-blur-md">
                                {visibleHeaders.map((header) => {
                                    // Special toggle button column
                                    if (header === '__TOGGLE__') {
                                        return (
                                            <th
                                                key="__TOGGLE__"
                                                className="px-2 py-5 border-b-2 border-slate-300 border-r border-slate-200/50 w-px"
                                            >
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIsDetailColumnsExpanded(v => !v); }}
                                                    title={isDetailColumnsExpanded ? '折叠详情列' : '展开详情列'}
                                                    className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    {isDetailColumnsExpanded
                                                        ? <ChevronsLeft className="w-4 h-4" />
                                                        : <ChevronsRight className="w-4 h-4" />}
                                                </button>
                                            </th>
                                        );
                                    }

                                    const isSorted = sortConfig.key === header;
                                    const isBrand = header === '品牌' || header.toLowerCase() === 'brand';
                                    const isIndex = header === '序号';
                                    const isAsin = header.toLowerCase() === 'asin';
                                    const isPeriod = header === '上架时段';
                                    const isRank = header === '自然排名';
                                    const isTraffic = header === '自然:广告';
                                    const isSeller = header === '卖家';
                                    const isMainImage = header === '主图';

                                    return (
                                        <th
                                            key={header}
                                            onClick={() => handleSort(header)}
                                            className={`px-4 py-5 font-extrabold uppercase tracking-wide border-b-2 border-slate-300 border-r border-slate-200/50 transition-colors ${header !== '序号' && header !== '主图' ? 'cursor-pointer hover:bg-slate-100/80 active:bg-slate-200/50' : ''
                                                } ${isSorted ? 'text-blue-600 bg-blue-50/30' : 'text-slate-800'
                                                } ${isBrand ? 'w-[140px] min-w-[140px] max-w-[140px] !whitespace-normal text-xl' : 'whitespace-nowrap w-px'
                                                } ${isIndex ? 'text-sm' : 'text-xl'
                                                } ${isAsin ? 'w-[120px] min-w-[120px] max-w-[120px] text-center' : ''
                                                } ${isMainImage ? 'text-center min-w-[150px]' : ''
                                                } ${isPeriod ? 'w-[100px] min-w-[100px] max-w-[100px] text-center' : ''
                                                } ${isRank ? 'w-[100px] min-w-[100px] max-w-[100px] text-center' : ''
                                                } ${isTraffic ? 'w-[120px] min-w-[120px] max-w-[120px] text-center' : ''
                                                } ${isSeller ? 'w-[120px] min-w-[120px] max-w-[120px] !whitespace-normal' : ''
                                                } ${header === '价格' || header === 'Price' ? 'relative overflow-visible z-20' : ''}`}
                                        >
                                            <div className={`flex items-center gap-2 ${isAsin || isPeriod || isRank || isTraffic || isMainImage ? 'justify-center' : ''}`}>
                                                {header}
                                                {header !== '序号' && header !== '主图' && (
                                                    <div className="flex flex-col text-[10px] leading-[1]">
                                                        <span className={isSorted && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-slate-300'}>▲</span>
                                                        <span className={isSorted && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-slate-300'}>▼</span>
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {displayData.map((row, i) => {
                                const asin = row['ASIN'] || row['asin'] || `row-${i}`;
                                const isSelected = selectedAsins.has(asin);

                                return (
                                    <tr
                                        key={asin}
                                        onClick={() => toggleRowSelection(asin)}
                                        className={`group transition-colors cursor-pointer ${isSelected
                                            ? 'bg-[#eff5ff] hover:bg-[#eff5ff]'
                                            : 'even:bg-slate-100/60 hover:bg-blue-50/20'
                                            }`}
                                    >
                                        {visibleHeaders.map((header) => {
                                            // Empty cell for the toggle column
                                            if (header === '__TOGGLE__') {
                                                return <td key={`${i}-__toggle__`} className="border-r border-slate-100/30 w-px" />;
                                            }

                                            const isBrand = header === '品牌' || header.toLowerCase() === 'brand';
                                            const isAsin = header.toLowerCase() === 'asin';
                                            const isPeriod = header === '上架时段';
                                            const isRank = header === '自然排名';
                                            const isTraffic = header === '自然:广告';
                                            const isSeller = header === '卖家';
                                            const isMainImage = header === '主图';

                                            return (
                                                <td
                                                    key={`${i}-${header}`}
                                                    className={`px-4 py-3 text-lg text-slate-600 font-medium border-r border-slate-100/30 ${isBrand ? 'w-[140px] min-w-[140px] max-w-[140px] whitespace-normal' :
                                                        isAsin ? 'w-[120px] min-w-[120px] max-w-[120px] text-center' :
                                                            isMainImage ? 'text-center' :
                                                                isPeriod ? 'w-[100px] min-w-[100px] max-w-[100px] text-center' :
                                                                    isRank ? 'w-[100px] min-w-[100px] max-w-[100px] text-center' :
                                                                        isTraffic ? 'w-[120px] min-w-[120px] max-w-[120px] text-center' :
                                                                            isSeller ? 'w-[120px] min-w-[120px] max-w-[120px] whitespace-normal' :
                                                                                'whitespace-nowrap max-w-[400px]'
                                                        }`}
                                                    onMouseEnter={(e) => {
                                                        const isPrice = header === '价格' || header === 'Price';
                                                        const isChildSales = ['子体销量', '子体历史月销量', 'Sub-item Sales'].includes(header);
                                                        const isParentSales = ['父体销量', '月销量', '月度销量', '近30天销量', 'Monthly Sales'].includes(header);

                                                        if (isPrice || isChildSales || isParentSales) {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            // clear any pending hide
                                                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

                                                            setHoveredChartData({
                                                                data: row,
                                                                type: isPrice ? 'price' : (isChildSales ? 'sales' : 'parentSales'),
                                                                position: { x: rect.left + rect.width / 2, y: rect.bottom }
                                                            });
                                                        }
                                                    }}
                                                    onMouseLeave={() => {
                                                        const isPrice = header === '价格' || header === 'Price';
                                                        const isChildSales = ['子体销量', '子体历史月销量', 'Sub-item Sales'].includes(header);
                                                        const isParentSales = ['父体销量', '月销量', '月度销量', '近30天销量', 'Monthly Sales'].includes(header);

                                                        if (isPrice || isChildSales || isParentSales) {
                                                            hoverTimeoutRef.current = setTimeout(() => {
                                                                setHoveredChartData(null);
                                                            }, 200); // Increased delay to allow moving to the card
                                                        }
                                                    }}
                                                >
                                                    {renderCell(header, row, i)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Scrollbar for horizontal navigation */}
                <div
                    className="overflow-x-auto overflow-y-hidden border-t border-slate-100"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        const tableContainer = target.previousElementSibling as HTMLElement;
                        if (tableContainer) {
                            tableContainer.scrollLeft = target.scrollLeft;
                        }
                    }}
                    ref={(el) => {
                        if (el) {
                            const tableContainer = el.previousElementSibling as HTMLElement;
                            if (tableContainer) {
                                el.scrollLeft = tableContainer.scrollLeft;
                            }
                        }
                    }}
                >
                    <div style={{ height: '12px', width: '100%', minWidth: 'max-content' }} />
                </div>
            </div>

            {/* Load More Button */}
            {
                displayData.length < sortedData.length && (
                    <div className="flex justify-center pt-6 animate-in fade-in duration-500">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 100)}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>加载更多</span>
                            <span className="text-xs opacity-80">(还有 {sortedData.length - displayData.length} 条)</span>
                        </button>
                    </div>
                )
            }
            {/* Trend History Hover Portal */}
            {
                hoveredChartData && createPortal(
                    <div
                        className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            left: hoveredChartData.position.x,
                            top: hoveredChartData.position.y,
                            transform: 'translateX(-50%) translateY(10px)'
                        }}
                        onMouseEnter={() => {
                            if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                            }
                        }}
                        onMouseLeave={() => {
                            hoverTimeoutRef.current = setTimeout(() => {
                                setHoveredChartData(null);
                            }, 200);
                        }}
                    >
                        <div className="relative">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-100 rotate-45" />
                            {hoveredChartData.type === 'price' ? (
                                <PriceHistoryChart data={hoveredChartData.data} />
                            ) : hoveredChartData.type === 'sales' ? (
                                <TrendHistoryChart
                                    data={hoveredChartData.data}
                                    dataKeyPattern={/^(\d{4})-(\d{2})-子-U$/}
                                    title="子体月销量趋势 (近三年对比)"
                                />
                            ) : (
                                <TrendHistoryChart
                                    data={hoveredChartData.data}
                                    dataKeyPattern={/^(\d{4})-(\d{2})-父-U$/}
                                    title="父体销量趋势 (近三年对比)"
                                />
                            )}
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};
