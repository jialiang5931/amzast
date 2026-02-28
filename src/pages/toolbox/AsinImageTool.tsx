import React from 'react';
import { Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface AsinImageToolProps {
    onBack: () => void;
}

export const AsinImageTool: React.FC<AsinImageToolProps> = ({ onBack }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all text-sm group/back"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                返回工具箱
            </button>

            <div className="bg-white/60 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm text-center py-20">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                    <ImageIcon className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">ASIN 识图</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    该工具正在开发中。未来您可以通过输入 ASIN，一键精准提取产品主图、副图、A+ 图片以及视频素材。
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    开发进度: 10%
                </div>
            </div>
        </div>
    );
};
