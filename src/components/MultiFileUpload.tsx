import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Files, Trash2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface MultiFileUploadProps {
    onFilesChange: (files: File[]) => void;
}

export function MultiFileUpload({ onFilesChange }: MultiFileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const existingNames = new Set(files.map(f => f.name));
        const addedFiles: File[] = [];
        const duplicates: string[] = [];

        Array.from(newFiles).forEach(file => {
            if (existingNames.has(file.name)) {
                duplicates.push(file.name);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                addedFiles.push(file);
                existingNames.add(file.name);
            }
        });

        if (duplicates.length > 0) {
            alert(`以下文件已存在，已跳过：\n${duplicates.join('\n')}`);
        }

        if (addedFiles.length > 0) {
            const updatedFiles = [...files, ...addedFiles];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [files]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const removeFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFiles([]);
        onFilesChange([]);
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 px-4">
            <div
                className={twMerge(
                    "relative group cursor-pointer transition-all duration-300 ease-in-out",
                    "border-2 border-dashed rounded-3xl p-10",
                    "flex flex-col items-center justify-center text-center",
                    "bg-white/80 backdrop-blur-sm shadow-sm",
                    isDragging
                        ? "border-blue-500 bg-blue-50/50 scale-[1.01] shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-white"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('multi-file-upload')?.click()}
            >
                <input
                    type="file"
                    id="multi-file-upload"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    multiple
                    onChange={handleChange}
                />

                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="z-10 flex flex-col items-center">
                    <div className={twMerge(
                        "w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-300",
                        "group-hover:scale-110 group-hover:bg-blue-50"
                    )}>
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        上传多份数据文件
                    </h3>
                    <p className="text-slate-500 text-base mb-6 max-w-sm">
                        拖拽多个 Excel 文件到此处，或点击浏览
                    </p>
                    <div className="px-5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                        支持 .xlsx, .csv (多选)
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Files className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">已选择 {files.length} 个文件</span>
                        </div>
                        <button
                            onClick={clearAll}
                            className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> 清空全部
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => removeFile(index, e)}
                                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
