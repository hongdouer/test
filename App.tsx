import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { MethodologyPage } from './pages/Methodology';
import { MethodologyDetail } from './pages/MethodologyDetail';
import { RatingMethodologyPage } from './pages/RatingMethodology';
import { RatingMatchingPage } from './pages/RatingMatching';
import { EnterprisePage } from './pages/Enterprise';
import { EnterpriseDetail } from './pages/EnterpriseDetail';
import { LoanPage } from './pages/Loan';
import { LoanDetail } from './pages/LoanDetail';
import { MatchingPage } from './pages/Matching';
import { SettingsPage } from './pages/Settings';
import { UnderConstruction } from './pages/UnderConstruction';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simple logic to determine title based on current hash (basic implementation)
  const [title, setTitle] = React.useState('工作台');
  
  React.useEffect(() => {
    const updateTitle = () => {
        const hash = window.location.hash;
        
        // Specific checks first to avoid overlapping matches
        if (hash.includes('/rating/methodology/')) setTitle('评级规则详情');
        else if (hash.includes('/rating/methodology')) setTitle('绿色评级 - 方法学管理');
        else if (hash.includes('/rating/matching')) setTitle('绿色评级 - 评绿结果');
        else if (hash.includes('/investigation/methodology')) setTitle('绿色调查 - 方法学管理');
        else if (hash.includes('/investigation/matching')) setTitle('绿色调查 - 查绿结果');

        // General checks
        else if (hash.includes('/methodology/')) setTitle('规则详情');
        else if (hash.includes('methodology')) setTitle('方法学管理');
        else if (hash.includes('/enterprise/')) setTitle('企业详情');
        else if (hash.includes('enterprise')) setTitle('企业信息库');
        else if (hash.includes('/loan/')) setTitle('贷款详情');
        else if (hash.includes('loan')) setTitle('贷款信息库');
        else if (hash.includes('matching')) setTitle('识绿结果');
        else if (hash.includes('settings')) setTitle('系统设置');
        else setTitle('工作台');
    };
    window.addEventListener('hashchange', updateTitle);
    updateTitle();
    return () => window.removeEventListener('hashchange', updateTitle);
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
      <Sidebar />
      <div className="flex-1 ml-72 print:ml-0 flex flex-col min-h-screen transition-all duration-300">
        <Header title={title} />
        <main className="flex-1 mt-16 print:mt-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Green Client Center */}
          <Route path="/enterprise" element={<EnterprisePage />} />
          <Route path="/enterprise/:id" element={<EnterpriseDetail />} />
          <Route path="/loan" element={<LoanPage />} />
          <Route path="/loan/:id" element={<LoanDetail />} />
          
          {/* Green Identification Center */}
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/methodology/:id" element={<MethodologyDetail />} />
          <Route path="/matching" element={<MatchingPage />} />
          
          {/* Green Rating Center */}
          <Route path="/rating/methodology" element={<RatingMethodologyPage />} />
          <Route path="/rating/methodology/:id" element={<MethodologyDetail />} /> {/* Dedicated route to keep sidebar active */}
          <Route path="/rating/matching" element={<RatingMatchingPage />} />

          {/* Green Investigation Center (Placeholder) */}
          <Route path="/investigation/methodology" element={<UnderConstruction title="调查方法学管理" description="此处将配置现场尽职调查模版与合规检查清单。" />} />
          <Route path="/investigation/matching" element={<UnderConstruction title="调查任务结果" description="此处将展示尽调报告、现场核查记录及风险排查结果。" />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;