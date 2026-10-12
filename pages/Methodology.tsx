
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Filter, FileText, Calendar, Pencil, MoreHorizontal, 
  FileSpreadsheet, X, Download, Loader2, CheckCircle2, AlertTriangle, 
  Save, XCircle, Upload, Users, Layers, Trash2, CheckSquare, Square, FileEdit
} from 'lucide-react';
import { MOCK_METHODOLOGIES } from '../constants';
import { Methodology, MethodologyType, ApplicationStage, UserRole, CatalogItem } from '../types';

interface ImportMetadata {
  name: string;
  type: string;
  version: string;
  // roles and stages removed
}

interface ExcelCatalogRow {
  '一级类别': string;
  '二级类别': string;
  '三级类别': string;
  '四级类别': string;
  '五级类别': string;
  '类别名称': string;
  '条件/标准': string;
  '备注': string;
  [key: string]: any;
}

export const MethodologyPage: React.FC = () => {
  // Only show standard methodologies, exclude Rating Models
  const [methodologies, setMethodologies] = useState<Methodology[]>(
      MOCK_METHODOLOGIES.filter(m => m.type !== MethodologyType.RATING_MODEL)
  );
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // --- Filter & Search State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- Single Add/Edit Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [detectedType, setDetectedType] = useState<string>('');
  // roles and stages state removed
  const [ruleFileName, setRuleFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [editingCatalogItems, setEditingCatalogItems] = useState<CatalogItem[]>([]); 
  const ruleFileInputRef = useRef<HTMLInputElement>(null);

  // --- New Batch/Excel Import State ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedCatalogItems, setParsedCatalogItems] = useState<CatalogItem[]>([]);
  const [importMetadata, setImportMetadata] = useState<ImportMetadata>({
      name: '',
      type: '',
      version: 'v1.0'
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // --- Filtering Logic ---
  const filteredMethodologies = methodologies.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || item.type === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
  });

  // --- Logic: Single Add/Edit ---
  const handleOpenEdit = (e: React.MouseEvent, item: Methodology) => {
      e.stopPropagation();
      setEditingId(item.id);
      setNewRuleName(item.name);
      setNewRuleContent(item.content);
      setDetectedType(item.type);
      setRuleFileName('');
      
      // Deep copy and AUTO-PARSE category levels from string if missing
      const itemsCopy = item.catalogItems ? JSON.parse(JSON.stringify(item.catalogItems)) : [];
      const enhancedItems = itemsCopy.map((ci: CatalogItem) => {
          // If l1 is missing but category string exists, parse it
          if (!ci.l1 && ci.category) {
              const parts = ci.category.split('>').map(s => s.trim());
              return {
                  ...ci,
                  l1: parts[0] || '',
                  l2: parts[1] || '',
                  l3: parts[2] || '',
                  l4: parts[3] || '',
                  l5: parts[4] || ''
              };
          }
          return ci;
      });

      setEditingCatalogItems(enhancedItems); 
      setShowModal(true);
  };

  const handleRuleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processRuleFile(file);
      if (ruleFileInputRef.current) ruleFileInputRef.current.value = '';
  };

  const handleRuleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processRuleFile(file);
  };

  const processRuleFile = (file: File) => {
      setRuleFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          setNewRuleContent(text);
      };
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
          reader.readAsText(file);
      } else {
          setNewRuleContent(`[文件已上传: ${file.name}]\n(注：二进制文件内容，系统将自动建立索引)`);
      }
  };

  const handleRemoveRuleFile = () => {
      setRuleFileName('');
      setNewRuleContent('');
  };

  // Handlers for Editing Catalog Items in Edit Modal
  const handleUpdateEditingItem = (index: number, field: keyof CatalogItem, value: string) => {
      setEditingCatalogItems(prev => prev.map((item, i) => {
          if (i === index) {
              const updatedItem = { ...item, [field]: value as any };
              if (['l1', 'l2', 'l3', 'l4', 'l5'].includes(field)) {
                  const parts = [
                      updatedItem.l1, 
                      updatedItem.l2, 
                      updatedItem.l3, 
                      updatedItem.l4, 
                      updatedItem.l5
                  ].filter(Boolean);
                  updatedItem.category = parts.join(' > ');
              }
              return updatedItem;
          }
          return item;
      }));
  };

  const handleDeleteEditingItem = (index: number) => {
      setEditingCatalogItems(prev => prev.filter((_, i) => i !== index));
  };

  const editingDataDepth = useMemo(() => {
      return {
          hasL3: editingCatalogItems.some(item => !!item.l3),
          hasL4: editingCatalogItems.some(item => !!item.l4),
          hasL5: editingCatalogItems.some(item => !!item.l5),
      };
  }, [editingCatalogItems]);

  const handleSaveSingle = () => {
    if (!newRuleName) {
        alert("请输入规则名称");
        return;
    }

    const commonData = {
        name: newRuleName,
        type: (detectedType as MethodologyType) || MethodologyType.BANK,
        stages: [], // Removed
        roles: [], // Removed
        content: newRuleContent,
        catalogItems: editingCatalogItems.length > 0 ? editingCatalogItems : undefined,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
        setMethodologies(prev => prev.map(m => m.id === editingId ? { ...m, ...commonData } : m));
    } else {
        const newMethodology: Methodology = {
            id: `m${Date.now()}`,
            version: 'v1.0',
            status: 'active',
            effectiveDate: new Date().toISOString().split('T')[0],
            ...commonData
        };
        setMethodologies([newMethodology, ...methodologies]);
    }
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
      setNewRuleName('');
      setNewRuleContent('');
      setDetectedType('');
      setEditingId(null);
      setRuleFileName('');
      setEditingCatalogItems([]);
  };

  // --- Logic: Excel Import ---

  const handleOpenBatchImport = () => {
      setImportMetadata({
          name: '',
          type: '',
          version: 'v1.0'
      });
      setParsedCatalogItems([]);
      setImportErrors([]);
      setShowImportModal(true);
  };

  const handleDownloadTemplate = () => {
      const headers = ['一级类别', '二级类别', '三级类别', '四级类别', '五级类别', '类别名称', '条件/标准', '备注'];
      const exampleRow = {
          '一级类别': '1. 节能降碳产业',
          '二级类别': '1.1 高效节能装备制造',
          '三级类别': '',
          '四级类别': '',
          '五级类别': '',
          '类别名称': '高效锅炉制造',
          '条件/标准': '1. 锅炉热效率达到一级能效;\n2. 污染物排放符合最新环保标准。',
          '备注': '参考GB24500标准'
      };
      
      const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "方法学导入模版");
      XLSX.writeFile(wb, "绿色金融方法学导入模版.xlsx");
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processExcelFile(file);
      if (batchInputRef.current) batchInputRef.current.value = '';
  };

  const processExcelFile = (file: File) => {
      setImporting(true);
      setImportErrors([]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              
              const json = XLSX.utils.sheet_to_json(sheet) as unknown as ExcelCatalogRow[];
              
              const items: CatalogItem[] = [];
              const errors: string[] = [];

              if (json.length === 0) {
                  errors.push("文件内容为空或格式无法解析");
              }

              json.forEach((row, index) => {
                  const rowNum = index + 2; 
                  const name = row['类别名称'];
                  const conditionStr = row['条件/标准'];

                  if (!name || !conditionStr) {
                      errors.push(`第 ${rowNum} 行: 缺少必填项 (类别名称或条件/标准)`);
                      return;
                  }

                  const conditions = conditionStr.split(/[\n\r;；]+/).map(s => s.trim()).filter(Boolean);

                  const categoryParts = [
                      row['一级类别'],
                      row['二级类别'],
                      row['三级类别'],
                      row['四级类别'],
                      row['五级类别']
                  ].filter(Boolean);

                  items.push({
                      code: `CAT_${Date.now()}_${index}`,
                      category: categoryParts.join(' > '),
                      l1: row['一级类别'] || '',
                      l2: row['二级类别'] || '',
                      l3: row['三级类别'] || '',
                      l4: row['四级类别'] || '',
                      l5: row['五级类别'] || '',
                      name: name,
                      conditions: conditions,
                      remarks: row['备注']
                  });
              });

              setParsedCatalogItems(items);
              if (errors.length > 0) {
                  setImportErrors(errors);
              }
              if (items.length > 0 && errors.length === 0) {
                  if (!importMetadata.name) {
                      setImportMetadata(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
                  }
              }

          } catch (error) {
              console.error("Excel Parse Error", error);
              setImportErrors(["文件解析发生严重错误，请检查文件格式是否为 .xlsx"]);
          } finally {
              setImporting(false);
          }
      };
      reader.readAsArrayBuffer(file);
  };

  const handleUpdateCatalogItem = (index: number, field: keyof CatalogItem, value: string) => {
      setParsedCatalogItems(prev => prev.map((item, i) => {
          if (i === index) {
              const updatedItem = { ...item, [field]: value as any };
              if (['l1', 'l2', 'l3', 'l4', 'l5'].includes(field)) {
                  const parts = [
                      updatedItem.l1, 
                      updatedItem.l2, 
                      updatedItem.l3, 
                      updatedItem.l4, 
                      updatedItem.l5
                  ].filter(Boolean);
                  updatedItem.category = parts.join(' > ');
              }
              return updatedItem;
          }
          return item;
      }));
  };

  const handleDeleteCatalogItem = (index: number) => {
      setParsedCatalogItems(prev => prev.filter((_, i) => i !== index));
  };

  const dataDepth = useMemo(() => {
      return {
          hasL3: parsedCatalogItems.some(item => !!item.l3),
          hasL4: parsedCatalogItems.some(item => !!item.l4),
          hasL5: parsedCatalogItems.some(item => !!item.l5),
      };
  }, [parsedCatalogItems]);

  const handleConfirmImport = () => {
      if (!importMetadata.name || !importMetadata.type) {
          alert("请完善规则基本信息（名称、类型）");
          return;
      }
      
      if (parsedCatalogItems.length === 0) {
          alert("未解析到有效的目录数据，无法导入");
          return;
      }

      const newMethodology: Methodology = {
          id: `m_batch_${Date.now()}`,
          name: importMetadata.name,
          type: importMetadata.type as MethodologyType,
          version: importMetadata.version,
          status: 'active',
          effectiveDate: new Date().toISOString().split('T')[0],
          roles: [], // Removed
          stages: [], // Removed
          content: `通过Excel批量导入创建，包含 ${parsedCatalogItems.length} 条目录项。`,
          catalogItems: parsedCatalogItems,
          lastUpdated: new Date().toISOString().split('T')[0]
      };

      setMethodologies(prev => [newMethodology, ...prev]);
      setShowImportModal(false);
      setParsedCatalogItems([]);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">方法学管理</h2>
           <p className="text-gray-500 mt-1">统一管理国家、地方及银行内部绿色信贷认定规则</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleOpenBatchImport}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>新增规则</span>
            </button>
        </div>
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
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex gap-2 items-center">
            <Filter size={18} className="text-gray-400 mr-1" />
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-50 border-transparent hover:border-gray-200 text-sm text-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
            >
                <option value="all">所有类型</option>
                <option value={MethodologyType.NATIONAL}>国家政策</option>
                <option value={MethodologyType.LOCAL}>地方政策</option>
                <option value={MethodologyType.BANK}>银行规则</option>
            </select>
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50 border-transparent hover:border-gray-200 text-sm text-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
            >
                <option value="all">所有状态</option>
                <option value="active">生效中</option>
                <option value="inactive">已停用</option>
            </select>
        </div>
      </div>

      {/* Methodologies List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">规则名称</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">版本</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">生效日期</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredMethodologies.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            未找到匹配的规则
                        </td>
                    </tr>
                ) : filteredMethodologies.map((item) => (
                    <tr 
                        key={item.id} 
                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/methodology/${item.id}`, { state: { methodology: item } })}
                    >
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-50 p-2 rounded text-primary-600">
                                    <FileText size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800 hover:text-primary-600 transition-colors">{item.name}</span>
                                    {item.catalogItems && (
                                        <span className="text-xs text-gray-400 mt-0.5">{item.catalogItems.length} 条目录项</span>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${item.type === MethodologyType.NATIONAL ? 'bg-red-50 text-red-700' : 
                                  item.type === MethodologyType.LOCAL ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                {item.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono bg-gray-50 w-fit rounded">{item.version}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                            <Calendar size={14} /> {item.effectiveDate}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={(e) => handleOpenEdit(e, item)}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="编辑"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- Batch/Template Import Modal --- */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileSpreadsheet size={20} className="text-primary-600" />
                            新增方法学规
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            通过 Excel 模板批量导入规则明细（如：绿色目录清单）
                        </p>
                    </div>
                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Step 1: Metadata Form */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="bg-primary-100 text-primary-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                            基础信息配置 (必填)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">规则名称 <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={importMetadata.name}
                                    onChange={(e) => setImportMetadata(p => ({...p, name: e.target.value}))}
                                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                                    placeholder="例如：绿色金融支持项目目录（2025年版）"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">规则类型 <span className="text-red-500">*</span></label>
                                <select 
                                    value={importMetadata.type}
                                    onChange={(e) => setImportMetadata(p => ({...p, type: e.target.value as MethodologyType}))}
                                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="">请选择</option>
                                    {Object.values(MethodologyType)
                                        .filter(t => t !== MethodologyType.RATING_MODEL) 
                                        .map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Upload & Preview */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-primary-100 text-primary-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                                导入明细 (Excel)
                            </h4>
                            <button 
                                onClick={handleDownloadTemplate}
                                className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline"
                            >
                                <Download size={14} /> 下载模版
                            </button>
                        </div>
                        
                        {parsedCatalogItems.length === 0 ? (
                            <div 
                                onClick={() => !importing && batchInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-gray-50 cursor-pointer group
                                    ${importing ? 'opacity-50 cursor-wait' : 'border-gray-300 hover:border-primary-400 hover:bg-white'}`}
                            >
                                {importing ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={24} className="animate-spin text-primary-600 mb-2" />
                                        <span className="text-sm font-bold text-gray-700">正在解析Excel...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-green-600">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <h4 className="text-gray-700 font-bold mb-1">点击上传 .xlsx 文件</h4>
                                        <p className="text-xs text-gray-400">必填列：一级类别、类别名称、条件/标准</p>
                                    </div>
                                )}
                                <input 
                                    ref={batchInputRef}
                                    type="file" 
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleExcelFileChange}
                                    disabled={importing}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                        <CheckCircle2 size={16} />
                                        <span>成功解析 <b>{parsedCatalogItems.length}</b> 条目录项</span>
                                    </div>
                                    <button 
                                        onClick={() => { setParsedCatalogItems([]); setImportErrors([]); }}
                                        className="text-xs text-green-600 hover:text-green-800 hover:underline"
                                    >
                                        重新上传
                                    </button>
                                </div>
                                
                                <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg custom-scrollbar">
                                    <table className="w-full text-xs text-left min-w-[1200px]">
                                        <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 border-b border-gray-200 z-10">
                                            <tr>
                                                <th className="p-2 w-10 text-center bg-gray-50">#</th>
                                                <th className="p-2 w-[150px] bg-gray-50">一级类别</th>
                                                <th className="p-2 w-[150px] bg-gray-50">二级类别</th>
                                                {dataDepth.hasL3 && <th className="p-2 w-[150px] bg-gray-50">三级类别</th>}
                                                {dataDepth.hasL4 && <th className="p-2 w-[150px] bg-gray-50">四级类别</th>}
                                                {dataDepth.hasL5 && <th className="p-2 w-[150px] bg-gray-50">五级类别</th>}
                                                <th className="p-2 w-[200px] bg-gray-50">名称</th>
                                                <th className="p-2 min-w-[200px] bg-gray-50">条件预览</th>
                                                <th className="p-2 w-[150px] bg-gray-50">备注</th>
                                                <th className="p-2 w-10 text-center bg-gray-50"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parsedCatalogItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.l1 || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'l1', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.l2 || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'l2', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>
                                                    {dataDepth.hasL3 && <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.l3 || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'l3', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>}
                                                    {dataDepth.hasL4 && <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.l4 || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'l4', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>}
                                                    {dataDepth.hasL5 && <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.l5 || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'l5', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>}
                                                    <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.name} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'name', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 font-medium text-gray-800 outline-none focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-gray-500 truncate max-w-xs">{item.conditions.join('; ')}</td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.remarks || ''} 
                                                            onChange={(e) => handleUpdateCatalogItem(idx, 'remarks', e.target.value)}
                                                            className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteCatalogItem(idx)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Error Feedback */}
                        {importErrors.length > 0 && (
                            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-4 animate-fade-in">
                                <h5 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} />
                                    解析存在问题 (请修正Excel后重新上传)
                                </h5>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-red-600 max-h-32 overflow-y-auto">
                                    {importErrors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                    <button 
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleConfirmImport}
                        disabled={parsedCatalogItems.length === 0 || importErrors.length > 0}
                        className={`px-6 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors
                            ${(parsedCatalogItems.length === 0 || importErrors.length > 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700'}`}
                    >
                        <Save size={16} />
                        确认导入
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- Single Add/Edit Modal --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${editingCatalogItems.length > 0 ? 'max-w-6xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto flex flex-col`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl shrink-0">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {editingCatalogItems.length > 0 ? <FileEdit size={24} className="text-primary-600" /> : null}
                        {editingId ? '编辑规则' : '录入新规则'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Top: Metadata Form */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">规则名称</label>
                            <input 
                                type="text" 
                                value={newRuleName}
                                onChange={(e) => setNewRuleName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                placeholder="例如：绿色金融支持项目目录（2025版）"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">规则类型</label>
                             <select 
                                value={detectedType}
                                onChange={(e) => setDetectedType(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white"
                             >
                                 <option value="">请选择</option>
                                 {Object.values(MethodologyType)
                                    .filter(t => t !== MethodologyType.RATING_MODEL)
                                    .map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                        </div>
                    </div>

                    {/* Content Logic */}
                    {editingCatalogItems.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">规则明细 (可直接编辑)</label>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">共 {editingCatalogItems.length} 条</span>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg custom-scrollbar">
                                <table className="w-full text-xs text-left min-w-[1000px]">
                                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 border-b border-gray-200 z-10">
                                        <tr>
                                            <th className="p-2 w-10 text-center bg-gray-50">#</th>
                                            <th className="p-2 w-[120px] bg-gray-50">一级类别</th>
                                            <th className="p-2 w-[120px] bg-gray-50">二级类别</th>
                                            {editingDataDepth.hasL3 && <th className="p-2 w-[120px] bg-gray-50">三级类别</th>}
                                            {editingDataDepth.hasL4 && <th className="p-2 w-[120px] bg-gray-50">四级类别</th>}
                                            <th className="p-2 w-[180px] bg-gray-50">名称</th>
                                            <th className="p-2 bg-gray-50">条件 / 标准</th>
                                            <th className="p-2 w-[120px] bg-gray-50">备注</th>
                                            <th className="p-2 w-10 text-center bg-gray-50"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {editingCatalogItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                <td className="p-2">
                                                    <input type="text" value={item.l1 || ''} onChange={(e) => handleUpdateEditingItem(idx, 'l1', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white" />
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={item.l2 || ''} onChange={(e) => handleUpdateEditingItem(idx, 'l2', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white" />
                                                </td>
                                                {editingDataDepth.hasL3 && <td className="p-2">
                                                    <input type="text" value={item.l3 || ''} onChange={(e) => handleUpdateEditingItem(idx, 'l3', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white" />
                                                </td>}
                                                {editingDataDepth.hasL4 && <td className="p-2">
                                                    <input type="text" value={item.l4 || ''} onChange={(e) => handleUpdateEditingItem(idx, 'l4', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white" />
                                                </td>}
                                                <td className="p-2">
                                                    <input type="text" value={item.name} onChange={(e) => handleUpdateEditingItem(idx, 'name', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 font-medium text-gray-800 outline-none focus:bg-white" />
                                                </td>
                                                <td className="p-2 text-gray-500 truncate max-w-xs">{item.conditions.join('; ')}</td>
                                                <td className="p-2">
                                                    <input type="text" value={item.remarks || ''} onChange={(e) => handleUpdateEditingItem(idx, 'remarks', e.target.value)} className="w-full bg-transparent border-transparent hover:border-gray-200 focus:border-primary-500 rounded px-1 py-0.5 text-gray-600 outline-none focus:bg-white" />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleDeleteEditingItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">规则文件 (文本/Markdown)</label>
                            {!ruleFileName ? (
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-gray-50 mb-4 relative group cursor-pointer
                                        ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-white'}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleRuleDrop}
                                    onClick={() => ruleFileInputRef.current?.click()}
                                >
                                    <div className="flex flex-col items-center justify-center pointer-events-none">
                                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">点击或拖拽上传规则文档</p>
                                        <p className="text-xs text-gray-400 mt-1">支持 .txt, .md, .json 及各类文档格式</p>
                                    </div>
                                    <input 
                                        ref={ruleFileInputRef} 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleRuleFileChange} 
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-blue-600" size={20} />
                                        <span className="text-sm font-medium text-blue-900">{ruleFileName}</span>
                                    </div>
                                    <button onClick={handleRemoveRuleFile} className="text-blue-400 hover:text-red-500 p-1 hover:bg-blue-100 rounded">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50 rounded-b-2xl">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                    <button onClick={handleSaveSingle} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm">
                        {editingId ? '保存更改' : '确认录入'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
