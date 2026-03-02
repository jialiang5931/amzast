import React from 'react';
import {
    Briefcase,
    Search,
    BarChart3,
    Key,
    MessageSquareQuote,
    ArrowRight,
    LayoutGrid,
    Activity
} from 'lucide-react';
import type { TabId } from '../components/layout/Sidebar';

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
        icon: Activity,
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
                            className="group relative flex flex-col items-start p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 text-left overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000"
                            style={{ animationDelay: `${index * 100}ms` }}
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
