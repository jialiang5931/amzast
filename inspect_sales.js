import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inspectExcel() {
    try {
        const filePath = join(process.cwd(), 'dataSample', 'product-US-sales-20260206-120587.xlsx');
        console.log(`Reading file: ${filePath}`);

        const buf = await readFile(filePath);
        const workbook = XLSX.read(buf, { type: 'buffer' });

        console.log('--- All Sheet Names ---');
        console.log(workbook.SheetNames);

        for (const sheetName of workbook.SheetNames) {
            console.log(`\n=== Sheet: ${sheetName} ===`);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
                console.log('Headers:', jsonData[0]);
            } else {
                console.log('(Empty Sheet)');
            }
        }

    } catch (error) {
        console.error('Error reading Excel file:', error);
    }
}

inspectExcel();
