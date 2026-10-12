import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, ComposedChart
} from 'recharts';
import { 
  CheckCircle2, AlertTriangle, Leaf, Activity, 
  BarChart3, TrendingUp, ArrowRight, ScanEye, SearchCheck, 
  PieChart as PieChartIcon, Target, Zap, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  FileWarning, Scale, Clock, Timer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickMatchModal } from '../components/QuickMatchModal';
import { QuickRatingModal } from '../components/QuickRatingModal';

// --- Mock Data ---

// 1. 核心指标 (KPIs) - 移除金额/减碳，关注效率与量
const kpiData = {
    identifyCount: 342,
    identifyTrend: 12.5,
    passRate: 65, // 通过率
    ratingCount: 128,
    ratingTrend: 8.2,
    avgTime: '1.2天', // 平均处理时效
    autoMatchRate: 88 // 自动化匹配率
};

// 2. 绿色认定分布 (Identification - Pie)
const identificationData = [
  { name: '绿色项目', value: 65, color: '#10b981' }, // primary-500
  { name: '存疑待核', value: 15, color: '#f59e0b' }, // amber-500
  { name: '非绿/其他', value: 20, color: '#94a3b8' }, // slate-400
];

// 3. 绿色投向行业 Top 5 (Identification - Bar)
const industryData = [
    { name: '清洁能源', value: 45 },
    { name: '绿色交通', value: 25 },
    { name: '节能环保', value: 15 },
    { name: '生态农业', value: 10 },
    { name: '绿色建筑', value: 5 },
];

// 4. [New] 存疑与非绿原因分析 (Identification - Horizontal Bar)
const doubtfulReasonsData = [
    { name: '关键材料缺失', value: 42 },
    { name: '能效未达标', value: 35 },
    { name: '目录匹配存疑', value: 28 },
    { name: '资金用途模糊', value: 18 },
    { name: '环境合规风险', value: 8 },
];

// 5. 评级等级分布 (Rating - Bar)
const ratingDistData = [
  { name: 'GE1 深绿', count: 45, color: '#059669' }, // emerald-600
  { name: 'GE2 中绿', count: 82, color: '#3b82f6' }, // blue-500
  { name: 'GE3 浅绿', count: 120, color: '#facc15' }, // yellow-400
  { name: '非绿/未评', count: 95, color: '#cbd5e1' }, // slate-300
];

// 6. 评级维度平均表现 (Rating - Radar)
const ratingRadarData = [
    { subject: '绿色效益', A: 85, fullMark: 100 },
    { subject: '能源效率', A: 68, fullMark: 100 },
    { subject: '环境影响', A: 92, fullMark: 100 },
    { subject: '绿色转型', A: 75, fullMark: 100 },
    { subject: '社会责任', A: 60, fullMark: 100 },
];

// 7. [New] 认定依据分布 (Methodology - Donut)
const methodologyUsageData = [
    { name: '绿色金融支持目录(2025)', value: 55, color: '#3b82f6' },
    { name: '绿色低碳转型目录(2024)', value: 30, color: '#8b5cf6' },
    { name: '行内绿色信贷指引', value: 15, color: '#f59e0b' },
];

// 8. 业务处理趋势 (Trend - Combined, removed carbon)
const trendData = [
  { month: '1月', identify: 45, rating: 20 },
  { month: '2月', identify: 52, rating: 25 },
  { month: '3月', identify: 48, rating: 35 },
  { month: '4月', identify: 60, rating: 42 },
  { month: '5月', identify: 75, rating: 55 },
  { month: '6月', identify: 90, rating: 68 },
];

// 9. 近期动态 (Activity List)
const recentActivities = [
  { id: 1, type: 'rating', title: '四川光耀新能源 完成GE1深绿评级', time: '10分钟前', score: 92 },
  { id: 2, type: 'identify', title: '冀北特种钢铁 技改项目认定为绿色', time: '35分钟前', status: '通过' },
  { id: 3, type: 'identify', title: '苏州生态农业 缺少能效证明', time: '2小时前', status: '存疑' },
  { id: 4, type: 'rating', title: '杭州绿环资源 评级提升至GE2', time: '4小时前', score: 76 },
  { id: 5, type: 'identify', title: '新建50MW光伏电站项目 认定通过', time: '5小时前', status: '通过' },
];

// --- Sub-components ---

const SummaryCard = ({ title, value, subValue, icon, trend, colorClass, chartType }: any) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 text-opacity-100`}>
                {icon}
            </div>
        </div>
        
        <div className="relative z-10">
             {trend && (
                 <div className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                     {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                     {Math.abs(trend)}% 
                     <span className="text-gray-400 font-normal ml-1">较上月</span>
                 </div>
             )}
             {subValue && (
                 <div className="text-xs text-gray-500">{subValue}</div>
             )}
        </div>

        {/* Decorative Background Chart (Simulated) */}
        {chartType === 'area' && (
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 pointer-events-none">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <Area type="monotone" dataKey="identify" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
        )}
    </div>
);

export const Dashboard: React.FC = () => {
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [showQuickRating, setShowQuickRating] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-6 pb-12 animate-fade-in max-w-[1600px] mx-auto">
       
       {/* 1. Header & Quick Actions */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-2xl font-bold text-gray-800">工作台</h2>
               <p className="text-gray-500 mt-1 text-sm">欢迎回来，今日待处理识绿任务 <span className="text-primary-600 font-bold">12</span> 项</p>
            </div>
            
            <div className="flex gap-4">
                {/* Unified Button Style */}
                <button 
                    onClick={() => setShowQuickMatch(true)}
                    className="group relative px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-primary-200 hover:text-primary-700 hover:shadow-lg hover:shadow-primary-500/10 transition-all flex items-center gap-3 font-medium overflow-hidden"
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Leaf size={18} />
                    </div>
                    <div className="text-left">
                        <div className="text-xs text-gray-400 group-hover:text-primary-400 transition-colors">项目认定</div>
                        <div className="font-bold">快速识绿</div>
                    </div>
                    <ArrowRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary-400" />
                </button>
                
                <button 
                    onClick={() => setShowQuickRating(true)}
                    className="group relative px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-blue-200 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center gap-3 font-medium overflow-hidden"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 size={18} />
                    </div>
                    <div className="text-left">
                        <div className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors">企业评价</div>
                        <div className="font-bold">快速评绿</div>
                    </div>
                    <ArrowRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-blue-400" />
                </button>
            </div>
       </div>

       {/* 2. Summary Metrics (KPIs) - Focus on Process & Volume */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <SummaryCard 
                title="本月识绿任务" 
                value={kpiData.identifyCount} 
                trend={kpiData.identifyTrend} 
                icon={<SearchCheck size={20} className="text-emerald-600"/>} 
                colorClass="bg-emerald-100"
                chartType="area"
           />
           <SummaryCard 
                title="认定通过率" 
                value={`${kpiData.passRate}%`} 
                subValue="AI 自动匹配率 88%"
                icon={<PieChartIcon size={20} className="text-blue-600"/>} 
                colorClass="bg-blue-100"
           />
           <SummaryCard 
                title="本月评级企业" 
                value={kpiData.ratingCount} 
                trend={kpiData.ratingTrend} 
                icon={<ScanEye size={20} className="text-purple-600"/>} 
                colorClass="bg-purple-100"
                chartType="area"
           />
           <SummaryCard 
                title="平均处理时效" 
                value={kpiData.avgTime} 
                subValue="较上月缩短 0.3天"
                icon={<Timer size={20} className="text-orange-600"/>} 
                colorClass="bg-orange-100"
           />
       </div>

      {/* 3. Main Analysis Section - Identification Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Identification Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Leaf size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-800">智能识绿概览</h3>
                          <p className="text-xs text-gray-500">认定结果与投向分布</p>
                      </div>
                  </div>
                  <button onClick={() => navigate('/matching')} className="text-gray-400 hover:text-emerald-600 transition-colors">
                      <ArrowRight size={20} />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* Left: Donut Chart */}
                  <div className="flex flex-col items-center justify-center relative">
                      <div className="w-48 h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={identificationData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={70}
                                      paddingAngle={5}
                                      dataKey="value"
                                      stroke="none"
                                  >
                                      {identificationData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <Tooltip 
                                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}}
                                  />
                              </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold text-gray-800">65%</span>
                              <span className="text-xs text-gray-400">绿色占比</span>
                          </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 绿色</div>
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 存疑</div>
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> 非绿</div>
                      </div>
                  </div>

                  {/* Right: Industry Bar Chart */}
                  <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">贷款用途 Top 5</h4>
                      <div className="flex-1 min-h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={industryData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                  <XAxis type="number" hide />
                                  <YAxis 
                                      dataKey="name" 
                                      type="category" 
                                      width={60} 
                                      tick={{fontSize: 11, fill: '#64748b'}} 
                                      axisLine={false}
                                      tickLine={false}
                                  />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px'}} />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} fill="#10b981" name="项目数" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* Card 2: Deep Dive Analysis (New) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          <FileWarning size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-800">深度归因分析</h3>
                          <p className="text-xs text-gray-500">存疑原因与认定依据分布</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* Left: Rejection Reasons */}
                  <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">存疑与非绿主要原因</h4>
                      <div className="flex-1 min-h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={doubtfulReasonsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                  <XAxis type="number" hide />
                                  <YAxis 
                                      dataKey="name" 
                                      type="category" 
                                      width={80} 
                                      tick={{fontSize: 11, fill: '#64748b'}} 
                                      axisLine={false}
                                      tickLine={false}
                                  />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px'}} />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} fill="#f59e0b" name="项目数" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Right: Methodology Usage */}
                  <div className="flex flex-col items-center justify-center">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 w-full text-left">认定依据分布</h4>
                      <div className="w-40 h-40 relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={methodologyUsageData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={60}
                                      paddingAngle={2}
                                      dataKey="value"
                                  >
                                      {methodologyUsageData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px'}} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 text-[10px] text-gray-500 mt-2">
                          {methodologyUsageData.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: item.color}}></span>
                                  {item.name.substring(0, 4)}...
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

      </div>

      {/* 4. Rating Section - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 3: ESG Rating Insights */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <Target size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-800">ESG 评级画像</h3>
                          <p className="text-xs text-gray-500">等级分布与维度分析</p>
                      </div>
                  </div>
                  <button onClick={() => navigate('/rating/matching')} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <ArrowRight size={20} />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* Left: Rating Dist Bar */}
                  <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">企业等级分布</h4>
                      <div className="flex-1 min-h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={ratingDistData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={0} />
                                  <YAxis hide />
                                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px'}} />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                                      {ratingDistData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Right: Dimension Radar */}
                  <div className="flex flex-col items-center justify-center">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 w-full text-left">维度平均得分</h4>
                      <div className="w-full h-48">
                          <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ratingRadarData}>
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <Radar
                                      name="平均得分"
                                      dataKey="A"
                                      stroke="#3b82f6"
                                      strokeWidth={2}
                                      fill="#3b82f6"
                                      fillOpacity={0.2}
                                  />
                                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px'}} />
                              </RadarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* Card 4: Trend Analysis */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <TrendingUp size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-800">业务办理趋势</h3>
                          <p className="text-xs text-gray-500">认定与评级业务量走势</p>
                      </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 识绿</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 评级</div>
                  </div>
              </div>
              
              <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorIdentify" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                          <Area type="monotone" dataKey="identify" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIdentify)" name="识绿认定" />
                          <Area type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRating)" name="ESG评级" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>

      {/* 5. Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity size={18} className="text-orange-500" />
                  实时动态
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={18} />
              </button>
          </div>
          <div className="space-y-0 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
              {recentActivities.map(act => (
                  <div key={act.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2 transition-colors">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${act.type === 'rating' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                      <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{act.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{act.time}</div>
                      </div>
                      <div className="text-right shrink-0 self-center">
                          {act.type === 'rating' ? (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{act.score}分</span>
                          ) : (
                              <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                  act.status === '通过' 
                                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                                  : 'text-orange-600 bg-orange-50 border-orange-100'
                              }`}>
                                  {act.status}
                              </span>
                          )}
                      </div>
                  </div>
              ))}
              <button className="w-full text-center text-xs text-gray-400 mt-2 hover:text-primary-600 py-2 border-t border-dashed border-gray-100">
                  查看更多动态
              </button>
          </div>
      </div>
      
      {/* Quick Match Modal */}
      <QuickMatchModal isOpen={showQuickMatch} onClose={() => setShowQuickMatch(false)} />
      
      {/* Quick Rating Modal */}
      <QuickRatingModal isOpen={showQuickRating} onClose={() => setShowQuickRating(false)} />
    </div>
  );
};
