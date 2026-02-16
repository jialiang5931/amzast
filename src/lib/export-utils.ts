import ExcelJS from 'exceljs';

export async function exportToExcelWithImages(
    data: any[],
    filename: string,
    headers: string[],
    site: string = 'US'
) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Search List');

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
            } else if (header === 'BuyBox卖家') {
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
            { name: 'BuyBox卖家', matcher: (h: string) => h === 'BuyBox卖家' },
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
