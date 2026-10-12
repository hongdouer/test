

import React, { useState, useMemo, useEffect } from 'react';
import { Play, FileText, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Sparkles, Layers, Building2, ChevronRight, Clock, Trash2, ArrowLeft, Filter, FileWarning, Upload, HelpCircle, Check, X, BadgeCheck, Briefcase, Banknote, Users, ScanEye, FileCheck, Search, FileSearch, ArrowUpRight } from 'lucide-react';
import { MatchingTask, GreenStatus, UserRole, ApplicationStage, MethodologyType } from '../types';
import { MOCK_ENTERPRISES, MOCK_METHODOLOGIES, MOCK_LOANS } from '../constants';
import { runGreenMatching } from '../services/geminiService';
import { useLocation, useNavigate } from 'react-router-dom';

// Pre-fabricated mock tasks for demonstration (linked to loans now)
const MOCK_TASKS: MatchingTask[] = [
  {
    id: 'task_mock_01',
    loanId: 'loan_001',
    enterpriseId: 'ent_001',
    methodologyIds: ['m1'],
    status: 'completed',
    createdAt: '2024-05-25T10:30:00.000Z',
    result: {
      status: GreenStatus.GREEN,
      confidence: 98,
      summary: '[岗位: 客户经理 @ 阶段: 准入阶段] 经系统分析，该项目资金用于“采购光伏组件、逆变器及支架，支付安装工程款”，主要投向为分布式光伏发电建设。依据《绿色金融支持项目目录（2025年版）》，项目精准匹配“4.2.2 太阳能利用设施建设和运营”类别。企业提供了完整的贸易背景材料，符合绿色信贷认定标准。',
      details: [
        {
          ruleName: '绿色金融支持项目目录（2025年版）',
          isMatched: true,
          matchedItems: [
            {
              code: '4.2.2',
              category: '4. 能源绿色低碳转型 > 4.2 清洁能源设施建设和运营 > 4.2.2 太阳能利用设施建设和运营',
              name: '太阳能发电',
              conditions: ['太阳能光伏发电和光热发电设施运营。'],
              standard: '太阳能光伏发电和光热发电设施运营。',
              evidence: '依据《光伏组件采购合同》中的组件规格及《借款意向书》中的项目描述判定。'
            }
          ],
          nearMatches: [
             {
                 code: '4.3.1',
                 category: '4. 能源绿色低碳转型 > 4.3 能源系统安全高效运行',
                 name: '电力源网荷储一体化',
                 gap: '项目中未提及储能设施建设内容。如项目包含储能模块（电池柜等），请补充《储能系统设计图纸》或相关采购清单，可同时匹配此高价值目录。'
             }
          ],
          reason: '资金用途明确指向光伏电站建设与运营，属于清洁能源产业重点支持领域。',
          conditions: [
            { requirement: '太阳能光伏发电和光热发电设施运营', status: 'pass', detail: '项目为50MW分布式光伏电站建设，完全符合定义。' }
          ],
          missingDocs: []
        }
      ],
      suggestions: ['建议纳入绿色信贷统计', '可申请碳减排支持工具贴息'],
      generatedAt: '2024-05-25T10:30:05.000Z'
    }
  },
  {
    id: 'task_mock_02',
    loanId: 'loan_002',
    enterpriseId: 'ent_002',
    methodologyIds: ['m1'],
    status: 'completed',
    createdAt: '2024-07-10T15:00:00.000Z',
    result: {
      status: GreenStatus.GREEN,
      confidence: 92,
      summary: '[岗位: 风险经理 @ 阶段: 贷前阶段] 该笔贷款用于“购置自动化拆解设备、黑粉提取装置及废水处理系统”，属于资源循环利用产业。依据目录匹配至“3.1.5 废旧物资循环利用装备制造”。项目已取得《危险废物经营许可证》，但在“能效对标”方面需进一步确认新购设备是否达到一级能效标准，整体符合绿色方向。',
      details: [
        {
          ruleName: '绿色金融支持项目目录（2025年版）',
          isMatched: true,
          matchedItems: [
            {
              code: '3.1.5',
              category: '3. 资源循环利用产业 > 3.1 资源循环利用装备制造 > 3.1.5 废旧物资循环利用装备制造',
              name: '环境保护专用设备制造',
              conditions: ['废弃电器电子、报废汽车、废电池、废塑料等拆解、分拣、回收处理设备。'],
              standard: '废弃电器电子、报废汽车、废电池、废塑料等拆解、分拣、回收处理设备。',
              evidence: '依据《设备采购清单》中的“锂电池自动化拆解线”及《技改项目可行性报告》判定。'
            }
          ],
          nearMatches: [
              {
                  code: '3.1.1',
                  category: '3. 资源循环利用产业 > 3.1 资源循环利用装备制造',
                  name: '矿产资源综合利用装备制造',
                  gap: '如果黑粉提取工艺涉及稀有金属提炼，可能符合此项。需补充《提炼工艺说明书》以确认是否包含伴生矿或尾矿综合利用环节。'
              }
          ],
          reason: '资金用于购置废旧锂电池拆解及回收设备，符合资源循环利用装备制造定义。',
          conditions: [
            { requirement: '废弃电器电子、报废汽车、废电池、废塑料等拆解、分拣、回收处理设备', status: 'pass', detail: '采购清单包含自动化拆解设备与黑粉提取装置，用途一致。' }
          ],
          missingDocs: ['新购设备能效检测报告']
        }
      ],
      suggestions: ['关注设备能效指标落实情况', '收集技改后的节能减排数据'],
      generatedAt: '2024-07-10T15:00:10.000Z'
    }
  }
];

export const MatchingPage: React.FC = () => {
  // ... (State and Helper Logic remains unchanged)
  // Multi-select State
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]); // Changed to Loans
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  
  // Context State (New: Role & Stage)
  const [contextRole, setContextRole] = useState<UserRole | ''>('');
  const [contextStage, setContextStage] = useState<ApplicationStage | ''>('');

  // Search States
  const [loanSearchTerm, setLoanSearchTerm] = useState('');
  const [methodologySearchTerm, setMethodologySearchTerm] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Task/Report State - Initialize with mock data
  const [tasks, setTasks] = useState<MatchingTask[]>(MOCK_TASKS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // --- Helpers ---
  const getEntName = (id: string) => MOCK_ENTERPRISES.find(e => e.id === id)?.name || '未知企业';
  const getLoanInfo = (id: string) => MOCK_LOANS.find(l => l.id === id);

  // --- Dynamic Effects & Filtering ---

  // Filter out Rating Models for Identification Page
  const identificationMethodologies = useMemo(() => 
    MOCK_METHODOLOGIES.filter(m => m.type !== MethodologyType.RATING_MODEL), 
  []);

  // 2. Compute available Roles based on selected Methodologies
  const availableRoles = useMemo(() => {
      // If no methodology is selected, show all roles (or default set)
      if (selectedMethodIds.length === 0) {
          return Object.values(UserRole);
      }

      // Collect all unique roles from selected methodologies
      const roles = new Set<UserRole>();
      identificationMethodologies
          .filter(m => selectedMethodIds.includes(m.id))
          .forEach(m => {
              m.roles.forEach(r => roles.add(r));
          });
      
      return Array.from(roles);
  }, [selectedMethodIds, identificationMethodologies]);

  // 3. Sort Methodologies based on Context (Prioritize matches)
  const sortedMethodologies = useMemo(() => {
      // If no context is set, return original order
      if (!contextRole && !contextStage) return identificationMethodologies;

      return [...identificationMethodologies].sort((a, b) => {
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
  }, [contextRole, contextStage, identificationMethodologies]);

  // 4. Search Filters
  const filteredLoans = useMemo(() => {
      return MOCK_LOANS.filter(loan => {
          if (!loanSearchTerm) return true;
          const term = loanSearchTerm.toLowerCase();
          const entName = getEntName(loan.enterpriseId).toLowerCase();
          return (
              (loan.projectName && loan.projectName.toLowerCase().includes(term)) ||
              (loan.contractNo && loan.contractNo.toLowerCase().includes(term)) ||
              entName.includes(term)
          );
      });
  }, [loanSearchTerm]);

  const filteredMethodologies = useMemo(() => {
      return sortedMethodologies.filter(m => {
          if (!methodologySearchTerm) return true;
          return m.name.toLowerCase().includes(methodologySearchTerm.toLowerCase());
      });
  }, [sortedMethodologies, methodologySearchTerm]);

  const filteredTasks = useMemo(() => {
      return tasks.filter(task => {
          if (!reportSearchTerm) return true;
          const term = reportSearchTerm.toLowerCase();
          const loan = getLoanInfo(task.loanId);
          const entName = getEntName(task.enterpriseId).toLowerCase();
          const status = task.result?.status || '';
          
          return (
              (loan?.projectName && loan.projectName.toLowerCase().includes(term)) ||
              (loan?.contractNo && loan.contractNo.toLowerCase().includes(term)) || // Added contract number search
              entName.includes(term) ||
              status.includes(term)
          );
      });
  }, [tasks, reportSearchTerm]);


  // Helper to update task status/result
  const updateTask = (id: string, updates: Partial<MatchingTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Check for auto-run state from navigation
  React.useEffect(() => {
    if (location.state && location.state.initiateMatch) {
        const { loanIds, methodologyIds, contextRole: incomingRole, contextStage: incomingStage } = location.state;
        
        // Update selection UI to reflect what's running
        if (loanIds && Array.isArray(loanIds)) setSelectedLoanIds(loanIds);
        if (methodologyIds) setSelectedMethodIds(methodologyIds);
        
        // Set context if passed from QuickMatchModal
        if (incomingRole) setContextRole(incomingRole);
        if (incomingStage) setContextStage(incomingStage);

        // Initiate tasks immediately if valid
        if (loanIds && loanIds.length > 0 && methodologyIds && methodologyIds.length > 0) {
            
            const newTasks: MatchingTask[] = [];
            
            // Create a task for EACH loan
            loanIds.forEach((lId: string) => {
                 const loan = MOCK_LOANS.find(l => l.id === lId);
                 if (loan) {
                    newTasks.push({
                        id: `task_auto_${Date.now()}_${lId}`,
                        loanId: lId,
                        enterpriseId: loan.enterpriseId,
                        methodologyIds: methodologyIds,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    });
                 }
            });
            
            setTasks(prev => [...newTasks, ...prev]);
            setIsProcessing(true);
            
            // Trigger processing asynchronously for all tasks
            const processTasks = async () => {
                 for (const task of newTasks) {
                     updateTask(task.id, { status: 'processing' });
                     try {
                        const loan = MOCK_LOANS.find(l => l.id === task.loanId);
                        const ent = MOCK_ENTERPRISES.find(e => e.id === task.enterpriseId);
                        const methods = MOCK_METHODOLOGIES.filter(m => methodologyIds.includes(m.id));
                        
                        if (loan && ent && methods.length > 0) {
                          // Pass incoming context to the matching service
                          const result = await runGreenMatching(
                              loan, 
                              ent, 
                              methods,
                              {
                                  role: incomingRole || undefined,
                                  stage: incomingStage || undefined
                              }
                          );
                          updateTask(task.id, { status: 'completed', result });
                        } else {
                          updateTask(task.id, { status: 'failed' });
                        }
                     } catch (error) {
                        console.error(error);
                        updateTask(task.id, { status: 'failed' });
                     }
                 }
                 setIsProcessing(false);
                 // Auto select the first new task
                 if (newTasks.length > 0) setActiveTaskId(newTasks[0].id);
            };
            
            processTasks();
            
            // Clear navigation state to prevent re-running on simple re-renders
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location.state, navigate]);

  // Helper to toggle selection
  const toggleSelection = (id: string, currentList: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentList.includes(id)) {
      setList(currentList.filter(item => item !== id));
    } else {
      setList([...currentList, id]);
    }
  };

  const handleBatchRun = async () => {
    if (selectedLoanIds.length === 0 || selectedMethodIds.length === 0) return;
    
    setIsProcessing(true);

    // 1. Generate Task Queue
    const newTasks: MatchingTask[] = [];
    
    selectedLoanIds.forEach(lId => {
      const loan = MOCK_LOANS.find(l => l.id === lId);
      if (loan) {
          newTasks.push({
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            loanId: lId,
            enterpriseId: loan.enterpriseId,
            methodologyIds: selectedMethodIds,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
      }
    });

    // Add new tasks to the TOP of the list
    setTasks(prev => [...newTasks, ...prev]);

    // 2. Process Tasks Sequentially
    for (const task of newTasks) {
      updateTask(task.id, { status: 'processing' });
      
      try {
        const loan = MOCK_LOANS.find(l => l.id === task.loanId);
        const ent = MOCK_ENTERPRISES.find(e => e.id === task.enterpriseId);
        const methods = MOCK_METHODOLOGIES.filter(m => task.methodologyIds.includes(m.id));
        
        if (loan && ent && methods.length > 0) {
          // Pass the selected context here
          const result = await runGreenMatching(
              loan, 
              ent, 
              methods, 
              { 
                  role: contextRole || undefined, 
                  stage: contextStage || undefined 
              }
          );
          updateTask(task.id, { status: 'completed', result });
        } else {
          updateTask(task.id, { status: 'failed' });
        }
      } catch (error) {
        console.error(error);
        updateTask(task.id, { status: 'failed' });
      }
    }

    setIsProcessing(false);
  };

  const handleDeleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  // --- Render Views ---

  const renderDetailView = () => {
    const task = tasks.find(t => t.id === activeTaskId);
    const result = task?.result;
    const loan = getLoanInfo(task?.loanId || '');

    if (!task || !result || !loan) return null;

    const matchedRules = result.details?.filter(d => d.isMatched) || [];
    const unmatchedRules = result.details?.filter(d => !d.isMatched) || [];

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in h-full flex flex-col">
          {/* Detail Header */}
          <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10">
              <button 
                onClick={() => setActiveTaskId(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                  <ArrowLeft size={16} /> 返回列表
              </button>
              <div className="flex gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">生成时间: {new Date(task.createdAt).toLocaleTimeString()}</span>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Summary Banner */}
            <div className="bg-gray-900 text-white p-8 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-primary-200 text-sm mb-2 font-medium">
                            <FileText size={14} /> 贷款编号：{loan.contractNo}
                        </div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            {result.status === GreenStatus.GREEN && <CheckCircle2 className="text-green-400" size={32} />}
                            {result.status === GreenStatus.DOUBTFUL && <AlertTriangle className="text-yellow-400" size={32} />}
                            {result.status === GreenStatus.NON_GREEN && <XCircle className="text-red-400" size={32} />}
                            综合认定：{result.status}
                        </h2>
                        <p className="opacity-80 text-sm flex items-center gap-2">
                             <Building2 size={14} /> {getEntName(task.enterpriseId)}
                             <span className="mx-1">|</span>
                             <Briefcase size={14} /> 项目：{loan.projectName || '未命名项目'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                            {result.confidence}%
                        </div>
                        <div className="text-xs uppercase tracking-widest opacity-60 mt-1">AI 置信度</div>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
            </div>

            <div className="p-8 space-y-8">
                
                {/* Use of Funds Highlight */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                    <h5 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Sparkles size={14} /> 核心判定依据：资金用途
                    </h5>
                    <p className="text-blue-900 font-medium text-lg leading-relaxed">
                        “{loan.useOfFunds}”
                    </p>
                </div>

                {/* Overall Summary */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">综合分析摘要</h4>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-primary-500 whitespace-pre-line">
                        {result.summary}
                    </p>
                </div>

                {/* All Rules Section (Combined) */}
                {[...matchedRules, ...unmatchedRules].map((rule, idx) => (
                    <div key={idx} className={`border rounded-lg p-6 shadow-sm ${rule.isMatched ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                            <div>
                                <h5 className="font-bold text-gray-800 text-lg">{rule.ruleName}</h5>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                rule.isMatched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {rule.isMatched ? '规则匹配' : '规则未匹配'}
                            </span>
                        </div>

                        {/* Matched Catalog Items - Optimized UI */}
                        {rule.matchedItems && rule.matchedItems.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <BadgeCheck size={14} className="text-primary-600"/> 
                                    命中目录项清单
                                    <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full text-[10px] min-w-[20px] text-center">{rule.matchedItems.length}</span>
                                </h6>
                                
                                <div className="grid gap-3">
                                    {rule.matchedItems.map((item, i) => {
                                        // Parse category path safely
                                        const pathSegments = item.category ? item.category.split('>').map(s => s.trim()) : [];
                                        
                                        return (
                                            <div key={i} className="group relative bg-white border border-green-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-green-200 overflow-hidden">
                                                {/* Decorative background accent */}
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

                                                <div className="relative z-10">
                                                    {/* Header: Code + Name */}
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <span className="inline-flex items-center justify-center bg-green-100 text-green-700 text-xs font-mono font-bold px-2 py-1 rounded-md border border-green-200 shadow-sm min-w-[60px]">
                                                                {item.code || '#'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h4>
                                                        </div>
                                                    </div>

                                                    {/* Hierarchy / Breadcrumbs */}
                                                    {pathSegments.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                            <Layers size={12} className="text-gray-400 mr-1 flex-shrink-0" />
                                                            {pathSegments.map((seg, idx) => (
                                                                <React.Fragment key={idx}>
                                                                    {idx > 0 && <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />}
                                                                    <span className={`${idx === pathSegments.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                                        {seg}
                                                                    </span>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Standards / Conditions Block */}
                                                    {item.standard && (
                                                        <div className="bg-green-50/50 rounded-lg p-3 border border-green-100 mb-3">
                                                            <div className="flex items-start gap-2">
                                                                <FileCheck size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                                                                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                                                    <span className="font-semibold text-green-800 block mb-1">认定标准与技术要求</span>
                                                                    {item.standard}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Evidence Block - NEW */}
                                                    {item.evidence && (
                                                        <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50/50 p-2 rounded border border-blue-100">
                                                            <FileSearch size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="font-bold text-blue-800 mr-1">判定依据:</span>
                                                                {item.evidence}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : rule.category && (
                            /* Fallback for legacy single category string */
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
                                <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <BadgeCheck size={14} /> 命中目录项 (简略)
                                </div>
                                <div className="text-lg font-bold text-green-900">
                                    {rule.category}
                                </div>
                                <div className="text-sm text-green-700 mt-1 opacity-80">
                                    {rule.reason}
                                </div>
                            </div>
                        )}

                        {/* Near Matches / Close Calls - NEW SECTION */}
                        {rule.nearMatches && rule.nearMatches.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <h6 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={14} /> 
                                    接近但不符合的目录 (建议争取)
                                </h6>
                                <div className="grid gap-3">
                                    {rule.nearMatches.map((item, i) => (
                                        <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                            <div className="flex items-start gap-3 mb-2 relative z-10">
                                                <span className="inline-flex items-center justify-center bg-white text-amber-600 text-xs font-mono font-bold px-2 py-1 rounded border border-amber-200 shadow-sm min-w-[60px]">
                                                    {item.code}
                                                </span>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                                                    <div className="text-xs text-gray-500 mt-0.5">{item.category}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Gap Analysis */}
                                            <div className="mt-3 text-xs bg-white/60 p-3 rounded border border-amber-100 text-amber-800 relative z-10">
                                                <div className="font-bold flex items-center gap-1.5 mb-1">
                                                    <ArrowUpRight size={14} /> 缺口分析与补充建议
                                                </div>
                                                {item.gap}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Granular Conditions Table */}
                        <div className="space-y-3 mb-6">
                            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider">准入条件细项核查</h6>
                            
                            {rule.conditions && rule.conditions.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-24">状态</th>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-1/3">认定标准 / 目录要求</th>
                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">分析详情</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {rule.conditions.map((cond, cIdx) => (
                                                <tr key={cIdx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            {cond.status === 'pass' && (
                                                                <>
                                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                                    <span className="text-green-700 font-medium text-xs">符合</span>
                                                                </>
                                                            )}
                                                            {cond.status === 'fail' && (
                                                                <>
                                                                    <XCircle size={16} className="text-red-500" />
                                                                    <span className="text-red-700 font-medium text-xs">不符</span>
                                                                </>
                                                            )}
                                                            {cond.status === 'unknown' && (
                                                                <>
                                                                    <HelpCircle size={16} className="text-orange-400" />
                                                                    <span className="text-orange-700 font-medium text-xs">存疑</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-800 font-medium align-top">
                                                        {cond.requirement}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 align-top">
                                                        {cond.detail}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">暂无细项数据。</p>
                            )}
                        </div>

                        {/* Missing Docs */}
                        {rule.missingDocs && rule.missingDocs.length > 0 && (
                            <div className="mt-4 bg-orange-50 border border-orange-100 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-orange-800 text-sm font-bold mb-3">
                                    <FileWarning size={16} /> 需补充佐证材料
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {rule.missingDocs.map((doc, docIdx) => (
                                        <span key={docIdx} className="inline-flex items-center gap-1.5 bg-white border border-orange-200 text-orange-700 text-sm px-3 py-1.5 rounded-md shadow-sm">
                                            <Upload size={12} /> {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Overall Suggestions */}
                <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">综合操作建议</h4>
                    <div className="grid gap-3">
                        {result.suggestions.map((s, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="bg-primary-100 text-primary-600 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                                <span className="text-sm text-gray-800 font-medium">{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
      </div>
    );
  };

  return (
    // ... (Outer Render Logic remains mostly the same, ensuring imports are covered)
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-4 flex justify-between items-center">
           <div>
               <h2 className="text-2xl font-bold text-gray-800">智能匹配引擎</h2>
               <p className="text-gray-500 mt-1 text-sm">以贷款资金用途为核心，结合企业信息与多套规则进行批量交叉验证</p>
           </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Panel ... (Unchanged) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
            {/* ... Left Panel Content ... */}
            {/* Context Configuration (Compact Role & Stage) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                        <ScanEye size={16} className="text-primary-600" />
                        分析视角配置
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <Clock size={10} /> 业务阶段
                        </label>
                        <select 
                            value={contextStage}
                            onChange={(e) => setContextStage(e.target.value as ApplicationStage)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                        >
                            <option value="">(自动) 全流程</option>
                            {Object.values(ApplicationStage).map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <Users size={10} /> 操作岗位
                        </label>
                        <select 
                            value={contextRole}
                            onChange={(e) => setContextRole(e.target.value as UserRole)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                        >
                            <option value="">(自动) 通用视角</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Loan Selector */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Banknote size={18} className="text-primary-600" />
                        选择贷款信息
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{selectedLoanIds.length} 已选</span>
                </div>
                {/* Loan Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="搜索项目、贷款编号或企业..." 
                        value={loanSearchTerm}
                        onChange={(e) => setLoanSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-gray-50/50"
                    />
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {filteredLoans.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                            {loanSearchTerm ? '无匹配贷款' : '暂无贷款数据，请先录入'}
                        </div>
                    ) : (
                        filteredLoans.map(loan => (
                            <div 
                                key={loan.id}
                                onClick={() => toggleSelection(loan.id, selectedLoanIds, setSelectedLoanIds)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                                    selectedLoanIds.includes(loan.id) 
                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                    selectedLoanIds.includes(loan.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'
                                }`}>
                                    {selectedLoanIds.includes(loan.id) && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Main: Project Name */}
                                    <div className="font-medium text-gray-800 text-sm truncate" title={loan.projectName}>
                                        {loan.projectName || '未命名项目'}
                                    </div>
                                    {/* Enterprise Name */}
                                    <div className="text-xs text-indigo-600 truncate mt-0.5 flex items-center gap-1">
                                        <Building2 size={10} />
                                        {getEntName(loan.enterpriseId)}
                                    </div>
                                    {/* Secondary: Contract No + Amount */}
                                    <div className="text-xs text-gray-400 truncate font-mono mt-0.5">
                                        {loan.contractNo} · {loan.amount.toLocaleString()}万
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Methodology Selector */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Layers size={18} className="text-primary-600" />
                        选择方法学依据
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{selectedMethodIds.length} 已选</span>
                </div>
                {/* Methodology Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="搜索规则名称..." 
                        value={methodologySearchTerm}
                        onChange={(e) => setMethodologySearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-gray-50/50"
                    />
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {filteredMethodologies.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                            无匹配规则
                        </div>
                    ) : (
                        filteredMethodologies.map(m => {
                            // Check matches
                            const isRoleMatch = contextRole && m.roles.includes(contextRole as UserRole);
                            const isStageMatch = contextStage && m.stages.includes(contextStage as ApplicationStage);
                            const isRecommended = isRoleMatch || isStageMatch;

                            return (
                                <div 
                                    key={m.id}
                                    onClick={() => toggleSelection(m.id, selectedMethodIds, setSelectedMethodIds)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-2 relative ${
                                        selectedMethodIds.includes(m.id) 
                                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Recommendation Badge */}
                                    {isRecommended && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-green-200">
                                                推荐
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                            selectedMethodIds.includes(m.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'
                                        }`}>
                                            {selectedMethodIds.includes(m.id) && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="font-medium text-gray-800 text-sm truncate" title={m.name}>{m.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{m.version} · {m.type}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Stages and Roles (Simple Tag Style like QuickMatchModal) */}
                                    <div className="flex flex-wrap gap-1 ml-7 mt-1">
                                        {m.stages.map(stage => (
                                            <span key={stage} className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                                                contextStage === stage
                                                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                                {stage}
                                            </span>
                                        ))}
                                        {m.roles.map(role => (
                                            <span key={role} className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                                                contextRole === role
                                                ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
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

            {/* Action Button */}
            <div className="sticky bottom-0 pt-2">
                <button 
                    onClick={handleBatchRun}
                    disabled={selectedLoanIds.length === 0 || selectedMethodIds.length === 0 || isProcessing}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                        ${selectedLoanIds.length === 0 || selectedMethodIds.length === 0 || isProcessing 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-primary-500/30 active:scale-[0.98]'}`}
                >
                    {isProcessing ? (
                        <>
                            <Sparkles className="animate-spin" /> 
                            正在分析 ({selectedLoanIds.length} 贷款 x {selectedMethodIds.length} 规则)...
                        </>
                    ) : (
                        <>
                            <Play fill="currentColor" /> 
                            开始综合判定 
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1 font-normal">
                                {selectedLoanIds.length} 个任务
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Right Panel: Report List or Detail View */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
            {activeTaskId ? (
                renderDetailView()
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-primary-600" />
                                分析报告列表
                            </h3>
                            {tasks.length > 0 && (
                                <div className="text-xs text-gray-500 flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> 绿色</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> 存疑</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 非绿</span>
                                </div>
                            )}
                        </div>
                        {/* Report Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="搜索项目、贷款编号或企业..." 
                                value={reportSearchTerm}
                                onChange={(e) => setReportSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {tasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles size={32} className="text-gray-300" />
                                </div>
                                <p className="text-lg font-medium text-gray-500">暂无分析报告</p>
                                <p className="text-sm mt-1">请在左侧选择贷款与规则启动综合分析</p>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p className="text-sm">未找到匹配的分析报告</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => {
                                const loan = getLoanInfo(task.loanId);
                                return (
                                    <div 
                                        key={task.id}
                                        onClick={() => task.status === 'completed' && setActiveTaskId(task.id)}
                                        className={`relative p-4 rounded-lg border transition-all group ${
                                            task.status === 'completed' 
                                                ? 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md cursor-pointer' 
                                                : 'bg-gray-50 border-gray-100 opacity-80'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                {/* Status Icon */}
                                                <div className="mt-1">
                                                    {task.status === 'pending' && <Clock size={18} className="text-gray-400 animate-pulse" />}
                                                    {task.status === 'processing' && <Sparkles size={18} className="text-primary-500 animate-spin" />}
                                                    {task.status === 'completed' && task.result?.status === GreenStatus.GREEN && <CheckCircle2 size={18} className="text-green-500" />}
                                                    {task.status === 'completed' && task.result?.status === GreenStatus.DOUBTFUL && <AlertTriangle size={18} className="text-yellow-500" />}
                                                    {task.status === 'completed' && task.result?.status === GreenStatus.NON_GREEN && <XCircle size={18} className="text-red-500" />}
                                                    {task.status === 'failed' && <AlertTriangle size={18} className="text-gray-400" />}
                                                </div>
                                                
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                        {loan ? (loan.projectName || '未命名项目') : '未知贷款'}
                                                    </div>
                                                    
                                                    {/* Contract No & Enterprise Line */}
                                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                         <span className="font-mono bg-gray-50 px-1 rounded border border-gray-100 text-[10px]">{loan?.contractNo}</span>
                                                         <span>{getEntName(task.enterpriseId)}</span>
                                                    </div>

                                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                        <span className="flex items-center gap-1">
                                                            <Layers size={12} />
                                                            {task.methodologyIds.length} 规则
                                                        </span>
                                                        <span>·</span>
                                                        <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {task.status === 'completed' && task.result && (
                                                    <div className="text-right">
                                                        <div className={`text-sm font-bold ${
                                                            task.result.status === GreenStatus.GREEN ? 'text-green-600' :
                                                            task.result.status === GreenStatus.DOUBTFUL ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {task.result.status}
                                                        </div>
                                                        <div className="text-xs text-gray-400">置信度 {task.result.confidence}%</div>
                                                    </div>
                                                )}
                                                
                                                {task.status === 'completed' && (
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Delete Button (Hover) */}
                                        <button 
                                            onClick={(e) => handleDeleteTask(e, task.id)}
                                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-gray-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};