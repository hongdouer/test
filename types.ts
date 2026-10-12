export interface EnterpriseDocument {
  id: string;
  name: string;
  type: 'PDF' | 'DOC' | 'JPG' | 'OTHER';
  tag: string;
  summary?: string;
  uploadDate: string;
}

export interface EnterpriseActivity {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  description: string;
}

export interface Enterprise {
  id: string;
  name: string;
  creditCode: string; // 统一社会信用代码
  industry: string; // 行业分类 (GB/T 4754)
  registeredCapital: string;
  businessScope: string;
  fundsUse: string; // 资金用途
  documents: EnterpriseDocument[];
  riskLevel?: 'Low' | 'Medium' | 'High';
  activities?: EnterpriseActivity[];
  
  // Enhanced Business Info (工商扩充字段)
  legalRepresentative?: string; // 法定代表人
  foundingDate?: string; // 成立日期
  registrationStatus?: string; // 登记状态 (在营/存续/注销)
  osdcStatus?: string; // OSDC状态 (第三方平台数据状态)
  address?: string; // 注册地址
  phoneNumber?: string; // 电话
  email?: string; // 邮箱
  website?: string; // 官网
  organizationCode?: string; // 组织机构代码
  taxpayerType?: string; // 纳税人资质 (一般纳税人/小规模)
  staffSize?: string; // 人员规模
  businessTerm?: string; // 营业期限
  registrationAuthority?: string; // 登记机关
  region?: string; // 所属地区
  introduction?: string; // 企业简介
}

export interface LoanActivity {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  description: string;
}

export enum LoanType {
  WORKING_CAPITAL = '流动资金贷款',
  PROJECT_LOAN = '项目贷款',
  TRADE_FINANCE = '贸易融资',
  GREEN_LOAN = '绿色信贷',
  OTHER = '其他'
}

export enum LoanStatus {
  DRAFT = '草稿',
  SUBMITTED = '已提交',
  UNDER_REVIEW = '审核中',
  APPROVED = '已审批',
  REJECTED = '已拒绝'
}

export interface Loan {
  id: string;
  contractNo: string;
  enterpriseId: string;
  projectName?: string;
  amount: number;
  currency: string;
  interestRate?: number;
  interestRateTo?: number;
  termMonths?: number;
  startDate?: string;
  endDate?: string;
  repaymentMethod?: string;
  useOfFunds?: string;
  guarantor?: string;
  manager?: string;
  loanType: string | LoanType;
  status?: LoanStatus;
  documents?: EnterpriseDocument[];
  activities?: LoanActivity[];
}

export enum MethodologyType {
  NATIONAL = '国家政策',
  LOCAL = '地方政策',
  BANK = '银行规则',
  RATING_MODEL = '评级规则'
}

export enum UserRole {
  RELATIONSHIP_MANAGER = '客户经理',
  RISK_MANAGER = '风险经理',
  PRODUCT_MANAGER = '产品经理',
  AUDITOR = '审核员'
}

export enum ApplicationStage {
  PRE_LOAN = '贷前阶段',
  LOAN_REVIEW = '贷中审查',
  POST_LOAN = '贷后管理'
}

export interface CatalogItem {
  code: string;
  category: string;
  name: string;
  conditions: string[];
  remarks?: string;
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
  l5?: string;
  standard?: string;
  evidence?: string;
}

export interface RatingIndicator {
  title?: string;
  description?: string;
  level1?: string;
  level2?: string;
  score?: number | string; // Allow string for form inputs
  maxScore?: number;
  standard?: string;
  analysis?: string;
  evidence?: string;
  missingInfo?: string;
}

export interface RatingLevel {
  level: string;
  name: string;
  scoreRange: string;
  minScore?: string; // New: Min score input
  maxScore?: string; // New: Max score input
  description: string;
  color: string;
}

export interface RatingDirectRule {
  levelName: string;
  condition: string;
  formula: string;
}

export interface RatingModelConfig {
  qualitative: RatingIndicator[];
  quantitative: RatingIndicator[];
  bonus: RatingIndicator[];
  levels: RatingLevel[];
  directRules: RatingDirectRule[];
}

export interface Methodology {
  id: string;
  name: string;
  type: MethodologyType;
  version: string;
  status: string;
  effectiveDate: string;
  roles: UserRole[];
  stages: ApplicationStage[];
  content: string;
  catalogItems?: CatalogItem[];
  ratingConfig?: RatingModelConfig;
  lastUpdated: string;
}

export enum GreenStatus {
  GREEN = '绿色',
  DOUBTFUL = '存疑',
  NON_GREEN = '非绿'
}

export interface MatchDetail {
  ruleName: string;
  isMatched: boolean;
  matchedItems?: CatalogItem[];
  nearMatches?: { code: string; category: string; name: string; gap: string }[];
  reason: string;
  conditions?: { requirement: string; status: 'pass' | 'fail' | 'unknown'; detail: string }[];
  missingDocs?: string[];
  category?: string;
}

export interface MatchingResult {
  status: GreenStatus;
  confidence: number;
  summary: string;
  details: MatchDetail[];
  suggestions: string[];
  generatedAt: string;
}

export interface MatchingTask {
  id: string;
  loanId: string;
  enterpriseId: string;
  methodologyIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  result?: MatchingResult;
}

export interface RatingScoreDetail {
  level1?: string;
  level2?: string;
  maxScore?: number;
  actualScore?: number;
  analysis: string;
  evidence?: string;
  missingInfo?: string;
  passed?: boolean;
  item?: string;
}

export interface RatingResult {
  totalScore: number;
  level: string;
  levelName: string;
  summary: string;
  qualitative: RatingScoreDetail[];
  quantitative: RatingScoreDetail[];
  bonus: RatingScoreDetail[];
  suggestions: string[];
  generatedAt: string;
}

export interface RatingTask {
  id: string;
  enterpriseId: string;
  methodologyId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  result?: RatingResult;
}