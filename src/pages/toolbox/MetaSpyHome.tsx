import React from 'react';
import { Activity, Rocket, ArrowRight, ShieldCheck, Zap, Search } from 'lucide-react';

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
        status: 'Beta'
    },
    {
        id: 'metaspy-trends',
        title: '竞品投放趋势',
        description: '分析竞品在不同国家的投放权重与时间分布（即将上线）。',
        icon: Zap,
        color: 'from-purple-500 to-pink-500',
        status: 'Coming Soon'
    },
    {
        id: 'metaspy-security',
        title: '素材永久转存',
        description: '解决 Meta 链接有效期短的问题，一键同步素材至个人云端（研发中）。',
        icon: ShieldCheck,
        color: 'from-emerald-500 to-teal-500',
        status: 'Coming Soon'
    }
];

export const MetaSpyHome: React.FC<MetaSpyHomeProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Section */}
            <div className="bg-white/60 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/40 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Activity className="w-32 h-32 text-blue-600" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white">
                            <Activity className="w-6 h-6" />
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
