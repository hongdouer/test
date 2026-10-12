
import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Banknote, Layers, CheckCircle2, Search, Clock, Users, ScanEye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ENTERPRISES, MOCK_LOANS, MOCK_METHODOLOGIES } from '../constants';
import { MethodologyType, UserRole, ApplicationStage } from '../types';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLoanIds?: string[]; // Changed from EnterpriseIds to LoanIds
}

export const QuickMatchModal: React.FC<QuickMatchModalProps> = ({ isOpen, onClose, defaultLoanIds }) => {
  const navigate = useNavigate();
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  
  // Context State
  const [contextRole, setContextRole] = useState<UserRole | ''>('');
  const [contextStage, setContextStage] = useState<ApplicationStage | ''>('');

  // Search States
  const [loanSearchTerm, setLoanSearchTerm] = useState('');
  const [methodSearchTerm, setMethodSearchTerm] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        setSelectedLoanIds(defaultLoanIds || []);
        // Reset search terms on open
        setLoanSearchTerm('');
        setMethodSearchTerm('');
        // Reset context
        setContextRole('');
        setContextStage('');
        
        // Default select the first methodology (National Policy usually)
        // We defer this selection logic to after sortedMethodologies is computed if we wanted dynamic defaults,
        // but for now, hard reset is safer.
        const baseMethods = MOCK_METHODOLOGIES.filter(m => m.type !== MethodologyType.RATING_MODEL);
        const nationalRule = baseMethods.find(m => m.type === '国家政策');
        if (nationalRule) setSelectedMethodIds([nationalRule.id]);
        else if (baseMethods.length > 0) setSelectedMethodIds([baseMethods[0].id]);
        else setSelectedMethodIds([]);
    }
  }, [isOpen, defaultLoanIds]);

  // Sort Methodologies based on Context (Prioritize matches)
  const sortedMethodologies = useMemo(() => {
      // Filter out rating models first
      const base = MOCK_METHODOLOGIES.filter(m => m.type !== MethodologyType.RATING_MODEL);
      
      // If no context is set, return original order
      if (!contextRole && !contextStage) return base;

      return [...base].sort((a, b) => {
          // Check if 'a' matches current context
          const aMatchesRole = contextRole && a.roles.includes(contextRole as UserRole);
          const aMatchesStage = contextStage && a.stages.includes(contextStage as ApplicationStage);
          const aScore = (aMatchesRole ? 1 : 0) + (aMatchesStage ? 1 : 0);

          // Check if 'b' matches current context
          const bMatchesRole = contextRole && b.roles.includes(contextRole as UserRole);
          const bMatchesStage = contextStage && b.stages.includes(contextStage as ApplicationStage);
          const bScore = (bMatchesRole ? 1 : 0) + (bMatchesStage ? 1 : 0);

          // Sort descending by score (matches first)
          return bScore - aScore;
      });
  }, [contextRole, contextStage]);

  const toggleLoan = (id: string) => {
    setSelectedLoanIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleMethodology = (id: string) => {
    setSelectedMethodIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRun = () => {
    if (selectedLoanIds.length === 0 || selectedMethodIds.length === 0) return;
    
    navigate('/matching', { 
        state: { 
            initiateMatch: true, 
            loanIds: selectedLoanIds, 
            methodologyIds: selectedMethodIds,
            contextRole,
            contextStage
        } 
    });
    onClose();
  };

  const getEnterpriseName = (id: string) => {
    return MOCK_ENTERPRISES.find(e => e.id === id)?.name || '未知企业';
  };

  // Filter Logic
  const filteredLoans = MOCK_LOANS.filter(loan => {
      const term = loanSearchTerm.toLowerCase();
      const entName = getEnterpriseName(loan.enterpriseId).toLowerCase();
      return (
          (loan.projectName || '').toLowerCase().includes(term) ||
          loan.contractNo.toLowerCase().includes(term) ||
          entName.includes(term)
      );
  });

  const filteredMethodologies = sortedMethodologies.filter(m => 
      m.name.toLowerCase().includes(methodSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Play size={20} fill="currentColor" />
                </div>
                快速识绿判定
            </h3>
            <p className="text-sm text-gray-500 mt-1 ml-13">配置分析视角，快速生成绿色认定报告</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Context Configuration */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <ScanEye size={16} /> 分析视角配置 (可选)
              </h4>
              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                          <Clock size={12} /> 业务阶段
                      </label>
                      <select 
                          value={contextStage}
                          onChange={(e) => setContextStage(e.target.value as ApplicationStage)}
                          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-shadow"
                      >
                          <option value="">(自动) 全流程</option>
                          {Object.values(ApplicationStage).map(stage => (
                              <option key={stage} value={stage}>{stage}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                          <Users size={12} /> 操作岗位
                      </label>
                      <select 
                          value={contextRole}
                          onChange={(e) => setContextRole(e.target.value as UserRole)}
                          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-shadow"
                      >
                          <option value="">(自动) 通用视角</option>
                          {Object.values(UserRole).map(role => (
                              <option key={role} value={role}>{role}</option>
                          ))}
                      </select>
                  </div>
              </div>
          </div>

          {/* Loan Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Banknote size={18} className="text-gray-500" /> 选择信贷业务
                </label>
                {selectedLoanIds.length > 0 && (
                    <span className="text-xs text-primary-700 bg-primary-100 px-3 py-1 rounded-full font-bold">
                        已选 {selectedLoanIds.length} 笔
                    </span>
                )}
            </div>
            {/* Search Box for Loans */}
            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索贷款编号、项目或企业..." 
                    value={loanSearchTerm}
                    onChange={(e) => setLoanSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-gray-50/30 transition-all"
                />
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredLoans.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        未找到匹配的贷款
                    </div>
                ) : (
                    filteredLoans.map(loan => (
                        <div 
                            key={loan.id}
                            onClick={() => toggleLoan(loan.id)}
                            className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all group ${
                                selectedLoanIds.includes(loan.id) 
                                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500' 
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                selectedLoanIds.includes(loan.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white group-hover:border-primary-400'
                            }`}>
                                {selectedLoanIds.includes(loan.id) && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-800 truncate mb-0.5">{loan.projectName || '未命名项目'}</div>
                                <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">{loan.contractNo}</span>
                                    <span>{getEnterpriseName(loan.enterpriseId)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Methodology Selection */}
          <div>
             <div className="flex justify-between items-center mb-3">
                <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Layers size={18} className="text-gray-500" /> 选择依据规则
                </label>
                {selectedMethodIds.length > 0 && (
                    <span className="text-xs text-primary-700 bg-primary-100 px-3 py-1 rounded-full font-bold">
                        已选 {selectedMethodIds.length} 项
                    </span>
                )}
            </div>
            {/* Search Box for Methodologies */}
            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索规则名称..." 
                    value={methodSearchTerm}
                    onChange={(e) => setMethodSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-gray-50/30 transition-all"
                />
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredMethodologies.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        未找到匹配的规则
                    </div>
                ) : (
                    filteredMethodologies.map(m => {
                        // Check if matched by context for highlighting
                        const isRoleMatch = contextRole && m.roles.includes(contextRole as UserRole);
                        const isStageMatch = contextStage && m.stages.includes(contextStage as ApplicationStage);
                        const isRecommended = isRoleMatch || isStageMatch;

                        return (
                            <div 
                                key={m.id}
                                onClick={() => toggleMethodology(m.id)}
                                className={`p-4 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all relative group ${
                                    selectedMethodIds.includes(m.id)
                                    ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500' 
                                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                {isRecommended && (
                                    <div className="absolute top-3 right-3 flex gap-1">
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200 shadow-sm">推荐</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        selectedMethodIds.includes(m.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white group-hover:border-primary-400'
                                    }`}>
                                        {selectedMethodIds.includes(m.id) && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-12">
                                        <div className="text-sm font-bold text-gray-800 truncate mb-0.5">{m.name}</div>
                                        <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{m.version}</span>
                                            <span>{m.type}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Tags for Stages and Roles */}
                                <div className="flex flex-wrap gap-1.5 ml-9 mt-1">
                                    {m.stages.map(stage => (
                                        <span key={stage} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                            (contextStage === stage) ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {stage}
                                        </span>
                                    ))}
                                    {m.roles.map(role => (
                                        <span key={role} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                            (contextRole === role) ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        }`}>
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm">
            取消
          </button>
          <button 
            onClick={handleRun}
            disabled={selectedLoanIds.length === 0 || selectedMethodIds.length === 0}
            className={`px-8 py-2.5 bg-primary-600 text-white rounded-xl flex items-center gap-2 shadow-md transition-all font-bold text-sm ${
                (selectedLoanIds.length === 0 || selectedMethodIds.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <Play size={16} fill="currentColor" />
            批量分析 ({selectedLoanIds.length * selectedMethodIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
