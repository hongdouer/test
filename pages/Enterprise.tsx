
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Building2, MapPin, User, ChevronRight, 
  Pencil, Trash2, CheckCircle2, AlertTriangle, XCircle, Save, X, Sparkles, Loader2, Activity,
  FileText, Paperclip, Download
} from 'lucide-react';
import { MOCK_ENTERPRISES } from '../constants';
import { Enterprise, EnterpriseDocument } from '../types';
import { autoCompleteEnterpriseInfo } from '../services/geminiService';

const ENTERPRISE_DOC_TYPES = ['基础证照', '财务资料', '资质证书', '评估报告', '资产证明', '其他'];

interface NewFile {
    id: string;
    file: File;
    tag: string;
}

export const EnterprisePage: React.FC = () => {
  const navigate = useNavigate();
  const [enterprises, setEnterprises] = useState<Enterprise[]>(MOCK_ENTERPRISES);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Enterprise>>({});
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // File State
  const [existingDocs, setExistingDocs] = useState<EnterpriseDocument[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEnterprises = enterprises.filter(ent => 
    ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ent.creditCode.includes(searchTerm) ||
    (ent.legalRepresentative && ent.legalRepresentative.includes(searchTerm))
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({});
    setExistingDocs([]);
    setNewFiles([]);
    setShowModal(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, ent: Enterprise) => {
    e.stopPropagation();
    setEditingId(ent.id);
    setFormData({ ...ent });
    setExistingDocs(ent.documents || []);
    setNewFiles([]);
    setShowModal(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除该企业档案吗？')) {
      setEnterprises(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAutoFill = async () => {
    if (!formData.name) return;
    setIsAutoCompleting(true);
    try {
      const info = await autoCompleteEnterpriseInfo(formData.name);
      setFormData(prev => ({
        ...prev,
        ...info
      }));
    } catch (error) {
      console.error('Auto-complete failed', error);
    } finally {
      setIsAutoCompleting(false);
    }
  };

  // --- File Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const filesArr = Array.from(e.target.files).map((file) => ({
              id: `nf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              file,
              tag: '其他'
          }));
          setNewFiles(prev => [...prev, ...filesArr]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveNewFile = (id: string) => {
      setNewFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleRemoveExistingDoc = (id: string) => {
      setExistingDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleUpdateNewFileTag = (id: string, tag: string) => {
      setNewFiles(prev => prev.map(f => f.id === id ? { ...f, tag } : f));
  };

  const getTypeFromExt = (filename: string): 'PDF' | 'DOC' | 'JPG' | 'OTHER' => {
      const ext = filename.split('.').pop()?.toUpperCase();
      if (ext === 'PDF') return 'PDF';
      if (['DOC', 'DOCX'].includes(ext || '')) return 'DOC';
      if (['JPG', 'JPEG', 'PNG'].includes(ext || '')) return 'JPG';
      return 'OTHER';
  };

  const handleSave = () => {
    if (!formData.name || !formData.creditCode) {
      alert('请填写企业名称和统一社会信用代码');
      return;
    }

    // Process new files into EnterpriseDocument format
    const processedNewDocs: EnterpriseDocument[] = newFiles.map(nf => ({
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: nf.file.name,
        type: getTypeFromExt(nf.file.name),
        tag: nf.tag,
        uploadDate: new Date().toISOString().split('T')[0],
        summary: '新上传文件'
    }));

    const finalDocuments = [...existingDocs, ...processedNewDocs];

    if (editingId) {
      setEnterprises(prev => prev.map(e => e.id === editingId ? { 
          ...e, 
          ...formData,
          documents: finalDocuments 
      } as Enterprise : e));
    } else {
      const newEnt: Enterprise = {
        id: `ent_${Date.now()}`,
        name: formData.name,
        creditCode: formData.creditCode,
        industry: formData.industry || '',
        registeredCapital: formData.registeredCapital || '',
        businessScope: formData.businessScope || '',
        fundsUse: formData.fundsUse || '',
        riskLevel: 'Low',
        osdcStatus: '待同步',
        ...formData,
        documents: finalDocuments,
      } as Enterprise;
      setEnterprises(prev => [newEnt, ...prev]);
    }
    setShowModal(false);
  };

  return (
    <div className="p-8 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">企业信息库</h2>
           <p className="text-gray-500 mt-1">管理客户企业档案，维护工商、经营及风险信息</p>
        </div>
        <button 
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>新增企业</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="搜索企业名称、法人或信用代码..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">企业名称</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">统一社会信用代码</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">所属行业</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">法人代表</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">OSDC状态</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">风险等级</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredEnterprises.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">暂无匹配企业</td>
                        </tr>
                    ) : filteredEnterprises.map(ent => (
                        <tr 
                            key={ent.id} 
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/enterprise/${ent.id}`, { state: { enterprise: ent } })}
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 font-bold shrink-0">
                                        {ent.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{ent.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <MapPin size={10} /> {ent.region || '地区未知'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-gray-600">{ent.creditCode}</td>
                            <td className="px-6 py-4">
                                <span className="inline-block max-w-[200px] truncate text-sm text-gray-700" title={ent.industry}>{ent.industry}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                {ent.legalRepresentative || '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                                    ent.osdcStatus === '已同步' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    ent.osdcStatus === '待核验' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                }`}>
                                    <Activity size={10} />
                                    {ent.osdcStatus || '待同步'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    ent.riskLevel === 'Low' ? 'bg-green-50 text-green-700 border-green-100' :
                                    ent.riskLevel === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                    'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                    {ent.riskLevel === 'Low' && <CheckCircle2 size={12} />}
                                    {ent.riskLevel === 'Medium' && <AlertTriangle size={12} />}
                                    {ent.riskLevel === 'High' && <XCircle size={12} />}
                                    {ent.riskLevel === 'Low' ? '低风险' : ent.riskLevel === 'Medium' ? '中风险' : '高风险'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={(e) => handleOpenEdit(e, ent)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="编辑"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, ent.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <span className="text-gray-300 mx-1">|</span>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={24} className="text-primary-600" />
                        {editingId ? '编辑企业档案' : '新增企业档案'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                            基本信息
                            {editingId && <span className="text-xs text-orange-500 font-normal bg-orange-50 px-2 py-0.5 rounded border border-orange-100">工商信息不可编辑 (第三方同步)</span>}
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">企业名称 <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        disabled={!!editingId}
                                        className={`flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                        placeholder="请输入企业全称"
                                    />
                                    {!editingId && (
                                        <button 
                                            onClick={handleAutoFill}
                                            disabled={isAutoCompleting || !formData.name}
                                            className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isAutoCompleting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            AI 自动填充
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">统一社会信用代码 <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.creditCode || ''}
                                        onChange={(e) => setFormData({...formData, creditCode: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none font-mono ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">法定代表人</label>
                                    <input 
                                        type="text" 
                                        value={formData.legalRepresentative || ''}
                                        onChange={(e) => setFormData({...formData, legalRepresentative: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">注册资本</label>
                                    <input 
                                        type="text" 
                                        value={formData.registeredCapital || ''}
                                        onChange={(e) => setFormData({...formData, registeredCapital: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">成立日期</label>
                                    <input 
                                        type="date" 
                                        value={formData.foundingDate || ''}
                                        onChange={(e) => setFormData({...formData, foundingDate: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                            </div>
                            
                            {/* OSDC Status - Only in Edit Mode & Read Only */}
                            {editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">OSDC状态 (不可编辑)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={formData.osdcStatus || '待同步'}
                                            disabled
                                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        <Activity size={16} className="absolute right-3 top-2.5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">该状态由系统对接第三方工商数据平台自动同步，人工无法修改。</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Extended Info */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">经营信息</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">所属行业 (GB/T 4754)</label>
                                <input 
                                    type="text" 
                                    value={formData.industry || ''}
                                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                                    disabled={!!editingId}
                                    className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    placeholder="例如：C3825 - 光伏设备及元器件制造"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">经营范围</label>
                                <textarea 
                                    value={formData.businessScope || ''}
                                    onChange={(e) => setFormData({...formData, businessScope: e.target.value})}
                                    disabled={!!editingId}
                                    className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none h-24 ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">所属地区</label>
                                    <input 
                                        type="text" 
                                        value={formData.region || ''}
                                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">注册地址</label>
                                    <input 
                                        type="text" 
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        disabled={!!editingId}
                                        className={`w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Document Management Section */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            文件管理
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">支持编辑</span>
                        </h4>
                        
                        {/* Existing Docs */}
                        {existingDocs.length > 0 && (
                            <div className="mb-4">
                                <label className="text-xs font-medium text-gray-500 mb-2 block">已归档文件</label>
                                <div className="space-y-2">
                                    {existingDocs.map((doc) => (
                                        <div key={doc.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-2 rounded-lg group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-1.5 rounded shrink-0 ${
                                                    doc.type === 'PDF' ? 'bg-red-50 text-red-500' :
                                                    doc.type === 'DOC' ? 'bg-blue-50 text-blue-500' :
                                                    'bg-gray-200 text-gray-500'
                                                }`}>
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                                        <span className="bg-white border border-gray-200 px-1 rounded">{doc.tag}</span>
                                                        <span>{doc.uploadDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveExistingDoc(doc.id)}
                                                className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                title="移除文件"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload Area */}
                        <div 
                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 hover:border-primary-300 transition-all cursor-pointer mb-3"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                multiple
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-primary-50 p-2 rounded-full text-primary-600">
                                    <Paperclip size={16} />
                                </div>
                                <span className="text-xs text-gray-600 font-medium">点击添加文件</span>
                                <span className="text-[10px] text-gray-400">支持各类证照、报告等附件</span>
                            </div>
                        </div>

                        {/* New Files List */}
                        {newFiles.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">新添加文件</label>
                                {newFiles.map((item) => (
                                    <div key={item.id} className="flex gap-2 items-center bg-blue-50/50 p-2 rounded border border-blue-100">
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <FileText size={14} className="text-blue-400 shrink-0" />
                                            <span className="text-xs text-gray-700 truncate font-medium flex-1" title={item.file.name}>{item.file.name}</span>
                                        </div>
                                        <select 
                                            className="text-xs border border-gray-200 rounded px-1 py-1 bg-white focus:ring-1 focus:ring-primary-500 outline-none w-24"
                                            value={item.tag}
                                            onChange={(e) => handleUpdateNewFileTag(item.id, e.target.value)}
                                        >
                                            {ENTERPRISE_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <button 
                                            onClick={() => handleRemoveNewFile(item.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm flex items-center gap-2">
                        <Save size={16} /> 保存
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
