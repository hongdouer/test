
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Banknote, Calendar, CreditCard, User, AlertCircle, FileText, PieChart, TrendingUp, CheckCircle2, Layers, Sparkles, Clock, FileCheck, Download, Plus, Upload, AlertTriangle, ChevronRight, Tag } from 'lucide-react';
import { MOCK_LOANS, MOCK_ENTERPRISES } from '../constants';
import { Loan, LoanStatus, ApplicationStage } from '../types';

export const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const loan: Loan | undefined = location.state?.loan || MOCK_LOANS.find(l => l.id === id);
  const enterprise = loan ? MOCK_ENTERPRISES.find(e => e.id === loan.enterpriseId) : undefined;

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">未找到贷款信息</p>
        <button onClick={() => navigate('/loan')} className="mt-4 text-primary-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  // Parse loan purpose
  const typeStr = typeof loan.loanType === 'string' ? loan.loanType : '';
  const parts = typeStr.split(' - ');
  const category = parts[0] || '未分类';
  const subType = parts[1] || parts[0] || '未指定';

  // Helper to determine activity styling (reused concept from EnterpriseDetail)
  const getActivityStyle = (action: string) => {
      if (action.includes('新增') || action.includes('创建')) return { bg: 'bg-green-500', border: 'border-green-200', icon: <Plus size={12} className="text-white" /> };
      if (action.includes('更新') || action.includes('修改')) return { bg: 'bg-blue-500', border: 'border-blue-200', icon: <FileText size={12} className="text-white" /> };
      if (action.includes('批量')) return { bg: 'bg-purple-500', border: 'border-purple-200', icon: <Layers size={12} className="text-white" /> };
      return { bg: 'bg-gray-400', border: 'border-gray-200', icon: <Clock size={12} className="text-white" /> };
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
            onClick={() => navigate('/loan')}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-800"
        >
            <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
             <div className="flex items-center justify-between">
                 <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {loan.projectName || '未命名项目'}
                 </h1>
             </div>
             <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center bg-blue-50 border border-blue-100 rounded px-2 py-1 text-blue-700">
                    <span className="text-xs text-blue-400 mr-2 uppercase tracking-wider font-bold">贷款编号</span>
                    <span className="font-mono font-bold text-base">{loan.contractNo}</span>
                 </div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Loan Info */}
          <div className="lg:col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-primary-600 mb-2">
                          <Banknote size={20} />
                          <span className="text-sm font-bold">期望金额</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">{loan.amount.toLocaleString()} <span className="text-sm text-gray-500 font-normal">万元</span></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <TrendingUp size={20} />
                          <span className="text-sm font-bold">期望利率</span>
                      </div>
                      {/* Unified Font Style: All bold, all gray-900 */}
                      <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
                          {loan.interestRate}% 
                          {loan.interestRateTo && loan.interestRateTo !== loan.interestRate && (
                              <span> - {loan.interestRateTo}%</span>
                          )}
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <Calendar size={20} />
                          <span className="text-sm font-bold">期望期限</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">{loan.termMonths} <span className="text-sm text-gray-500 font-normal">个月</span></div>
                  </div>
              </div>

              {/* Detailed Specs (Project & Funds Use) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Sparkles size={18} className="text-primary-600" />
                          项目与资金用途
                      </h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    
                    {/* 1. Project Name (Moved to Top) */}
                    <div>
                        <div className="text-xs text-gray-500 mb-1">项目名称</div>
                        <div className="text-lg font-bold text-gray-900">{loan.projectName || '未命名项目'}</div>
                    </div>

                    {/* 2. Funds Use Categories (Renamed title, kept structure) */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-50">
                        <div className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wide">资金用途</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-100 shadow-sm text-blue-800 text-sm font-bold">
                                <Layers size={14} className="text-blue-500"/>
                                {category}
                            </div>
                            <ChevronRight size={16} className="text-blue-300" />
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-100 shadow-sm text-blue-800 text-sm font-bold">
                                <Tag size={14} className="text-blue-500"/>
                                {subType}
                            </div>
                        </div>
                    </div>

                    {/* 3. Description (Moved to Bottom) */}
                    <div>
                        <div className="text-xs text-gray-500 mb-1">贷款用途详细描述</div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 leading-relaxed">
                            {loan.useOfFunds || '未提供详细贷款用途说明'}
                        </div>
                    </div>
                  </div>
              </div>

              {/* Documents Section (New) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <FileCheck size={18} className="text-primary-600" />
                          贷款补充文件
                      </h3>
                      {loan.documents && loan.documents.length > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                              共 {loan.documents.length} 份
                          </span>
                      )}
                  </div>
                  
                  <div className="p-6">
                      {!loan.documents || loan.documents.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                              <FileText size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-sm">暂无上传文件</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {loan.documents.map((doc, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group bg-white">
                                      <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5
                                          ${doc.type === 'PDF' ? 'bg-red-50 text-red-600' : 
                                            doc.type === 'DOC' ? 'bg-blue-50 text-blue-600' : 
                                            doc.type === 'JPG' ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-gray-100 text-gray-600'}`}>
                                          {doc.type}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="text-sm font-bold text-gray-800 truncate mb-1" title={doc.name}>{doc.name}</div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{doc.tag}</span>
                                              <span className="text-[10px] text-gray-400">{doc.uploadDate}</span>
                                          </div>
                                          {doc.summary && (
                                              <p className="text-xs text-gray-500 mt-1 truncate" title={doc.summary}>{doc.summary}</p>
                                          )}
                                      </div>
                                      <button className="text-gray-400 hover:text-primary-600 p-1.5 rounded hover:bg-gray-50 transition-colors">
                                          <Download size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Sidebar: Enterprise Info */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Building2 size={18} className="text-primary-600" />
                          借款人信息
                      </h3>
                      {enterprise && (
                        <button 
                            onClick={() => navigate(`/enterprise/${enterprise.id}`, { state: { enterprise } })}
                            className="text-xs text-primary-600 hover:underline"
                        >
                            查看画像
                        </button>
                      )}
                  </div>
                  {enterprise ? (
                      <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 font-bold">
                                  {enterprise.name.substring(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 truncate" title={enterprise.name}>{enterprise.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{enterprise.industry}</div>
                              </div>
                          </div>
                          
                          <div className="space-y-3 pt-3 border-t border-gray-100">
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">统一信用代码</span>
                                  <span className="text-gray-900 font-mono">{enterprise.creditCode}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">法定代表人</span>
                                  <span className="text-gray-900">{enterprise.legalRepresentative || '-'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">注册资本</span>
                                  <span className="text-gray-900">{enterprise.registeredCapital}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">风险评级</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      enterprise.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                      enterprise.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                      {enterprise.riskLevel === 'Low' ? '低风险' : enterprise.riskLevel === 'Medium' ? '中风险' : '高风险'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="p-6 text-center text-gray-400">
                          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                          <p>关联企业信息缺失</p>
                      </div>
                  )}
              </div>

              {/* Status Tracker -> Activity Log */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Clock size={18} className="text-primary-600" />
                          活动日志
                      </h3>
                  </div>
                  <div className="p-6 relative">
                      <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gray-100"></div>
                      <div className="space-y-6 relative">
                          {loan.activities?.map((activity, idx) => {
                              const style = getActivityStyle(activity.action);
                              return (
                                  <div key={activity.id || idx} className="flex gap-4 group">
                                      <div className="mt-1 relative z-10">
                                          <div className={`w-8 h-8 rounded-full border-2 ${style.border} ${style.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                              {style.icon}
                                          </div>
                                      </div>
                                      <div className="flex-1 pb-2">
                                          <div className="flex justify-between items-start">
                                              <p className="text-sm font-bold text-gray-800">{activity.action}</p>
                                              <span className="text-xs text-gray-400 tabular-nums">{activity.timestamp.split(' ')[0]}</span>
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1 leading-snug">{activity.description}</p>
                                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                              <User size={10} /> {activity.actor}
                                          </p>
                                      </div>
                                  </div>
                              );
                          })}
                           {!loan.activities?.length && (
                              <p className="text-sm text-gray-400 italic pl-10">暂无活动记录</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
