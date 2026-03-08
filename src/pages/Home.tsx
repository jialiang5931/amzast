import React from 'react';
import {
    Briefcase,
    Search,
    BarChart3,
    Key,
    MessageSquareQuote,
    ArrowRight,
    LayoutGrid,
    Target
} from 'lucide-react';
import type { TabId } from '../components/layout/Sidebar';

// Meta infinity (∞) logo icon
const MetaLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M20.26,7.8a4.82,4.82,0,0,0-3.93-2.44,3.91,3.91,0,0,0-2.54,1.09,10.58,10.58,0,0,0-1.52,1.71,11,11,0,0,0-1.63-1.72A4.39,4.39,0,0,0,7.76,5.36,5,5,0,0,0,3.7,8,11.49,11.49,0,0,0,2,14a7,7,0,0,0,.18,1.64A4.44,4.44,0,0,0,2.71,17a3.23,3.23,0,0,0,3,1.6c1.25,0,2.19-.56,3.3-2A26.4,26.4,0,0,0,11.22,13l.63-1.12c.06-.09.11-.18.16-.27l.15.25,1.79,3A14.77,14.77,0,0,0,16,17.63a3.38,3.38,0,0,0,2.55,1,3,3,0,0,0,2.54-1.23,2.2,2.2,0,0,0,.18-.28,4.1,4.1,0,0,0,.31-.63l.12-.35A6.53,6.53,0,0,0,22,15,9,9,0,0,0,22,14,11.15,11.15,0,0,0,20.26,7.8ZM10.14,11.36c-.64,1-1.57,2.51-2.37,3.61-1,1.37-1.51,1.51-2.07,1.51a1.29,1.29,0,0,1-1.15-.66,3.3,3.3,0,0,1-.39-1.7A9.74,9.74,0,0,1,5.54,9,2.8,2.8,0,0,1,7.73,7.53,3,3,0,0,1,10,8.74a14.07,14.07,0,0,1,1,1.31Zm8.42,5.12c-.48,0-.85-.19-1.38-.83A34.87,34.87,0,0,1,14.82,12l-.52-.86c-.36-.61-.71-1.16-1-1.65a2.46,2.46,0,0,1,.17-.27c.94-1.39,1.77-2.17,2.8-2.17a3.12,3.12,0,0,1,2.49,1.66,10.17,10.17,0,0,1,1.37,5.34C20.09,15.36,19.79,16.48,18.56,16.48Z"
            fill="currentColor"
        />
    </svg>
);

interface HomeProps {
    onNavigate: (tab: TabId) => void;
}

const features = [
    {
        id: 'projects',
        title: '我的项目',
        description: '管理您所有的亚马逊分析项目，查看历史记录与存档。',
        icon: Briefcase,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'search',
        title: '生成搜索列表',
        description: '针对特定关键词，自动生成高转化的产品搜索列表。',
        icon: Search,
        color: 'from-purple-500 to-indigo-500',
    },
    {
        id: 'market',
        title: '市场分析',
        description: '多维度透视市场趋势，包含月销折线图及高阶价格散点分析。',
        icon: BarChart3,
        color: 'from-orange-500 to-red-500',
    },
    {
        id: 'comp-analysis',
        title: '竞品分析',
        description: '全方位监控竞品动态，深度分析其价格变化、关键词权重及流量来源。',
        icon: Target,
        color: 'from-blue-400 to-purple-600',
    },
    {
        id: 'keywords',
        title: '关键词分析',
        description: '精准捕捉核心流量词，挖掘蓝海搜索词，提升曝光率。',
        icon: Key,
        color: 'from-emerald-500 to-teal-500',
    },
    {
        id: 'voc',
        title: 'VOC分析',
        description: '基于AI深度解析用户评论，直击痛点，优化产品开发。',
        icon: MessageSquareQuote,
        color: 'from-pink-500 to-rose-500',
    },
    {
        id: 'metaspy',
        title: 'MetaSpy 广告分析',
        description: '实时爬取 Meta 广告图书馆，深度监测核心竞品的广告投放策略。',
        icon: MetaLogoIcon,
        color: 'from-blue-600 to-indigo-700',
    },
    {
        id: 'toolbox',
        title: '工具箱',
        description: '集合了多种亚马逊辅助小工具，如利润计算器、ASIN 提取等。',
        icon: LayoutGrid,
        color: 'from-slate-600 to-slate-800',
    }
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    return (
        <div className="max-w-7xl mx-auto space-y-12 py-8 px-4 sm:px-6 lg:px-8">
            {/* Welcome Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    欢迎回到 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AMZAST</span>
                </h1>
                <p className="text-lg text-slate-500 font-light">
                    一站式亚马逊数据分析利器。请点击下方功能卡片或侧边栏开始您的分析之旅。
                </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <button
                            key={feature.id}
                            onClick={() => onNavigate(feature.id as TabId)}
                            className="group relative flex flex-col items-start p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            {/* Background gradient hint */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-500`} />

                            {/* Icon */}
                            <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg shadow-blue-100 mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                <Icon className="w-8 h-8" />
                            </div>

                            {/* Text content */}
                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                {feature.description}
                            </p>

                            {/* CTA Link style */}
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                                立即进入 <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
