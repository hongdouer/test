import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Building2, Layers, CheckCircle2, Search, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ENTERPRISES, MOCK_METHODOLOGIES } from '../constants';
import { MethodologyType } from '../types';

interface QuickRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickRatingModal: React.FC<QuickRatingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedEntIds, setSelectedEntIds] = useState<string[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  
  // Search States
  const [entSearchTerm, setEntSearchTerm] = useState('');
  const [methodSearchTerm, setMethodSearchTerm] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        // Reset selections on open
        setSelectedEntIds([]);
        setEntSearchTerm('');
        setMethodSearchTerm('');
        
        // Default select the first rating methodology
        const ratingMethods = MOCK_METHODOLOGIES.filter(m => m.type === MethodologyType.RATING_MODEL);
        if (ratingMethods.length > 0) {
            setSelectedMethodId(ratingMethods[0].id);
        } else {
            setSelectedMethodId('');
        }
    }
  }, [isOpen]);

  const toggleEnterprise = (id: string) => {
    setSelectedEntIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRun = () => {
    if (selectedEntIds.length === 0 || !selectedMethodId) return;
    
    navigate('/rating/matching', { 
        state: { 
            initiateRating: true, 
            enterpriseIds: selectedEntIds, 
            methodologyId: selectedMethodId
        } 
    });
    onClose();
  };

  // Filter Logic
  const filteredEnterprises = MOCK_ENTERPRISES.filter(ent => {
      const term = entSearchTerm.toLowerCase();
      return (
          (ent.name || '').toLowerCase().includes(term) ||
          (ent.industry || '').toLowerCase().includes(term)
      );
  });

  const ratingMethodologies = useMemo(() => 
      MOCK_METHODOLOGIES.filter(m => m.type === MethodologyType.RATING_MODEL), 
  []);

  const filteredMethodologies = ratingMethodologies.filter(m => 
      m.name.toLowerCase().includes(methodSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <BarChart3 size={20} />
                </div>
                快速评绿
            </h3>
            <p className="text-sm text-gray-500 mt-1 ml-13">选择目标企业与评级规则，批量生成ESG评分报告</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Enterprise Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Building2 size={18} className="text-gray-500" /> 选择参评企业
                </label>
                {selectedEntIds.length > 0 && (
                    <span className="text-xs text-primary-700 bg-primary-100 px-3 py-1 rounded-full font-bold">
                        已选 {selectedEntIds.length} 家
                    </span>
                )}
            </div>
            {/* Search Box */}
            <div className="relative mb-3">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索企业名称、行业..." 
                    value={entSearchTerm}
                    onChange={(e) => setEntSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-gray-50/30 transition-all"
                />
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredEnterprises.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        未找到匹配的企业
                    </div>
                ) : (
                    filteredEnterprises.map(ent => (
                        <div 
                            key={ent.id}
                            onClick={() => toggleEnterprise(ent.id)}
                            className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all group ${
                                selectedEntIds.includes(ent.id) 
                                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500' 
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                selectedEntIds.includes(ent.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white group-hover:border-primary-400'
                            }`}>
                                {selectedEntIds.includes(ent.id) && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-800 truncate mb-0.5">{ent.name}</div>
                                <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{ent.industry}</span>
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
                    <Layers size={18} className="text-gray-500" /> 选择评级规则
                </label>
            </div>
            {/* Search Box */}
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
                    filteredMethodologies.map(m => (
                        <div 
                            key={m.id}
                            onClick={() => setSelectedMethodId(m.id)}
                            className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all group ${
                                selectedMethodId === m.id
                                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500' 
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                selectedMethodId === m.id ? 'border-primary-500 bg-white' : 'border-gray-300 bg-white group-hover:border-primary-400'
                            }`}>
                                {selectedMethodId === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>}
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                                <div className="text-sm font-bold text-gray-800 truncate mb-0.5">{m.name}</div>
                                <div className="text-xs text-gray-500 truncate">{m.version}</div>
                            </div>
                        </div>
                    ))
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
            disabled={selectedEntIds.length === 0 || !selectedMethodId}
            className={`px-8 py-2.5 bg-primary-600 text-white rounded-xl flex items-center gap-2 shadow-md transition-all font-bold text-sm ${
                (selectedEntIds.length === 0 || !selectedMethodId) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <Play size={16} fill="currentColor" />
            开始评级 ({selectedEntIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};