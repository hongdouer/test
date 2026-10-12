import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Users, Layers, FileText, Download, Printer, FileJson, ChevronDown, CheckCircle2, Award, Zap, Shield, Leaf, Info, HelpCircle, Search } from 'lucide-react';
import { MOCK_METHODOLOGIES } from '../constants';
import { Methodology, MethodologyType } from '../types';

export const MethodologyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'indicators' | 'levels'>('indicators');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  
  const methodology: Methodology | undefined = location.state?.methodology || MOCK_METHODOLOGIES.find(m => m.id === id);

  // Filter catalog items based on search term
  const filteredCatalogItems = useMemo(() => {
    if (!methodology?.catalogItems) return [];
    if (!catalogSearchTerm) return methodology.catalogItems;
    
    const lowerTerm = catalogSearchTerm.toLowerCase();
    return methodology.catalogItems.filter(item => 
        item.code.toLowerCase().includes(lowerTerm) ||
        item.name.toLowerCase().includes(lowerTerm) ||
        item.category.toLowerCase().includes(lowerTerm) ||
        item.conditions.some(c => c.toLowerCase().includes(lowerTerm)) ||
        (item.remarks && item.remarks.toLowerCase().includes(lowerTerm))
    );
  }, [methodology?.catalogItems, catalogSearchTerm]);

  if (!methodology) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FileText size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">未找到方法学规则</p>
        <button onClick={() => navigate('/methodology')} className="mt-4 text-primary-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(methodology, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${methodology.name}_${methodology.version}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  const isRatingModel = methodology.type === MethodologyType.RATING_MODEL;

  // --- Sub-components for Rating Model View ---

  const RatingModelView = () => {
      const config = methodology.ratingConfig;
      if (!config) return <div className="p-8 text-center text-gray-500">该评级规则暂无结构化配置数据。</div>;

      return (
          <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-100">
                  <button 
                    onClick={() => setActiveTab('indicators')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'indicators' 
                        ? 'text-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      评价指标体系
                      {activeTab === 'indicators' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('levels')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'levels' 
                        ? 'text-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      等级认定标准
                      {activeTab === 'levels' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>}
                  </button>
              </div>

              {activeTab === 'indicators' ? (
                  <div className="space-y-8 animate-fade-in">
                      {/* Qualitative Section */}
                      <div>
                          <div className="flex items-center gap-2 mb-4">
                              <Shield size={18} className="text-emerald-600" />
                              <h3 className="font-bold text-gray-800">一、定性评价 (准入指标)</h3>
                              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">一票否决</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {config.qualitative.map((item, idx) => (
                                  <div key={idx} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                      <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Quantitative Section */}
                      <div>
                          <div className="flex items-center gap-2 mb-4">
                              <Zap size={18} className="text-blue-600" />
                              <h3 className="font-bold text-gray-800">二、定量评价 (满分100分)</h3>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-blue-50/50 text-gray-600 font-semibold">
                                      <tr>
                                          <th className="px-6 py-4 w-32">一级指标</th>
                                          <th className="px-6 py-4 w-48">二级指标</th>
                                          <th className="px-6 py-4 w-20 text-center">分值</th>
                                          <th className="px-6 py-4">评分标准概要</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {config.quantitative.map((item, idx, arr) => {
                                          // Simple logic to merge cells visually (not strictly using rowSpan for simplicity, but simulating clean look)
                                          const isFirstOfGroup = idx === 0 || item.level1 !== arr[idx-1].level1;
                                          const groupScore = isFirstOfGroup 
                                              ? arr.filter(i => i.level1 === item.level1).reduce((acc, curr) => acc + Number(curr.score || 0), 0) 
                                              : 0;

                                          return (
                                              <tr key={idx} className="hover:bg-gray-50">
                                                  <td className="px-6 py-4 align-top">
                                                      {isFirstOfGroup && (
                                                          <div className="font-bold text-gray-800 flex flex-col">
                                                              {item.level1}
                                                              <span className="text-xs text-gray-400 font-normal mt-1">({groupScore}分)</span>
                                                          </div>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-4 font-medium text-gray-700 align-top">{item.level2}</td>
                                                  <td className="px-6 py-4 text-center font-bold text-gray-900 align-top">{item.score}</td>
                                                  <td className="px-6 py-4 text-gray-600 align-top">{item.standard}</td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {/* Bonus Section */}
                      <div>
                          <div className="flex items-center gap-2 mb-4">
                              <Award size={18} className="text-orange-500" />
                              <h3 className="font-bold text-gray-800">三、鼓励性指标 (加分项)</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {config.bonus.map((item, idx) => (
                                  <div key={idx} className="bg-orange-50/30 border border-orange-100 p-5 rounded-xl">
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold">{item.score}分</span>
                                      </div>
                                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-8 animate-fade-in">
                      {/* Levels Cards */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 border-l-4 border-green-500 pl-3">
                              <h3 className="font-bold text-gray-800 text-lg">等级划分标准</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {config.levels.map((lvl, idx) => {
                                  // Simplified Style Mapping for Read-only View
                                  const getColorStyle = (c: string) => {
                                      switch(c) {
                                          case 'green': return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', score: 'text-emerald-600' };
                                          case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', score: 'text-blue-600' };
                                          case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-800', score: 'text-yellow-600' };
                                          case 'red': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-800', score: 'text-red-600' };
                                          case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800', score: 'text-purple-600' };
                                          case 'pink': return { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-800', score: 'text-pink-600' };
                                          case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800', score: 'text-orange-600' };
                                          case 'teal': return { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-800', score: 'text-teal-600' };
                                          case 'indigo': return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-800', score: 'text-indigo-600' };
                                          case 'gray': return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-800', score: 'text-gray-600' };
                                          case 'cyan': return { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-800', score: 'text-cyan-600' };
                                          default: return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-800', score: 'text-gray-600' };
                                      }
                                  };
                                  
                                  const style = getColorStyle(lvl.color);

                                  return (
                                      <div key={idx} className={`rounded-xl border p-6 text-center shadow-sm ${style.bg} ${style.border} ${style.text}`}>
                                          <h4 className="text-lg font-bold mb-2">{lvl.name} ({lvl.level})</h4>
                                          <div className={`text-3xl font-black mb-3 ${style.score}`}>{lvl.scoreRange}</div>
                                          <p className="text-sm opacity-80">{lvl.description}</p>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Direct Rules Table */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 border-l-4 border-purple-500 pl-3">
                              <h3 className="font-bold text-gray-800 text-lg">直接认定规则</h3>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                      <tr>
                                          <th className="px-6 py-4 w-48">认定等级</th>
                                          <th className="px-6 py-4">认定条件 (绿色工厂/绿色供应链)</th>
                                          <th className="px-6 py-4 w-64">综合得分计算公式</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {config.directRules.map((rule, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                              <td className={`px-6 py-4 font-bold ${
                                                  rule.levelName.includes('深绿') ? 'text-emerald-600' : 
                                                  rule.levelName.includes('中绿') ? 'text-blue-600' : 'text-yellow-600'
                                              }`}>
                                                  {rule.levelName}
                                              </td>
                                              <td className="px-6 py-4 text-gray-700">{rule.condition}</td>
                                              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{rule.formula}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              <div className="p-4 bg-gray-50 text-xs text-gray-500 flex items-center gap-2 border-t border-gray-200">
                                  <Info size={14} />
                                  注：直接认定企业仍需满足定性评价（准入指标）要求。如发生环保一票否决事项，将取消直接认定资格。
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <button 
            onClick={() => navigate(isRatingModel ? '/rating/methodology' : '/methodology')}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-800"
        >
            <ArrowLeft size={20} />
        </button>
        <div>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {methodology.name}
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                    {methodology.version}
                </span>
             </h1>
             <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> 生效日期: {methodology.effectiveDate}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                    <Tag size={14} /> {methodology.type}
                </span>
             </div>
        </div>
        <div className="ml-auto relative">
            <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
            >
                <Download size={16} /> 导出 / 打印
                <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                    <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <FileJson size={16} className="text-gray-400" /> 导出为 JSON
                    </button>
                    <button onClick={handlePrint} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Printer size={16} className="text-gray-400" /> 打印 / 另存为 PDF
                    </button>
                </div>
                </>
            )}
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{methodology.name}</h1>
          <p className="text-gray-500">版本: {methodology.version} | 类型: {methodology.type} | 生效日期: {methodology.effectiveDate}</p>
          <hr className="mt-4 border-gray-300"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Left Column: Content (Switch based on type) */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
            {/* Conditional Rendering for Rating Model vs Standard Methodology */}
            {isRatingModel ? (
                <RatingModelView />
            ) : methodology.catalogItems ? (
                // --- Existing Catalog View ---
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-transparent print:px-0 flex-wrap gap-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText size={18} className="text-primary-600 print:hidden" />
                            目录详情
                            <span className="text-xs text-gray-500 font-normal ml-2 bg-gray-200/50 px-2 py-0.5 rounded-full">
                                {filteredCatalogItems.length} 条
                            </span>
                        </h3>
                        {/* Search Input */}
                        <div className="relative print:hidden">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="搜索代码、名称或条件..." 
                                value={catalogSearchTerm}
                                onChange={(e) => setCatalogSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white w-64 transition-all"
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 print:divide-gray-200">
                        {filteredCatalogItems.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                没有找到匹配的目录项
                            </div>
                        ) : (
                            filteredCatalogItems.map((item, idx) => (
                                <div key={idx} className="p-6 hover:bg-gray-50 transition-colors print:px-0 print:hover:bg-transparent break-inside-avoid">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium mb-2 print:border print:border-blue-200">
                                                代码: {item.code}
                                            </span>
                                            <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border border-gray-100 print:bg-transparent print:border-gray-200 print:border-l-4">
                                        <div className="font-semibold mb-2 text-gray-900">条件/标准：</div>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {item.conditions.map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ul>
                                        {item.remarks && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                                <span className="font-semibold">备注：</span> {item.remarks}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                // --- Generic Content View ---
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-transparent print:px-0">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText size={18} className="text-primary-600 print:hidden" />
                            规则全文
                        </h3>
                    </div>
                    <div className="p-6 print:px-0">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {methodology.content}
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: Metadata */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
             
             {/* Only show Roles/Stages for Non-Rating Models */}
             {!isRatingModel && (
                 <>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Users size={18} className="text-primary-600" />
                                适用岗位
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {methodology.roles.map(role => (
                                    <span key={role} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                                        {role}
                                    </span>
                                ))}
                                {methodology.roles.length === 0 && <span className="text-sm text-gray-400">未指定岗位</span>}
                            </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Layers size={18} className="text-primary-600" />
                                适用阶段
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {methodology.stages.map(stage => (
                                    <div key={stage} className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                        <span className="text-sm text-gray-700">{stage}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                 </>
             )}
             
             {/* Info Card for Rating Models */}
             {isRatingModel && (
                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                     <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                         <HelpCircle size={16}/>
                         使用说明
                     </h4>
                     <p className="text-xs text-blue-600 leading-relaxed">
                         {methodology.content || '暂无详细说明'}
                     </p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};