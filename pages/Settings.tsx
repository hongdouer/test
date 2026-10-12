import React, { useState } from 'react';
import { Save, User, Bell, Shield, Globe, Lock, Mail, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weeklyReport: true
  });
  const [security, setSecurity] = useState({
    mfa: true,
    ipWhitelist: false
  });

  const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-primary-50 text-primary-700' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">系统设置</h2>
           <p className="text-gray-500 mt-1">管理您的个人偏好与系统全局配置</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm">
            <Save size={18} />
            <span>保存更改</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-100 bg-gray-50/50 p-4 space-y-1">
            <TabButton id="general" label="基本设置" icon={<User size={18} />} />
            <TabButton id="notifications" label="通知偏好" icon={<Bell size={18} />} />
            <TabButton id="security" label="安全隐私" icon={<Shield size={18} />} />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
           {activeTab === 'general' && (
             <div className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-primary-600" />
                        系统偏好
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">系统语言</label>
                            <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                                <option>简体中文</option>
                                <option>English</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">时区设置</label>
                            <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                                <option>(GMT+08:00) 北京，重庆，香港，乌鲁木齐</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User size={20} className="text-primary-600" />
                        个人信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">显示名称</label>
                            <input type="text" defaultValue="肖虹" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">绑定邮箱</label>
                            <input type="email" defaultValue="xiaohong@bank.com" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'notifications' && (
             <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Bell size={20} className="text-primary-600" />
                    消息通知
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-500">
                                <Mail size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">邮件通知</div>
                                <div className="text-xs text-gray-500">当有新的企业风险预警时发送邮件</div>
                            </div>
                        </div>
                        <button onClick={() => setNotifications({...notifications, email: !notifications.email})} className="text-primary-600 transition-colors">
                            {notifications.email ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-500">
                                <Bell size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">系统推送</div>
                                <div className="text-xs text-gray-500">识绿匹配任务完成后在站内推送消息</div>
                            </div>
                        </div>
                        <button onClick={() => setNotifications({...notifications, push: !notifications.push})} className="text-primary-600 transition-colors">
                            {notifications.push ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
                        </button>
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-primary-600" />
                    安全设置
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-500">
                                <Lock size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">修改密码</div>
                                <div className="text-xs text-gray-500">定期修改密码可以保护账号安全</div>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-white transition-colors">修改</button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-500">
                                <Shield size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">双重认证 (2FA)</div>
                                <div className="text-xs text-gray-500">登录时需要进行二次验证</div>
                            </div>
                        </div>
                        <button onClick={() => setSecurity({...security, mfa: !security.mfa})} className="text-primary-600 transition-colors">
                            {security.mfa ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
                        </button>
                    </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};