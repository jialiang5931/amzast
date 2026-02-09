import { useState } from 'react';
import { parseExcel } from './lib/data-parser';
import type { ParsedData } from './lib/types';
import { Sidebar } from './components/layout/Sidebar';
import type { TabId } from './components/layout/Sidebar';
import { Home } from './pages/Home';
import { MarketAnalysis } from './pages/MarketAnalysis';
import { SearchListGenerator } from './pages/SearchListGenerator';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedData | null>(null);
  const [isParsing, setIsParsing] = useState(false);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={(tab) => setActiveTab(tab)} />;
      case 'market':
        return (
          <MarketAnalysis
            data={data}
            file={file}
            isParsing={isParsing}
            onFileUpload={handleFileUpload}
            onClear={handleClear}
          />
        );
      case 'search':
        return <SearchListGenerator />;
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

      <main className={`flex-1 h-screen overflow-y-auto relative ${activeTab === 'search' ? 'p-0' : 'py-6'}`}>
        <div className={`h-full ${activeTab === 'search' ? 'w-full' : 'container mx-auto max-w-7xl'}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
