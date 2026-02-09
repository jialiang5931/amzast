import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inspectExcel() {
    try {
        const filePath = join(process.cwd(), 'dataSample', '高端款红光面罩.xlsx');
        console.log(`Reading file: ${filePath}`);

        // Read buffer explicitly to avoid dependency on xlsx fs integration
        const buf = await readFile(filePath);
        const workbook = XLSX.read(buf, { type: 'buffer' });

        const sheetName = workbook.SheetNames[0];
        console.log(`Sheet Name: ${sheetName}`);

        const worksheet = workbook.Sheets[sheetName];
        // Get headers (row 1)
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
        // Get data (row 2)
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[1];

        console.log('\n--- Headers ---');
        console.log(headers);

        console.log('\n--- First Row Data ---');
        console.log(data);

    } catch (error) {
        console.error('Error reading Excel file:', error);
    }
}

inspectExcel();
