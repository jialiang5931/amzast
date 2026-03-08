import React from 'react';
import { Rocket, ArrowRight, Search } from 'lucide-react';

interface MetaSpyHomeProps {
    onNavigate: (id: string) => void;
}

const features = [
    {
        id: 'metaspy-realtime',
        title: '实时查询',
        description: '即时检索 Meta 广告库，获取最新的广告投放动态与素材。',
        icon: Search,
        color: 'from-blue-500 to-cyan-500', // Corrected color based on original content, assuming the user's provided 'from-bluexport type TabId = ...' was an error.
        status: 'Beta'
    },
    {
        id: 'metaspy-dev',
        title: '自动化探测 (开发中)',
        description: '深度对接 Meta 广告库，支持实时关键词探测与 400 条最新广告素材同步。',
        icon: Rocket,
        color: 'from-blue-600 to-indigo-600',
    }
];

// Meta infinity (∞) logo icon
const MetaLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M20.26,7.8a4.82,4.82,0,0,0-3.93-2.44,3.91,3.91,0,0,0-2.54,1.09,10.58,10.58,0,0,0-1.52,1.71,11,11,0,0,0-1.63-1.72A4.39,4.39,0,0,0,7.76,5.36,5,5,0,0,0,3.7,8,11.49,11.49,0,0,0,2,14a7,7,0,0,0,.18,1.64A4.44,4.44,0,0,0,2.71,17a3.23,3.23,0,0,0,3,1.6c1.25,0,2.19-.56,3.3-2A26.4,26.4,0,0,0,11.22,13l.63-1.12c.06-.09.11-.18.16-.27l.15.25,1.79,3A14.77,14.77,0,0,0,16,17.63a3.38,3.38,0,0,0,2.55,1,3,3,0,0,0,2.54-1.23,2.2,2.2,0,0,0,.18-.28,4.1,4.1,0,0,0,.31-.63l.12-.35A6.53,6.53,0,0,0,22,15,9,9,0,0,0,22,14,11.15,11.15,0,0,0,20.26,7.8ZM10.14,11.36c-.64,1-1.57,2.51-2.37,3.61-1,1.37-1.51,1.51-2.07,1.51a1.29,1.29,0,0,1-1.15-.66,3.3,3.3,0,0,1-.39-1.7A9.74,9.74,0,0,1,5.54,9,2.8,2.8,0,0,1,7.73,7.53,3,3,0,0,1,10,8.74a14.07,14.07,0,0,1,1,1.31Zm8.42,5.12c-.48,0-.85-.19-1.38-.83A34.87,34.87,0,0,1,14.82,12l-.52-.86c-.36-.61-.71-1.16-1-1.65a2.46,2.46,0,0,1,.17-.27c.94-1.39,1.77-2.17,2.8-2.17a3.12,3.12,0,0,1,2.49,1.66,10.17,10.17,0,0,1,1.37,5.34C20.09,15.36,19.79,16.48,18.56,16.48Z"
            fill="currentColor"
        />
    </svg>
);

export const MetaSpyHome: React.FC<MetaSpyHomeProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Section */}
            <div className="bg-white/60 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <MetaLogoIcon className="w-32 h-32 text-blue-600" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white">
                            <MetaLogoIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">MetaSpy 广告监测</h2>
                    </div>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                        深度同步 Meta 广告图书馆，洞察全球竞品投放策略。从自动化探测到素材永久转存，全方位助力您的竞品分析。
                    </p>
                </div>
            </div>

            {/* Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    const isComingSoon = feature.status === 'Coming Soon';

                    return (
                        <button
                            key={feature.id}
                            disabled={isComingSoon}
                            onClick={() => onNavigate(feature.id)}
                            className={`group relative p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm transition-all duration-500 text-left flex flex-col h-full
                                ${isComingSoon
                                    ? 'opacity-80 grayscale-[0.5] cursor-not-allowed'
                                    : 'hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                                <Icon className="w-7 h-7" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                        ${feature.status === 'Beta'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-slate-100 text-slate-500'}`}>
                                        {feature.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 leading-relaxed mb-6">
                                    {feature.description}
                                </p>
                            </div>

                            {!isComingSoon && (
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    进入功能 <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
