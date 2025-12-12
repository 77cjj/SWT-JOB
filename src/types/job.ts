export type SecondJobDifficulty = '高' | '中' | '低';

export interface JobRecord {
  jobId: string;
  jobTitle: string;
  company: string;
  city: string;
  state: string;
  stateTaxRate: number; // 0.06 -> 6%
  jobType: string;

  hourlyWage: number;
  overtimeRate: number;
  tipped: boolean;
  averageTip?: [number, number];

  avgHoursPerWeek: number;
  workHoursRange: [number, number];
  overtimeAvailable: boolean;

  // 工作时间段
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string

  hasHousing: boolean;
  housingCostPerWeek: number;
  housingDistanceKm: number;

  secondJobPossible: SecondJobDifficulty;
  secondJobHours: number;
  secondJobIndustry: string;

  workStability: 1 | 2 | 3 | 4 | 5;
  costOfLivingIndex: number;
  safetyLevel: 1 | 2 | 3 | 4 | 5;
  employerRating: 1 | 2 | 3 | 4 | 5;
  lastYearIncidents: boolean;

  description: string;
  highlights: string[];
  projectStartDate: string;
  projectEndDate: string;
}

