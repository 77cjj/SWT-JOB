export type SecondJobDifficulty = '高' | '中' | '低';
export type JobAccessTier = 'public' | 'community' | 'premium';
export type CultureType = '友好' | '一般' | '严格' | '国际化' | '本地化';
export type EmployerAttitude = '非常友好' | '友好' | '一般' | '严格' | '苛刻';
export type HousingCondition = '很好' | '良好' | '一般' | '较差' | '很差';

export interface JobRecord {
  jobId: string;
  jobTitle: string;
  company: string;
  state: string;
  city?: string; // 城市/地点

  hourlyWage: number;
  overtimeRate: number;
  tipped: boolean;
  averageTip?: [number, number];

  avgHoursPerWeek: number;
  workHoursRange: [number, number];
  overtimeAvailable: boolean;

  hasHousing: boolean;
  housingCostPerWeek: number;
  housingDistanceKm: number;
  housingCondition?: HousingCondition; // 住宿情况

  secondJobPossible: SecondJobDifficulty;
  secondJobHours: number;
  secondJobIndustry: string;
  // 二工时薪（可选，不填则使用默认预估值）
  secondJobHourlyWage?: number;

  workStability: 1 | 2 | 3 | 4 | 5;
  costOfLivingIndex: number;
  safetyLevel: 1 | 2 | 3 | 4 | 5;
  employerRating: 1 | 2 | 3 | 4 | 5;
  lastYearIncidents: boolean;

  // 新增字段
  culture?: CultureType; // 文化情况
  employerAttitude?: EmployerAttitude; // 雇主态度
  employeeBenefits?: string; // 员工福利（如：健康保险、餐补、交通补贴等）

  description: string;
  projectStartDate: string;
  projectEndDate: string;
  year?: number; // 年份，用于岗位情报
  /** 访问层级：public 全公开；community 雇主脱敏；premium 仅会员可见详情 */
  accessTier?: JobAccessTier;
  /** 脱敏后的雇主展示名，如「NJ 某 Boardwalk 餐饮」 */
  companyMasked?: string;
  /** 往届生验证人数 */
  verifiedCount?: number;
}

