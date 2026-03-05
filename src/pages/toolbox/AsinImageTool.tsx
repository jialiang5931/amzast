import React, { useState, useCallback } from 'react';
import { Image as ImageIcon, ArrowLeft, UploadCloud, CheckCircle2, Loader2, Download } from 'lucide-react';
import { parseAsinExcel, fetchAmazonImage, generateExcelWithImages } from '../../lib/asin-image-utils';
import type { ProcessedRow } from '../../lib/asin-image-utils';

interface AsinImageToolProps {
    onBack: () => void;
}

type ProcessingState = 'idle' | 'parsing' | 'fetching' | 'generating' | 'done' | 'error';

export const AsinImageTool: React.FC<AsinImageToolProps> = ({ onBack }) => {
    const [status, setStatus] = useState<ProcessingState>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errorMessage, setErrorMessage] = useState('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus('parsing');
        setErrorMessage('');
        setDownloadUrl(null);
        setProgress({ current: 0, total: 0 });

        try {
            // 1. Parse Excel
            const { headers, rows } = await parseAsinExcel(file);
            const totalRows = rows.length;
            setProgress({ current: 0, total: totalRows });
            setStatus('fetching');

            // 2. Fetch Images Concurrently (Chunked to avoid overwhelming browser/network)
            const chunkSize = 5;
            let currentProgress = 0;
            const updatedRows: ProcessedRow[] = [...rows];

            for (let i = 0; i < totalRows; i += chunkSize) {
                const chunk = updatedRows.slice(i, i + chunkSize);

                await Promise.all(chunk.map(async (row) => {
                    if (row.asin) {
                        try {
                            const buffer = await fetchAmazonImage(row.asin);
                            if (buffer) {
                                row.imageBuffer = buffer;
                                row.status = 'success';
                            } else {
                                row.status = 'failed';
                            }
                        } catch (e) {
                            row.status = 'failed';
                        }
                    } else {
                        row.status = 'failed'; // No ASIN to fetch
                    }
                }));

                currentProgress += chunk.length;
                setProgress({ current: Math.min(currentProgress, totalRows), total: totalRows });
            }

            // 3. Generate New Excel
            setStatus('generating');
            const newFilename = file.name.replace('.xlsx', '_补图完成.xlsx');
            const blob = await generateExcelWithImages(headers, updatedRows);

            // 4. Create Download Link
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setStatus('done');

            // Auto-trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = newFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error: any) {
            console.error("Error processing ASINs:", error);
            setStatus('error');
            setErrorMessage(error.message || '处理文件时发生错误');
        }
    }, []);

    const resetTool = () => {
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        setStatus('idle');
        setDownloadUrl(null);
        setErrorMessage('');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 h-full flex flex-col">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all text-sm group/back w-fit cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                返回工具箱
            </button>

            <div className="bg-white/60 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm flex-1 flex flex-col">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg text-white">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ASIN 识图补全</h2>
                    </div>
                    <p className="text-slate-500 font-medium">
                        上传包含 ASIN 列的表格，系统将自动抓取高清图片并嵌入到表格中，完成后直接下载。
                    </p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                    {status === 'idle' && (
                        <div className="w-full max-w-2xl relative group">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-3 border-dashed border-slate-200 rounded-3xl p-16 text-center bg-white/50 group-hover:bg-blue-50/50 group-hover:border-blue-400/50 transition-all duration-300">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <UploadCloud className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">点击或拖拽上传表格</h3>
                                <p className="text-slate-500 text-sm">支持 .xlsx 格式文件。第一列将作为图片展示列。</p>
                            </div>
                        </div>
                    )}

                    {(status === 'parsing' || status === 'fetching' || status === 'generating') && (
                        <div className="w-full max-w-md text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-slate-200/50 border border-slate-100">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                {status === 'parsing' && '正在解析表格...'}
                                {status === 'fetching' && '正在批量抓取高清图片...'}
                                {status === 'generating' && '正在生成嵌入式表格...'}
                            </h3>

                            {status === 'fetching' && (
                                <>
                                    <p className="text-slate-500 mb-6 font-medium">请勿关闭页面，这可能需要几十秒的时间</p>
                                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden relative">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                                            style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-slate-400">
                                        <span>进度</span>
                                        <span className="text-blue-600 font-black tabular-nums">{progress.current} / {progress.total}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="w-full max-w-md text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-lg shadow-green-100/50">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">处理完成！</h3>
                            <p className="text-slate-500 mb-8 font-medium">已成功为表格填补产品图片并开始下载。</p>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={resetTool}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    处理新文件
                                </button>
                                {downloadUrl && (
                                    <a
                                        href={downloadUrl}
                                        download="ASIN补图完成.xlsx"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> 重新下载
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95">
                            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <div className="text-4xl font-black">!</div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">处理失败</h3>
                            <p className="text-red-500/80 mb-8 bg-red-50 p-4 rounded-xl text-sm break-words border border-red-100">{errorMessage}</p>
                            <button
                                onClick={resetTool}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                重试
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
