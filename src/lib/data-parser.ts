import * as XLSX from 'xlsx';
import type { RawAmazonRow, ParsedData, MergedSearchListData, YearlyTrendData } from './types';

/**
 * 根据列名优先级解析应使用哪一列作为「子体销量」来源。
 * 优先级: 子体销量 > 最新 YYYY-MM-子-U > 子体历史月销量 > 近30天销量 > 父体销量
 */
function resolveUnitsKey(allKeys: string[]): string {
    const subItemSalesColumns = allKeys.filter(key => /^\d{4}-\d{2}-子-U$/.test(key));
    if (allKeys.includes('子体销量')) return '子体销量';
    if (subItemSalesColumns.length > 0) return subItemSalesColumns.sort().reverse()[0];
    if (allKeys.includes('子体历史月销量')) return '子体历史月销量';
    if (allKeys.includes('近30天销量')) return '近30天销量';
    if (allKeys.includes('父体销量')) return '父体销量';
    return '';
}

/**
 * Transforms raw rows into structured data for charts.
 */
export function processRawRows(jsonData: any[]): ParsedData {
    const allKeys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    // 使用统一的优先级解析函数
    const subItemSalesColumns = allKeys.filter(key => /^\d{4}-\d{2}-子-U$/.test(key));
    let unitsKey = resolveUnitsKey(allKeys);

    // Transform data for Scatter Chart
    const scatterData = jsonData
        .filter(row => (row['价格'] != null || row['Price'] != null) && (unitsKey && row[unitsKey] != null))
        .map(row => {
            const val = unitsKey ? row[unitsKey] : 0;
            const units = typeof val === 'number' ? val : (Number(val?.toString().replace(/[^0-9.-]/g, '')) || 0);

            return {
                price: Number(row['价格'] || row['Price']),
                units: units,
                brand: row['品牌'] || 'Unknown',
                launchDate: row['上架时间'],
                url: row['商品详情页链接'] || row['url'],
                asin: row['ASIN'],
                title: row['商品标题'],
                imageUrl: row['首图链接'] || row['商品主图'] || row['imageUrl'],
                rating: row['评分'],
                reviewCount: row['评分数'],
                coupon: row['Coupon']
            };
        });

    // Transform data for Monthly Sales Chart
    // Primary: "YYYY-MM-子-U" (Sub-item Sales from Exported Search List)
    // Parent:  "YYYY-MM-父-U" (Parent Sales from Exported Search List)
    // Fallback (no sales file): "YYYY-MM" (Parent Sales from Raw Product File)
    const rawMonthlyColumns = allKeys.filter(key => /^\d{4}-\d{2}$/.test(key));
    const parentSalesColumns = allKeys.filter(key => /^\d{4}-\d{2}-父-U$/.test(key));

    const isUsingSubItemSales = subItemSalesColumns.length > 0;
    const monthlyColumns = isUsingSubItemSales ? subItemSalesColumns : rawMonthlyColumns;

    /** Helper: aggregate a set of date columns into YearlyTrendData[] */
    function buildYearlyTrend(
        cols: string[],
        useParentDedup: boolean
    ): YearlyTrendData[] {
        const yMap: Record<string, Record<number, number>> = {};

        cols.forEach(col => {
            const datePart = col.split('-').slice(0, 2).join('-');
            const [year, monthStr] = datePart.split('-');
            const month = parseInt(monthStr, 10);

            if (!yMap[year]) yMap[year] = {};
            if (!yMap[year][month]) yMap[year][month] = 0;

            const seen = new Set<string>();
            jsonData.forEach(row => {
                const parentAsin = row['父ASIN'] || row['ASIN'] || row['Parent ASIN'];
                const val = row[col];
                if (val != null && val !== '') {
                    const numVal = Number(val.toString().replace(/[^0-9.-]/g, ''));
                    if (isNaN(numVal)) return;
                    if (useParentDedup) {
                        if (!seen.has(parentAsin)) {
                            yMap[year][month] += numVal;
                            seen.add(parentAsin);
                        }
                    } else {
                        yMap[year][month] += numVal;
                    }
                }
            });
        });

        return Object.entries(yMap).map(([year, months]) => ({
            year,
            data: Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const dp = months[m];
                return { month: m, units: dp !== undefined ? dp : null };
            })
        })).sort((a, b) => a.year.localeCompare(b.year));
    }

    // Primary dataset: sub-item (子-U) or raw YYYY-MM fallback
    const monthlyData = buildYearlyTrend(
        monthlyColumns,
        !isUsingSubItemSales  // de-dup parent ASIN only when using raw YYYY-MM columns
    );

    // Parent dataset: 父-U (only available when sales file uploaded)
    const monthlyDataParent = buildYearlyTrend(parentSalesColumns, false);

    // Transform data for Brand Monopoly Chart（复用统一优先级函数）
    const brandSalesMap: Record<string, number> = {};
    let totalUnits = 0;
    unitsKey = resolveUnitsKey(allKeys);

    jsonData.forEach(row => {
        const brand = row['品牌'] || 'Unknown';
        const val = unitsKey ? row[unitsKey] : 0;
        const units = typeof val === 'number' ? val : (Number(val?.toString().replace(/[^0-9.-]/g, '')) || 0);

        brandSalesMap[brand] = (brandSalesMap[brand] || 0) + units;
        totalUnits += units;
    });

    const brandData = Object.entries(brandSalesMap)
        .map(([brand, units]) => ({
            brand,
            units,
            percentage: totalUnits > 0 ? (units / totalUnits) * 100 : 0
        }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 20); // Top 20 brands

    return {
        rows: jsonData,
        totalRows: jsonData.length,
        scatterData,
        monthlyData,
        monthlyDataParent,
        brandData
    };
}

/**
 * Parses the uploaded Excel file and returns row data.
 * Keeps all raw keys from the Excel file (Chinese headers).
 */
export async function parseExcel(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    throw new Error("File is empty");
                }

                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Parse to JSON directly using first row as headers
                const jsonData = XLSX.utils.sheet_to_json<RawAmazonRow>(worksheet, {
                    defval: "", // Use empty string for empty cells
                });

                resolve(processRawRows(jsonData));
            } catch (err) {
                console.error("[DataParser] Error parsing file:", err);
                reject(err);
            }
        };

        reader.onerror = (err) => {
            reject(err);
        };

        reader.readAsArrayBuffer(file);
    });
}
/**
 * Identifies and merges "Product" and "Keywords" files based on ASIN.
 */
/**
 * Identifies and merges "Product", "Keyword", and "Sales" files based on ASIN.
 */
export async function mergeSearchListData(files: File[]): Promise<MergedSearchListData> {
    // 1. Identify Files
    const productFile = files.find(f =>
        /^Product-[a-z]{2,}-\d{4,}\.xlsx$/i.test(f.name) &&
        !f.name.toLowerCase().includes('sales')
    );

    // Support multiple sales files
    const salesFiles = files.filter(f =>
        f.name.toLowerCase().startsWith('product-') &&
        f.name.toLowerCase().includes('sales') &&
        /\.xlsx$/i.test(f.name)
    );

    const keywordFile = files.find(f =>
        /^关键词分析_.*\.xlsx$/i.test(f.name) ||
        (f.name.startsWith('关键词分析_') && f.name.includes('~'))
    );

    if (!productFile || !keywordFile) {
        throw new Error(`缺少必要文件。\n需至少包含：\n1. 主产品表 (Product-*.xlsx)\n2. 关键词表 (关键词分析_*.xlsx)\n\n当前识别：\nProduct: ${productFile?.name || '无'}\nKeywords: ${keywordFile?.name || '无'}\nSales Files: ${salesFiles.length} 个`);
    }

    // --- Helper: Read specific sheet ---
    const readSheet = (file: File, sheetName?: string): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const targetSheetName = sheetName || workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[targetSheetName];
                    if (!worksheet) {
                        // If specific sheet missing in sales file, return empty array (non-fatal)
                        if (sheetName) return resolve([]);
                        throw new Error(`Sheet ${targetSheetName} not found in ${file.name}`);
                    }
                    resolve(XLSX.utils.sheet_to_json(worksheet, { defval: "" }));
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    // 2. Parse Files
    // 2.1 Main Product Data
    const productData = await readSheet(productFile);

    // 2.2 Keyword Data
    const keywordData = await readSheet(keywordFile);

    // 2.3 Sales Data (Complex Processing)
    const salesDataMap = new Map<string, any>();

    // Sheet Config for Sales Files
    const sheetRules = [
        { name: '产品历史月销量', from: /^\d{4}-\d{2}$/, suffix: '-父-U' },
        { name: '历史月销售额', from: /^(\d{4}-\d{2})\(\$\)$/, suffix: '-父-M', stripMoney: true },
        { name: '子体历史月销量', from: /^\d{4}-\d{2}$/, suffix: '-子-U' },
        { name: '子体历史月销售额', from: /^(\d{4}-\d{2})\(\$\)$/, suffix: '-子-M', stripMoney: true },
        { name: '历史月价格', from: /^(\d{4}-\d{2})\(\$\)$/, suffix: '-子-P', stripMoney: true },
    ];

    if (salesFiles.length > 0) {
        for (const sFile of salesFiles) {
            // Process each required sheet
            for (const rule of sheetRules) {
                const sheetRows = await readSheet(sFile, rule.name);

                sheetRows.forEach(row => {
                    const asin = row['ASIN'] || row['asin'];
                    if (!asin) return;

                    const asinKey = asin.toString();
                    if (!salesDataMap.has(asinKey)) {
                        salesDataMap.set(asinKey, { ASIN: asinKey });
                    }
                    const mergedRow = salesDataMap.get(asinKey);

                    // Iterate columns and rename
                    Object.keys(row).forEach(key => {
                        let newKey = key;
                        const val = row[key];

                        // Skip common identify columns to avoid overwriting or duplication if already exists
                        if (['ASIN', 'SKU', '商品标题', '图片', 'URL', '所属类目'].includes(key)) {
                            // Optionally keep them if not in main product file? 
                            // For now, Main Product File is source of truth for these.
                            return;
                        }

                        // Apply renaming rules
                        const match = key.match(rule.from);
                        if (match) {
                            const datePart = rule.stripMoney ? match[1] : key;
                            newKey = `${datePart}${rule.suffix}`;
                            mergedRow[newKey] = val;
                        }
                        // If it doesn't match the specific date pattern, we ignore it to avoid clutter
                        // unless it's a specific interesting column. 
                        // User request implies specifically renaming these date columns.
                    });
                });
            }
        }
    }

    // 3. Merging
    const keywordMap = new Map();
    keywordData.forEach(row => {
        const asin = row['ASIN'] || row['asin'];
        if (asin) keywordMap.set(asin.toString(), row);
    });

    // Extract station (marketplace) from product filename
    const productMatch = productFile.name.match(/^Product-([a-z]{2,})-\d{4,}\.xlsx$/i);
    const station = productMatch ? productMatch[1].toUpperCase() : '';

    const mergedRows = productData.map(pRow => {
        const asin = pRow['ASIN'] || pRow['asin'];
        if (!asin) return pRow;

        const asinStr = asin.toString();
        const kRow = keywordMap.get(asinStr) || {};
        const sRow = salesDataMap.get(asinStr) || {};

        return { ...pRow, ...kRow, ...sRow };
    });

    return { rows: mergedRows, site: station };
}
