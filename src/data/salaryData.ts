import { JobSector, Parish, SectorSalaryTrend, ParishSalaryBenchmark } from '../types';

export type TimeframeOption = '3m' | '6m' | '1y';

export interface TimeframeConfig {
  id: TimeframeOption;
  label: string;
  shortLabel: string;
  monthsCount: number;
  periodDescription: string;
  monthsRangeLabel: string;
  badge: string;
}

export const TIMEFRAME_OPTIONS: TimeframeConfig[] = [
  {
    id: '3m',
    label: 'Last 3 Months',
    shortLabel: '3 Months',
    monthsCount: 3,
    periodDescription: 'July 2026 – September 2026 (Q3)',
    monthsRangeLabel: 'Jul 2026 – Sep 2026',
    badge: 'Quarterly View',
  },
  {
    id: '6m',
    label: 'Last 6 Months',
    shortLabel: '6 Months',
    monthsCount: 6,
    periodDescription: 'April 2026 – September 2026 (Trailing 6M)',
    monthsRangeLabel: 'Apr 2026 – Sep 2026',
    badge: 'Bi-Annual Default',
  },
  {
    id: '1y',
    label: 'Last 1 Year',
    shortLabel: '1 Year',
    monthsCount: 12,
    periodDescription: 'October 2025 – September 2026 (Trailing 12M)',
    monthsRangeLabel: 'Oct 2025 – Sep 2026',
    badge: 'Annual Macro View',
  },
];

export const DOMINICA_MONTHS_12 = [
  { key: '2025-10', label: 'Oct 2025' },
  { key: '2025-11', label: 'Nov 2025' },
  { key: '2025-12', label: 'Dec 2025' },
  { key: '2026-01', label: 'Jan 2026' },
  { key: '2026-02', label: 'Feb 2026' },
  { key: '2026-03', label: 'Mar 2026' },
  { key: '2026-04', label: 'Apr 2026' },
  { key: '2026-05', label: 'May 2026' },
  { key: '2026-06', label: 'Jun 2026' },
  { key: '2026-07', label: 'Jul 2026' },
  { key: '2026-08', label: 'Aug 2026' },
  { key: '2026-09', label: 'Sep 2026' },
];

export const DOMINICA_MONTHS_6 = DOMINICA_MONTHS_12.slice(-6);

export const getMonthsForTimeframe = (timeframe: TimeframeOption) => {
  const count = timeframe === '3m' ? 3 : timeframe === '1y' ? 12 : 6;
  return DOMINICA_MONTHS_12.slice(-count);
};

export const SECTOR_SALARY_TRENDS: SectorSalaryTrend[] = [
  {
    sector: 'Renewable Energy & Geothermal',
    color: '#059669', // Emerald-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 6850, vacanciesCount: 8 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 6950, vacanciesCount: 9 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 7100, vacanciesCount: 11 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 7200, vacanciesCount: 12 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 7300, vacanciesCount: 13 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 7380, vacanciesCount: 14 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 7450, vacanciesCount: 14 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 7600, vacanciesCount: 16 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 7850, vacanciesCount: 19 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 8100, vacanciesCount: 22 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 8350, vacanciesCount: 26 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 8650, vacanciesCount: 29 },
    ],
  },
  {
    sector: 'Information Technology & Digital',
    color: '#2563eb', // Blue-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 5900, vacanciesCount: 12 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 6050, vacanciesCount: 14 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 6150, vacanciesCount: 15 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 6200, vacanciesCount: 16 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 6300, vacanciesCount: 17 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 6350, vacanciesCount: 18 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 6400, vacanciesCount: 18 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 6650, vacanciesCount: 21 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 6800, vacanciesCount: 25 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 7100, vacanciesCount: 28 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 7350, vacanciesCount: 32 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 7550, vacanciesCount: 38 },
    ],
  },
  {
    sector: 'Banking & Financial Services',
    color: '#7c3aed', // Purple-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 5950, vacanciesCount: 14 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 6000, vacanciesCount: 14 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 6050, vacanciesCount: 15 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 6100, vacanciesCount: 15 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 6150, vacanciesCount: 15 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 6180, vacanciesCount: 15 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 6200, vacanciesCount: 15 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 6250, vacanciesCount: 17 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 6380, vacanciesCount: 16 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 6500, vacanciesCount: 19 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 6550, vacanciesCount: 20 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 6600, vacanciesCount: 22 },
    ],
  },
  {
    sector: 'Healthcare & Medical',
    color: '#dc2626', // Red-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 4700, vacanciesCount: 20 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 4750, vacanciesCount: 21 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 4800, vacanciesCount: 22 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 4850, vacanciesCount: 22 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 4880, vacanciesCount: 23 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 4900, vacanciesCount: 24 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 4950, vacanciesCount: 24 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 5050, vacanciesCount: 25 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 5120, vacanciesCount: 27 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 5200, vacanciesCount: 28 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 5320, vacanciesCount: 30 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 5450, vacanciesCount: 33 },
    ],
  },
  {
    sector: 'Eco-Tourism & Hospitality',
    color: '#d97706', // Amber-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 4200, vacanciesCount: 30 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 4400, vacanciesCount: 35 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 4750, vacanciesCount: 48 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 4900, vacanciesCount: 50 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 4850, vacanciesCount: 46 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 4750, vacanciesCount: 40 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 4800, vacanciesCount: 42 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 4650, vacanciesCount: 36 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 4700, vacanciesCount: 38 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 5100, vacanciesCount: 45 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 5300, vacanciesCount: 52 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 5500, vacanciesCount: 58 },
    ],
  },
  {
    sector: 'Logistics & Marine Services',
    color: '#0891b2', // Cyan-600
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 4300, vacanciesCount: 10 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 4380, vacanciesCount: 11 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 4500, vacanciesCount: 12 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 4520, vacanciesCount: 12 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 4550, vacanciesCount: 12 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 4580, vacanciesCount: 12 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 4600, vacanciesCount: 12 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 4720, vacanciesCount: 14 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 4800, vacanciesCount: 15 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 4950, vacanciesCount: 18 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 5080, vacanciesCount: 20 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 5200, vacanciesCount: 21 },
    ],
  },
  {
    sector: 'Agriculture & Agro-Processing',
    color: '#84cc16', // Lime-500
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 2950, vacanciesCount: 22 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 3000, vacanciesCount: 24 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 3080, vacanciesCount: 25 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 3100, vacanciesCount: 25 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 3150, vacanciesCount: 26 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 3180, vacanciesCount: 27 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 3200, vacanciesCount: 28 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 3300, vacanciesCount: 30 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 3450, vacanciesCount: 34 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 3580, vacanciesCount: 36 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 3650, vacanciesCount: 38 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 3750, vacanciesCount: 42 },
    ],
  },
  {
    sector: 'Education & Training',
    color: '#ec4899', // Pink-500
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 3850, vacanciesCount: 14 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 3900, vacanciesCount: 14 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 3950, vacanciesCount: 15 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 4000, vacanciesCount: 15 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 4020, vacanciesCount: 15 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 4050, vacanciesCount: 15 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 4100, vacanciesCount: 16 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 4150, vacanciesCount: 16 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 4200, vacanciesCount: 18 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 4350, vacanciesCount: 20 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 4500, vacanciesCount: 26 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 4620, vacanciesCount: 30 },
    ],
  },
  {
    sector: 'Public Sector & Cooperatives',
    color: '#64748b', // Slate-500
    data: [
      { month: '2025-10', monthLabel: 'Oct 2025', avgSalary: 3800, vacanciesCount: 18 },
      { month: '2025-11', monthLabel: 'Nov 2025', avgSalary: 3820, vacanciesCount: 18 },
      { month: '2025-12', monthLabel: 'Dec 2025', avgSalary: 3850, vacanciesCount: 19 },
      { month: '2026-01', monthLabel: 'Jan 2026', avgSalary: 3900, vacanciesCount: 19 },
      { month: '2026-02', monthLabel: 'Feb 2026', avgSalary: 3920, vacanciesCount: 19 },
      { month: '2026-03', monthLabel: 'Mar 2026', avgSalary: 3940, vacanciesCount: 20 },
      { month: '2026-04', monthLabel: 'Apr 2026', avgSalary: 3950, vacanciesCount: 20 },
      { month: '2026-05', monthLabel: 'May 2026', avgSalary: 4000, vacanciesCount: 20 },
      { month: '2026-06', monthLabel: 'Jun 2026', avgSalary: 4050, vacanciesCount: 22 },
      { month: '2026-07', monthLabel: 'Jul 2026', avgSalary: 4100, vacanciesCount: 22 },
      { month: '2026-08', monthLabel: 'Aug 2026', avgSalary: 4180, vacanciesCount: 24 },
      { month: '2026-09', monthLabel: 'Sep 2026', avgSalary: 4250, vacanciesCount: 25 },
    ],
  },
];

export const getSectorTrendsForTimeframe = (timeframe: TimeframeOption): SectorSalaryTrend[] => {
  const count = timeframe === '3m' ? 3 : timeframe === '1y' ? 12 : 6;
  return SECTOR_SALARY_TRENDS.map((t) => ({
    ...t,
    data: t.data.slice(-count),
  }));
};

export const PARISH_SALARY_BENCHMARKS: ParishSalaryBenchmark[] = [
  {
    parish: 'St. George',
    minSalary: 2800,
    q1Salary: 4500,
    medianSalary: 6400,
    q3Salary: 8600,
    maxSalary: 14500,
    sampleCount: 142,
    topSector: 'Banking & Financial Services',
    costOfLivingIndex: 115,
  },
  {
    parish: 'Island-wide / Remote',
    minSalary: 3500,
    q1Salary: 5200,
    medianSalary: 6800,
    q3Salary: 8900,
    maxSalary: 16000,
    sampleCount: 88,
    topSector: 'Information Technology & Digital',
    costOfLivingIndex: 98,
  },
  {
    parish: 'St. John',
    minSalary: 2600,
    q1Salary: 3800,
    medianSalary: 5100,
    q3Salary: 6900,
    maxSalary: 11200,
    sampleCount: 96,
    topSector: 'Eco-Tourism & Hospitality',
    costOfLivingIndex: 104,
  },
  {
    parish: 'St. Paul',
    minSalary: 2400,
    q1Salary: 3600,
    medianSalary: 4800,
    q3Salary: 6400,
    maxSalary: 9800,
    sampleCount: 64,
    topSector: 'Agriculture & Agro-Processing',
    costOfLivingIndex: 97,
  },
  {
    parish: 'St. Patrick',
    minSalary: 2200,
    q1Salary: 3200,
    medianSalary: 4300,
    q3Salary: 5800,
    maxSalary: 8500,
    sampleCount: 42,
    topSector: 'Eco-Tourism & Hospitality',
    costOfLivingIndex: 92,
  },
  {
    parish: 'St. David',
    minSalary: 2100,
    q1Salary: 3100,
    medianSalary: 4100,
    q3Salary: 5400,
    maxSalary: 7900,
    sampleCount: 38,
    topSector: 'Agriculture & Agro-Processing',
    costOfLivingIndex: 89,
  },
  {
    parish: 'St. Andrew',
    minSalary: 2300,
    q1Salary: 3400,
    medianSalary: 4500,
    q3Salary: 6100,
    maxSalary: 8800,
    sampleCount: 52,
    topSector: 'Logistics & Marine Services',
    costOfLivingIndex: 94,
  },
  {
    parish: 'St. Joseph',
    minSalary: 2200,
    q1Salary: 3300,
    medianSalary: 4400,
    q3Salary: 5900,
    maxSalary: 8200,
    sampleCount: 36,
    topSector: 'Eco-Tourism & Hospitality',
    costOfLivingIndex: 91,
  },
  {
    parish: 'St. Luke',
    minSalary: 2400,
    q1Salary: 3500,
    medianSalary: 4700,
    q3Salary: 6300,
    maxSalary: 9100,
    sampleCount: 30,
    topSector: 'Eco-Tourism & Hospitality',
    costOfLivingIndex: 95,
  },
  {
    parish: 'St. Mark',
    minSalary: 2300,
    q1Salary: 3400,
    medianSalary: 4600,
    q3Salary: 6200,
    maxSalary: 8700,
    sampleCount: 26,
    topSector: 'Eco-Tourism & Hospitality',
    costOfLivingIndex: 93,
  },
  {
    parish: 'St. Peter',
    minSalary: 2200,
    q1Salary: 3200,
    medianSalary: 4200,
    q3Salary: 5600,
    maxSalary: 7800,
    sampleCount: 22,
    topSector: 'Agriculture & Agro-Processing',
    costOfLivingIndex: 90,
  },
];

export interface SectorCompensationMatrix {
  sector: JobSector;
  entryLevel: { min: number; max: number; median: number };
  midLevel: { min: number; max: number; median: number };
  seniorLevel: { min: number; max: number; median: number };
  nepStipendSupport: boolean;
}

export const SECTOR_COMPENSATION_GUIDE: SectorCompensationMatrix[] = [
  {
    sector: 'Renewable Energy & Geothermal',
    entryLevel: { min: 4200, max: 5800, median: 5000 },
    midLevel: { min: 6500, max: 8800, median: 7600 },
    seniorLevel: { min: 9500, max: 15500, median: 12000 },
    nepStipendSupport: true,
  },
  {
    sector: 'Information Technology & Digital',
    entryLevel: { min: 3800, max: 5200, median: 4500 },
    midLevel: { min: 5800, max: 8000, median: 6900 },
    seniorLevel: { min: 8500, max: 14000, median: 11000 },
    nepStipendSupport: false,
  },
  {
    sector: 'Banking & Financial Services',
    entryLevel: { min: 3500, max: 4800, median: 4200 },
    midLevel: { min: 5200, max: 7200, median: 6100 },
    seniorLevel: { min: 7800, max: 13000, median: 9800 },
    nepStipendSupport: false,
  },
  {
    sector: 'Healthcare & Medical',
    entryLevel: { min: 3200, max: 4400, median: 3800 },
    midLevel: { min: 4500, max: 6200, median: 5300 },
    seniorLevel: { min: 6800, max: 11500, median: 8600 },
    nepStipendSupport: true,
  },
  {
    sector: 'Eco-Tourism & Hospitality',
    entryLevel: { min: 2800, max: 3800, median: 3300 },
    midLevel: { min: 4200, max: 5800, median: 4900 },
    seniorLevel: { min: 6200, max: 10500, median: 7800 },
    nepStipendSupport: true,
  },
  {
    sector: 'Logistics & Marine Services',
    entryLevel: { min: 3000, max: 4000, median: 3500 },
    midLevel: { min: 4400, max: 5900, median: 5100 },
    seniorLevel: { min: 6500, max: 9800, median: 7900 },
    nepStipendSupport: false,
  },
  {
    sector: 'Agriculture & Agro-Processing',
    entryLevel: { min: 2400, max: 3200, median: 2800 },
    midLevel: { min: 3500, max: 4800, median: 4100 },
    seniorLevel: { min: 5200, max: 8000, median: 6300 },
    nepStipendSupport: true,
  },
  {
    sector: 'Education & Training',
    entryLevel: { min: 2900, max: 3900, median: 3400 },
    midLevel: { min: 4100, max: 5400, median: 4700 },
    seniorLevel: { min: 5800, max: 8600, median: 6900 },
    nepStipendSupport: true,
  },
  {
    sector: 'Public Sector & Cooperatives',
    entryLevel: { min: 2700, max: 3600, median: 3100 },
    midLevel: { min: 3800, max: 5000, median: 4400 },
    seniorLevel: { min: 5500, max: 8200, median: 6500 },
    nepStipendSupport: true,
  },
];
