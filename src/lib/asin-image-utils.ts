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
                return await altData.arrayBuffer();
            }
            return null;
        }

        // Supabase client returns a Blob for binary responses
        if (data instanceof Blob) {
            return await data.arrayBuffer();
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

    // Make sure the first column header explicitly mentions images if not present
    let finalHeaders = [...headers];
    if (finalHeaders[0] !== '图片') {
        // If the file didn't have an image column, we should ideally insert one, 
        // but based on user prompt, "图片 (数据来源于西柚找词)" is usually column A.
        // We'll trust the original headers but ensure column 1 is wide enough.
    }

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
        } else if (idx === 2) { // ASIN
            col.width = 15;
        } else if (idx === 1) { // Title
            col.width = 40;
        } else {
            col.width = 12;
        }
    });

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        const rowIndex = i + 2; // +1 for 1-based index, +1 for header

        const row = sheet.addRow(rowData.originalRow);
        row.height = 80; // Make row tall enough for image
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Center ASIN and some specific columns based on general indices
        const asinCell = row.getCell(3); // Assuming ASIN is C (index 3 via 1-based indexing)
        if (asinCell) asinCell.alignment = { vertical: 'middle', horizontal: 'center' };

        if (rowData.imageBuffer) {
            try {
                // Determine image extension (simple check)
                const extension = 'jpeg';

                const imageId = workbook.addImage({
                    buffer: rowData.imageBuffer,
                    extension: extension as any,
                });

                // Clear any existing text in the first column where image goes
                const imageCell = row.getCell(1);
                imageCell.value = '';

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
