
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Calendar, Filter, MoreHorizontal, CheckCircle2, XCircle, Users, Layers, Pencil, X, Trash2, AlertTriangle, Calculator, ChevronDown, ChevronRight, GripVertical, Search, FileText, Save, ListChecks, Award, Palette, Info, Shield, Zap, Clock, Activity, BarChart3
} from 'lucide-react';
import { MOCK_METHODOLOGIES } from '../constants';
import { Methodology, MethodologyType, RatingModelConfig, UserRole, ApplicationStage, RatingIndicator, RatingLevel } from '../types';

const DEFAULT_RATING_CONFIG: RatingModelConfig = {
    qualitative: [
        { title: '绿色产业符合性', description: '主营业务需符合国家绿色产业目录定义。' },
        { title: '环境合规一票否决', description: '近一年无重大环境违法违规记录。' },
        { title: '公共信用状况', description: '企业信用等级需在B级及以上。' }
    ],
    quantitative: [],
    bonus: [],
    levels: [],
    directRules: []
};

// 10 Preset Colors for Levels
const PRESET_COLORS = [
    { value: 'green', color: '#10b981', label: '绿色' }, 
    { value: 'blue', color: '#3b82f6', label: '蓝色' }, 
    { value: 'yellow', color: '#eab308', label: '黄色' }, 
    { value: 'red', color: '#ef4444', label: '红色' }, 
    { value: 'purple', color: '#a855f7', label: '紫色' }, 
    { value: 'orange', color: '#f97316', label: '橙色' }, 
    { value: 'cyan', color: '#06b6d4', label: '青色' }, 
    { value: 'indigo', color: '#6366f1', label: '靛蓝' },
    { value: 'teal', color: '#14b8a6', label: '蓝绿' },
    { value: 'gray', color: '#6b7280', label: '灰色' }, 
];

// Helper type for quantitative grouping
type QuantGroup = {
    id: string; // for key
    name: string; // Level 1 name
    indicators: RatingIndicator[]; // Level 2 items
};

// Helper Component: Color Picker
const ColorPicker: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedColor = PRESET_COLORS.find(c => c.value === value) || PRESET_COLORS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full bg-white"
            >
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: selectedColor.color }}></div>
                <span className="text-xs text-gray-600 flex-1 text-left truncate">{selectedColor.label}</span>
                <ChevronDown size={12} className="text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c.value}
                            onClick={() => { onChange(c.value); setIsOpen(false); }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value === c.value ? 'border-gray-600' : 'border-transparent'}`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const RatingMethodologyPage: React.FC = () => {
  const [methodologies, setMethodologies] = useState<Methodology[]>(
      MOCK_METHODOLOGIES.filter(m => m.type === MethodologyType.RATING_MODEL)
  );
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMethodologies = useMemo(() => {
      return methodologies.filter(m => 
          m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [methodologies, searchTerm]);

  // --- Editor State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Basic Info
  const [formData, setFormData] = useState<{
      name: string;
      version: string;
      startDate: string;
      endDate: string;
  }>({
      name: '',
      version: 'v1.0',
      startDate: '',
      endDate: '',
  });

  // Config State
  const [config, setConfig] = useState<RatingModelConfig>(DEFAULT_RATING_CONFIG);
  
  // Helper state for Quantitative Groups
  const [quantGroups, setQuantGroups] = useState<QuantGroup[]>([]);

  // --- Validation Helpers ---
  const totalQuantScore = useMemo(() => {
      return quantGroups.reduce((acc, g) => acc + g.indicators.reduce((sum, i) => sum + (Number(i.score) || 0), 0), 0);
  }, [quantGroups]);

  // --- Helper to parse score string range to min/max ---
  const parseScoreRange = (range: string): { min: string, max: string } => {
      if (!range) return { min: '', max: '' };
      
      if (range.includes('-')) {
          const [min, max] = range.split('-');
          return { min: min.trim(), max: max.trim() };
      }
      
      if (range.includes('≥') || range.includes('>=')) {
          const min = range.replace(/[^0-9]/g, '');
          return { min: min, max: '100' };
      }

      if (range.includes('<') || range.includes('≤')) {
          const max = range.replace(/[^0-9]/g, '');
          return { min: '0', max: max }; 
      }

      return { min: '', max: '' };
  };

  // --- Helper to calculate remaining days ---
  const calculateRemainingDays = (dateStr: string) => {
      if (!dateStr) return null;
      let endDateStr = dateStr;
      
      // Handle range strings
      if (dateStr.includes('~')) {
          endDateStr = dateStr.split('~')[1]?.trim();
      } else if (dateStr.includes('至')) {
          endDateStr = dateStr.split('至')[1]?.trim();
      }
      
      if (!endDateStr) return null;

      try {
          const endDate = new Date(endDateStr);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          // Calculate difference in days
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? diffDays : 0;
      } catch (e) {
          return null;
      }
  };

  // --- Handlers ---

  const handleOpenAdd = () => {
      setEditingId(null);
      setFormData({
          name: '',
          version: 'v1.0',
          startDate: '',
          endDate: '',
      });
      setConfig(DEFAULT_RATING_CONFIG);
      setQuantGroups([]);
      setActiveTab('basic');
      setShowModal(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, m: Methodology) => {
      e.stopPropagation();
      setEditingId(m.id);
      
      let sDate = m.effectiveDate;
      let eDate = '';
      if (m.effectiveDate.includes(' ~ ')) {
          [sDate, eDate] = m.effectiveDate.split(' ~ ');
      }

      setFormData({
          name: m.name,
          version: m.version,
          startDate: sDate,
          endDate: eDate,
      });
      
      const currentConfig = m.ratingConfig || DEFAULT_RATING_CONFIG;
      const configCopy: RatingModelConfig = JSON.parse(JSON.stringify(currentConfig));
      
      if (configCopy.levels) {
          configCopy.levels = configCopy.levels.map(l => {
              if ((!l.minScore && !l.maxScore) && l.scoreRange) {
                  const { min, max } = parseScoreRange(l.scoreRange);
                  return { ...l, minScore: min, maxScore: max };
              }
              return l;
          });
      }

      setConfig(configCopy);

      const groupsMap: Record<string, RatingIndicator[]> = {};
      const groupsOrder: string[] = [];
      
      currentConfig.quantitative.forEach(item => {
          const l1 = item.level1 || '未分类';
          if (!groupsMap[l1]) {
              groupsMap[l1] = [];
              groupsOrder.push(l1);
          }
          groupsMap[l1].push(item);
      });

      const groups: QuantGroup[] = groupsOrder.map((l1, idx) => ({
          id: `g_${Date.now()}_${idx}`,
          name: l1,
          indicators: groupsMap[l1]
      }));
      setQuantGroups(groups);

      setActiveTab('basic');
      setShowModal(true);
  };

  const handleSave = () => {
      // ... (Validation logic remains same) ...
      if (!formData.name.trim()) {
          setActiveTab('basic');
          setTimeout(() => alert('【基本信息不完整】\n规则名称为必填项，请补充。'), 10);
          return;
      }
      if (!formData.startDate) {
          setActiveTab('basic');
          setTimeout(() => alert('【基本信息不完整】\n生效开始日期为必填项，请补充。'), 10);
          return;
      }
      if (totalQuantScore !== 100) {
          setActiveTab('quantitative');
          setTimeout(() => alert(`【定量评价配置错误】\n总分必须严格等于 100 分。\n当前总分：${totalQuantScore} 分。`), 10);
          return;
      }
      if (quantGroups.length === 0) {
          setActiveTab('quantitative');
          setTimeout(() => alert('【定量评价为空】\n请至少配置一个定量评价维度。'), 10);
          return;
      }
      if (config.levels.length === 0) {
          setActiveTab('levels');
          setTimeout(() => alert('【等级定义缺失】\n请至少配置一个评级等级。'), 10);
          return;
      }
      // ... (Existing save logic) ...

      // Flatten Quant Groups back to Config
      const flatQuant: RatingIndicator[] = [];
      quantGroups.forEach(group => {
          group.indicators.forEach(ind => {
              flatQuant.push({
                  ...ind,
                  level1: group.name,
                  score: Number(ind.score) || 0
              });
          });
      });

      // Process Levels
      const sequencedLevels = config.levels.map((lvl, index) => {
          const min = Number(lvl.minScore);
          const max = Number(lvl.maxScore);
          let rangeStr = `${min}-${max}`;
          
          if (max === 100) rangeStr = `≥${min}`;
          else if (min === 0) rangeStr = `<${max + 1}`; 
          else rangeStr = `${min}-${max}`;

          return {
              ...lvl,
              level: `GE${index + 1}`, // Auto generate
              scoreRange: rangeStr,
              minScore: String(min),
              maxScore: String(max)
          };
      });

      const finalConfig: RatingModelConfig = { 
          ...config, 
          quantitative: flatQuant,
          levels: sequencedLevels,
          bonus: config.bonus.map(b => ({...b, score: Number(b.score) || 0}))
      };
      
      let effectiveDateStr = formData.startDate;
      if (formData.startDate && formData.endDate) {
          effectiveDateStr = `${formData.startDate} ~ ${formData.endDate}`;
      } else if (formData.endDate) {
          effectiveDateStr = formData.endDate; 
      }

      const commonData = {
          name: formData.name,
          version: formData.version,
          type: MethodologyType.RATING_MODEL,
          effectiveDate: effectiveDateStr,
          roles: [], 
          stages: [], 
          ratingConfig: finalConfig,
          status: 'active',
          content: '评级规则配置',
          lastUpdated: new Date().toISOString().split('T')[0]
      };

      if (editingId) {
          setMethodologies(prev => prev.map(m => m.id === editingId ? { ...m, ...commonData } : m));
      } else {
          const newMethodology: Methodology = {
              id: `m_rate_${Date.now()}`,
              ...commonData
          };
          setMethodologies([newMethodology, ...methodologies]);
      }
      setShowModal(false);
  };

  // ... (Quantitative/Qualitative/Bonus/Level Editor Helpers remain same) ...
  // --- Quantitative Editor Helpers ---
  const addQuantGroup = () => {
      setQuantGroups(prev => [...prev, { id: `g_${Date.now()}`, name: '新维度', indicators: [] }]);
  };
  const deleteQuantGroup = (groupId: string) => {
      if (window.confirm('确定删除该维度及其所有指标吗？')) { setQuantGroups(prev => prev.filter(g => g.id !== groupId)); }
  };
  const updateGroupName = (groupId: string, newName: string) => {
      setQuantGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };
  const addQuantIndicator = (groupId: string) => {
      setQuantGroups(prev => prev.map(g => {
          if (g.id === groupId) { return { ...g, indicators: [...g.indicators, { level2: '', score: '', standard: '' }] }; }
          return g;
      }));
  };
  const deleteQuantIndicator = (groupId: string, index: number) => {
      setQuantGroups(prev => prev.map(g => {
          if (g.id === groupId) { const newInds = [...g.indicators]; newInds.splice(index, 1); return { ...g, indicators: newInds }; }
          return g;
      }));
  };
  const updateQuantIndicator = (groupId: string, index: number, field: keyof RatingIndicator, value: any) => {
      setQuantGroups(prev => prev.map(g => {
          if (g.id === groupId) { const newInds = [...g.indicators]; newInds[index] = { ...newInds[index], [field]: value }; return { ...g, indicators: newInds }; }
          return g;
      }));
  };
  // --- Qualitative Editor Helpers ---
  const addQualitativeItem = () => { setConfig(prev => ({ ...prev, qualitative: [...prev.qualitative, { title: '', description: '' }] })); };
  const updateQualitativeItem = (index: number, field: keyof RatingIndicator, value: string) => { const newList = [...config.qualitative]; newList[index] = { ...newList[index], [field]: value }; setConfig(prev => ({ ...prev, qualitative: newList })); };
  const deleteQualitativeItem = (index: number) => { const newList = [...config.qualitative]; newList.splice(index, 1); setConfig(prev => ({ ...prev, qualitative: newList })); };
  // --- Bonus Editor Helpers ---
  const addBonusItem = () => { setConfig(prev => ({ ...prev, bonus: [...prev.bonus, { title: '', score: '', description: '' }] })); };
  const updateBonusItem = (index: number, field: keyof RatingIndicator, value: any) => { const newList = [...config.bonus]; newList[index] = { ...newList[index], [field]: value }; setConfig(prev => ({ ...prev, bonus: newList })); };
  const deleteBonusItem = (index: number) => { const newList = [...config.bonus]; newList.splice(index, 1); setConfig(prev => ({ ...prev, bonus: newList })); };
  // --- Level Editor Helpers ---
  const addLevelItem = () => { setConfig(prev => ({ ...prev, levels: [...prev.levels, { level: '', name: '', scoreRange: '', minScore: '', maxScore: '', description: '', color: 'green' }] })); };
  const updateLevelItem = (index: number, field: keyof RatingLevel, value: string) => { const newList = [...config.levels]; newList[index] = { ...newList[index], [field]: value }; setConfig(prev => ({ ...prev, levels: newList })); };
  const deleteLevelItem = (index: number) => { const newList = [...config.levels]; newList.splice(index, 1); setConfig(prev => ({ ...prev, levels: newList })); };

  // --- Tab Navigation ---
  const tabs = [
      { id: 'basic', label: '基本信息', icon: FileText, required: true },
      { id: 'qualitative', label: '定性评价', icon: ShieldIcon, required: false },
      { id: 'quantitative', label: '定量评价', icon: Calculator, required: true },
      { id: 'bonus', label: '加分项', icon: Award, required: false },
      { id: 'levels', label: '等级定义', icon: ListChecks, required: true },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">评级规则管理</h2>
           <p className="text-gray-500 mt-1">配置ESG评级规则，定义指标权重与等级标准</p>
        </div>
        <button 
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>新增规则</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="搜索规则名称..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
      </div>

      {/* List - Enhanced Version */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-[30%]">规则概览</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-[30%]">模型结构</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-[25%]">生效日期</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right w-[15%]">操作</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {filteredMethodologies.length === 0 ? (
                      <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                              未找到匹配的规则
                          </td>
                      </tr>
                  ) : filteredMethodologies.map((item) => {
                      // Calculate Stats
                      const qualCount = item.ratingConfig?.qualitative?.length || 0;
                      const quantCount = item.ratingConfig?.quantitative?.length || 0;
                      const levelCount = item.ratingConfig?.levels?.length || 0;
                      const isActive = item.status === 'active';
                      
                      // Date Calculation
                      const remainingDays = calculateRemainingDays(item.effectiveDate);
                      const displayDate = item.effectiveDate.replace('~', '至');

                      return (
                        <tr 
                            key={item.id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/rating/methodology/${item.id}`, { state: { methodology: item } })}
                        >
                            {/* 1. Basic Info */}
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-mono border border-gray-200">
                                            {item.version}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={`text-xs ${isActive ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                            {isActive ? '生效中' : '已停用'}
                                        </span>
                                    </div>
                                </div>
                            </td>

                            {/* 2. Model Structure Stats */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 group/stat" title="定性指标数">
                                        <div className="p-1 rounded bg-emerald-50 text-emerald-600 group-hover/stat:bg-emerald-100 transition-colors">
                                            <Shield size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{qualCount}</span>
                                            <span className="text-[10px] text-gray-400 scale-90 origin-left">定性</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 group/stat" title="定量指标数">
                                        <div className="p-1 rounded bg-blue-50 text-blue-600 group-hover/stat:bg-blue-100 transition-colors">
                                            <Calculator size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{quantCount}</span>
                                            <span className="text-[10px] text-gray-400 scale-90 origin-left">定量</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 group/stat" title="等级划分数">
                                        <div className="p-1 rounded bg-orange-50 text-orange-600 group-hover/stat:bg-orange-100 transition-colors">
                                            <Award size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{levelCount}</span>
                                            <span className="text-[10px] text-gray-400 scale-90 origin-left">等级</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* 4. Dates & Validity */}
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="text-xs text-gray-700 font-mono flex items-center gap-1.5">
                                        <Calendar size={12} className="text-gray-400"/>
                                        {displayDate}
                                    </div>
                                    {remainingDays !== null && (
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded w-fit font-medium flex items-center gap-1
                                            ${remainingDays > 90 ? 'bg-green-50 text-green-600 border border-green-100' : 
                                              remainingDays > 30 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                                              'bg-red-50 text-red-600 border border-red-100'}`}>
                                            <Clock size={10} />
                                            有效期剩余 {remainingDays} 天
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* 5. Actions */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={(e) => handleOpenEdit(e, item)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors group-hover:bg-white border border-transparent group-hover:border-gray-100"
                                        title="编辑"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group-hover:bg-white border border-transparent group-hover:border-gray-100"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>

      {/* Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Calculator size={24} className="text-primary-600" />
                          {editingId ? '编辑评级规则' : '新增评级规则'}
                      </h3>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 px-6 bg-white shrink-0 overflow-x-auto">
                      {tabs.map(tab => (
                          <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                  activeTab === tab.id 
                                  ? 'border-primary-600 text-primary-700' 
                                  : 'border-transparent text-gray-500 hover:text-gray-700'
                              }`}
                          >
                              <tab.icon size={16} />
                              {tab.label}
                              {tab.required && <span className="text-red-500 ml-0.5">*</span>}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                      
                      {/* Basic Info */}
                      {activeTab === 'basic' && (
                          <div className="space-y-6 max-w-3xl mx-auto">
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1.5">规则名称 <span className="text-red-500">*</span></label>
                                      <input 
                                          type="text" 
                                          value={formData.name}
                                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                                          placeholder="例如：企业ESG绿色评级规则 (通用版)"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1.5">版本号</label>
                                      <input 
                                          type="text" 
                                          value={formData.version}
                                          onChange={(e) => setFormData({...formData, version: e.target.value})}
                                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1.5">生效日期范围 <span className="text-red-500">*</span></label>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="date" 
                                              value={formData.startDate}
                                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                          />
                                          <span className="text-gray-400">至</span>
                                          <input 
                                              type="date" 
                                              value={formData.endDate}
                                              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Qualitative Editor */}
                      {activeTab === 'qualitative' && (
                          <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm text-gray-500">
                                      定性指标（一票否决项）配置 <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-1">选填</span>
                                  </div>
                                  <button onClick={addQualitativeItem} className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded flex items-center gap-1">
                                      <Plus size={16} /> 添加定性指标
                                  </button>
                              </div>
                              
                              {config.qualitative.length === 0 && (
                                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                      暂无定性指标，请点击右上角添加
                                  </div>
                              )}

                              {config.qualitative.map((item, idx) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 items-start shadow-sm animate-fade-in">
                                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold mt-1">
                                          {idx + 1}
                                      </div>
                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">指标名称</label>
                                              <input 
                                                  type="text" 
                                                  value={item.title || ''}
                                                  onChange={(e) => updateQualitativeItem(idx, 'title', e.target.value)}
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                                                  placeholder="例如：环境合规"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">评价标准 / 说明</label>
                                              <input 
                                                  type="text" 
                                                  value={item.description || ''}
                                                  onChange={(e) => updateQualitativeItem(idx, 'description', e.target.value)}
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                                                  placeholder="例如：近一年无重大环境违法违规记录"
                                              />
                                          </div>
                                      </div>
                                      <button onClick={() => deleteQualitativeItem(idx)} className="text-gray-300 hover:text-red-500 p-1 mt-1">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Quantitative Editor (Hierarchical) */}
                      {activeTab === 'quantitative' && (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center mb-2 sticky top-0 z-20 bg-gray-50/95 py-2 backdrop-blur-sm">
                                  <div className="text-sm text-gray-600 flex items-center gap-2">
                                      总分合计: 
                                      <span className={`font-bold text-lg ${totalQuantScore === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                          {totalQuantScore}
                                      </span> 
                                      <span className="text-gray-400">/ 100</span>
                                      {totalQuantScore !== 100 && (
                                          <span className="text-xs text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                              <AlertTriangle size={12} /> 总分必须等于100
                                          </span>
                                      )}
                                      {totalQuantScore === 100 && (
                                          <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                              <CheckCircle2 size={12} /> 分值配置正确
                                          </span>
                                      )}
                                  </div>
                                  <button onClick={addQuantGroup} className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded flex items-center gap-1">
                                      <Plus size={16} /> 添加一级维度
                                  </button>
                              </div>

                              {quantGroups.length === 0 && (
                                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                      暂无评价指标，请点击右上角添加维度
                                  </div>
                              )}

                              {quantGroups.map((group) => (
                                  <div key={group.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
                                      {/* Level 1 Header */}
                                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-4">
                                          <GripVertical size={16} className="text-gray-300 cursor-move" />
                                          <div className="flex-1">
                                              <input 
                                                  type="text" 
                                                  value={group.name}
                                                  onChange={(e) => updateGroupName(group.id, e.target.value)}
                                                  className="bg-transparent font-bold text-gray-800 border-none p-0 focus:ring-0 w-full placeholder-gray-400"
                                                  placeholder="输入一级维度名称 (如: 绿色效益)"
                                              />
                                          </div>
                                          <div className="text-xs text-gray-500 font-medium">
                                              小计: {group.indicators.reduce((s, i) => s + (Number(i.score) || 0), 0)} 分
                                          </div>
                                          <button onClick={() => deleteQuantGroup(group.id)} className="text-gray-400 hover:text-red-500 p-1">
                                              <Trash2 size={16} />
                                          </button>
                                      </div>

                                      {/* Level 2 Items */}
                                      <div className="p-4 space-y-3">
                                          {group.indicators.map((item, idx) => (
                                              <div key={idx} className="flex gap-3 items-start">
                                                  <div className="flex-1">
                                                      <input 
                                                          type="text" 
                                                          value={item.level2} 
                                                          onChange={(e) => updateQuantIndicator(group.id, idx, 'level2', e.target.value)}
                                                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary-500 outline-none"
                                                          placeholder="二级指标名称"
                                                      />
                                                  </div>
                                                  <div className="w-24">
                                                      <input 
                                                          type="number" 
                                                          value={item.score ?? ''} 
                                                          onChange={(e) => updateQuantIndicator(group.id, idx, 'score', e.target.value)}
                                                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:border-primary-500 outline-none"
                                                          placeholder="分值"
                                                          min="0"
                                                      />
                                                  </div>
                                                  <div className="flex-[2]">
                                                      <input 
                                                          type="text" 
                                                          value={item.standard} 
                                                          onChange={(e) => updateQuantIndicator(group.id, idx, 'standard', e.target.value)}
                                                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary-500 outline-none"
                                                          placeholder="评分标准"
                                                      />
                                                  </div>
                                                  <button onClick={() => deleteQuantIndicator(group.id, idx)} className="mt-1.5 text-gray-300 hover:text-red-500">
                                                      <X size={16} />
                                                  </button>
                                              </div>
                                          ))}
                                          <button onClick={() => addQuantIndicator(group.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
                                              <Plus size={12} /> 添加指标
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Bonus Editor */}
                      {activeTab === 'bonus' && (
                          <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm text-gray-500">
                                      鼓励性加分项配置 <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-1">选填</span>
                                  </div>
                                  <button onClick={addBonusItem} className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded flex items-center gap-1">
                                      <Plus size={16} /> 添加加分项
                                  </button>
                              </div>
                              
                              {config.bonus.length === 0 && (
                                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                      暂无加分项，请点击右上角添加
                                  </div>
                              )}

                              {config.bonus.map((item, idx) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 items-start shadow-sm animate-fade-in">
                                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold mt-1">
                                          {idx + 1}
                                      </div>
                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                                          <div className="md:col-span-2">
                                              <label className="block text-xs font-medium text-gray-500 mb-1">加分项目</label>
                                              <input 
                                                  type="text" 
                                                  value={item.title || ''}
                                                  onChange={(e) => updateBonusItem(idx, 'title', e.target.value)}
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                                                  placeholder="例如：绿色认证"
                                              />
                                          </div>
                                          <div className="md:col-span-1">
                                              <label className="block text-xs font-medium text-gray-500 mb-1">分值</label>
                                              <input 
                                                  type="number" 
                                                  value={item.score ?? ''}
                                                  onChange={(e) => updateBonusItem(idx, 'score', e.target.value)}
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                                                  placeholder="5"
                                                  min="0"
                                              />
                                          </div>
                                          <div className="md:col-span-3">
                                              <label className="block text-xs font-medium text-gray-500 mb-1">评分标准 / 说明</label>
                                              <input 
                                                  type="text" 
                                                  value={item.description || ''}
                                                  onChange={(e) => updateBonusItem(idx, 'description', e.target.value)}
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-primary-500 outline-none"
                                                  placeholder="例如：获得国家级绿色工厂认证"
                                              />
                                          </div>
                                      </div>
                                      <button onClick={() => deleteBonusItem(idx)} className="text-gray-300 hover:text-red-500 p-1 mt-1">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Levels Editor (Compact with Min/Max) */}
                      {activeTab === 'levels' && (
                          <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm text-gray-500">
                                      等级划分标准配置（等级代码由系统自动生成）
                                  </div>
                                  <button onClick={addLevelItem} className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded flex items-center gap-1">
                                      <Plus size={16} /> 添加等级
                                  </button>
                              </div>
                              
                              {config.levels.length === 0 && (
                                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                      暂无等级定义，请点击右上角添加
                                  </div>
                              )}

                              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                  <div className="grid grid-cols-12 bg-gray-50 text-xs text-gray-500 font-medium py-2 px-4 border-b border-gray-100 rounded-t-lg">
                                      <div className="col-span-1 text-center">系统代码</div>
                                      <div className="col-span-2">颜色标记</div>
                                      <div className="col-span-3">等级名称 <span className="text-red-500">*</span></div>
                                      <div className="col-span-2">分数范围 (Min - Max) <span className="text-red-500">*</span></div>
                                      <div className="col-span-3">等级描述</div>
                                      <div className="col-span-1 text-center">操作</div>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                      {config.levels.map((item, idx) => (
                                          <div key={idx} className={`grid grid-cols-12 gap-3 p-3 items-center hover:bg-gray-50 group ${idx === config.levels.length - 1 ? 'rounded-b-lg' : ''}`}>
                                              <div className="col-span-1 text-center text-xs font-mono text-gray-400 bg-gray-100 rounded py-1 mx-2">
                                                  GE{idx + 1}
                                              </div>
                                              <div className="col-span-2">
                                                  <ColorPicker 
                                                      value={item.color} 
                                                      onChange={(val) => updateLevelItem(idx, 'color', val)} 
                                                  />
                                              </div>
                                              <div className="col-span-3">
                                                  <input 
                                                      type="text" 
                                                      value={item.name}
                                                      onChange={(e) => updateLevelItem(idx, 'name', e.target.value)}
                                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-primary-500 outline-none"
                                                      placeholder="如：深绿企业"
                                                  />
                                              </div>
                                              <div className="col-span-2 flex items-center gap-1">
                                                  <input 
                                                      type="number" 
                                                      value={item.minScore ?? ''}
                                                      onChange={(e) => updateLevelItem(idx, 'minScore', e.target.value)}
                                                      className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-primary-500 outline-none text-center"
                                                      placeholder="Min"
                                                  />
                                                  <span className="text-gray-400">-</span>
                                                  <input 
                                                      type="number" 
                                                      value={item.maxScore ?? ''}
                                                      onChange={(e) => updateLevelItem(idx, 'maxScore', e.target.value)}
                                                      className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-primary-500 outline-none text-center"
                                                      placeholder="Max"
                                                  />
                                              </div>
                                              <div className="col-span-3">
                                                  <input 
                                                      type="text" 
                                                      value={item.description}
                                                      onChange={(e) => updateLevelItem(idx, 'description', e.target.value)}
                                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-primary-500 outline-none"
                                                      placeholder="描述..."
                                                  />
                                              </div>
                                              <div className="col-span-1 text-center">
                                                  <button 
                                                      onClick={() => deleteLevelItem(idx)} 
                                                      className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50 rounded-b-2xl">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm">
                          {editingId ? '保存修改' : '确认创建'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper Icon for Qualitative
const ShieldIcon = ({size, className}: {size?:number, className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size||24} height={size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
