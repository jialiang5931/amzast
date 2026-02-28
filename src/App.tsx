import { useState, useRef, useEffect } from 'react';
import { parseExcel } from './lib/data-parser';
import type { ParsedData } from './lib/types';
import { Sidebar } from './components/layout/Sidebar';
import type { TabId } from './components/layout/Sidebar';
import { Home } from './pages/Home';
import { MarketAnalysis } from './pages/MarketAnalysis';
import { SearchListGenerator } from './pages/SearchListGenerator';
import { ToolboxHome } from './pages/toolbox/ToolboxHome';
import { AsinImageTool } from './pages/toolbox/AsinImageTool';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedData | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // 滚动位置恢复：记录搜索列表离开时的滚动位置
  const mainRef = useRef<HTMLElement>(null);
  const searchScrollY = useRef<number>(0);

  useEffect(() => {
    if (activeTab === 'search') {
      // 等待组件渲染完成后再恢复位置
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: searchScrollY.current, behavior: 'instant' });
      });
    }
  }, [activeTab]);

  // Search List Persisted State
  const [searchListData, setSearchListData] = useState<any[] | null>(null);
  const [searchListSite, setSearchListSite] = useState<string>('');

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    try {
      const parsed = await parseExcel(uploadedFile);
      setData(parsed);
    } catch (error) {
      console.error("Parsing failed:", error);
      alert("解析文件失败，请检查控制台。");
    } finally {
      setIsParsing(false);
    }
  };

  const handleClear = () => {
    setData(null);
    setFile(null);
  };

  // Direct transfer from Search List to Market Analysis
  const handleGenerateMarketAnalysis = async (rows: any[], site: string) => {
    setIsParsing(true);
    setActiveTab('market');
    try {
      // Create a virtual file object to represent the transferred data
      const virtualFile = new File([], `SearchList_${site}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setFile(virtualFile);

      // Process the rows through the standard parser logic to get charts
      const { processRawRows } = await import('./lib/data-parser');
      const parsed = processRawRows(rows);
      setData(parsed);
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("生成报告失败。");
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveSearchListRow = (asin: string) => {
    setSearchListData(prev => {
      if (!prev) return null;
      return prev.filter(row => (row['ASIN'] || row['asin']) !== asin);
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={(tab: TabId) => setActiveTab(tab)} />;
      case 'market':
        return (
          <MarketAnalysis
            data={data}
            file={file}
            isParsing={isParsing}
            onFileUpload={handleFileUpload}
            onClear={handleClear}
            hasSearchListData={!!searchListData}
            onBackToSearch={() => setActiveTab('search')}
          />
        );
      case 'search':
        return (
          <SearchListGenerator
            persistedData={searchListData}
            persistedSite={searchListSite}
            onDataChange={(rows, site) => {
              setSearchListData(rows);
              setSearchListSite(site);
            }}
            onRemoveRow={handleRemoveSearchListRow}
            onGenerateMarketAnalysis={handleGenerateMarketAnalysis}
          />
        );
      case 'toolbox':
        return <ToolboxHome onNavigate={(tab) => setActiveTab(tab as TabId)} />;
      case 'toolbox-asin-image':
        return <AsinImageTool onBack={() => setActiveTab('toolbox')} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <span className="text-3xl text-slate-400">🏗️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">开发中...</h2>
            <p className="text-slate-500 mt-2">“{activeTab}”板块功能正在快马加鞭赶来。</p>
            <button
              onClick={() => setActiveTab('home')}
              className="mt-8 text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              返回首页
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main
        ref={mainRef}
        className={`flex-1 h-screen overflow-y-auto relative ${activeTab === 'search' ? 'p-0' : 'py-6'}`}
        onScroll={(e) => {
          if (activeTab === 'search') {
            searchScrollY.current = (e.target as HTMLElement).scrollTop;
          }
        }}
      >
        <div className={`h-full ${activeTab === 'search' ? 'w-full' : 'container mx-auto max-w-7xl'}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
