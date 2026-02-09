import * as XLSX from 'xlsx';
import type { RawAmazonRow, ParsedData } from './types';

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
                    defval: null, // Use null for empty cells
                });

                // Transform data for Scatter Chart
                const scatterData = jsonData
                    .filter(row => row['价格'] != null && row['近30天销量'] != null)
                    .map(row => ({
                        price: Number(row['价格']),
                        units: Number(row['近30天销量']),
                        brand: row['品牌'] || 'Unknown',
                        launchDate: row['上架时间'],
                        url: row['商品详情页链接'],
                        asin: row['ASIN'],
                        title: row['商品标题'],
                        imageUrl: row['首图链接'],
                        rating: row['评分'],
                        reviewCount: row['评分数'],
                        coupon: row['Coupon']
                    }));

                // Transform data for Monthly Sales Chart
                // 1. Identify monthly columns (format: YYYY-MM)
                const allKeys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
                const monthlyColumns = allKeys.filter(key => /^\d{4}-\d{2}$/.test(key));

                // 2. Aggregate data
                // Structure: { [year]: { [month]: Set<ParentASIN | ASIN> } } to handle "count only once"
                // Actually, the user says "count once", I'll assume it means sum the sales value but only once per Parent ASIN per month.
                // Wait, if two product rows have same Parent ASIN, do we sum their individual sales for that month? 
                // "在统计每一个月的总销量时，同个“父ASIN”的数据只统计一次，也就是说有可能出现两个产品同属于一个父ASIN。这个时候只统计一次。"
                // This implies if we see the same Parent ASIN again, we don't add it again. 
                // Usually, the monthly columns in these reports are already aggregated at some level, or they are per-SKU.
                // I will use a Map to keep track of seen Parent ASINs per month to avoid double counting.

                const yearlyMap: Record<string, Record<number, number>> = {};

                monthlyColumns.forEach(col => {
                    const [year, monthStr] = col.split('-');
                    const month = parseInt(monthStr, 10);
                    if (!yearlyMap[year]) yearlyMap[year] = {};
                    if (!yearlyMap[year][month]) yearlyMap[year][month] = 0;

                    const seenParentAsins = new Set<string>();

                    jsonData.forEach(row => {
                        const parentAsin = row['父ASIN'] || row['ASIN'];
                        const val = row[col];

                        if (val != null && !seenParentAsins.has(parentAsin)) {
                            yearlyMap[year][month] += Number(val);
                            seenParentAsins.add(parentAsin);
                        }
                    });
                });

                const monthlyData = Object.entries(yearlyMap).map(([year, months]) => ({
                    year,
                    data: Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const colName = `${year}-${month.toString().padStart(2, '0')}`;
                        const isPresent = monthlyColumns.includes(colName);
                        return {
                            month,
                            units: isPresent ? (months[month] || 0) : null
                        };
                    })
                })).sort((a, b) => a.year.localeCompare(b.year));

                // Transform data for Brand Monopoly Chart
                const brandSalesMap: Record<string, number> = {};
                let totalUnits = 0;

                jsonData.forEach(row => {
                    const brand = row['品牌'] || 'Unknown';
                    const units = Number(row['近30天销量']) || 0;
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

                console.log(`[DataParser] Parsed ${jsonData.length} rows, ${monthlyColumns.length} months, ${brandData.length} brands`);

                resolve({
                    rows: jsonData,
                    totalRows: jsonData.length,
                    scatterData,
                    monthlyData,
                    brandData
                });
            } catch (err) {
                console.error("[DataParser] Error paring file:", err);
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
export async function mergeSearchListData(files: File[]): Promise<any[]> {
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
                        let val = row[key];

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

    return productData.map(pRow => {
        const asin = pRow['ASIN'] || pRow['asin'];
        if (!asin) return pRow;

        const asinStr = asin.toString();
        const kRow = keywordMap.get(asinStr) || {};
        const sRow = salesDataMap.get(asinStr) || {};

        // Merge Priority: Product > Sales > Keyword (or distinct columns)
        // Spread order: existing pRow, then kRow, then sRow.
        // sales columns are distinct (suffixed), keyword columns usually distinct.
        return { ...pRow, ...kRow, ...sRow };
    });
}
