
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, ArrowRight, Building2, Banknote, Calendar, ChevronDown, Loader2, Sparkles, User, Hash, Clock, FileText, Layers, FileSpreadsheet, Download, Upload, Trash2, Save, Pencil, Briefcase, Minus, Maximize2, X, Paperclip, Power, TrendingUp, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Loan, Enterprise, LoanType, EnterpriseDocument, LoanActivity } from '../types';
import { MOCK_LOANS, MOCK_ENTERPRISES } from '../constants';
import { autoCompleteEnterpriseInfo } from '../services/geminiService';
import { QuickMatchModal } from '../components/QuickMatchModal';

interface BatchLoanImportRow {
    _id: string;
    enterpriseName: string;
    creditCode: string;
    useOfFunds: string;
}

interface LoanFile {
    id: string;
    file: File;
    type: string;
    description: string;
}

// Updated based on user request to focus on loan-related documents
const LOAN_FILE_TYPES = [
    '借款合同', '担保合同', '授信批复', '借款凭证', 
    '贸易背景材料', '还款计划表', '绿色认定佐证', 
    '第三方评估报告', '资金监管协议', '其他信贷资料'
];

// New 2-level Loan Purpose Options
const LOAN_PURPOSE_OPTIONS: Record<string, string[]> = {
    '清洁能源产业相关': ['开发', '建设', '运营', '配套'],
    '节能环保产业相关': ['污染治理', '资源循环', '节能改造'],
    '绿色制造产业相关': ['绿色工厂', '产线升级', '绿色产品生产'],
    '绿色建筑与绿色基建相关': ['新建', '改造', '配套设施建设'],
    '生态环境修复与保护相关': ['生态修复', '碳汇培育', '生物多样性保护'],
    '绿色交通与绿色物流相关': ['装备购置', '设施建设', '体系升级'],
    '农业农村绿色发展相关': ['绿色种养', '污染治理', '人居环境整治'],
    '传统高耗能行业绿色低碳转型相关': ['节能降碳', '工艺改造', '电气化升级'],
    '企业绿色发展配套相关': ['绿技研发', '碳管理', '绿色认证', '碳交易']
};

export const LoanPage: React.FC = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>(MOCK_LOANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // --- Quick Match State ---
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [quickMatchLoanIds, setQuickMatchLoanIds] = useState<string[]>([]);

  // --- Batch Import State ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImportMinimized, setIsImportMinimized] = useState(false); // New state for minimize
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<BatchLoanImportRow[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // --- New/Edit Loan Form State ---
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  
  // Helper state for the 1st level category of Loan Purpose
  const [loanCategory, setLoanCategory] = useState<string>('');

  const [loanFormData, setLoanFormData] = useState<Partial<Loan>>({
      currency: 'CNY',
      useOfFunds: '',
      projectName: '',
      loanType: '',
      // Numeric fields initialized as undefined to show empty inputs
  });
  
  // --- File Upload State ---
  const [loanFiles, setLoanFiles] = useState<LoanFile[]>([]);
  const [existingDocs, setExistingDocs] = useState<EnterpriseDocument[]>([]); // New state for existing docs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Enterprise Search & Auto-fill State ---
  const [entSearchTerm, setEntSearchTerm] = useState('');
  const [showEntDropdown, setShowEntDropdown] = useState(false);
  const [entSuggestions, setEntSuggestions] = useState<string[]>([]);
  const [isFetchingEntInfo, setIsFetchingEntInfo] = useState(false);
  const [enterpriseData, setEnterpriseData] = useState<Partial<Enterprise>>({});
  
  const entDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (entDropdownRef.current && !entDropdownRef.current.contains(event.target as Node)) {
        setShowEntDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEnterpriseName = (id: string) => {
      const ent = MOCK_ENTERPRISES.find(e => e.id === id);
      return ent ? ent.name : '未知企业';
  };

  const filteredLoans = loans.filter(loan => {
      const matchSearch = loan.contractNo.includes(searchTerm) ||
                          (loan.projectName && loan.projectName.includes(searchTerm)) ||
                          getEnterpriseName(loan.enterpriseId).includes(searchTerm);
      return matchSearch;
  });

  // --- Handlers for Enterprise Search ---

  const handleEntNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEntSearchTerm(val);
    setEnterpriseData(prev => ({ ...prev, name: val }));

    if (val.length >= 2) {
        const mockSuggestions = [
            val,
            `四川${val}科技有限公司`,
            `${val}（中国）投资有限公司`,
            `北京${val}发展集团`,
            `${val}新能源股份有限公司`
        ];
        setEntSuggestions(mockSuggestions);
        setShowEntDropdown(true);
    } else {
        setEntSuggestions([]);
        setShowEntDropdown(false);
    }
  };

  const handleSelectCompany = async (name: string) => {
    setEntSearchTerm(name);
    setShowEntDropdown(false);
    setIsFetchingEntInfo(true);
    
    const existingEnt = MOCK_ENTERPRISES.find(e => e.name === name);
    
    if (existingEnt) {
        setEnterpriseData(existingEnt);
        setIsFetchingEntInfo(false);
    } else {
        try {
            const info = await autoCompleteEnterpriseInfo(name);
            setEnterpriseData({
                name: name,
                ...info
            });
        } catch (error) {
            console.error("Auto-complete failed", error);
        }
        setIsFetchingEntInfo(false);
    }
  };

  // --- Date Calculation Helper ---
  const calculateEndDate = (startDate: string | undefined, months: number | undefined): string => {
    if (!startDate || !months) return '';
    try {
        const [y, m, d] = startDate.split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1 + months, d));
        if (date.getUTCDate() !== d) {
            date.setUTCDate(0);
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const months = val === '' ? undefined : Number(val);
      
      const newEndDate = calculateEndDate(loanFormData.startDate, months);
      setLoanFormData(prev => ({ ...prev, termMonths: months, endDate: newEndDate || prev.endDate }));
  };

  // --- File Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles: LoanFile[] = Array.from(e.target.files).map((file: File) => ({
              id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              file,
              type: '',
              description: ''
          }));
          setLoanFiles(prev => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeLoanFile = (id: string) => {
      setLoanFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeExistingDoc = (id: string) => {
      setExistingDocs(prev => prev.filter(doc => doc.id !== id));
  };

  const updateLoanFile = (id: string, field: 'type' | 'description', value: string) => {
      setLoanFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // --- Batch Import Logic ---

  const handleDownloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
          { "企业名称": "示例新能源公司", "统一社会信用代码": "91330106MA27W81H9G", "贷款用途描述": "建设50MW分布式光伏发电项目" }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "贷款批量导入模版");
      XLSX.writeFile(wb, "贷款信息批量导入模版.xlsx");
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const json = XLSX.utils.sheet_to_json(sheet);
              
              const mappedData: BatchLoanImportRow[] = json.map((row: any, index: number) => ({
                  _id: `row_${index}`,
                  enterpriseName: row['企业名称'] || '',
                  creditCode: row['统一社会信用代码'] || '',
                  useOfFunds: row['贷款用途描述'] || row['资金用途'] || ''
              })).filter(r => r.enterpriseName);

              setPreviewData(mappedData);
          } catch (error) {
              console.error("Error parsing Excel file:", error);
              alert("文件解析失败，请确保格式正确。");
          } finally {
              setImporting(false);
          }
      };
      reader.readAsArrayBuffer(file);
      if (batchInputRef.current) batchInputRef.current.value = '';
  };

  const handleUpdatePreview = (id: string, field: keyof BatchLoanImportRow, value: string) => {
      setPreviewData(prev => prev.map(row => 
          row._id === id ? { ...row, [field]: value } : row
      ));
  };

  const handleDeletePreview = (id: string) => {
      setPreviewData(prev => prev.filter(row => row._id !== id));
  };

  const handleCloseImport = () => {
      setShowImportModal(false);
      setIsImportMinimized(false);
      setPreviewData([]);
      setSyncProgress(0);
      setImporting(false);
  };

  const handleConfirmBatchImport = async () => {
      setImporting(true);
      setSyncProgress(0);
      
      const newLoans: Loan[] = [];
      const total = previewData.length;

      for (let i = 0; i < total; i++) {
          const row = previewData[i];
          let entId = '';

          const existingEnt = MOCK_ENTERPRISES.find(e => e.name === row.enterpriseName);
          
          if (existingEnt) {
              entId = existingEnt.id;
          } else {
              entId = `e_batch_${Date.now()}_${i}`;
              let enrichedInfo: Partial<Enterprise> = {};
              try {
                  enrichedInfo = await autoCompleteEnterpriseInfo(row.enterpriseName);
              } catch (e) {
                  console.error(`Failed to sync info for ${row.enterpriseName}`);
              }

              const newEnt: Enterprise = {
                  id: entId,
                  name: row.enterpriseName,
                  creditCode: row.creditCode || enrichedInfo.creditCode || '待补全',
                  industry: enrichedInfo.industry || '待自动识别',
                  registeredCapital: enrichedInfo.registeredCapital || '待补全',
                  businessScope: enrichedInfo.businessScope || '待补全',
                  fundsUse: row.useOfFunds,
                  legalRepresentative: enrichedInfo.legalRepresentative,
                  foundingDate: enrichedInfo.foundingDate,
                  registrationStatus: enrichedInfo.registrationStatus,
                  address: enrichedInfo.address,
                  region: enrichedInfo.region,
                  riskLevel: 'Low',
                  documents: [],
                  activities: [
                      { 
                          id: `act_${Date.now()}_${i}`, 
                          action: '批量导入', 
                          actor: '系统自动', 
                          timestamp: new Date().toLocaleString(), 
                          description: '贷款批量导入时自动创建企业档案并同步工商信息' 
                      }
                  ],
                  introduction: enrichedInfo.introduction || '该企业通过贷款批量导入创建。'
              };
              MOCK_ENTERPRISES.unshift(newEnt);
          }

          const newLoan: Loan = {
              id: `l_batch_${Date.now()}_${i}`,
              contractNo: `JK-BATCH-${Date.now().toString().substr(-6)}-${i}`,
              enterpriseId: entId,
              projectName: '',
              amount: 0, 
              currency: 'CNY',
              interestRate: 0,
              termMonths: 0,
              startDate: '',
              endDate: '',
              repaymentMethod: '',
              useOfFunds: row.useOfFunds,
              guarantor: '',
              manager: '当前用户',
              loanType: LoanType.OTHER,
              documents: [], // Initialize empty documents
              activities: [
                  {
                      id: `act_l_${Date.now()}_${i}`,
                      action: '批量导入',
                      actor: '系统自动',
                      timestamp: new Date().toLocaleString(),
                      description: '通过 Excel 批量导入贷款信息'
                  }
              ]
          };
          newLoans.push(newLoan);
          setSyncProgress(Math.round(((i + 1) / total) * 100));
      }

      setLoans(prev => [...newLoans, ...prev]);
      
      // Reset filters so imported items are visible
      setSearchTerm('');
      
      handleCloseImport();
  };

  // --- Save Loan Logic ---

  const handleEditLoan = (e: React.MouseEvent, loan: Loan) => {
    e.stopPropagation();
    setEditingLoanId(loan.id);
    setLoanFiles([]); // Reset new files
    setExistingDocs(loan.documents || []); // Populate existing documents
    
    // Parse Loan Purpose Category (e.g., "清洁能源 - 建设" -> Category: "清洁能源", Sub: "建设")
    // We store the full string in loanType, but need to split for UI
    let category = '';
    const fullType = typeof loan.loanType === 'string' ? loan.loanType : '';
    // Try to find if the loanType starts with any known category
    const foundCategory = Object.keys(LOAN_PURPOSE_OPTIONS).find(cat => fullType.startsWith(cat));
    if (foundCategory) {
        category = foundCategory;
    }
    setLoanCategory(category);

    // Pre-populate form
    setLoanFormData({
        contractNo: loan.contractNo,
        projectName: loan.projectName,
        amount: loan.amount,
        currency: loan.currency,
        interestRate: loan.interestRate,
        interestRateTo: loan.interestRateTo,
        termMonths: loan.termMonths,
        startDate: loan.startDate,
        endDate: loan.endDate,
        repaymentMethod: loan.repaymentMethod,
        useOfFunds: loan.useOfFunds,
        guarantor: loan.guarantor,
        loanType: fullType, // Keep full string here
    });
    
    // Set enterprise context
    const entName = getEnterpriseName(loan.enterpriseId);
    setEntSearchTerm(entName);
    setEnterpriseData(MOCK_ENTERPRISES.find(e => e.id === loan.enterpriseId) || { name: entName });

    setShowModal(true);
  };

  // Helper to determine type from file extension
  const getTypeFromExt = (filename: string): 'PDF' | 'DOC' | 'JPG' | 'OTHER' => {
      const ext = filename.split('.').pop()?.toUpperCase() || 'OTHER';
      if (['PDF'].includes(ext)) return 'PDF';
      if (['DOC', 'DOCX'].includes(ext)) return 'DOC';
      if (['JPG', 'JPEG', 'PNG'].includes(ext)) return 'JPG';
      return 'OTHER';
  };

  const handleSaveLoan = () => {
      // Validation Logic
      if (!entSearchTerm) {
          alert("【企业信息】企业名称为必填项");
          return;
      }
      
      if (!enterpriseData.creditCode && !editingLoanId) {
           alert("【企业信息】统一社会信用代码为必填项 (请等待自动获取或手动补充)");
           return;
      }

      if (!loanFormData.loanType || !loanCategory) {
          alert("【贷款信息】请完整选择贷款用途（分类及子项）");
          return;
      }

      // useOfFunds is now optional, removed validation
      
      let targetEntId = '';

      // 1. Check or Create Enterprise
      const existingEnt = MOCK_ENTERPRISES.find(e => e.name === entSearchTerm);
      if (existingEnt) {
          targetEntId = existingEnt.id;
      } else {
          // Create new Enterprise
          targetEntId = `e_new_${Date.now()}`;
          const newEnt: Enterprise = {
              id: targetEntId,
              name: entSearchTerm,
              creditCode: enterpriseData.creditCode || '待补全',
              industry: enterpriseData.industry || '未分类',
              registeredCapital: enterpriseData.registeredCapital || '0',
              businessScope: enterpriseData.businessScope || '',
              fundsUse: loanFormData.useOfFunds || enterpriseData.fundsUse || '详见贷款项目', 
              legalRepresentative: enterpriseData.legalRepresentative,
              foundingDate: enterpriseData.foundingDate,
              registrationStatus: enterpriseData.registrationStatus,
              address: enterpriseData.address,
              region: enterpriseData.region,
              documents: [],
              riskLevel: 'Low', 
              activities: [
                  { 
                      id: `a_${Date.now()}`, 
                      action: '自动入库', 
                      actor: '系统自动', 
                      timestamp: new Date().toLocaleString(), 
                      description: '新增贷款时自动关联创建企业档案' 
                  }
              ]
          };
          MOCK_ENTERPRISES.unshift(newEnt);
      }
      
      // Safe conversions for numbers, default to 0 if undefined for data model
      const finalAmount = loanFormData.amount !== undefined ? Number(loanFormData.amount) : 0;
      const finalRate = loanFormData.interestRate !== undefined ? Number(loanFormData.interestRate) : 0;
      const finalRateTo = loanFormData.interestRateTo !== undefined ? Number(loanFormData.interestRateTo) : 0;
      const finalTerm = loanFormData.termMonths !== undefined ? Number(loanFormData.termMonths) : 0;

      // Prepare documents from upload queue
      const newDocs: EnterpriseDocument[] = loanFiles.map((f, index) => ({
          id: `doc_${Date.now()}_${index}`,
          name: f.file.name,
          type: getTypeFromExt(f.file.name),
          tag: f.type || '其他信贷资料',
          summary: f.description,
          uploadDate: new Date().toISOString().split('T')[0]
      }));

      if (editingLoanId) {
          // Update existing
          setLoans(prev => prev.map(l => {
              if (l.id === editingLoanId) {
                  // Create Activity Log - UPDATED: Generic description
                  const updateActivity: LoanActivity = {
                      id: `act_upd_${Date.now()}`,
                      action: '更新信息',
                      actor: '当前用户',
                      timestamp: new Date().toLocaleString(),
                      description: '更新信贷基本信息'
                  };

                  return {
                      ...l,
                      ...loanFormData,
                      enterpriseId: targetEntId,
                      amount: finalAmount,
                      interestRate: finalRate,
                      interestRateTo: finalRateTo,
                      termMonths: finalTerm,
                      contractNo: l.contractNo, // Keep original contract no for edits
                      manager: l.manager,
                      // Merge existing documents (remaining) with new ones
                      documents: [...existingDocs, ...newDocs],
                      activities: [updateActivity, ...(l.activities || [])]
                  } as Loan;
              }
              return l;
          }));
      } else {
          // Create Loan - UPDATED: Generic description
          const createActivity: LoanActivity = {
              id: `act_new_${Date.now()}`,
              action: '新增贷款',
              actor: '当前用户',
              timestamp: new Date().toLocaleString(),
              description: '创建信贷业务档案'
          };

          const loan: Loan = {
              id: `l_${Date.now()}`,
              contractNo: loanFormData.contractNo || `JK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
              enterpriseId: targetEntId,
              projectName: loanFormData.projectName || '',
              amount: finalAmount,
              currency: loanFormData.currency || 'CNY',
              interestRate: finalRate,
              interestRateTo: finalRateTo,
              termMonths: finalTerm,
              startDate: loanFormData.startDate || '',
              endDate: loanFormData.endDate || '',
              repaymentMethod: loanFormData.repaymentMethod || '',
              useOfFunds: loanFormData.useOfFunds || '',
              guarantor: loanFormData.guarantor || '',
              manager: '当前用户',
              loanType: loanFormData.loanType || LoanType.OTHER,
              documents: newDocs,
              activities: [createActivity]
          };
          setLoans(prev => [loan, ...prev]);

          // Reset filters to ensure visibility
          setSearchTerm('');
      }

      setShowModal(false);
      resetForm();
  };

  const resetForm = () => {
      setEditingLoanId(null);
      setLoanFiles([]);
      setExistingDocs([]);
      // Pre-generate a contract number for new loans
      const newContractNo = `JK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setLoanCategory(''); // Reset category
      
      setLoanFormData({ 
          contractNo: newContractNo,
          currency: 'CNY', 
          repaymentMethod: '',
          guarantor: '',
          useOfFunds: '',
          projectName: '',
          loanType: '',
          // Implicitly undefined for numbers: amount, interestRate, interestRateTo, termMonths
      });
      setEntSearchTerm('');
      setEnterpriseData({});
  };

  // Helper to handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cat = e.target.value;
      setLoanCategory(cat);
      // Reset the sub-type when category changes
      setLoanFormData(prev => ({ ...prev, loanType: '' })); 
  };

  // Helper to handle sub-type change
  const handleSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sub = e.target.value;
      // Store full string: "Category - Sub"
      setLoanFormData(prev => ({ ...prev, loanType: `${loanCategory} - ${sub}` }));
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-4 relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">贷款信息库</h2>
           <p className="text-gray-500 mt-1">管理全行信贷产品台账，关联企业与项目信息</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => { setQuickMatchLoanIds([]); setShowQuickMatch(true); }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg flex items-center gap-2 hover:shadow-md transition-all shadow-sm"
            >
                <Play fill="currentColor" size={18} />
                <span>快速识绿</span>
            </button>
             <button 
                onClick={() => { setShowImportModal(true); setIsImportMinimized(false); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
                <FileSpreadsheet size={18} />
                <span>批量导入</span>
            </button>
            <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>新增贷款</span>
            </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
         <div className="flex gap-4 flex-1">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="搜索贷款编号、项目名称或企业..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
             </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left min-w-[1000px] border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[140px] bg-gray-50">贷款编号</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[160px] bg-gray-50">所属企业</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[160px] bg-gray-50">项目名称</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[180px] bg-gray-50">贷款用途</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[100px] bg-gray-50 text-right">期望金额</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[100px] bg-gray-50 text-right">期望利率</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-[80px] bg-gray-50 text-right">期望期限</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right whitespace-nowrap bg-gray-50">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredLoans.map((loan) => {
                        // Parse loan purpose
                        const typeStr = typeof loan.loanType === 'string' ? loan.loanType : '';
                        const parts = typeStr.split(' - ');
                        const category = parts[0] || '-';
                        const subType = parts[1] || parts[0] || '-';

                        return (
                            <tr 
                                key={loan.id} 
                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                onClick={() => navigate(`/loan/${loan.id}`, { state: { loan } })}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary-50 p-2 rounded text-primary-600 mt-0.5">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex items-center h-full mt-1.5">
                                            <div className="font-mono font-medium text-gray-800 text-sm">{loan.contractNo}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-700 font-medium truncate max-w-[12rem]" title={getEnterpriseName(loan.enterpriseId)}>
                                            {getEnterpriseName(loan.enterpriseId)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-700 font-medium truncate block max-w-[12rem]" title={loan.projectName}>
                                        {loan.projectName || '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 mb-0.5">{category}</span>
                                        <span className="text-sm font-bold text-gray-800 truncate" title={subType}>{subType}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-bold text-gray-900">{loan.amount?.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 ml-1">万</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {/* Updated: Unified bold black style for range */}
                                    <span className="text-sm font-bold text-gray-900">
                                        {loan.interestRate}%
                                        {loan.interestRateTo && loan.interestRateTo !== loan.interestRate && ` - ${loan.interestRateTo}%`}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-medium text-gray-900">{loan.termMonths}</span>
                                    <span className="text-xs text-gray-500 ml-1">月</span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setQuickMatchLoanIds([loan.id]); setShowQuickMatch(true); }}
                                            className="p-1.5 rounded-lg transition-colors text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                            title="快速识绿"
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleEditLoan(e, loan)}
                                            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                                            title="编辑"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                                            详情 <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredLoans.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    暂无贷款记录
                </div>
            )}
        </div>
      </div>

      {/* Batch Import Modal Code Removed for Brevity - It remains the same */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${previewData.length > 0 ? 'max-w-4xl max-h-[90vh]' : 'max-w-lg'} flex flex-col transition-all duration-300`}>
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet size={20} className="text-primary-500" />
                        批量导入贷款
                    </h3>
                    {previewData.length > 0 && (
                         <span className="text-sm text-gray-500">已解析 {previewData.length} 条数据</span>
                    )}
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {previewData.length === 0 ? (
                        <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-1">下载标准模版</h4>
                                    <p className="text-xs text-gray-500 mb-3">请使用 .xlsx 格式模版填写，包括企业名称、统一社会信用代码及贷款用途。</p>
                                    <button 
                                        onClick={handleDownloadTemplate}
                                        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors"
                                    >
                                        <Download size={14} /> 下载模版.xlsx
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1">上传表格文件</h4>
                                    <p className="text-xs text-gray-500 mb-3">上传填写好的 Excel 文件，系统将解析内容供您预览确认。</p>
                                    
                                    <div 
                                        onClick={() => !importing && batchInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-gray-50 cursor-pointer relative
                                            ${importing ? 'border-primary-200 opacity-60' : 'border-gray-200 hover:border-primary-400 hover:bg-white'}`}
                                    >
                                        {importing ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 size={24} className="animate-spin text-primary-600 mb-2" />
                                                <span className="text-sm font-bold text-gray-700">正在解析...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload size={24} className="text-gray-400 mb-2" />
                                                <span className="text-sm font-medium text-gray-600">点击上传 .xlsx 文件</span>
                                            </div>
                                        )}
                                        <input 
                                            ref={batchInputRef}
                                            type="file" 
                                            accept=".xlsx, .xls"
                                            className="hidden"
                                            onChange={handleBatchFileChange}
                                            disabled={importing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Preview Table
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                                <Sparkles size={14} />
                                <span>预览模式：您可以在下方直接修正数据，确认无误后点击“确认导入”。</span>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 w-10">#</th>
                                            <th className="p-3">企业名称</th>
                                            <th className="p-3">统一社会信用代码</th>
                                            <th className="p-3">贷款用途描述</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.map((row, idx) => (
                                            <tr key={row._id} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-400 text-xs">{idx + 1}</td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        value={row.enterpriseName}
                                                        onChange={(e) => handleUpdatePreview(row._id, 'enterpriseName', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        value={row.creditCode}
                                                        onChange={(e) => handleUpdatePreview(row._id, 'creditCode', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        value={row.useOfFunds}
                                                        onChange={(e) => handleUpdatePreview(row._id, 'useOfFunds', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-primary-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => handleDeletePreview(row._id)} className="text-gray-400 hover:text-red-500">
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
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
                    <button 
                        onClick={handleCloseImport}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    {previewData.length > 0 && (
                         <button 
                            onClick={handleConfirmBatchImport}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Save size={16} />
                            确认导入 ({previewData.length})
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* Add/Edit Loan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Banknote size={24} className="text-primary-600" />
                            {editingLoanId ? '编辑信贷业务' : '新增信贷业务'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">请填写关键业务信息</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                        <ChevronDown className="rotate-180" size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {/* ... (Existing Form Content) ... */}
                    {/* Section 0: Contract Identifier (Top) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">贷款编号 (系统自动生成)</label>
                            <div className="font-mono font-bold text-gray-800 text-lg">
                                {loanFormData.contractNo}
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Enterprise Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">1</span>
                            企业信息
                        </h4>
                        
                        <div className="relative" ref={entDropdownRef}>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">企业名称 (必填) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={entSearchTerm}
                                    onChange={handleEntNameChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-800"
                                    placeholder="输入企业名称，如：济宁矿业..."
                                    autoComplete="off"
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                {enterpriseData.name && !isFetchingEntInfo && (
                                    <Sparkles className="absolute right-3 top-2.5 text-yellow-400" size={18} />
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showEntDropdown && entSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {entSuggestions.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleSelectCompany(item)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none"
                                        >
                                            <div className="bg-primary-50 p-2 rounded text-primary-600">
                                                <Building2 size={16} />
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Read-only Auto-filled Fields */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                             <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Hash size={12}/> 统一社会信用代码 (必填)</label>
                                <input disabled value={enterpriseData.creditCode || ''} className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 placeholder-gray-300" placeholder="等待自动填充..." />
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><User size={12}/> 法定代表人</label>
                                <input disabled value={enterpriseData.legalRepresentative || ''} className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 placeholder-gray-300" placeholder="自动获取..." />
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Banknote size={12}/> 注册资本</label>
                                <input disabled value={enterpriseData.registeredCapital || ''} className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 placeholder-gray-300" placeholder="自动获取..." />
                             </div>
                        </div>
                    </div>

                    {/* Section 2: Project Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">2</span>
                            项目信息
                        </h4>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">所属项目名称 (企业项目) <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                placeholder="例如：二期厂房扩建项目、50MW光伏电站建设..."
                                value={loanFormData.projectName || ''}
                                onChange={e => setLoanFormData({...loanFormData, projectName: e.target.value})}
                            />
                        </div>

                        {/* File Upload Section */}
                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-500 mb-2">佐证材料上传 (选填)</label>
                            
                            {/* Existing Files Display */}
                            {existingDocs.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <label className="text-xs font-medium text-gray-500">已归档文件</label>
                                    {existingDocs.map((doc, index) => (
                                        <div key={doc.id || index} className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-1.5 rounded text-gray-500">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 truncate max-w-[200px]" title={doc.name}>{doc.name}</div>
                                                    <div className="text-xs text-gray-400">{doc.tag} · {doc.uploadDate}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeExistingDoc(doc.id)}
                                                className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                                title="移除文件"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                    <span className="text-[10px] text-gray-400">支持 .pdf, .jpg, .doc 等格式</span>
                                </div>
                            </div>

                            {/* File List */}
                            {loanFiles.length > 0 && (
                                <div className="space-y-2">
                                    {loanFiles.map((item) => (
                                        <div key={item.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100">
                                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                                                    <FileText size={14} className="text-gray-400 shrink-0" />
                                                    <span className="text-xs text-gray-700 truncate font-medium" title={item.file.name}>{item.file.name}</span>
                                                </div>
                                                <div className="col-span-3">
                                                    <select 
                                                        className="w-full text-xs border border-gray-200 rounded px-1 py-1 bg-white focus:ring-1 focus:ring-primary-500 outline-none"
                                                        value={item.type}
                                                        onChange={(e) => updateLoanFile(item.id, 'type', e.target.value)}
                                                    >
                                                        <option value="">选择类型</option>
                                                        {LOAN_FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-5">
                                                    <input 
                                                        type="text" 
                                                        placeholder="文件描述..."
                                                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500 outline-none"
                                                        value={item.description}
                                                        onChange={(e) => updateLoanFile(item.id, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeLoanFile(item.id)}
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

                    {/* Section 3: Loan Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">3</span>
                            贷款信息
                        </h4>
                        
                        {/* Loan Type (2-Level Select) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">贷款用途 (必填) <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={loanCategory}
                                    onChange={handleCategoryChange}
                                >
                                    <option value="">选择产业领域...</option>
                                    {Object.keys(LOAN_PURPOSE_OPTIONS).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                
                                <select 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                    value={loanFormData.loanType ? loanFormData.loanType.split(' - ').pop() : ''}
                                    onChange={handleSubTypeChange}
                                    disabled={!loanCategory}
                                >
                                    <option value="">选择具体投向...</option>
                                    {loanCategory && LOAN_PURPOSE_OPTIONS[loanCategory]?.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description (Moved Below) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">贷款用途描述 (选填)</label>
                            <textarea 
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 placeholder-gray-300"
                                rows={2}
                                placeholder="详细描述贷款资金的具体流向和使用计划..."
                                value={loanFormData.useOfFunds || ''}
                                onChange={e => setLoanFormData({...loanFormData, useOfFunds: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Amount & Rate */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">期望金额 (万元)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm pr-10"
                                        placeholder=""
                                        value={loanFormData.amount ?? ''}
                                        onChange={e => setLoanFormData({...loanFormData, amount: e.target.value === '' ? undefined : Number(e.target.value)})}
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-xs">{loanFormData.currency || 'CNY'}</span>
                                </div>
                            </div>
                            <div>
                                 <label className="block text-xs font-medium text-gray-500 mb-1.5">期望利率 (%)</label>
                                 <div className="flex items-center gap-2">
                                     <input 
                                        type="number" step="0.01"
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                        placeholder="Min"
                                        value={loanFormData.interestRate ?? ''}
                                        onChange={e => setLoanFormData({...loanFormData, interestRate: e.target.value === '' ? undefined : Number(e.target.value)})}
                                     />
                                     <span className="text-gray-400">-</span>
                                     <input 
                                        type="number" step="0.01"
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                        placeholder="Max"
                                        value={loanFormData.interestRateTo ?? ''}
                                        onChange={e => setLoanFormData({...loanFormData, interestRateTo: e.target.value === '' ? undefined : Number(e.target.value)})}
                                     />
                                 </div>
                            </div>
                        </div>

                        {/* Term */}
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1.5">期望期限 (月)</label>
                             <input 
                                type="number"
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                                value={loanFormData.termMonths ?? ''}
                                onChange={handleTermChange}
                             />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                    <button onClick={handleSaveLoan} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm flex items-center gap-2">
                        {editingLoanId ? <Save size={16} /> : <Plus size={16} />} 
                        {editingLoanId ? '保存修改' : '确认添加'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Quick Match Modal */}
      <QuickMatchModal 
        isOpen={showQuickMatch} 
        onClose={() => setShowQuickMatch(false)} 
        defaultLoanIds={quickMatchLoanIds}
      />
    </div>
  );
};
