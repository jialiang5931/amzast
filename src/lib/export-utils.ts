import ExcelJS from 'exceljs';

export async function exportToExcelWithImages(data: any[], filename: string, customHeaders?: string[]) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Search List');

    // Determine Headers
    let headers: string[];
    const imageColName = '主图';

    if (customHeaders && customHeaders.length > 0) {
        headers = [...customHeaders];
    } else {
        const originalHeaders = Object.keys(data[0]);
        headers = [...originalHeaders];
        const asinIndex = headers.findIndex(key => key.toUpperCase() === 'ASIN');

        if (asinIndex !== -1 && !headers.includes(imageColName)) {
            headers.splice(asinIndex + 1, 0, imageColName);
        }
    }

    // Setup Columns
    worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: header === imageColName ? 15 : 25, // Width for image column vs others
    }));

    // Process Rows
    for (let i = 0; i < data.length; i++) {
        const rowData = data[i];
        const rowValues: any = {};

        // Map data to row values
        headers.forEach(header => {
            if (header === imageColName) {
                // Use URL as initial value (will be cleared if image loads, or kept as fallback)
                rowValues[header] = rowData['商品主图'] || rowData['imageUrl'] || rowData['image'] || '';
            } else {
                rowValues[header] = rowData[header];
            }
        });

        const excelRow = worksheet.addRow(rowValues);

        // Initial height (standard)
        // If we have an image, we'll increase it
        const imgUrl = rowValues[imageColName];

        if (imgUrl) {
            try {
                // Set row height to accommodate image (visual tweak)
                excelRow.height = 100; // ~133px height

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
                console.warn(`Failed to embed image for ASIN row ${i}:`, err);
                // Keep the URL text in the cell as fallback
            }
        }

        // Align other cells vertically middle
        excelRow.eachCell((cell) => {
            cell.alignment = { ...cell.alignment, vertical: 'middle' };
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
