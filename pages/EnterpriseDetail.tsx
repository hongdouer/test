
import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, Clock, FileCheck, AlertCircle, Download, Briefcase, Banknote, MapPin, User, Users, Calendar, Globe, Phone, Mail, Hash, Plus, X, Upload, Trash2, AlertTriangle, CheckCircle2, Loader2, ChevronRight, Activity } from 'lucide-react';
import { MOCK_ENTERPRISES, MOCK_LOANS } from '../constants';
import { Enterprise, EnterpriseDocument } from '../types';

export const EnterpriseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize state from props or mock data
  const initialEnterprise = location.state?.enterprise || MOCK_ENTERPRISES.find(e => e.id === id);
  const [enterprise, setEnterprise] = useState<Enterprise | undefined>(initialEnterprise);

  if (!enterprise) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">未找到企业信息</p>
        <button onClick={() => navigate('/enterprise')} className="mt-4 text-primary-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  // Get associated loans
  const associatedLoans = MOCK_LOANS.filter(l => l.enterpriseId === enterprise.id);

  const InfoRow: React.FC<{ label: string; value: string | undefined; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="mt-0.5 text-gray-400">{icon}</div>
        <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className="text-sm font-medium text-gray-900 truncate" title={value || '-'}>{value || '-'}</div>
        </div>
    </div>
  );

  // Helper to determine activity styling
  const getActivityStyle = (action: string) => {
      if (action.includes('上传')) return { bg: 'bg-blue-500', border: 'border-blue-200', icon: <Upload size={12} className="text-white" /> };
      if (action.includes('预警') || action.includes('风险')) return { bg: 'bg-amber-500', border: 'border-amber-200', icon: <AlertTriangle size={12} className="text-white" /> };
      if (action.includes('录入') || action.includes('创建') || action.includes('更新')) return { bg: 'bg-green-500', border: 'border-green-200', icon: <Plus size={12} className="text-white" /> };
      return { bg: 'bg-gray-400', border: 'border-gray-200', icon: <Clock size={12} className="text-white" /> };
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header / Back */}
      <div className="flex items-center gap-4">
        <button 
            onClick={() => navigate('/enterprise')}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-800"
        >
            <ArrowLeft size={20} />
        </button>
        <div>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {enterprise.name}
                {enterprise.riskLevel === 'Low' && <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">低风险</span>}
                {enterprise.riskLevel === 'Medium' && <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">中风险</span>}
                {enterprise.riskLevel === 'High' && <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">高风险</span>}
             </h1>
             <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span className="font-mono">ID: {enterprise.id}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>最后更新: {new Date().toLocaleDateString()}</span>
             </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & Docs */}
        <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={18} className="text-primary-600" />
                        工商基本信息
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    {/* Introduction Section */}
                    {enterprise.introduction && (
                        <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-2">企业简介</h4>
                            {enterprise.introduction}
                        </div>
                    )}

                    {/* Detailed Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoRow label="统一社会信用代码" value={enterprise.creditCode} icon={<Hash size={16} />} />
                        <InfoRow label="组织机构代码" value={enterprise.organizationCode} icon={<Hash size={16} />} />
                        <InfoRow label="OSDC状态" value={enterprise.osdcStatus} icon={<Activity size={16} />} />
                        
                        <InfoRow label="法定代表人" value={enterprise.legalRepresentative} icon={<User size={16} />} />
                        <InfoRow label="登记状态" value={enterprise.registrationStatus} icon={<FileText size={16} />} />
                        <InfoRow label="成立日期" value={enterprise.foundingDate} icon={<Calendar size={16} />} />
                        
                        <InfoRow label="注册资本" value={enterprise.registeredCapital} icon={<Banknote size={16} />} />
                        <InfoRow label="人员规模" value={enterprise.staffSize} icon={<Users size={16} />} />
                        <InfoRow label="纳税人资质" value={enterprise.taxpayerType} icon={<FileCheck size={16} />} />

                        <InfoRow label="所属行业" value={enterprise.industry} icon={<Briefcase size={16} />} />
                        <InfoRow label="营业期限" value={enterprise.businessTerm} icon={<Clock size={16} />} />
                        <InfoRow label="登记机关" value={enterprise.registrationAuthority} icon={<Building2 size={16} />} />

                        <InfoRow label="注册地址" value={enterprise.address} icon={<MapPin size={16} />} />
                        <InfoRow label="所属地区" value={enterprise.region} icon={<MapPin size={16} />} />
                        <div className="hidden md:block"></div>

                        <InfoRow label="电话" value={enterprise.phoneNumber} icon={<Phone size={16} />} />
                        <InfoRow label="邮箱" value={enterprise.email} icon={<Mail size={16} />} />
                        <InfoRow label="官网" value={enterprise.website} icon={<Globe size={16} />} />
                    </div>

                    {/* Business Scope */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">经营范围</div>
                        <p className="text-sm text-gray-900 leading-relaxed">{enterprise.businessScope}</p>
                    </div>
                </div>
            </div>

            {/* Documents Card (Read Only) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileCheck size={18} className="text-primary-600" />
                        企业补充文件
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">共 {enterprise.documents.length} 份</span>
                </div>
                <div className="p-6">
                    {enterprise.documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无归档文件</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {enterprise.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-xs
                                            ${doc.type === 'PDF' ? 'bg-red-50 text-red-600' : 
                                              doc.type === 'DOC' ? 'bg-blue-50 text-blue-600' : 
                                              'bg-gray-100 text-gray-600'}`}>
                                            {doc.type}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{doc.tag}</span>
                                                <span className="text-xs text-gray-400">{doc.uploadDate}</span>
                                                {doc.summary && <span className="text-xs text-gray-400 border-l pl-2 border-gray-200 truncate max-w-[200px]">{doc.summary}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-primary-600 p-2" title="下载文件">
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Associated Loans & Timeline */}
        <div className="lg:col-span-1 space-y-6">
             {/* Associated Loans Card */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Banknote size={18} className="text-primary-600" />
                        关联信贷业务
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{associatedLoans.length} 笔</span>
                </div>
                <div className="p-4">
                    {associatedLoans.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                            <Banknote size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无关联信贷业务</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {associatedLoans.map(loan => (
                                <div 
                                    key={loan.id}
                                    onClick={() => navigate(`/loan/${loan.id}`, { state: { loan } })}
                                    className="p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group cursor-pointer bg-white"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold shrink-0">
                                            <Banknote size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-900 text-xs truncate" title={loan.projectName || '未命名项目'}>
                                                {loan.projectName || '未命名项目'}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 font-mono truncate">{loan.contractNo}</div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </div>
                                    <div className="flex justify-between items-end border-t border-gray-50 pt-2">
                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                            期限: {loan.termMonths}个月
                                        </span>
                                        <div className="font-bold text-gray-900 text-sm">
                                            {loan.amount.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">万元</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={18} className="text-primary-600" />
                        活动日志
                    </h3>
                </div>
                <div className="p-6 relative">
                    <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gray-100"></div>
                    <div className="space-y-6 relative">
                        {enterprise.activities?.map((activity, idx) => {
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
                         {!enterprise.activities?.length && (
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
