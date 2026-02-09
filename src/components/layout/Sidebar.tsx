import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Briefcase,
    Search,
    BarChart3,
    Key,
    MessageSquareQuote
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type TabId = 'home' | 'projects' | 'search' | 'market' | 'keywords' | 'voc';

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

interface MenuItem {
    id: TabId;
    label: string;
    icon: React.ElementType;
}

const menuItems: MenuItem[] = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'projects', label: '我的项目', icon: Briefcase },
    { id: 'search', label: '生成搜索列表', icon: Search },
    { id: 'market', label: '市场分析', icon: BarChart3 },
    { id: 'keywords', label: '关键词分析', icon: Key },
    { id: 'voc', label: 'VOC分析', icon: MessageSquareQuote },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
                "relative flex flex-col h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-all duration-300 ease-in-out z-30 shadow-xl cursor-pointer",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="flex items-center gap-3 p-6 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <span className="text-white font-bold text-lg">A</span>
                </div>
                {!isCollapsed && (
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        AMZAST
                    </span>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabChange(item.id);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-colors",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                            )} />

                            {!isCollapsed && (
                                <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}

                            {isActive && !isCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                }}
                className="mt-auto mb-6 mx-3 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
            >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                    <div className="flex items-center gap-2">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">收起侧边栏</span>
                    </div>
                )}
            </button>
        </aside>
    );
};
