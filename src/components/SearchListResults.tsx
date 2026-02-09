import React from 'react';
import { ArrowLeft, Download, Table, Search } from 'lucide-react';

interface SearchListResultsProps {
    data: any[];
    onBack: () => void;
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc' | null;
};

export const SearchListResults: React.FC<SearchListResultsProps> = ({ data, onBack }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: '', direction: null });

    // 1. Normalize both keys and limit rows
    const { displayData, processedData, allPossibleKeys } = React.useMemo(() => {
        const CHAR_MAP: Record<string, string> = { '，': ',', '：': ':', '；': ';' };
        const normalizeKey = (k: string) => {
            const s = k.toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (!s) return '';
            return s.replace(/[（【［]/g, '(')
                .replace(/[）】］]/g, ')')
                .replace(/[，：；]/g, m => CHAR_MAP[m] || m);
        };

        const normalized = data.map(row => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = normalizeKey(key);
                if (cleanKey && !cleanKey.startsWith('__EMPTY') && !cleanKey.toLowerCase().includes('unnamed')) {
                    newRow[cleanKey] = row[key];
                }
            });
            return newRow;
        });

        // Search/Filter logic
        let filtered = normalized;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = normalized.filter(row =>
                Object.values(row).some(val =>
                    val?.toString().toLowerCase().includes(term)
                )
            );
        }

        // Sorting logic
        if (sortConfig.key && sortConfig.direction) {
            filtered = [...filtered].sort((a, b) => {
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
        }

        const keys = new Set<string>();
        normalized.forEach(row => {
            Object.keys(row).forEach(k => keys.add(k));
        });

        return {
            processedData: normalized,
            displayData: filtered.slice(0, 500),
            allPossibleKeys: Array.from(keys)
        };
    }, [data, searchTerm, sortConfig]);

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
        ['价格($)', '价格', 'Price'],
        ['子体销量', '子体历史月销量', 'Sub-item Sales'],
        ['月销量', '月度销量', '近30天销量', 'Monthly Sales'],
        ['评分数', '评论数', 'Reviews'],
        ['评分', 'Rating'],
        ['上架时间', 'Date First Available'],
        ['品牌', 'Brand'],
        ['FBA($)', 'FBA费用($)', 'FBA费用', 'FBA Fee', 'FBA'],
        ['SKU']
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
        orderedHeaders.push(...Array.from(remainingHeaders));

        return orderedHeaders;
    }, [originalHeaders]);

    const handleSort = (key: string) => {
        if (key === '序号' || key === '主图') return;
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
            const link = row['商品详情页链接'] || row['url'] || '#';
            return (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 group/link"
                    onClick={(e) => e.stopPropagation()}
                >
                    {val}
                    <ArrowLeft className="w-3 h-3 rotate-135 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
            );
        }

        if (header === '主图') {
            const imgUrl = row['商品主图'] || row['imageUrl'] || row['image'];
            if (!imgUrl) return <span className="text-slate-300">-</span>;
            return (
                <div className="w-32 h-32 rounded-xl border border-slate-200 bg-white p-2 overflow-visible hover:scale-150 transition-transform duration-300 origin-center relative z-10 hover:z-50 shadow-sm hover:shadow-2xl flex items-center justify-center will-change-transform">
                    <img
                        src={imgUrl}
                        alt="Product"
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        const displayVal = val?.toString()?.trim() || '-';
        return <span className="truncate block" title={displayVal}>{displayVal}</span>;
    };

    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { exportToExcelWithImages } = await import('../lib/export-utils');
            const filename = `merged_search_list_${new Date().toISOString().split('T')[0]}.xlsx`;
            await exportToExcelWithImages(processedData, filename, headers);
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
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/60 py-3 px-6 rounded-3xl backdrop-blur-xl border border-white/60 shadow-md -mx-2 sticky top-0 z-30">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button
                        onClick={onBack}
                        className="rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200 p-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="transition-all duration-500">
                        <h3 className="font-bold text-slate-800 text-base">合并结果预览</h3>
                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">共 {data.length} 条数据，当前显示前 {displayData.length} 条</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
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
                            className="w-full bg-slate-100/50 border border-slate-200 pl-10 pr-4 py-2 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70 ${isExporting
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                </div>
            </div>

            {/* Table Container - Fixed Height */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-sm overflow-hidden border-collapse">
                <div
                    className="overflow-x-auto overflow-y-auto transition-all duration-500"
                    style={{ maxHeight: 'calc(100vh - 160px)' }}
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
                                {headers.map((header) => {
                                    const isSorted = sortConfig.key === header;
                                    return (
                                        <th
                                            key={header}
                                            onClick={() => handleSort(header)}
                                            className={`px-4 py-5 text-xl font-extrabold uppercase tracking-wide border-b-2 border-slate-300 whitespace-nowrap w-px border-r border-slate-200/50 transition-colors ${header !== '序号' && header !== '主图' ? 'cursor-pointer hover:bg-slate-100/80 active:bg-slate-200/50' : ''
                                                } ${isSorted ? 'text-blue-600 bg-blue-50/30' : 'text-slate-800'}`}
                                        >
                                            <div className="flex items-center gap-2">
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
                            {displayData.map((row, i) => (
                                <tr
                                    key={i}
                                    className="group even:bg-slate-100/60 hover:bg-blue-50/20 transition-colors"
                                >
                                    {headers.map((header) => (
                                        <td key={`${i}-${header}`} className="px-4 py-3 text-lg text-slate-600 font-medium whitespace-nowrap max-w-[400px] border-r border-slate-100/30">
                                            {renderCell(header, row, i)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
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
        </div>
    );
};
