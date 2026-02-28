import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFile = useCallback((file: File) => {
        setSelectedFile(file);
        onFileUpload(file);
    }, [onFileUpload]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-12 px-4">
            <div
                className={twMerge(
                    "relative group cursor-pointer transition-all duration-300 ease-in-out",
                    "border-2 border-dashed rounded-3xl p-12",
                    "flex flex-col items-center justify-center text-center",
                    "bg-white/80 backdrop-blur-sm shadow-sm",
                    isDragging
                        ? "border-blue-500 bg-blue-50/50 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-white"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleChange}
                />

                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {selectedFile ? (
                    <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                            <FileSpreadsheet className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-800 mb-1">{selectedFile.name}</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                            onClick={clearFile}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm border border-slate-200"
                        >
                            <X className="w-4 h-4" /> Change File
                        </button>
                    </div>
                ) : (
                    <div className="z-10 flex flex-col items-center">
                        <div className={twMerge(
                            "w-20 h-20 mb-6 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-300",
                            "group-hover:scale-110 group-hover:bg-blue-50"
                        )}>
                            <Upload className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                            Upload your Data Here
                        </h3>
                        <p className="text-slate-500 text-lg mb-8 max-w-sm">
                            Drag and drop your Excel file here, or click to browse
                        </p>
                        <div className="px-6 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                            Supports .xlsx, .csv
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
