import ExcelJS from 'exceljs';

export async function exportToExcelWithImages(
    data: any[],
    filename: string,
    headers: string[],
    site: string = 'US'
) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('搜索列表');

    const imageColName = '主图';

    // Setup Columns with dynamic width based on header length
    worksheet.columns = headers.map(header => {
        let width: number;

        if (header === imageColName) {
            width = 15; // Fixed width for image column
        } else {
            // Calculate width based on header text length
            // Chinese characters are wider, so we count them as 2 units
            const chineseCharCount = (header.match(/[\u4e00-\u9fa5]/g) || []).length;
            const otherCharCount = header.length - chineseCharCount;
            const estimatedWidth = chineseCharCount * 2 + otherCharCount * 1.2;

            // Set min and max width constraints
            width = Math.max(8, Math.min(estimatedWidth + 4, 40));
        }

        return {
            header: header,
            key: header,
            width: width,
        };
    });


    // Process Rows
    for (let i = 0; i < data.length; i++) {
        const rowData = data[i];
        const rowValues: any = {};

        // Map data to row values
        headers.forEach(header => {
            if (header === imageColName) {
                // Use URL as initial value (will be cleared if image loads, or kept as fallback)
                rowValues[header] = rowData['商品主图'] || rowData['imageUrl'] || rowData['image'] || '';
            } else if (header.toUpperCase() === 'ASIN') {
                const asinVal = rowData[header];
                const asinLink = rowData['商品详情页链接'] || rowData['url'];
                if (asinLink && asinLink !== '#') {
                    rowValues[header] = { text: asinVal, hyperlink: asinLink, tooltip: '点击前往 Amazon 查看商品详情' };
                } else {
                    rowValues[header] = asinVal;
                }
            } else if (header === '品牌' || header.toLowerCase() === 'brand') {
                const brandVal = rowData[header];
                const brandLink = rowData['品牌链接'];
                if (brandLink && brandLink !== '#') {
                    rowValues[header] = { text: brandVal, hyperlink: brandLink, tooltip: '点击查看品牌页面' };
                } else {
                    const val = brandVal;
                    rowValues[header] = (val === null || val === undefined || val === '') ? '-' : val;
                }
            } else if (header === '卖家') {
                const sellerVal = rowData[header];
                const sellerLink = rowData['卖家首页'];
                if (sellerLink && sellerLink !== '#') {
                    rowValues[header] = { text: sellerVal, hyperlink: sellerLink, tooltip: '点击查看卖家首页' };
                } else {
                    const val = sellerVal;
                    rowValues[header] = (val === null || val === undefined || val === '') ? '-' : val;
                }
            } else if (header === '自然排名') {
                const rankVal = rowData[header];
                const asin = rowData['ASIN'] || rowData['asin'];
                if (rankVal && asin) {
                    const rankLink = `https://www.xiyouzhaoci.com/detail/asin/look_up/${site}/${asin}`;
                    rowValues[header] = { text: rankVal, hyperlink: rankLink, tooltip: '点击前往西柚找词查看排名详情' };
                } else {
                    const val = rankVal;
                    rowValues[header] = (val === null || val === undefined || val === '') ? '-' : val;
                }
            } else {
                const val = rowData[header];
                // Display '-' for empty, null, or undefined values
                rowValues[header] = (val === null || val === undefined || val === '') ? '-' : val;
            }
        });

        const excelRow = worksheet.addRow(rowValues);

        // Style hyperlinks for ASIN, Brand, Seller, and Natural Rank columns
        // Apply black color with underline for all hyperlinks
        const hyperlinkColumns = [
            { name: 'ASIN', matcher: (h: string) => h.toUpperCase() === 'ASIN' },
            { name: '品牌', matcher: (h: string) => h === '品牌' || h.toLowerCase() === 'brand' },
            { name: '卖家', matcher: (h: string) => h === '卖家' },
            { name: '自然排名', matcher: (h: string) => h === '自然排名' }
        ];

        hyperlinkColumns.forEach(({ matcher }) => {
            const colIndex = headers.findIndex(matcher);
            if (colIndex !== -1) {
                const cell = excelRow.getCell(colIndex + 1);
                if (cell.value && typeof cell.value === 'object' && (cell.value as any).hyperlink) {
                    cell.font = { color: { argb: 'FF000000' }, underline: true }; // Black with underline
                }
            }
        });


        // Initial height (standard)
        // If we have an image, we'll increase it
        const imgUrl = rowValues[imageColName];

        if (imgUrl) {
            try {
                // Set row height to accommodate image (visual tweak)
                excelRow.height = 80; // ~106px height, just enough for 100px image

                // Fetch Image
                const response = await fetch(imgUrl, { mode: 'cors' });
                if (!response.ok) throw new Error('Network response was not ok');

                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();

                // Determine extension safely
                let ext = 'png';
                if (imgUrl.toLowerCase().endsWith('.jpg') || imgUrl.toLowerCase().endsWith('.jpeg')) ext = 'jpeg';
                else if (imgUrl.toLowerCase().endsWith('.gif')) ext = 'gif';

                const imageId = workbook.addImage({
                    buffer: buffer,
                    extension: ext as 'jpeg' | 'png' | 'gif',
                });

                const colIndex = headers.indexOf(imageColName);

                // Embed Image
                // tl: top-left { col, row } 0-based
                // br: bottom-right (optional, or use ext)
                worksheet.addImage(imageId, {
                    tl: { col: colIndex, row: i + 1 }, // Row 0 is header, so data starts at row 1
                    ext: { width: 100, height: 100 },
                    editAs: 'oneCell' // Image moves with cells but doesn't resize automatically weirdly
                });

                // Clear cell text if successful so it's clean
                excelRow.getCell(colIndex + 1).value = '';

                // Apply center alignment avoiding text overlapping empty space if any
                excelRow.getCell(colIndex + 1).alignment = { vertical: 'middle', horizontal: 'center' };

            } catch (err) {
                console.warn(`Failed to embed image for ASIN row ${i}: `, err);
                // Keep the URL text in the cell as fallback
            }
        }

        // Align other cells vertically middle and center
        excelRow.eachCell((cell) => {
            cell.alignment = { ...cell.alignment, vertical: 'middle', horizontal: 'center' };
        });
    }

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Trigger Download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export Meta Ads realtime query data to Excel.
 * Columns: 资料库编号, 素材预览, 公共主页, 投放日期, 投放时长, 广告标题, 广告文案摘要, 同款数, 跳转页, 状态
 */
export async function exportMetaAdsToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('广告列表');

    worksheet.columns = [
        { header: '资料库编号', key: '资料库编号', width: 22 },
        { header: '素材预览', key: '素材预览', width: 16 },
        { header: '公共主页', key: '公共主页', width: 20 },
        { header: '投放日期', key: '投放日期', width: 14 },
        { header: '投放时长', key: '投放时长', width: 12 },
        { header: '广告标题', key: '广告标题', width: 36 },
        { header: '广告文案摘要', key: '广告文案摘要', width: 50 },
        { header: '同款数', key: '同款数', width: 10 },
        { header: '跳转页', key: '跳转页', width: 14 },
        { header: '状态', key: '状态', width: 10 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } } };
    });
    headerRow.height = 28;

    const now = new Date();

    for (let i = 0; i < data.length; i++) {
        const ad = data[i];

        const adArchiveId = ad.metadata?.ad_archive_id || '-';
        const adLibraryUrl = `https://www.facebook.com/ads/library/?id=${adArchiveId}`;

        const snapshot = ad.additional_info?.raw_data?.snapshot;
        const brandedContent = snapshot?.branded_content;
        const pageName = brandedContent?.page_name
            ? `${brandedContent.page_name} / ${snapshot?.page_name || ad.metadata?.page_name || ''}`.trim()
            : (snapshot?.page_name || ad.metadata?.page_name || '-');

        const startDateObj = ad.timing?.start_date ? new Date(ad.timing.start_date * 1000) : null;
        const startDateStr = startDateObj ? startDateObj.toLocaleDateString('zh-CN') : '-';
        const durationDays = startDateObj
            ? Math.floor((now.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
            : null;
        const durationStr = durationDays !== null ? `${durationDays} 天` : '-';

        const title = ad.ad_content?.title || '-';
        const body = ad.ad_content?.body || '-';
        const collationCount = ad.additional_info?.raw_data?.collation_count ?? '-';

        const ctaType = snapshot?.cta_type;
        const linkUrl = ad.ad_content?.link_url;
        let ctaText = '-';
        if (ctaType === 'SHOP_NOW') ctaText = '落地页';
        else if (ctaType === 'LEARN_MORE') ctaText = '中间页';

        const isActive = ad.status?.is_active;
        const statusText = isActive ? '投放中' : '已结束';

        const videoThumb = ad.ad_content?.videos?.[0]?.video_preview_image_url;
        const imageResized = ad.ad_content?.images?.[0]?.resized_image_url;
        const imageOrigin = ad.ad_content?.images?.[0]?.original_image_url;
        const mediaUrl: string | null = videoThumb || imageResized || imageOrigin || null;

        const rowValues: any = {
            '资料库编号': { text: adArchiveId, hyperlink: adLibraryUrl, tooltip: '在 Meta 广告库中查看' },
            '素材预览': mediaUrl || '-',
            '公共主页': pageName,
            '投放日期': startDateStr,
            '投放时长': durationStr,
            '广告标题': title,
            '广告文案摘要': body,
            '同款数': String(collationCount),
            '跳转页': (ctaText !== '-' && linkUrl)
                ? { text: ctaText, hyperlink: linkUrl, tooltip: '点击访问广告落地页' }
                : ctaText,
            '状态': statusText,
        };

        const excelRow = worksheet.addRow(rowValues);
        excelRow.height = 80;

        // Hyperlink styles
        const idCell = excelRow.getCell(1);
        if (idCell.value && typeof idCell.value === 'object' && (idCell.value as any).hyperlink) {
            idCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }
        const ctaCell = excelRow.getCell(9);
        if (ctaCell.value && typeof ctaCell.value === 'object' && (ctaCell.value as any).hyperlink) {
            ctaCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }
        // Status color
        const statusCell = excelRow.getCell(10);
        statusCell.font = { bold: true, color: { argb: isActive ? 'FF16A34A' : 'FF94A3B8' } };

        // Default alignment
        excelRow.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        });
        // Left-align text columns
        excelRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        excelRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Embed image
        if (mediaUrl) {
            try {
                const response = await fetch(mediaUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const imgBlob = await response.blob();
                const imgBuffer = await imgBlob.arrayBuffer();

                let ext: 'jpeg' | 'png' | 'gif' = 'jpeg';
                const urlBase = mediaUrl.toLowerCase().split('?')[0];
                if (urlBase.endsWith('.png')) ext = 'png';
                else if (urlBase.endsWith('.gif')) ext = 'gif';

                const imageId = workbook.addImage({ buffer: imgBuffer, extension: ext });
                worksheet.addImage(imageId, {
                    tl: { col: 1, row: i + 1 }, // col 1 = 素材预览 (0-based), row 0 = header
                    ext: { width: 100, height: 100 },
                    editAs: 'oneCell',
                });
                excelRow.getCell(2).value = '';
                excelRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
            } catch (err) {
                console.warn(`[exportMetaAds] row ${i}: image embed failed`, err);
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
