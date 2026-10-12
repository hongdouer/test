
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Building2, ClipboardCheck, Settings, Leaf, BarChart3, SearchCheck, ChevronDown, Banknote } from 'lucide-react';

export const Sidebar: React.FC = () => {
  // State to track expanded sections
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    client: true,
    identification: true,
    rating: true,
    investigation: false // Default to collapsed as requested
  });

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Improved active/inactive styles with gradient and shadows
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group mx-2 ${
      isActive
        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-900/20 font-medium'
        : 'text-primary-100/70 hover:bg-white/5 hover:text-white'
    }`;

  // Helper component for section headers
  const SectionHeader = ({ id, title }: { id: string, title: string }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between mt-6 mb-2 px-6 text-[11px] font-bold text-primary-300/50 uppercase tracking-[0.15em] hover:text-primary-200 transition-colors focus:outline-none select-none"
    >
      <span>{title}</span>
      <div className={`transition-transform duration-300 ease-out ${expanded[id] ? 'rotate-0' : '-rotate-90'}`}>
         <ChevronDown size={14} className="opacity-50" />
      </div>
    </button>
  );

  return (
    <aside className="w-72 bg-[#064e3b] text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-20 border-r border-primary-800/30 font-sans print:hidden">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-4 px-6 border-b border-primary-800/30 bg-primary-900/20 backdrop-blur-sm shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg text-white shrink-0 ring-1 ring-white/10">
            <Leaf className="w-6 h-6 fill-white/20" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-lg font-bold tracking-tight text-white leading-none mb-1">绿色金融</h1>
          <p className="text-[10px] text-emerald-200/60 font-medium tracking-wider uppercase">数智化管理平台</p>
        </div>
      </div>

      {/* Scrollable Navigation - Scrollbar Hidden */}
      <nav className="flex-1 py-6 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        <div className="mb-2">
            <NavLink to="/" className={getNavLinkClass}>
                <LayoutDashboard size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">工作台</span>
            </NavLink>
        </div>
        
        {/* Module 1: Green Client Center */}
        <SectionHeader id="client" title="绿色客户中心" />
        <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${expanded.client ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            {/* Swapped Order: Loan first, then Enterprise */}
            <NavLink to="/loan" className={getNavLinkClass}>
                <Banknote size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">贷款信息库</span>
            </NavLink>
            <NavLink to="/enterprise" className={getNavLinkClass}>
                <Building2 size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">企业信息库</span>
            </NavLink>
        </div>

        {/* Module 2: Green Identification Tools */}
        <SectionHeader id="identification" title="绿色标识中心" />
        <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${expanded.identification ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <NavLink to="/methodology" className={getNavLinkClass}>
                <BookOpen size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">方法学管理</span>
            </NavLink>

            <NavLink to="/matching" className={getNavLinkClass}>
                <ClipboardCheck size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">识绿结果</span>
            </NavLink>
        </div>

        {/* Module 3: Green Rating Center */}
        <SectionHeader id="rating" title="绿色评级中心" />
        <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${expanded.rating ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <NavLink to="/rating/methodology" className={getNavLinkClass}>
                <BookOpen size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">方法学管理</span>
            </NavLink>

            <NavLink to="/rating/matching" className={getNavLinkClass}>
                <BarChart3 size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">评绿结果</span>
            </NavLink>
        </div>

        {/* Module 4: Green Investigation Center (Temporarily Hidden) */}
        {/* <SectionHeader id="investigation" title="绿色调查中心" />
        <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${expanded.investigation ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <NavLink to="/investigation/methodology" className={getNavLinkClass}>
                <BookOpen size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">方法学管理</span>
            </NavLink>

            <NavLink to="/investigation/matching" className={getNavLinkClass}>
                <SearchCheck size={18} className="shrink-0" />
                <span className="text-sm tracking-wide">查绿结果</span>
            </NavLink>
        </div> */}

      </nav>

      {/* Footer / User Settings */}
      <div className="p-4 border-t border-primary-800/30 bg-primary-900/10 shrink-0">
        <NavLink to="/settings" className={getNavLinkClass}>
          <Settings size={18} className="shrink-0" />
          <span className="text-sm tracking-wide">系统设置</span>
        </NavLink>
      </div>
    </aside>
  );
};
