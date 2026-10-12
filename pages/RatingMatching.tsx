

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Building2, Layers, Play, Loader2, Award, AlertTriangle, CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, Sparkles, TrendingUp, HelpCircle, ArrowLeft, ArrowRight, Check, ChevronRight, Printer, Download, AlertCircle, Calculator, Plus, Search, FileSearch, Filter, X, Clock, Trash2 } from 'lucide-react';
import { MOCK_ENTERPRISES, MOCK_METHODOLOGIES } from '../constants';
import { MethodologyType, RatingTask, Enterprise, Methodology, RatingScoreDetail } from '../types';
import { runGreenRating } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';

// --- Pre-populated Mock Tasks ---
const MOCK_PRELOADED_TASKS: RatingTask[] = [
    {
        id: 'rt_mock_ge1',
        enterpriseId: 'ent_001', // 四川光耀新能源 (光伏) - GE1 深绿
        methodologyId: 'm3_rating',
        status: 'completed',
        createdAt: '2024-06-15T14:30:00.000Z',
        result: {
            totalScore: 96,
            level: 'GE1',
            levelName: '深绿企业',
            summary: '作为光伏制造行业的高新技术企业，主营业务完全符合绿色产业定义。企业在绿色效益、能源效率及绿色转型维度表现卓越，多项指标达到行业标杆水平。拥有完备的能源管理体系认证及多项低碳技术专利，且环境信用评价均为优良。',
            qualitative: [
                { item: '绿色产业', passed: true, analysis: '主营业务为光伏设备制造，属于目录重点支持领域。', evidence: '营业执照 & 官网简介' },
                { item: '合法合规', passed: true, analysis: '近一年无环保处罚、节能监察整改记录。', evidence: '信用中国查询结果' },
                { item: '公共信用', passed: true, analysis: '信用等级 AAA。', evidence: '信用等级报告' }
            ],
            quantitative: [
                // 1. 绿色效益 (10分)
                { level1: '绿色效益', level2: '绿色产业营收占比', maxScore: 4, actualScore: 4, analysis: '主营业务100%为绿色产业。', evidence: '审计报告主营业务收入表', missingInfo: '' },
                { level1: '绿色效益', level2: '节能改造投入占比', maxScore: 4, actualScore: 4, analysis: '新建高效产线及节能技改投入占比达65%。', evidence: '技改项目立项书', missingInfo: '' },
                { level1: '绿色效益', level2: '绿色产业营收增长率', maxScore: 2, actualScore: 2, analysis: '同比增长15%，高于得分标准。', evidence: '财务报表', missingInfo: '' },
                
                // 2. 能源效率 (20分)
                { level1: '能源效率', level2: '单位产品（产值）能耗下降率', maxScore: 20, actualScore: 18, analysis: '能耗下降率显著，接近行业标杆水平（前5%）。', evidence: '能效对标分析报告', missingInfo: '建议引入一级能效计量系统以精确对标' },
                
                // 3. 环境影响 (35分)
                { level1: '环境影响', level2: '碳排放强度下降率', maxScore: 5, actualScore: 5, analysis: '下降率达4.2%，满足满分标准（≥3.6%）。', evidence: '碳核查报告', missingInfo: '' },
                { level1: '环境影响', level2: '排污许可管理', maxScore: 5, actualScore: 5, analysis: '已纳入排污许可管理标杆企业白名单。', evidence: '环保局公示名单', missingInfo: '' },
                { level1: '环境影响', level2: '排污许可证执行报告', maxScore: 4, actualScore: 4, analysis: '按时提交执行报告，内容完整。', evidence: '排污许可平台截图', missingInfo: '' },
                { level1: '环境影响', level2: '单位产品（产值）废水下降率', maxScore: 3, actualScore: 3, analysis: '优于市平均下降率。', evidence: '环境监测报告', missingInfo: '' },
                { level1: '环境影响', level2: '单位产品（产值）废气下降率', maxScore: 3, actualScore: 3, analysis: '优于市平均下降率。', evidence: '环境监测报告', missingInfo: '' },
                { level1: '环境影响', level2: '环保信用评价等级', maxScore: 10, actualScore: 10, analysis: '评价为绿牌（诚信）。', evidence: '环境信用评价系统', missingInfo: '' },
                { level1: '环境影响', level2: '环境监测异常数据', maxScore: 5, actualScore: 5, analysis: '全年无日均值超标记录。', evidence: '在线监测数据', missingInfo: '' },

                // 4. 绿色转型 (30分)
                { level1: '绿色转型', level2: '绿色园区', maxScore: 4, actualScore: 4, analysis: '位于国家级绿色工业园区内。', evidence: '园区管委会证明', missingInfo: '' },
                { level1: '绿色转型', level2: '低碳技术', maxScore: 5, actualScore: 5, analysis: '拥有5项光伏电池核心低碳专利。', evidence: '知识产权证书列表', missingInfo: '' },
                { level1: '绿色转型', level2: '绿色能源消纳', maxScore: 3, actualScore: 3, analysis: '绿电使用比例达20%。', evidence: '绿证交易凭证', missingInfo: '' },
                { level1: '绿色转型', level2: '重点培植企业', maxScore: 10, actualScore: 10, analysis: '已纳入市重点培植企业名单。', evidence: '工信局文件', missingInfo: '' },
                { level1: '绿色转型', level2: '科创企业', maxScore: 8, actualScore: 8, analysis: '高新技术企业认证有效。', evidence: '高新技术企业证书', missingInfo: '' },

                // 5. 社会责任 (5分)
                { level1: '社会责任', level2: '企业环境披露', maxScore: 2, actualScore: 2, analysis: '已发布年度独立的ESG报告。', evidence: '2023年度ESG报告', missingInfo: '' },
                { level1: '社会责任', level2: '社保覆盖率', maxScore: 3, actualScore: 3, analysis: '社保缴纳覆盖率100%。', evidence: '社保缴纳证明', missingInfo: '' }
            ],
            bonus: [
                { level1: '鼓励性指标', level2: '绿色认证', maxScore: 5, actualScore: 5, analysis: '通过绿色产品认证。', evidence: '绿色产品认证证书', missingInfo: '' },
                { level1: '鼓励性指标', level2: '双碳管理', maxScore: 5, actualScore: 2, analysis: '已发布双碳目标(1分)及路线图(1分)。', evidence: '官网公告', missingInfo: '未建立专职碳管理团队及制度' },
                { level1: '鼓励性指标', level2: '双碳金融', maxScore: 5, actualScore: 0, analysis: '未参与碳交易或发行绿色债券。', evidence: '无', missingInfo: '建议探索开发CCER项目或参与绿电交易' }
            ],
            suggestions: [
                '持续保持能效领先优势，争取达到行业标杆值满分标准',
                '进一步完善双碳管理体系，建立专职团队'
            ],
            generatedAt: '2024-06-15T14:35:00.000Z'
        }
    },
    {
        id: 'rt_mock_ge2',
        enterpriseId: 'ent_003', // 冀北特种钢铁 (转型) - GE2 中绿
        methodologyId: 'm3_rating',
        status: 'completed',
        createdAt: '2024-05-20T10:00:00.000Z',
        result: {
            totalScore: 78,
            level: 'GE2',
            levelName: '中绿企业',
            summary: '该企业正处于绿色低碳转型关键期，节能改造投入较大，在“绿色效益”维度得分较高。但由于行业特性，其碳排放强度下降率尚未达到深绿标准，且尚未发布独立的社会责任报告，导致部分扣分。',
            qualitative: [
                { item: '绿色产业', passed: true, analysis: '企业经营范围及本项目均属于《绿色低碳转型产业指导目录(2024年版)》。', evidence: '营业执照经营范围' },
                { item: '合法合规', passed: true, analysis: '近一年无环保处罚、节能监察整改记录。', evidence: '企业信用报告' },
                { item: '公共信用', passed: true, analysis: '省公共信用评价等级为 A。', evidence: '公共信用信息平台查询' }
            ],
            quantitative: [
                // 1. 绿色效益 (10分)
                { level1: '绿色效益', level2: '绿色产业营收占比', maxScore: 4, actualScore: 4, analysis: '报告年度绿色营收占比 52% (≥50%)。', evidence: '2023年度财务审计报告', missingInfo: '' },
                { level1: '绿色效益', level2: '节能改造投入占比', maxScore: 4, actualScore: 3, analysis: '投入占比 38% (区间35%-50%)。', evidence: '2023年度投资项目清单', missingInfo: '若投入占比提升至 50% 以上可得满分' },
                { level1: '绿色效益', level2: '绿色产业营收增长率', maxScore: 2, actualScore: 1, analysis: '同比增长0.8% (>0%)。', evidence: '财务报表', missingInfo: '营收增速需超过1%方可得满分' },

                // 2. 能源效率 (20分)
                { level1: '能源效率', level2: '单位产品（产值）能耗下降率', maxScore: 20, actualScore: 12, analysis: '能耗同比下降，处于基准-标杆之间。', evidence: '能源管理报表', missingInfo: '需进一步提升能效至行业前10%' },

                // 3. 环境影响 (35分)
                { level1: '环境影响', level2: '碳排放强度下降率', maxScore: 5, actualScore: 3, analysis: '下降率 1.2% (0%-3.6%之间)。', evidence: '2023年度碳排放核查报告', missingInfo: '建议引入CCUS技术以加大减排力度' },
                { level1: '环境影响', level2: '排污许可管理', maxScore: 5, actualScore: 0, analysis: '尚未纳入标杆企业白名单。', evidence: '环保局公示名单', missingInfo: '争取纳入排污许可管理标杆' },
                { level1: '环境影响', level2: '排污许可证执行报告', maxScore: 4, actualScore: 4, analysis: '正常上报。', evidence: '排污许可平台', missingInfo: '' },
                { level1: '环境影响', level2: '单位产品（产值）废水下降率', maxScore: 3, actualScore: 2, analysis: '未达市平均下降率，但有下降。', evidence: '监测报告', missingInfo: '需优化废水回用工艺' },
                { level1: '环境影响', level2: '单位产品（产值）废气下降率', maxScore: 3, actualScore: 2, analysis: '未达市平均下降率，但有下降。', evidence: '监测报告', missingInfo: '需升级除尘脱硫设施' },
                { level1: '环境影响', level2: '环保信用评价等级', maxScore: 10, actualScore: 8, analysis: '评价为蓝牌（良好）。', evidence: '环境信用评价系统', missingInfo: '争取提升至绿牌（诚信）' },
                { level1: '环境影响', level2: '环境监测异常数据', maxScore: 5, actualScore: 5, analysis: '0次日均值超标。', evidence: '在线监测数据', missingInfo: '' },

                // 4. 绿色转型 (30分)
                { level1: '绿色转型', level2: '绿色园区', maxScore: 4, actualScore: 4, analysis: '所在园区为绿色园区。', evidence: '园区管委会证明', missingInfo: '' },
                { level1: '绿色转型', level2: '低碳技术', maxScore: 5, actualScore: 2, analysis: '拥有1项著作权。', evidence: '知识产权列表', missingInfo: '建议申请发明专利以获更高分' },
                { level1: '绿色转型', level2: '绿色能源消纳', maxScore: 3, actualScore: 1, analysis: '绿电占比5%。', evidence: '电费清单', missingInfo: '建议增加绿电采购比例至10%以上' },
                { level1: '绿色转型', level2: '重点培植企业', maxScore: 10, actualScore: 10, analysis: '已纳入重点培植名单。', evidence: '政府文件', missingInfo: '' },
                { level1: '绿色转型', level2: '科创企业', maxScore: 8, actualScore: 0, analysis: '未获得相关科创认证。', evidence: '资质文件', missingInfo: '建议申报科技型中小企业或高新技术企业' },

                // 5. 社会责任 (5分)
                { level1: '社会责任', level2: '企业环境披露', maxScore: 2, actualScore: 0, analysis: '未在公开渠道查询到独立的年度ESG报告或社会责任报告。', evidence: '公开渠道检索', missingInfo: '建议发布年度ESG报告' },
                { level1: '社会责任', level2: '社保覆盖率', maxScore: 3, actualScore: 3, analysis: '社保覆盖率100%。', evidence: '社保缴纳证明', missingInfo: '' }
            ],
            bonus: [
                { level1: '鼓励性指标', level2: '绿色认证', maxScore: 5, actualScore: 0, analysis: '暂无相关认证。', evidence: '无', missingInfo: '建议申请ISO14001或能源管理体系认证' },
                { level1: '鼓励性指标', level2: '双碳管理', maxScore: 5, actualScore: 3, analysis: '已制定碳达峰路线图(1分)，发布碳计划(1分)，组建碳团队(1分)。', evidence: '碳达峰行动方案', missingInfo: '建议开展年度碳盘查' },
                { level1: '鼓励性指标', level2: '双碳金融', maxScore: 5, actualScore: 2, analysis: '参与了碳排放权交易(1分)，获得减排量收益(1分)。', evidence: '碳交易凭证', missingInfo: '可尝试发行绿色债券' }
            ],
            suggestions: [
                '建议建立完善的环境信息披露机制，发布ESG报告',
                '加快生产工艺电气化改造，降低碳排放强度'
            ],
            generatedAt: '2024-05-20T10:05:00.000Z'
        }
    },
    {
        id: 'rt_mock_ge3',
        enterpriseId: 'ent_004', // 苏州生态农业 (浅绿) - GE3 浅绿
        methodologyId: 'm3_rating',
        status: 'completed',
        createdAt: '2024-08-12T09:15:00.000Z',
        result: {
            totalScore: 65,
            level: 'GE3',
            levelName: '浅绿企业',
            summary: '企业从事生态农业，基础资质符合绿色要求。但在定量指标上，缺乏高新技术企业认证、缺乏完善的能源计量数据，且未在绿色园区内，导致“绿色转型”和“能源效率”维度得分较低。',
            qualitative: [
                { item: '绿色产业', passed: true, analysis: '符合绿色农业相关定义。', evidence: '经营许可证' },
                { item: '合法合规', passed: true, analysis: '无违规记录。', evidence: '信用中国' },
                { item: '公共信用', passed: true, analysis: '信用等级 B级以上。', evidence: '信用报告' }
            ],
            quantitative: [
                // 1. 绿色效益 (10分)
                { level1: '绿色效益', level2: '绿色产业营收占比', maxScore: 4, actualScore: 4, analysis: '主营有机农产品，占比100%。', evidence: '销售报表', missingInfo: '' },
                { level1: '绿色效益', level2: '节能改造投入占比', maxScore: 4, actualScore: 1, analysis: '投入占比约12% (>10%)。', evidence: '财务报表', missingInfo: '加大农业设施节能改造投入' },
                { level1: '绿色效益', level2: '绿色产业营收增长率', maxScore: 2, actualScore: 0, analysis: '同比持平。', evidence: '财务报表', missingInfo: '需实现营收正增长' },

                // 2. 能源效率 (20分)
                { level1: '能源效率', level2: '单位产品（产值）能耗下降率', maxScore: 20, actualScore: 8, analysis: '缺乏完善计量，按基准持平评分。', evidence: '能源缴费单据', missingInfo: '建议安装二级能源计量设备并建立台账' },

                // 3. 环境影响 (35分)
                { level1: '环境影响', level2: '碳排放强度下降率', maxScore: 5, actualScore: 0, analysis: '未开展碳核算，无法计算下降率。', evidence: '无', missingInfo: '需开展碳盘查并计算强度' },
                { level1: '环境影响', level2: '排污许可管理', maxScore: 5, actualScore: 0, analysis: '未纳入白名单。', evidence: '公示名单', missingInfo: '' },
                { level1: '环境影响', level2: '排污许可证执行报告', maxScore: 4, actualScore: 4, analysis: '不涉及排污许可，视同满分。', evidence: '行业豁免清单', missingInfo: '' },
                { level1: '环境影响', level2: '单位产品（产值）废水下降率', maxScore: 3, actualScore: 2, analysis: '农业面源污染控制较好，未下降。', evidence: '自查报告', missingInfo: '进一步减少化肥农药使用' },
                { level1: '环境影响', level2: '单位产品（产值）废气下降率', maxScore: 3, actualScore: 2, analysis: '未下降。', evidence: '自查报告', missingInfo: '加强秸秆综合利用' },
                { level1: '环境影响', level2: '环保信用评价等级', maxScore: 10, actualScore: 8, analysis: '评价为蓝牌。', evidence: '信用系统', missingInfo: '争取提升至绿牌' },
                { level1: '环境影响', level2: '环境监测异常数据', maxScore: 5, actualScore: 5, analysis: '无异常。', evidence: '监测记录', missingInfo: '' },

                // 4. 绿色转型 (30分)
                { level1: '绿色转型', level2: '绿色园区', maxScore: 4, actualScore: 0, analysis: '所在区域未获得绿色园区认证。', evidence: '地址核查', missingInfo: '建议所在园区申请绿色园区认证' },
                { level1: '绿色转型', level2: '低碳技术', maxScore: 5, actualScore: 0, analysis: '无相关专利。', evidence: '知识产权库', missingInfo: '建议申请农业实用新型专利' },
                { level1: '绿色转型', level2: '绿色能源消纳', maxScore: 3, actualScore: 0, analysis: '未采购绿电。', evidence: '电费清单', missingInfo: '建议建设农光互补项目' },
                { level1: '绿色转型', level2: '重点培植企业', maxScore: 10, actualScore: 0, analysis: '未纳入名单。', evidence: '政府文件', missingInfo: '争取纳入农业产业化龙头企业' },
                { level1: '绿色转型', level2: '科创企业', maxScore: 8, actualScore: 0, analysis: '暂未获得高企认证。', evidence: '资质文件', missingInfo: '建议申报科技型中小企业' },

                // 5. 社会责任 (5分)
                { level1: '社会责任', level2: '企业环境披露', maxScore: 2, actualScore: 0, analysis: '未披露。', evidence: '无', missingInfo: '建议在官网披露环境信息' },
                { level1: '社会责任', level2: '社保覆盖率', maxScore: 3, actualScore: 3, analysis: '员工社保缴纳规范。', evidence: '社保缴纳证明', missingInfo: '' }
            ],
            bonus: [
                { level1: '鼓励性指标', level2: '绿色认证', maxScore: 5, actualScore: 5, analysis: '获得有机产品认证。', evidence: '有机产品认证证书', missingInfo: '' },
                { level1: '鼓励性指标', level2: '双碳管理', maxScore: 5, actualScore: 0, analysis: '无相关管理动作。', evidence: '无', missingInfo: '建议制定农业减排计划' },
                { level1: '鼓励性指标', level2: '双碳金融', maxScore: 5, actualScore: 0, analysis: '未参与。', evidence: '无', missingInfo: '建议开发林业碳汇或农业碳汇项目' }
            ],
            suggestions: [
                '完善能源计量体系，实现能耗数据可监测',
                '积极申报农业科技项目，提升科技属性',
                '考虑建设农光互补项目以使用绿色电力'
            ],
            generatedAt: '2024-08-12T09:20:00.000Z'
        }
    }
];

// Helper Component: Multi-Select Filter Dropdown
const LevelFilterDropdown: React.FC<{
    selected: string[];
    onChange: (levels: string[]) => void;
}> = ({ selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const options = ['GE1', 'GE2', 'GE3', 'GE4', '非绿/其他'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                    selected.length > 0 
                    ? 'bg-primary-50 border-primary-200 text-primary-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <Filter size={12} />
                <span>等级筛选 {selected.length > 0 && `(${selected.length})`}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in">
                    <div className="p-1 space-y-0.5">
                        {options.map(opt => (
                            <div 
                                key={opt} 
                                onClick={() => toggleOption(opt)}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded text-xs text-gray-700"
                            >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                    selected.includes(opt) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                                }`}>
                                    {selected.includes(opt) && <Check size={8} className="text-white" />}
                                </div>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <div className="border-t border-gray-100 p-1">
                            <button 
                                onClick={() => { onChange([]); setIsOpen(false); }}
                                className="w-full text-center text-xs text-gray-400 hover:text-red-500 py-1.5 rounded hover:bg-red-50"
                            >
                                清除已选
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Collapsible Quantitative Group Component
const QuantitativeGroup: React.FC<{
    level1: string;
    items: RatingScoreDetail[];
    groupTotalMax: number;
    groupTotalActual: number;
    isGroupFullScore: boolean;
}> = ({ level1, items, groupTotalMax, groupTotalActual, isGroupFullScore }) => {
    const [isOpen, setIsOpen] = useState(true); // Default open

    return (
        <div className="border-t border-gray-100 pt-4 break-inside-avoid">
            {/* Header */}
            <div 
                className="flex items-center gap-3 mb-4 cursor-pointer group select-none hover:bg-gray-50/50 p-2 -mx-2 rounded-lg transition-colors" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`p-1 rounded-md transition-colors ${isOpen ? 'bg-gray-100 text-gray-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                
                <h6 className="text-sm font-bold text-gray-800">{level1}</h6>
                
                <div className="text-xs font-medium text-gray-400 ml-auto flex items-center gap-2">
                    <div className={`h-2 w-20 rounded-full bg-gray-100 overflow-hidden`}>
                        <div 
                            className={`h-full rounded-full ${isGroupFullScore ? 'bg-green-500' : 'bg-orange-400'}`} 
                            style={{ width: `${(groupTotalActual / (groupTotalMax || 1)) * 100}%` }}
                        ></div>
                    </div>
                    <span className={`${isGroupFullScore ? 'text-green-600' : 'text-orange-500'}`}>
                        {groupTotalActual}
                    </span>
                    <span className="text-gray-300">/</span>
                    {groupTotalMax}
                </div>
            </div>

            {/* Items */}
            {isOpen && (
                <div className="pl-9 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {items.map((item, idx) => {
                        const isFullScore = item.actualScore === item.maxScore;
                        const maxScore = item.maxScore || 0;
                        const actualScore = item.actualScore || 0;
                        
                        return (
                            <div key={idx} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-blue-100 transition-colors print:border-gray-200 shadow-sm">
                                {/* Header Row: Title & Scores */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">{item.level2}</div>
                                        {/* Evidence Badge */}
                                        {item.evidence && (
                                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                <FileSearch size={10} className="text-primary-500"/>
                                                依据: {item.evidence}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        {!isFullScore && (
                                            <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded font-medium">扣 {maxScore - actualScore} 分</span>
                                        )}
                                        <div className="text-sm font-bold">
                                            <span className={`${isFullScore ? 'text-green-600' : 'text-orange-500'}`}>{actualScore}</span>
                                            <span className="text-gray-300 mx-1">/</span>
                                            <span className="text-gray-400">{maxScore}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content: Conditional Rendering based on Full Score */}
                                {isFullScore ? (
                                    // Full Score View: Minimalist, Green
                                    <div className="text-xs text-green-700 bg-green-50/50 p-2 rounded border border-green-100 flex items-start gap-2 mt-2">
                                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold mr-1">符合标准：</span>
                                            {item.analysis}
                                        </div>
                                    </div>
                                ) : (
                                    // Non-Full Score View: Detailed Deduction Box
                                    <div className="bg-orange-50 border border-orange-100 rounded p-3 text-xs text-gray-600 mt-2 flex gap-3">
                                        <div className="mt-0.5 shrink-0 text-orange-500">
                                            <AlertTriangle size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-orange-800 mb-1">扣分原因与改进建议</div>
                                            <p className="leading-relaxed mb-1 text-gray-700">{item.analysis}</p>
                                            {item.missingInfo && (
                                                <div className="mt-2 pt-2 border-t border-orange-200/50 text-orange-700 flex items-start gap-1.5">
                                                    <FileText size={12} className="mt-0.5"/>
                                                    <span>
                                                        <span className="font-bold">建议补充材料:</span> {item.missingInfo}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const RatingMatchingPage: React.FC = () => {
  // Selection State
  const [selectedEntIds, setSelectedEntIds] = useState<string[]>([]); // Multi-select
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  
  // Search State (Left Panel)
  const [entSearchTerm, setEntSearchTerm] = useState('');
  const [methodSearchTerm, setMethodSearchTerm] = useState('');
  
  // Results Search/Filter State (Right Panel)
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [filterModelId, setFilterModelId] = useState<string>('all');
  const [filterLevels, setFilterLevels] = useState<string[]>([]);

  // Task/Result State - Initialize with Pre-loaded tasks
  const [tasks, setTasks] = useState<RatingTask[]>(MOCK_PRELOADED_TASKS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Filters
  const ratingMethodologies = useMemo(() => 
      MOCK_METHODOLOGIES.filter(m => m.type === MethodologyType.RATING_MODEL), 
  []);

  const filteredEnterprises = useMemo(() => {
      return MOCK_ENTERPRISES.filter(ent => 
          (ent.name || '').toLowerCase().includes(entSearchTerm.toLowerCase()) || 
          (ent.industry || '').toLowerCase().includes(entSearchTerm.toLowerCase())
      );
  }, [entSearchTerm]);

  const filteredMethodologies = useMemo(() => {
      return ratingMethodologies.filter(m => 
          m.name.toLowerCase().includes(methodSearchTerm.toLowerCase())
      );
  }, [ratingMethodologies, methodSearchTerm]);

  // Filter Tasks (Reports)
  const filteredTasks = useMemo(() => {
      return tasks.filter(task => {
          const ent = MOCK_ENTERPRISES.find(e => e.id === task.enterpriseId);
          const method = ratingMethodologies.find(m => m.id === task.methodologyId);
          const level = task.result?.level || '未评级';
          const levelName = task.result?.levelName || '';

          // 1. Search Term (Fuzzy match enterprise name, industry, level name, or summary)
          const searchMatch = !reportSearchTerm || 
              (ent?.name || '').toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
              (ent?.industry || '').toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
              level.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
              levelName.includes(reportSearchTerm) ||
              (task.result?.summary || '').includes(reportSearchTerm);

          // 2. Model Filter
          const modelMatch = filterModelId === 'all' || task.methodologyId === filterModelId;

          // 3. Level Filter
          const levelMatch = filterLevels.length === 0 || filterLevels.some(l => level.includes(l) || (l === '非绿/其他' && !level.startsWith('GE')));

          return searchMatch && modelMatch && levelMatch;
      });
  }, [tasks, reportSearchTerm, filterModelId, filterLevels, ratingMethodologies]);

  // Check for auto-run state from navigation
  useEffect(() => {
    if (location.state && location.state.initiateRating) {
        const { enterpriseIds, methodologyId } = location.state;
        
        // Update selection UI to reflect what's running
        if (enterpriseIds && Array.isArray(enterpriseIds)) setSelectedEntIds(enterpriseIds);
        if (methodologyId) setSelectedMethodId(methodologyId);
        
        // Initiate tasks immediately if valid
        if (enterpriseIds && enterpriseIds.length > 0 && methodologyId) {
            
            const method = ratingMethodologies.find(m => m.id === methodologyId);
            if (!method || !method.ratingConfig) return;

            setIsProcessing(true);
            
            // 1. Create Tasks
            const newTasks: RatingTask[] = enterpriseIds.map((entId: string) => ({
                id: `rt_${Date.now()}_${entId}`,
                enterpriseId: entId,
                methodologyId: methodologyId,
                status: 'processing',
                createdAt: new Date().toISOString()
            }));

            // Add to list (newest first)
            setTasks(prev => [...newTasks, ...prev]);
            setActiveTaskId(null); // Return to list view to see progress

            // 2. Process Concurrently (Optimized for speed)
            const processTask = async (task: RatingTask) => {
                const ent = MOCK_ENTERPRISES.find(e => e.id === task.enterpriseId);
                
                if (ent) {
                    try {
                        // Ensure config exists (checked before loop)
                        const result = await runGreenRating(ent, method.ratingConfig!, method.name);
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', result } : t));
                    } catch (error) {
                        console.error(error);
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
                    }
                } else {
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
                }
            };

            // Execute all tasks in parallel using Promise.all
            Promise.all(newTasks.map(task => processTask(task))).then(() => {
                setIsProcessing(false);
            });
            
            // Clear navigation state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location.state, navigate, ratingMethodologies]);

  // Helpers
  const toggleEntSelection = (id: string) => {
      setSelectedEntIds(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  const getEntName = (id: string) => MOCK_ENTERPRISES.find(e => e.id === id)?.name || '未知企业';
  const getEntInfo = (id: string) => MOCK_ENTERPRISES.find(e => e.id === id);

  // Handlers
  const handleStartRating = async () => {
      if (selectedEntIds.length === 0 || !selectedMethodId) return;

      const method = ratingMethodologies.find(m => m.id === selectedMethodId);
      if (!method || !method.ratingConfig) return;

      setIsProcessing(true);
      
      // 1. Create Tasks
      const newTasks: RatingTask[] = selectedEntIds.map(entId => ({
          id: `rt_${Date.now()}_${entId}`,
          enterpriseId: entId,
          methodologyId: method.id,
          status: 'processing',
          createdAt: new Date().toISOString()
      }));

      // Add to list (newest first)
      setTasks(prev => [...newTasks, ...prev]);
      setActiveTaskId(null); // Return to list view to see progress

      // 2. Process Concurrently (Optimized for speed)
      // Define processing function for a single task
      const processTask = async (task: RatingTask) => {
          const ent = MOCK_ENTERPRISES.find(e => e.id === task.enterpriseId);
          
          if (ent) {
              try {
                  // Ensure config exists (checked before loop)
                  const result = await runGreenRating(ent, method.ratingConfig!, method.name);
                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', result } : t));
              } catch (error) {
                  console.error(error);
                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
              }
          } else {
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
          }
      };

      // Execute all tasks in parallel using Promise.all
      await Promise.all(newTasks.map(task => processTask(task)));

      setIsProcessing(false);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportPDF = async () => {
      const element = document.getElementById('report-content');
      if (!element) return;
      
      setIsExporting(true);
      
      try {
        // Calculate dimensions to ensure full capture
        const scrollHeight = element.scrollHeight;
        const offsetWidth = element.offsetWidth;

        const canvas = await html2canvas(element, { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            // Critical options for capturing scrollable content
            width: offsetWidth,
            height: scrollHeight,
            windowWidth: offsetWidth,
            windowHeight: scrollHeight,
            x: 0,
            y: 0,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById('report-content');
                if (clonedEl) {
                    // Force element to expand to full height and remove scrollbars
                    clonedEl.style.height = 'auto';
                    clonedEl.style.maxHeight = 'none';
                    clonedEl.style.overflow = 'visible';
                    clonedEl.classList.remove('overflow-y-auto');
                    clonedEl.classList.remove('custom-scrollbar');
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');

        // A4 Dimensions in mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = pdfImgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;

        // Add subsequent pages if content overflows A4
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
            heightLeft -= pdfHeight;
        }
        
        const taskId = activeTaskId?.split('_').pop() || 'report';
        pdf.save(`绿色评价报告_${taskId}.pdf`);
      } catch (e) {
        console.error("PDF Export failed", e);
        alert("PDF 导出失败，请重试或使用打印功能另存为PDF。");
      } finally {
        setIsExporting(false);
      }
  };

  // --- Render Helpers ---

  const renderDetailView = () => {
      const currentTask = tasks.find(t => t.id === activeTaskId);
      if (!currentTask || !currentTask.result) return null;
      const { result } = currentTask;
      const ent = getEntInfo(currentTask.enterpriseId);
      const method = ratingMethodologies.find(m => m.id === currentTask.methodologyId) || ratingMethodologies[0]; 

      // 1. Calculate Reference Totals from Methodology
      let maxQuantitative = 0;
      let maxBonus = 0;
      // Map for Level 1 totals from methodology to ensure visual consistency with groups
      const level1MaxScores: Record<string, number> = {};

      if (method && method.ratingConfig) {
          method.ratingConfig.quantitative.forEach(item => {
              maxQuantitative += Number(item.score || 0);
              // Aggregate Level 1 scores from config
              if (item.level1) {
                  level1MaxScores[item.level1] = (level1MaxScores[item.level1] || 0) + Number(item.score || 0);
              }
          });
          maxBonus = method.ratingConfig.bonus.reduce((acc, item) => acc + Number(item.score || 0), 0);
      } else {
          // Fallback to result data if methodology config is missing
          maxQuantitative = result.quantitative.reduce((sum, item) => sum + (item.maxScore || 0), 0);
          maxBonus = result.bonus.reduce((sum, item) => sum + (item.maxScore || 0), 0);
          result.quantitative.forEach(item => {
               if (item.level1) {
                   level1MaxScores[item.level1] = (level1MaxScores[item.level1] || 0) + (item.maxScore || 0);
               }
          });
      }

      // Group Quantitative Items by Level 1
      const groupedQuantitative: Record<string, RatingScoreDetail[]> = {};
      result.quantitative.forEach(item => {
          const l1 = item.level1 || '其他指标';
          if (!groupedQuantitative[l1]) groupedQuantitative[l1] = [];
          groupedQuantitative[l1].push(item);
      });
      
      // Determine color based on result.level - Added null check
      const levelCode = result.level || '';
      const levelColor = levelCode.includes('1') ? 'emerald' : levelCode.includes('2') ? 'blue' : 'yellow';

      return (
          <div className="flex flex-col h-full bg-gray-50 print:bg-white print:h-auto print:block">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-4 shrink-0 print:hidden">
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setActiveTaskId(null)}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-800"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">绿色评价报告</h3>
                    <span className="text-xs text-gray-400 font-mono mt-1">编号: {currentTask.id.split('_').pop()}</span>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                          <Printer size={14} /> 打印
                      </button>
                      <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 border border-primary-600 rounded text-sm text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait"
                      >
                          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          {isExporting ? '生成中...' : '导出 PDF'}
                      </button>
                  </div>
              </div>

              {/* Report Container */}
              <div id="report-content" className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-5xl mx-auto w-full print:border-none print:shadow-none print:p-0 print:overflow-visible print:h-auto">
                
                {/* 1. Report Header */}
                <div className="border-b border-gray-100 pb-8 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{ent?.name}</h1>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{ent?.industry}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500">{ent?.fundsUse || '未指定具体项目'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block mb-1">评价依据</span>
                            <span className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 rounded text-xs">
                                {method?.name || '绿色企业评级体系'}
                            </span>
                        </div>
                    </div>

                    <div className={`flex items-stretch divide-x divide-${levelColor}-100 bg-${levelColor}-50 rounded-xl border border-${levelColor}-100 overflow-hidden print:border-gray-200 print:bg-white`}>
                        {/* Total Score Panel */}
                        <div className="px-8 py-6 text-center flex flex-col justify-center min-w-[180px]">
                            <div className={`text-sm text-${levelColor}-700 mb-1 font-medium`}>综合得分</div>
                            <div className={`text-6xl font-black text-${levelColor}-600 tracking-tighter`}>{result.totalScore}</div>
                            <div className={`text-xs text-${levelColor}-600/70 mt-1`}>
                                满分参考: {maxQuantitative + maxBonus} 分
                            </div>
                        </div>
                        
                        {/* Level Panel */}
                        <div className="px-8 py-6 text-center flex flex-col justify-center min-w-[180px]">
                            <div className={`text-sm text-${levelColor}-700 mb-2 font-medium`}>认定等级</div>
                            <div className={`text-2xl font-bold flex items-center justify-center gap-2 text-${levelColor}-700`}>
                                <Award size={32} />
                                {result.levelName} 
                            </div>
                            <div className={`text-sm font-mono mt-1 text-${levelColor}-600 bg-white/50 rounded px-2 py-0.5 inline-block mx-auto`}>
                                等级代码: {result.level}
                            </div>
                        </div>

                        {/* Summary Panel */}
                        <div className="px-8 py-6 flex-1 flex flex-col">
                             <div className={`text-sm text-${levelColor}-800 mb-2 font-bold flex items-center gap-2`}>
                                 <Sparkles size={16} />
                                 评价综述
                             </div>
                             <p className="text-sm text-gray-700 leading-relaxed">
                                {result.summary}
                             </p>
                        </div>
                    </div>
                </div>

                {/* 3. Indicators Table */}
                <div>
                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <FileText size={20} className="text-primary-600" /> 
                        指标得分详情
                        <span className="text-xs font-normal text-gray-400">生成日期: {new Date(currentTask.createdAt).toLocaleDateString()}</span>
                    </h4>
                    
                    <div className="space-y-8">
                        
                        {/* I. Qualitative */}
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center print:bg-gray-100">
                                <h5 className="font-bold text-gray-700 text-sm">定性评价 (准入)</h5>
                                <span className="text-xs text-gray-400">一票否决项</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {result.qualitative.map((item, idx) => (
                                    <div key={`qual-${idx}`} className="p-4 flex gap-4 items-start bg-white">
                                        <div className="mt-1">
                                            {item.passed 
                                                ? <CheckCircle2 className="text-green-500" size={18} /> 
                                                : <XCircle className="text-red-500" size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800 text-sm mb-1">{item.item}</div>
                                            <div className="text-xs text-gray-500 mb-2">{item.analysis}</div>
                                            {item.evidence && (
                                                <div className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 border border-gray-200">
                                                    <FileSearch size={12} /> 
                                                    <span>判定依据: {item.evidence}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right min-w-[60px]">
                                            <span className={`text-sm font-bold ${item.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.passed ? '通过' : '不通过'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* II. Quantitative Header */}
                        <div className="break-before-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-bold text-gray-700 text-sm">定量评价</h5>
                                <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    得分：
                                    <span className="text-primary-600 text-lg mr-1 ml-1">
                                        {result.quantitative.reduce((sum, item) => sum + (item.actualScore || 0), 0)}
                                    </span>
                                    / {maxQuantitative}
                                </div>
                            </div>

                            {/* II. Quantitative Groups - Using Collapsible Component */}
                            <div className="space-y-6">
                                {Object.entries(groupedQuantitative).map(([level1, items], gIdx) => {
                                    // Calculate Level 1 Total from Method Config if available, otherwise sum items
                                    const groupTotalMax = level1MaxScores[level1] || items.reduce((sum, item) => sum + (item.maxScore || 0), 0);
                                    const groupTotalActual = items.reduce((sum, item) => sum + (item.actualScore || 0), 0);
                                    const isGroupFullScore = groupTotalActual === groupTotalMax;
                                    
                                    return (
                                        <QuantitativeGroup 
                                            key={`quant-group-${gIdx}`}
                                            level1={level1}
                                            items={items}
                                            groupTotalMax={groupTotalMax}
                                            groupTotalActual={groupTotalActual}
                                            isGroupFullScore={isGroupFullScore}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* III. Bonus */}
                        <div className="border-t border-gray-100 pt-6 mt-6 break-inside-avoid">
                            {/* Header similar to Quant Group Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                    <Award size={16} />
                                </div>
                                <h5 className="font-bold text-gray-800 text-sm">鼓励性指标 (加分项)</h5>
                                <div className="text-xs font-medium text-gray-400 ml-auto flex items-center gap-2">
                                    <div className={`h-2 w-20 rounded-full bg-gray-100 overflow-hidden`}>
                                        <div 
                                            className={`h-full rounded-full bg-orange-500`} 
                                            style={{ width: `${(result.bonus.reduce((sum, item) => sum + (item.actualScore || 0), 0) / (maxBonus || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-orange-600 font-bold">
                                        +{result.bonus.reduce((sum, item) => sum + (item.actualScore || 0), 0)}
                                    </span>
                                    <span className="text-gray-300">/</span>
                                    {maxBonus}
                                </div>
                            </div>
                            
                            <div className="pl-7 space-y-4">
                                {result.bonus.length === 0 ? (
                                    <div className="text-xs text-gray-400 italic">无加分项</div>
                                ) : result.bonus.map((item, idx) => {
                                    const maxScore = item.maxScore || 0;
                                    const actualScore = item.actualScore || 0;
                                    const isFullScore = actualScore === maxScore;
                                    const hasScore = actualScore > 0;
                                    
                                    return (
                                        <div key={`bonus-${idx}`} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-orange-200 transition-colors print:border-gray-200 shadow-sm">
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-700">{item.level2 || item.level1}</div>
                                                    {item.evidence && (
                                                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                            <FileSearch size={10} className="text-primary-500"/>
                                                            依据: {item.evidence}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right flex items-center gap-2">
                                                    {!isFullScore && (
                                                        <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded font-medium border border-orange-100">
                                                            {hasScore ? `未获满分 (-${maxScore - actualScore})` : '未获加分'}
                                                        </span>
                                                    )}
                                                    {isFullScore && (
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium border border-green-100">
                                                            已获满分
                                                        </span>
                                                    )}
                                                    <div className="text-sm font-bold">
                                                        <span className={`${isFullScore ? 'text-green-600' : hasScore ? 'text-orange-600' : 'text-gray-400'}`}>+{actualScore}</span>
                                                        <span className="text-gray-300 mx-1">/</span>
                                                        <span className="text-gray-400">{maxScore}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Box */}
                                            {isFullScore ? (
                                                // Success View (Green theme for full bonus)
                                                <div className="text-xs text-green-700 bg-green-50/50 p-2 rounded border border-green-100 flex items-start gap-2 mt-2">
                                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-600" />
                                                    <div>
                                                        <span className="font-bold mr-1">加分依据：</span>
                                                        {item.analysis}
                                                    </div>
                                                </div>
                                            ) : (
                                                // Warning View (Orange theme for partial or missed bonus)
                                                <div className="bg-orange-50 border border-orange-100 rounded p-3 text-xs text-gray-600 mt-2 flex gap-3">
                                                    <div className="mt-0.5 shrink-0 text-orange-500">
                                                        <AlertTriangle size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-orange-800 mb-1">未获满分原因与提升建议</div>
                                                        <p className="leading-relaxed mb-1 text-gray-700">{item.analysis}</p>
                                                        {item.missingInfo && (
                                                            <div className="mt-2 pt-2 border-t border-orange-200/50 text-orange-700 flex items-start gap-1.5">
                                                                <FileText size={12} className="mt-0.5"/>
                                                                <span>
                                                                    <span className="font-bold">建议补充材料:</span> {item.missingInfo}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>

              </div>
          </div>
      );
  };

  const renderTaskList = () => {
      return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden animate-fade-in">
              {/* Header with Search/Filters */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <FileText size={18} className="text-primary-600" />
                          评级报告列表
                      </h3>
                      {tasks.length > 0 && (
                          <div className="text-xs text-gray-500 flex gap-3">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> GE1</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> GE2</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> GE3</span>
                          </div>
                      )}
                  </div>
                  
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                          <input 
                              type="text" 
                              placeholder="搜索企业、等级或摘要..." 
                              value={reportSearchTerm}
                              onChange={(e) => setReportSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
                          />
                      </div>
                      <LevelFilterDropdown selected={filterLevels} onChange={setFilterLevels} />
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {tasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <Sparkles size={32} className="text-gray-300" />
                          </div>
                          <p className="text-lg font-medium text-gray-500">暂无评级报告</p>
                          <p className="text-sm mt-1">请在左侧选择企业与规则启动评级测算</p>
                      </div>
                  ) : filteredTasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <p className="text-sm">未找到匹配的评级报告</p>
                      </div>
                  ) : (
                      filteredTasks.map(task => {
                          const ent = getEntInfo(task.enterpriseId);
                          const method = ratingMethodologies.find(m => m.id === task.methodologyId);
                          const result = task.result;
                          const levelCode = result?.level || '';
                          const levelColor = levelCode.includes('1') ? 'emerald' : levelCode.includes('2') ? 'blue' : levelCode.includes('3') ? 'yellow' : 'gray';

                          const getBadgeClass = (code: string) => {
                              if (code.includes('1')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                              if (code.includes('2')) return 'bg-blue-100 text-blue-700 border-blue-200';
                              if (code.includes('3')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                              return 'bg-gray-100 text-gray-700 border-gray-200';
                          }

                          const getTagClass = (code: string) => {
                              if (code.includes('1')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                              if (code.includes('2')) return 'bg-blue-50 text-blue-600 border-blue-100';
                              if (code.includes('3')) return 'bg-yellow-50 text-yellow-600 border-yellow-100';
                              return 'bg-gray-50 text-gray-600 border-gray-100';
                          }

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
                                          <div className="mt-1 shrink-0">
                                              {task.status === 'pending' && <Clock size={18} className="text-gray-400 animate-pulse" />}
                                              {task.status === 'processing' && <Loader2 size={18} className="text-primary-500 animate-spin" />}
                                              {task.status === 'completed' && (
                                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${getBadgeClass(levelCode)}`}>
                                                      {result?.level || 'N/A'}
                                                  </div>
                                              )}
                                              {task.status === 'failed' && <AlertTriangle size={18} className="text-red-400" />}
                                          </div>
                                          
                                          <div className="min-w-0">
                                              <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                  <span className="truncate" title={ent ? ent.name : '未知企业'}>
                                                      {ent ? ent.name : '未知企业'}
                                                  </span>
                                                  {result && (
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-normal shrink-0 ${getTagClass(levelCode)}`}>
                                                          {result.levelName}
                                                      </span>
                                                  )}
                                              </div>
                                              
                                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                   <span className="truncate max-w-[150px]" title={method?.name}>{method?.name || '未知规则'}</span>
                                                   <span className="text-gray-300">|</span>
                                                   <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                              </div>

                                              {result && (
                                                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                                      <span className="font-medium">得分: {result.totalScore}</span>
                                                      <div className="w-px h-3 bg-gray-300"></div>
                                                      <div className="flex gap-2">
                                                          <span title="定量得分">定量: {result.quantitative.reduce((sum, i) => sum + (i.actualScore || 0), 0)}</span>
                                                          <span title="加分项得分">加分: {result.bonus.reduce((sum, i) => sum + (i.actualScore || 0), 0)}</span>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                          {task.status === 'completed' && (
                                              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                                          )}
                                      </div>
                                  </div>
                                  
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.filter(t => t.id !== task.id)); }}
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
      );
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col print:h-auto print:p-0">
      <div className="mb-4 print:hidden">
           <h2 className="text-2xl font-bold text-gray-800">评绿结果</h2>
           <p className="text-gray-500 mt-1 text-sm">基于多维模型对企业ESG表现及绿色等级进行智能化评定</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 print:block">
          
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-3 flex flex-col gap-4 print:hidden">
              
              {/* Enterprise Selector (Multi-select) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                          <Building2 size={16} className="text-primary-600" />
                          1. 选择企业信息
                      </h3>
                      {selectedEntIds.length > 0 && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded font-medium">{selectedEntIds.length} 已选</span>}
                  </div>
                  
                  {/* Enterprise Search Input */}
                  <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="搜索企业名称或行业..." 
                            value={entSearchTerm}
                            onChange={(e) => setEntSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-gray-50/50"
                        />
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
                      {filteredEnterprises.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400">未找到匹配企业</div>
                      ) : filteredEnterprises.map(ent => {
                          const isSelected = selectedEntIds.includes(ent.id);
                          return (
                              <div
                                  key={ent.id}
                                  onClick={() => toggleEntSelection(ent.id)}
                                  className={`relative w-full text-left p-3 rounded-lg border transition-all cursor-pointer group flex items-start gap-3 ${
                                      isSelected 
                                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                              >
                                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white group-hover:border-primary-400'
                                  }`}>
                                      {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  <div className="min-w-0">
                                      <div className={`font-medium text-sm truncate ${isSelected ? 'text-primary-900' : 'text-gray-700'}`} title={ent.name}>{ent.name}</div>
                                      <div className="text-xs text-gray-400 mt-0.5 truncate">{ent.industry}</div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Methodology Selector */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                      <Layers size={16} className="text-primary-600" />
                      2. 选择评级规则
                  </h3>
                  
                  {/* Methodology Search Input */}
                  <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="搜索规则名称..." 
                            value={methodSearchTerm}
                            onChange={(e) => setMethodSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-gray-50/50"
                        />
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredMethodologies.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400">未找到匹配规则</div>
                      ) : filteredMethodologies.map(m => (
                          <button
                              key={m.id}
                              onClick={() => setSelectedMethodId(m.id)}
                              className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                                  selectedMethodId === m.id 
                                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 text-primary-900' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                              <div className="font-medium truncate">{m.name}</div>
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                  <span className="bg-gray-100 px-1 rounded">{m.version}</span>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Action */}
              <button 
                  onClick={handleStartRating}
                  disabled={selectedEntIds.length === 0 || !selectedMethodId || isProcessing}
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all
                      ${(selectedEntIds.length === 0 || !selectedMethodId || isProcessing)
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-lg hover:shadow-primary-500/30'}`}
              >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                  {isProcessing ? '正在评级...' : selectedEntIds.length > 1 ? `批量评级 (${selectedEntIds.length})` : '开始评级测算'}
              </button>
          </div>

          {/* Right Panel: List or Detail */}
          <div className="lg:col-span-9 h-full min-h-0 print:col-span-12">
              {activeTaskId ? renderDetailView() : renderTaskList()}
          </div>

      </div>
    </div>
  );
};
