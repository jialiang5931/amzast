import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from './supabase';

export interface ProcessedRow {
    asin: string | undefined;
    originalRow: any[];
    imageBuffer?: ArrayBuffer;
    status: 'pending' | 'success' | 'failed';
}

/**
 * Converts any image format (like WebP from Amazon) to JPEG for exceljs compatibility
 */
const imageBufferToJpeg = async (buffer: ArrayBuffer): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        try {
            const blob = new Blob([buffer]);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    return resolve(buffer); // Fallback to original
                }
                // Fill white background in case of transparency
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((cblob) => {
                    URL.revokeObjectURL(url);
                    if (cblob) {
                        cblob.arrayBuffer().then(resolve).catch(() => resolve(buffer));
                    } else {
                        resolve(buffer); // Fallback
                    }
                }, 'image/jpeg', 0.9);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(buffer); // Fallback
            };
            img.src = url;
        } catch (e) {
            resolve(buffer); // Fallback on error
        }
    });
};

/**
 * Parses the uploaded Excel file and extracts raw data.
 */
export const parseAsinExcel = async (file: File): Promise<{ headers: any[], rows: ProcessedRow[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Get raw data arrays
                const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    throw new Error("表格数据为空");
                }

                const headers = jsonData[0];
                const asinIndex = headers.findIndex(h => {
                    const str = String(h || '').trim().toUpperCase();
                    return str === 'ASIN';
                });

                if (asinIndex === -1) {
                    throw new Error("未找到名为 'ASIN' 的列");
                }

                const rows: ProcessedRow[] = jsonData.slice(1)
                    .filter(row => row && row.length > 0)
                    .map(row => ({
                        asin: row[asinIndex] ? String(row[asinIndex]).trim() : undefined,
                        originalRow: row,
                        status: 'pending'
                    }));

                resolve({ headers, rows });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Fetches the high-resolution image for a generic ASIN from Amazon servers via a proxy to bypass CORS.
 */
export const fetchAmazonImage = async (asin: string): Promise<ArrayBuffer | null> => {
    try {
        // Known URL structure for Amazon product images
        const url = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCRM_.jpg`;

        // Use Supabase Edge Function as a proxy to bypass CORS restrictions
        const { data, error } = await supabase.functions.invoke('image-proxy', {
            body: { url }
        });

        if (error || !data) {
            // Also try an alternative format if the first fails
            const altUrl = `https://m.media-amazon.com/images/P/${asin}.jpg`;
            const { data: altData, error: altError } = await supabase.functions.invoke('image-proxy', {
                body: { url: altUrl }
            });
            if (altError || !altData) return null;

            // Supabase client returns a Blob for binary responses
            if (altData instanceof Blob) {
                const buffer = await altData.arrayBuffer();
                return await imageBufferToJpeg(buffer);
            }
            return null;
        }

        // Supabase client returns a Blob for binary responses
        if (data instanceof Blob) {
            const buffer = await data.arrayBuffer();
            return await imageBufferToJpeg(buffer);
        }

        return null;
    } catch (e) {
        console.error(`Failed to fetch image for ${asin}:`, e);
        return null;
    }
};

/**
 * Generates an ExcelJS workbook embedding the fetched images.
 */
export const generateExcelWithImages = async (
    headers: any[],
    rows: ProcessedRow[]
): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    // Make sure we explicitly have an image column
    // We will prepend a new column for "图片" so we don't overwrite anything
    const finalHeaders = ['图片', ...headers];

    sheet.addRow(finalHeaders);

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Set column widths. First column is specifically for images.
    sheet.columns.forEach((col, idx) => {
        if (idx === 0) {
            col.width = 15; // Width for image column
        } else {
            // Shifted headers for width styling
            const originalHeaderStr = String(finalHeaders[idx] || '');
            if (originalHeaderStr.toUpperCase() === 'ASIN') {
                col.width = 15;
            } else if (originalHeaderStr.includes('标题') || originalHeaderStr.includes('Title')) {
                col.width = 40;
            } else {
                col.width = 12;
            }
        }
    });

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        const rowIndex = i + 2; // +1 for 1-based index, +1 for header

        // Prepend an empty string for the image column
        const rowDataArr = ['', ...rowData.originalRow];

        const row = sheet.addRow(rowDataArr);
        row.height = 80; // Make row tall enough for image
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Center ASIN column
        const asinIdx = finalHeaders.findIndex(h => String(h || '').trim().toUpperCase() === 'ASIN');
        if (asinIdx !== -1) {
            const asinCell = row.getCell(asinIdx + 1); // 1-based indexing
            if (asinCell) asinCell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        if (rowData.imageBuffer) {
            try {
                const imageId = workbook.addImage({
                    buffer: rowData.imageBuffer,
                    extension: 'jpeg',
                });

                // Add image. Coordinates are 0-based: { col, row }
                sheet.addImage(imageId, {
                    tl: { col: 0.1, row: rowIndex - 1 + 0.1 } as any,
                    br: { col: 0.9, row: rowIndex - 0.1 } as any,
                    editAs: 'oneCell' // Embed within cell
                });
            } catch (err) {
                console.error(`Error adding image to row ${rowIndex}:`, err);
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
