import React from 'react';
import { LayoutGrid, Image as ImageIcon, ArrowRight } from 'lucide-react';

interface ToolboxHomeProps {
    onNavigate: (id: string) => void;
}

const tools = [
    {
        id: 'toolbox-asin-image',
        title: 'ASIN 识图',
        description: '通过 ASIN 快速提取产品图片，支持高清原图获取。',
        icon: ImageIcon,
        color: 'from-blue-500 to-indigo-500',
    }
];

export const ToolboxHome: React.FC<ToolboxHomeProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white/60 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-800 rounded-xl shadow-lg text-white">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">工具箱</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">多种亚马逊辅助实用工具，助您提升运营效率。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => onNavigate(tool.id)}
                            className="group p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-left"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{tool.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{tool.description}</p>
                            <div className="flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                立即使用 <ArrowRight className="w-3 h-3" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
