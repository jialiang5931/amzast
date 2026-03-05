import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import { join } from 'path';

async function inspectExcel() {
    try {
        const filePath = join(process.cwd(), 'dataSample', '关键词分析_US_red+light+therapy_20260225~20260303.xlsx');
        console.log(`Reading file: ${filePath}`);

        const buf = await readFile(filePath);
        const workbook = XLSX.read(buf, { type: 'buffer' });

        const sheetName = workbook.SheetNames[0];
        console.log(`Sheet Name: ${sheetName}`);

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = rows[0];
        console.log('\n--- Headers ---');
        console.log(headers);

        console.log('\n--- Data Rows (Up to 10) ---');
        // Filter out empty rows and log first 10 data rows (skip header)
        const dataRows = rows.slice(1).filter(r => r.length > 0).slice(0, 10);
        dataRows.forEach((row, i) => {
            console.log(`Row ${i + 1}: ASIN=${row[2]}, ImageColumnVal='${row[0]}', Title=${row[1]?.substring(0, 30)}...`);
        });

    } catch (error) {
        console.error('Error reading Excel file:', error);
    }
}

inspectExcel();
