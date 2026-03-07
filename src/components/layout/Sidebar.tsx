import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Briefcase,
    Search,
    BarChart3,
    Key,
    MessageSquareQuote,
    LayoutGrid,
    ChevronDown,
    Activity,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Meta infinity (∞) logo icon
const MetaLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M20.26,7.8a4.82,4.82,0,0,0-3.93-2.44,3.91,3.91,0,0,0-2.54,1.09,10.58,10.58,0,0,0-1.52,1.71,11,11,0,0,0-1.63-1.72A4.39,4.39,0,0,0,7.76,5.36,5,5,0,0,0,3.7,8,11.49,11.49,0,0,0,2,14a7,7,0,0,0,.18,1.64A4.44,4.44,0,0,0,2.71,17a3.23,3.23,0,0,0,3,1.6c1.25,0,2.19-.56,3.3-2A26.4,26.4,0,0,0,11.22,13l.63-1.12c.06-.09.11-.18.16-.27l.15.25,1.79,3A14.77,14.77,0,0,0,16,17.63a3.38,3.38,0,0,0,2.55,1,3,3,0,0,0,2.54-1.23,2.2,2.2,0,0,0,.18-.28,4.1,4.1,0,0,0,.31-.63l.12-.35A6.53,6.53,0,0,0,22,15,9,9,0,0,0,22,14,11.15,11.15,0,0,0,20.26,7.8ZM10.14,11.36c-.64,1-1.57,2.51-2.37,3.61-1,1.37-1.51,1.51-2.07,1.51a1.29,1.29,0,0,1-1.15-.66,3.3,3.3,0,0,1-.39-1.7A9.74,9.74,0,0,1,5.54,9,2.8,2.8,0,0,1,7.73,7.53,3,3,0,0,1,10,8.74a14.07,14.07,0,0,1,1,1.31Zm8.42,5.12c-.48,0-.85-.19-1.38-.83A34.87,34.87,0,0,1,14.82,12l-.52-.86c-.36-.61-.71-1.16-1-1.65a2.46,2.46,0,0,1,.17-.27c.94-1.39,1.77-2.17,2.8-2.17a3.12,3.12,0,0,1,2.49,1.66,10.17,10.17,0,0,1,1.37,5.34C20.09,15.36,19.79,16.48,18.56,16.48Z"
            fill="currentColor"
        />
    </svg>
);

export type TabId = 'home' | 'projects' | 'search' | 'market' | 'keywords' | 'voc' | 'metaspy' | 'metaspy-dev' | 'metaspy-realtime' | 'toolbox' | 'toolbox-asin-image';

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

interface MenuItem {
    id: TabId;
    label: string;
    icon: React.ElementType;
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'projects', label: '我的项目', icon: Briefcase },
    { id: 'search', label: '生成搜索列表', icon: Search },
    { id: 'market', label: '市场分析', icon: BarChart3 },
    { id: 'keywords', label: '关键词分析', icon: Key },
    { id: 'voc', label: 'VOC分析', icon: MessageSquareQuote },
    {
        id: 'metaspy',
        label: 'MetaSpy 广告监测',
        icon: MetaLogoIcon,
        children: [
            { id: 'metaspy-realtime', label: '实时查询', icon: Search },
            { id: 'metaspy-dev', label: '开发中功能', icon: Activity },
        ]
    },
    {
        id: 'toolbox',
        label: '工具箱',
        icon: LayoutGrid,
        children: [
            { id: 'toolbox-asin-image', label: 'ASIN 识图', icon: ImageIcon },
        ]
    }
];

interface SidebarItemProps {
    item: MenuItem;
    activeTab: TabId;
    isCollapsed: boolean;
    onTabChange: (tab: TabId) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, activeTab, isCollapsed, onTabChange }) => {
    const Icon = item.icon;
    const isSubItemActive = item.children?.some(child => child.id === activeTab);
    const isActive = activeTab === item.id || isSubItemActive;
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(isSubItemActive || false);

    // Sync expansion state when active tab changes externally (e.g. from home page)
    React.useEffect(() => {
        if (isSubItemActive) setIsExpanded(true);
    }, [isSubItemActive]);

    return (
        <div className="space-y-1">
            <button
                onClick={(e) => {
                    e.stopPropagation();

                    if (hasChildren && !isCollapsed) {
                        if (!isExpanded) {
                            setIsExpanded(true);
                        } else {
                            onTabChange(item.id);
                        }
                    } else {
                        onTabChange(item.id);
                    }
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

                {/* Collapsed Tooltip / Hover Menu */}
                {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700/50">
                        {item.label}
                        {hasChildren && (
                            <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
                                {item.children?.map(child => (
                                    <div
                                        key={child.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTabChange(child.id);
                                        }}
                                        className={cn(
                                            "px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer",
                                            activeTab === child.id ? "text-blue-400" : "text-slate-400"
                                        )}
                                    >
                                        {child.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!isCollapsed && hasChildren && (
                    <ChevronDown className={cn(
                        "ml-auto w-4 h-4 transition-transform duration-200",
                        isExpanded ? "rotate-180" : ""
                    )} />
                )}

                {isActive && !isCollapsed && !hasChildren && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
            </button>

            {/* Sub Menu */}
            {!isCollapsed && hasChildren && isExpanded && (
                <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.id;

                        return (
                            <button
                                key={child.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabChange(child.id);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                    isChildActive
                                        ? "text-blue-600 font-bold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                                )}
                            >
                                <ChildIcon className={cn(
                                    "w-4 h-4",
                                    isChildActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                <span className="text-[13px]">{child.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

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
            <div className="flex items-center gap-3 p-6 mb-4" onClick={(e) => e.stopPropagation()}>
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
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        isCollapsed={isCollapsed}
                        onTabChange={onTabChange}
                    />
                ))}
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
