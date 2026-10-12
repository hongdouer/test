
import { Enterprise, Loan, Methodology, MethodologyType, UserRole, ApplicationStage, LoanType } from './types';
import { CATALOG_2025_ITEMS } from './data/GreenFinanceCatalog2025';

export const MOCK_ENTERPRISES: Enterprise[] = [
    {
        id: 'ent_001',
        name: '四川光耀新能源科技有限公司',
        creditCode: '91510100MA6X123456',
        industry: 'C3825 - 光伏设备及元器件制造',
        registeredCapital: '10000万人民币',
        businessScope: '太阳能光伏发电技术研发；光伏设备制造、销售；光伏电站建设、运营及维护服务；货物及技术进出口。',
        fundsUse: '建设50MW分布式光伏发电项目',
        legalRepresentative: '张伟',
        foundingDate: '2019-05-18',
        registrationStatus: '存续（在营、开业、在册）',
        osdcStatus: '已同步',
        address: '四川省成都市高新区天府大道1号',
        phoneNumber: '028-85123456',
        email: 'contact@guangyao-solar.com',
        website: 'www.guangyao-solar.com',
        organizationCode: 'MA6X1234-5',
        taxpayerType: '一般纳税人',
        staffSize: '100-499人',
        businessTerm: '2019-05-18 至 无固定期限',
        registrationAuthority: '成都市高新技术产业开发区市场监督管理局',
        region: '四川省成都市',
        introduction: '四川光耀新能源科技有限公司是一家专注于高效光伏组件研发、制造及光伏电站整体解决方案的高新技术企业。公司拥有多项光伏电池核心专利，产品广泛应用于集中式地面电站及工商业分布式电站。',
        riskLevel: 'Low',
        documents: [
            { id: 'd1_1', name: '营业执照.jpg', type: 'JPG', tag: '基础证照', summary: '三证合一', uploadDate: '2024-05-20' },
            { id: 'd1_2', name: '2023年度财务审计报告.pdf', type: 'PDF', tag: '财务资料', summary: '无保留意见', uploadDate: '2024-05-20' },
            { id: 'd1_3', name: '高新技术企业证书.jpg', type: 'JPG', tag: '资质证书', summary: '有效期至2026年', uploadDate: '2024-05-22' },
            { id: 'd1_4', name: '信用等级报告.pdf', type: 'PDF', tag: '评估报告', summary: 'AAA级', uploadDate: '2024-05-22' }
        ],
        activities: [
            { id: 'act_e1_1', action: '系统录入', actor: '陈经理', timestamp: '2024-05-20 09:30:00', description: '企业档案建立，同步工商基本信息' },
            { id: 'act_e1_2', action: '资料上传', actor: '陈经理', timestamp: '2024-05-20 14:15:00', description: '上传了营业执照及财务审计报告' }
        ]
    },
    {
        id: 'ent_002',
        name: '杭州绿环资源再生利用有限公司',
        creditCode: '91330100MA2B987654',
        industry: 'C4220 - 非金属废料和碎屑加工处理',
        registeredCapital: '5000万人民币',
        businessScope: '废旧物资回收（含金属、塑料、废旧电池）；资源再生技术研发；再生资源加工、销售；环保设备销售。',
        fundsUse: '年处理2万吨废旧锂电池回收线技改项目',
        legalRepresentative: '李明',
        foundingDate: '2020-11-02',
        registrationStatus: '存续（在营、开业、在册）',
        osdcStatus: '已同步',
        address: '浙江省杭州市余杭区环保产业园',
        phoneNumber: '0571-88996666',
        email: 'info@luhuan-cycle.cn',
        website: 'www.luhuan-cycle.cn',
        organizationCode: 'MA2B9876-5',
        taxpayerType: '一般纳税人',
        staffSize: '50-99人',
        businessTerm: '2020-11-02 至 2050-11-01',
        registrationAuthority: '杭州市余杭区市场监督管理局',
        region: '浙江省杭州市',
        introduction: '杭州绿环资源再生利用有限公司致力于城市矿产资源的循环利用，特别是废旧锂电池、电子废弃物的无害化处理与资源化利用。公司已获得多项循环经济示范企业荣誉。',
        riskLevel: 'Medium',
        documents: [
            { id: 'd2_1', name: '营业执照.jpg', type: 'JPG', tag: '基础证照', summary: '三证合一', uploadDate: '2024-07-08' },
            { id: 'd2_2', name: '危险废物经营许可证.pdf', type: 'PDF', tag: '资质证书', summary: '核准经营类别：HW46', uploadDate: '2024-07-08' },
            { id: 'd2_3', name: '技改项目环境影响报告书.pdf', type: 'PDF', tag: '评估报告', summary: '年处理2万吨废旧锂电池项目', uploadDate: '2024-07-09' },
            { id: 'd2_4', name: '排污许可证.pdf', type: 'PDF', tag: '资质证书', summary: '有效期5年', uploadDate: '2024-07-09' }
        ],
        activities: [
            { id: 'act_e2_1', action: '系统录入', actor: '王经理', timestamp: '2024-07-08 10:00:00', description: '企业档案建立，同步工商基本信息' },
            { id: 'act_e2_2', action: '信息更新', actor: '王经理', timestamp: '2024-07-09 11:20:00', description: '更新了企业简介与经营范围信息' }
        ]
    },
    {
        id: 'ent_003',
        name: '冀北特种钢铁集团有限公司',
        creditCode: '91130200MA0D555888',
        industry: 'C3120 - 炼钢',
        registeredCapital: '50000万人民币',
        businessScope: '特种钢冶炼、加工、销售；金属材料、建筑材料销售；货物进出口；普通货运。',
        fundsUse: '烧结机烟气超低排放改造工程',
        legalRepresentative: '王强',
        foundingDate: '2005-08-15',
        registrationStatus: '存续（在营、开业、在册）',
        osdcStatus: '数据更新中',
        address: '河北省唐山市曹妃甸工业区',
        phoneNumber: '0315-5558888',
        email: 'office@jibeisteel.com',
        website: 'www.jibeisteel.com',
        organizationCode: 'MA0D5558-8',
        taxpayerType: '一般纳税人',
        staffSize: '1000-4999人',
        businessTerm: '2005-08-15 至 无固定期限',
        registrationAuthority: '唐山市曹妃甸区行政审批局',
        region: '河北省唐山市',
        introduction: '冀北特种钢铁集团有限公司是河北省重点特钢企业，主要产品包括优质碳素结构钢、合金结构钢等。近年来，公司积极响应国家“双碳”政策，大力推进生产工艺的绿色化、低碳化改造。',
        riskLevel: 'Medium',
        documents: [
            { id: 'd3_1', name: '营业执照.jpg', type: 'JPG', tag: '基础证照', summary: '统一社会信用代码', uploadDate: '2024-07-25' },
            { id: 'd3_2', name: '排污许可证(副本).jpg', type: 'JPG', tag: '资质证书', summary: '重点排污单位', uploadDate: '2024-07-25' },
            { id: 'd3_3', name: '能源管理体系认证证书.pdf', type: 'PDF', tag: '资质证书', summary: 'ISO 50001', uploadDate: '2024-07-26' },
            { id: 'd3_4', name: '2023年度碳排放核查报告.pdf', type: 'PDF', tag: '评估报告', summary: '第三方核查机构出具', uploadDate: '2024-07-26' },
            { id: 'd3_5', name: '安全生产许可证.jpg', type: 'JPG', tag: '资质证书', summary: '有效期至2025年', uploadDate: '2024-07-25' }
        ],
        activities: [
            { id: 'act_e3_1', action: '系统录入', actor: '刘经理', timestamp: '2024-07-25 09:00:00', description: '企业档案建立，同步工商基本信息' }
        ]
    },
    {
        id: 'ent_004',
        name: '苏州生态农业发展有限公司',
        creditCode: '91320500MA1T666999',
        industry: 'A0111 - 稻谷种植',
        registeredCapital: '2000万人民币',
        businessScope: '谷物种植；农产品初加工；生态农业观光旅游；农业技术开发与咨询；不再分装的包装种子销售。',
        fundsUse: '绿色有机水稻种植基地运营',
        legalRepresentative: '赵芳',
        foundingDate: '2022-03-10',
        registrationStatus: '存续（在营、开业、在册）',
        osdcStatus: '待核验',
        address: '江苏省苏州市吴中区现代农业示范园',
        phoneNumber: '0512-66699999',
        email: 'market@suzhou-ecoagri.com',
        website: '',
        organizationCode: 'MA1T6669-9',
        taxpayerType: '小规模纳税人',
        staffSize: '20-49人',
        businessTerm: '2022-03-10 至 2042-03-09',
        registrationAuthority: '苏州市吴中区市场监督管理局',
        region: '江苏省苏州市',
        introduction: '苏州生态农业发展有限公司是一家集有机种植、生态养殖与观光旅游为一体的现代农业企业。公司采用“稻鸭共作”等生态循环种养模式，致力于提供高品质的绿色农产品。',
        riskLevel: 'Low',
        documents: [
            { id: 'd4_1', name: '营业执照.jpg', type: 'JPG', tag: '基础证照', summary: '三证合一', uploadDate: '2024-08-20' },
            { id: 'd4_2', name: '土地流转经营权证.pdf', type: 'PDF', tag: '资产证明', summary: '500亩耕地', uploadDate: '2024-08-20' },
            { id: 'd4_3', name: '有机产品认证证书.jpg', type: 'JPG', tag: '资质证书', summary: '水稻、鸭蛋', uploadDate: '2024-08-21' },
            { id: 'd4_4', name: '农产品质量安全检测报告.pdf', type: 'PDF', tag: '评估报告', summary: '无农残检出', uploadDate: '2024-08-21' }
        ],
        activities: [
            { id: 'act_e4_1', action: '系统录入', actor: '赵经理', timestamp: '2024-08-20 15:30:00', description: '企业档案建立，同步工商基本信息' }
        ]
    }
];

export const MOCK_LOANS: Loan[] = [
    {
        id: 'loan_001',
        contractNo: 'JK-2024-0520-001',
        enterpriseId: 'ent_001',
        projectName: '50MW分布式光伏电站项目',
        amount: 3500,
        currency: 'CNY',
        interestRate: 3.25,
        interestRateTo: 3.45,
        termMonths: 60,
        startDate: '2024-06-01',
        endDate: '2029-05-31',
        useOfFunds: '采购光伏组件、逆变器及支架，支付安装工程款',
        loanType: '清洁能源产业相关 - 建设',
        documents: [
            { id: 'ld_1', name: '借款合同.pdf', type: 'PDF', tag: '借款合同', summary: '合同号: CT-240520-01', uploadDate: '2024-05-25' },
            { id: 'ld_2', name: '项目备案证.jpg', type: 'JPG', tag: '绿色认定佐证', summary: '发改委备案证明', uploadDate: '2024-05-20' },
            { id: 'ld_3', name: '光伏组件采购合同.pdf', type: 'PDF', tag: '贸易背景材料', summary: '组件采购清单', uploadDate: '2024-05-25' }
        ],
        activities: []
    },
    {
        id: 'loan_002',
        contractNo: 'JK-2024-0708-003',
        enterpriseId: 'ent_002',
        projectName: '锂电池回收线技改',
        amount: 800,
        currency: 'CNY',
        interestRate: 3.6,
        termMonths: 36,
        startDate: '2024-08-01',
        endDate: '2027-07-31',
        useOfFunds: '购置自动化拆解设备、黑粉提取装置及废水处理系统',
        loanType: '资源循环利用产业相关 - 产线升级',
        documents: [
            { id: 'ld_4', name: '授信批复通知书.pdf', type: 'PDF', tag: '授信批复', summary: '额度800万', uploadDate: '2024-07-10' },
            { id: 'ld_5', name: '技改项目可行性研究报告.pdf', type: 'PDF', tag: '其他信贷资料', summary: '项目技术路线说明', uploadDate: '2024-07-09' }
        ],
        activities: []
    }
];

export const MOCK_METHODOLOGIES: Methodology[] = [
    {
        id: 'm1',
        name: '绿色金融支持项目目录（2025年版）',
        type: MethodologyType.NATIONAL,
        version: 'v2025',
        status: 'active',
        effectiveDate: '2025-01-01',
        roles: [UserRole.RELATIONSHIP_MANAGER, UserRole.RISK_MANAGER],
        stages: [ApplicationStage.PRE_LOAN, ApplicationStage.LOAN_REVIEW],
        content: '为落实党中央、国务院关于推动绿色发展的决策部署...',
        catalogItems: CATALOG_2025_ITEMS,
        lastUpdated: '2024-12-15'
    },
    {
        id: 'm3_rating',
        name: '企业ESG绿色评级规则 (通用版)', // Renamed from 模型
        type: MethodologyType.RATING_MODEL,
        version: 'v2.0',
        status: 'active',
        effectiveDate: '2026-02-01 ~ 2028-08-01', // Updated date range
        roles: [UserRole.RISK_MANAGER],
        stages: [ApplicationStage.PRE_LOAN, ApplicationStage.POST_LOAN],
        content: '适用于工业及制造业企业的ESG表现量化评价。',
        lastUpdated: '2024-03-01',
        ratingConfig: {
            qualitative: [
                { title: '绿色产业符合性', description: '主营业务需符合国家绿色产业目录定义。' },
                { title: '环境合规一票否决', description: '近一年无重大环境违法违规记录。' },
                { title: '公共信用状况', description: '企业信用等级需在B级及以上。' }
            ],
            quantitative: [
                { level1: '绿色效益', level2: '绿色产业营收占比', score: 4, standard: '≥50%得2分，≥90%得4分' },
                { level1: '绿色效益', level2: '节能改造投入占比', score: 4, standard: '≥30%得2分，≥50%得4分' },
                { level1: '绿色效益', level2: '绿色产业营收增长率', score: 2, standard: '高于行业平均值' },
                { level1: '能源效率', level2: '单位产品（产值）能耗下降率', score: 20, standard: '达到行业标杆值' },
                { level1: '环境影响', level2: '碳排放强度下降率', score: 5, standard: '同比下降>3%' },
                { level1: '环境影响', level2: '排污许可管理', score: 5, standard: '纳入排污许可管理' },
                { level1: '环境影响', level2: '排污许可证执行报告', score: 4, standard: '按时提交' },
                { level1: '环境影响', level2: '单位产品（产值）废水下降率', score: 3, standard: '优于基准值' },
                { level1: '环境影响', level2: '单位产品（产值）废气下降率', score: 3, standard: '优于基准值' },
                { level1: '环境影响', level2: '环保信用评价等级', score: 10, standard: '绿牌得满分，蓝牌得80%' },
                { level1: '环境影响', level2: '环境监测异常数据', score: 5, standard: '无超标记录' },
                { level1: '绿色转型', level2: '绿色园区', score: 4, standard: '所在园区为省级以上绿色园区' },
                { level1: '绿色转型', level2: '低碳技术', score: 5, standard: '拥有绿色低碳发明专利' },
                { level1: '绿色转型', level2: '绿色能源消纳', score: 3, standard: '绿电占比>10%' },
                { level1: '绿色转型', level2: '重点培植企业', score: 10, standard: '纳入政府重点支持名单' },
                { level1: '绿色转型', level2: '科创企业', score: 8, standard: '高新技术企业或科技型中小企业' },
                { level1: '社会责任', level2: '企业环境披露', score: 2, standard: '发布年度ESG报告' },
                { level1: '社会责任', level2: '社保覆盖率', score: 3, standard: '100%覆盖' }
            ],
            bonus: [
                { title: '绿色认证', description: '获得绿色工厂、绿色产品等国家级认证', score: 5 },
                { title: '双碳管理', description: '制定明确碳达峰路线图并有效执行', score: 5 },
                { title: '双碳金融', description: '参与碳交易或发行绿色债券', score: 5 }
            ],
            levels: [
                { level: 'GE1', name: '深绿企业', scoreRange: '≥90', description: '行业绿色标杆，优先支持', color: 'green' },
                { level: 'GE2', name: '中绿企业', scoreRange: '75-89', description: '绿色转型成效显著，重点支持', color: 'blue' },
                { level: 'GE3', name: '浅绿企业', scoreRange: '60-74', description: '起步阶段，引导支持', color: 'yellow' },
                { level: 'GE4', name: '非绿企业', scoreRange: '<60', description: '暂不符合绿色标准', color: 'gray' }
            ],
            directRules: [
                { levelName: '深绿企业 (GE1)', condition: '国家级绿色工厂 + 环保信用绿牌', formula: '直接认定为GE1 (95分)' }
            ]
        }
    }
];
