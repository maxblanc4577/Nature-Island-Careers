import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { JobSector } from '../types';
import {
  TrendingUp,
  Award,
  DollarSign,
  MapPin,
  Sparkles,
  ArrowRight,
  Briefcase,
  ChevronRight,
  GraduationCap,
  Building,
  Target,
  Clock,
  Compass,
} from 'lucide-react';

interface CareerStage {
  stage: string;
  experience: string;
  monthlyXCD: number;
  annualXCD: number;
  benchmarkNational: number;
  roleTitle: string;
  keyResponsibilities: string[];
  requiredCredentials: string[];
  timeframe: string;
  growthDriver: string;
}

interface SectorCareerData {
  sector: JobSector;
  parishHotspots: string;
  description: string;
  stages: CareerStage[];
}

const SECTOR_CAREER_PATHS: Record<JobSector, SectorCareerData> = {
  'Information Technology & Digital': {
    sector: 'Information Technology & Digital',
    parishHotspots: 'Roseau Bayfront (St. George), Canefield, Global WIN Remote',
    description:
      'Fastest growing salary ceiling driven by the Dominica Work In Nature (WIN) remote program and digital banking modernizations.',
    stages: [
      {
        stage: 'Entry / NEP Trainee',
        experience: '0–2 Years',
        monthlyXCD: 3200,
        annualXCD: 38400,
        benchmarkNational: 2400,
        roleTitle: 'Junior Web & Systems Technician',
        keyResponsibilities: [
          'IT helpdesk and network maintenance for Dominican small businesses',
          'Assisting with frontend content updates and database backups',
          'Implementing cybersecurity fundamentals and multi-factor auth',
        ],
        requiredCredentials: [
          'DSC Associate Degree in Computer Science',
          'CompTIA A+ or Google IT Support Certificate',
        ],
        timeframe: '1–2 Years',
        growthDriver: 'High local demand for computer-literate staff across public and private sectors',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 6500,
        annualXCD: 78000,
        benchmarkNational: 4200,
        roleTitle: 'Full-Stack Developer / Cloud Systems Specialist',
        keyResponsibilities: [
          'Building custom React/Node.js web applications and mobile portals',
          'Managing AWS/Cloud SQL relational databases for financial & retail firms',
          'Integrating payment APIs and regional banking clearing protocols',
        ],
        requiredCredentials: [
          'AWS Certified Solutions Architect – Associate',
          'Meta/Coursera Professional Full-Stack Certification',
        ],
        timeframe: '2–3 Years',
        growthDriver: 'Fintech digitizations and cross-Caribbean CSME e-commerce expansion',
      },
      {
        stage: 'Senior Lead / Architect',
        experience: '5–8 Years',
        monthlyXCD: 11000,
        annualXCD: 132000,
        benchmarkNational: 6500,
        roleTitle: 'Senior Cloud & Cybersecurity Lead',
        keyResponsibilities: [
          'Overseeing enterprise cloud architecture and disaster recovery failover',
          'Directing developer teams and mentoring DSC university interns',
          'Ensuring strict PCI-DSS and OECS financial privacy compliance',
        ],
        requiredCredentials: [
          'CISSP or Certified Information Security Manager',
          'B.Sc. in Computer Engineering or UWI Post-Graduate Diploma',
        ],
        timeframe: '3–4 Years',
        growthDriver: 'Leadership over mission-critical digital infrastructure for banking and telecom',
      },
      {
        stage: 'Executive / Director',
        experience: '8+ Years',
        monthlyXCD: 16500,
        annualXCD: 198000,
        benchmarkNational: 9500,
        roleTitle: 'Chief Technology Officer (CTO) / Remote Technical Director',
        keyResponsibilities: [
          'Establishing multi-year national IT roadmap and multimillion capital budgets',
          'Negotiating international cloud vendor contracts and carrier interconnections',
          'Driving regional digital transformation across OECS territories',
        ],
        requiredCredentials: [
          'Executive Leadership Credential (DSC/UWI)',
          '10+ Years demonstrated project delivery track record',
        ],
        timeframe: 'Career Peak',
        growthDriver: 'Global WIN remote clientele and multinational enterprise contracts',
      },
    ],
  },
  'Eco-Tourism & Hospitality': {
    sector: 'Eco-Tourism & Hospitality',
    parishHotspots: 'Portsmouth (Cabrits), Soufrière, Roseau Waterfront',
    description:
      'Dominica’s core economic powerhouse centered on ultra-luxury eco-resorts, marine sanctuaries, and peak winter cruise calls.',
    stages: [
      {
        stage: 'Entry / NEP Trainee',
        experience: '0–2 Years',
        monthlyXCD: 2500,
        annualXCD: 30000,
        benchmarkNational: 2200,
        roleTitle: 'Guest Relations Associate / Tour Coordinator',
        keyResponsibilities: [
          'Welcoming international guests and coordinating eco-excursions',
          'Managing concierge communications and booking software',
          'Executing Discover Dominica Authority (DDA) hospitality standards',
        ],
        requiredCredentials: [
          'DDA Certified Tour & Hospitality Specialist',
          'Dominica Red Cross First Aid & CPR',
        ],
        timeframe: '1–2 Years',
        growthDriver: 'Continuous demand for energetic, service-oriented Dominican youth',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 4800,
        annualXCD: 57600,
        benchmarkNational: 3800,
        roleTitle: 'Eco-Resort Operations Supervisor / Head Nature Guide',
        keyResponsibilities: [
          'Supervising front-of-house teams and VIP wilderness itineraries',
          'Managing resort dining room protocols and HACCP food safety checklists',
          'Auditing Green Globe sustainability metrics (composting, rainwater collection)',
        ],
        requiredCredentials: [
          'AHLEI Certified Hospitality Supervisor (CHS)',
          'Dominica Bureau of Standards (DBOS) HACCP Level 2',
        ],
        timeframe: '2–3 Years',
        growthDriver: 'Expansion of premier 5-star eco-villas and yachting marina services',
      },
      {
        stage: 'Senior Lead / Dept Head',
        experience: '5–8 Years',
        monthlyXCD: 8200,
        annualXCD: 98400,
        benchmarkNational: 5800,
        roleTitle: 'Director of Guest Experience & Sustainability',
        keyResponsibilities: [
          'Managing multimillion-dollar resort operations, staffing, and revenue targets',
          'Directing marketing partnerships with international luxury travel agencies',
          'Leading community engagement initiatives in surrounding villages',
        ],
        requiredCredentials: [
          'Associate / Bachelor Degree in Hospitality Management (DSC/UWI)',
          'Advanced Eco-Tourism Certification',
        ],
        timeframe: '3–4 Years',
        growthDriver: 'Surge in high-net-worth experiential travelers seeking untouched Nature Island stays',
      },
      {
        stage: 'Executive / General Manager',
        experience: '8+ Years',
        monthlyXCD: 14000,
        annualXCD: 168000,
        benchmarkNational: 8500,
        roleTitle: 'Resort General Manager / Tourism Development Director',
        keyResponsibilities: [
          'Full P&L accountability for luxury resort properties',
          'Representing Dominica at international tourism summits (WTM, Caribbean Travel Marketplace)',
          'Setting strategic standards for nature preservation and national employment',
        ],
        requiredCredentials: [
          'CHA (Certified Hotel Administrator) / Master Degree in Tourism Governance',
        ],
        timeframe: 'Career Peak',
        growthDriver: 'Executive resort leadership across premier properties like Secret Bay & Fort Young',
      },
    ],
  },
  'Renewable Energy & Geothermal': {
    sector: 'Renewable Energy & Geothermal',
    parishHotspots: 'Laudat / Roseau Valley (St. George), Fond Cole DOMLEC Hub',
    description:
      'Strategic national energy transition project (DGDC Laudat 10MW Geothermal Plant) powering Dominica toward 100% clean energy.',
    stages: [
      {
        stage: 'Entry / NEP Apprentice',
        experience: '0–2 Years',
        monthlyXCD: 3000,
        annualXCD: 36000,
        benchmarkNational: 2300,
        roleTitle: 'Junior Electrical & Wellhead Apprentice',
        keyResponsibilities: [
          'Assisting senior technicians with substation cabling and telemetry gauges',
          'Monitoring environmental buffer zones around Laudat water sources',
          'Adhering to high-voltage industrial safety protocols',
        ],
        requiredCredentials: [
          'DSC Electrical Engineering Technology Diploma',
          'Industrial Safety & CPR Card',
        ],
        timeframe: '1–2 Years',
        growthDriver: 'National transition push with direct scholarships funded through DGDC',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 6200,
        annualXCD: 74400,
        benchmarkNational: 4000,
        roleTitle: 'Geothermal Plant SCADA & Transmission Technician',
        keyResponsibilities: [
          'Operating SCADA industrial monitoring interfaces for steam wellhead flow',
          'Performing preventive maintenance on power transformers and turbine sensors',
          'Diagnosing electrical grid fault anomalies and coordinating DOMLEC grid tie-ins',
        ],
        requiredCredentials: [
          'CARICOM Energy Unit SCADA Certification',
          'High-Voltage Switching Certification',
        ],
        timeframe: '2–3 Years',
        growthDriver: 'Grid commissioning of the Laudat power station and subsea cable interconnections',
      },
      {
        stage: 'Senior Lead Engineer',
        experience: '5–8 Years',
        monthlyXCD: 9800,
        annualXCD: 117600,
        benchmarkNational: 6200,
        roleTitle: 'Senior Geothermal Operations & Maintenance Engineer',
        keyResponsibilities: [
          'Leading operational shifts at the Laudat plant with full safety oversight',
          'Analyzing thermodynamic reservoir models and steam extraction rates',
          'Supervising environmental compliance reports for Dominica Forestry Division',
        ],
        requiredCredentials: [
          'B.Sc. in Mechanical or Electrical Engineering',
          'NEBOSH International Safety Certificate',
        ],
        timeframe: '3–5 Years',
        growthDriver: 'Specialized geothermal expertise in volcanic island terrain commanding premium salaries',
      },
      {
        stage: 'Executive / Technical Director',
        experience: '8+ Years',
        monthlyXCD: 15500,
        annualXCD: 186000,
        benchmarkNational: 9000,
        roleTitle: 'Chief Energy Infrastructure Engineer / Director of Power Generation',
        keyResponsibilities: [
          'Directing national geothermal utility operations and regional interconnection agreements',
          'Liaising with World Bank, Caribbean Development Bank, and government ministries',
          'Leading Dominica’s export of clean energy to Martinique and Guadeloupe',
        ],
        requiredCredentials: [
          'Professional Engineer (PE) License / M.Sc. in Renewable Energy',
        ],
        timeframe: 'Career Peak',
        growthDriver: 'Directing Dominica’s sovereign clean energy transition and regional power grid exports',
      },
    ],
  },
  'Agriculture & Agro-Processing': {
    sector: 'Agriculture & Agro-Processing',
    parishHotspots: 'Portsmouth Hub (St. John), Marigot, Canefield Industrial Park',
    description:
      'High-potential sector modernizing with post-harvest cold storage, value-added packaging, and organic exports via DEXIA.',
    stages: [
      {
        stage: 'Entry / Apprentice',
        experience: '0–2 Years',
        monthlyXCD: 2400,
        annualXCD: 28800,
        benchmarkNational: 2100,
        roleTitle: 'Agro-Processing Lab & Quality Technician',
        keyResponsibilities: [
          'Assisting with raw produce grading, sorting, and packaging',
          'Executing food sanitation standards according to DBOS guidelines',
          'Recording warehouse inventory batches and cold-room temperature logs',
        ],
        requiredCredentials: ['DSC Certificate in Food Science', 'Food Handlers Health Card'],
        timeframe: '1–2 Years',
        growthDriver: 'New Portsmouth agro-processing hub and root crop packaging facilities',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 4600,
        annualXCD: 55200,
        benchmarkNational: 3600,
        roleTitle: 'Cold-Chain Logistics & Export Quality Specialist',
        keyResponsibilities: [
          'Managing climate-controlled freight shipments with regional sea carriers',
          'Auditing HACCP compliance for organic passionfruit and herbal products',
          'Coordinating CSME agricultural export documentation with DEXIA',
        ],
        requiredCredentials: [
          'DBOS HACCP Level 2 Food Safety',
          'DEXIA Export Readiness Certification',
        ],
        timeframe: '2–3 Years',
        growthDriver: 'Expanded CSME trade corridors and European demand for organic Dominican exports',
      },
      {
        stage: 'Senior Manager',
        experience: '5–8 Years',
        monthlyXCD: 7500,
        annualXCD: 90000,
        benchmarkNational: 5200,
        roleTitle: 'Agro-Industrial Plant Operations Manager',
        keyResponsibilities: [
          'Directing food processing factory floors, packaging lines, and supply intake',
          'Negotiating purchase agreements with agricultural cooperatives in all parishes',
          'Ensuring international organic certifications (USDA Organic, EU Bio)',
        ],
        requiredCredentials: [
          'B.Sc. in Agribusiness or Industrial Food Technology',
          'ISO 22000 Lead Auditor',
        ],
        timeframe: '3–4 Years',
        growthDriver: 'Value-added agro-manufacturing (herbal teas, essential oils, dried fruits)',
      },
      {
        stage: 'Executive / General Manager',
        experience: '8+ Years',
        monthlyXCD: 12500,
        annualXCD: 150000,
        benchmarkNational: 7800,
        roleTitle: 'Director of National Agribusiness & Export Logistics',
        keyResponsibilities: [
          'Driving national agricultural export strategy and trade policy negotiations',
          'Managing agricultural credit funds and cooperative infrastructure investments',
        ],
        requiredCredentials: ['Executive Masters in Agribusiness / International Trade'],
        timeframe: 'Career Peak',
        growthDriver: 'National food security and million-dollar Caribbean export trade agreements',
      },
    ],
  },
  'Public Sector & Cooperatives': {
    sector: 'Public Sector & Cooperatives',
    parishHotspots: 'Government Headquarters (Roseau), Portsmouth Town Council',
    description:
      'Steady public administration and statutory bodies (DSS, Credit Unions) providing structured salary bands and comprehensive pensions.',
    stages: [
      {
        stage: 'Entry Level',
        experience: '0–2 Years',
        monthlyXCD: 2700,
        annualXCD: 32400,
        benchmarkNational: 2300,
        roleTitle: 'Administrative Cadet / Customer Service Clerk',
        keyResponsibilities: [
          'Processing public records, citizen inquiries, and permit filings',
          'Maintaining official government records and spreadsheet registers',
        ],
        requiredCredentials: ['DSC Associate Degree in Public Administration or Business'],
        timeframe: '1–2 Years',
        growthDriver: 'Ongoing civil service modernization and youth cadet recruitment',
      },
      {
        stage: 'Mid-Level Officer',
        experience: '3–5 Years',
        monthlyXCD: 4800,
        annualXCD: 57600,
        benchmarkNational: 3700,
        roleTitle: 'Labour & DSS Compliance Auditor',
        keyResponsibilities: [
          'Auditing statutory employer social security filings and workplace regulations',
          'Facilitating dispute mediation conferences and employment conciliation',
        ],
        requiredCredentials: ['CVQ Level 3 in Business Admin', 'Ministry of Labour Statutory Cert'],
        timeframe: '2–3 Years',
        growthDriver: 'Statutory compliance push for private sector employers across Dominica',
      },
      {
        stage: 'Senior Officer / Assistant Secretary',
        experience: '5–8 Years',
        monthlyXCD: 7800,
        annualXCD: 93600,
        benchmarkNational: 5600,
        roleTitle: 'Senior Administrative Officer / Department Coordinator',
        keyResponsibilities: [
          'Managing ministerial division budgets and national project implementations',
          'Drafting Cabinet memos and parliamentary legislative review briefs',
        ],
        requiredCredentials: ['UWI Certificate in Public Sector Governance / B.Sc. Management'],
        timeframe: '3–4 Years',
        growthDriver: 'Promotions based on civil service examination and meritorious performance',
      },
      {
        stage: 'Executive / Permanent Secretary',
        experience: '8+ Years',
        monthlyXCD: 13500,
        annualXCD: 162000,
        benchmarkNational: 8500,
        roleTitle: 'Permanent Secretary / Statutory Chief Executive (DSS)',
        keyResponsibilities: [
          'Chief accounting officer for ministerial portfolios and sovereign statutory boards',
          'Formulating national public policy and international treaty compliance',
        ],
        requiredCredentials: ['Postgraduate Degree in Public Policy, Law, or Economics'],
        timeframe: 'Career Peak',
        growthDriver: 'Highest public service leadership tier in the Commonwealth of Dominica',
      },
    ],
  },
  'Banking & Financial Services': {
    sector: 'Banking & Financial Services',
    parishHotspots: 'Roseau Financial Center, Portsmouth NBD Branch',
    description:
      'Premier commercial banking (National Bank of Dominica), credit union cooperatives, and offshore financial compliance.',
    stages: [
      {
        stage: 'Entry Level',
        experience: '0–2 Years',
        monthlyXCD: 3000,
        annualXCD: 36000,
        benchmarkNational: 2400,
        roleTitle: 'Customer Care & Banking Operations Associate',
        keyResponsibilities: ['Teller operations, account onboarding, and KYC verification'],
        requiredCredentials: ['DSC Degree in Finance or Accounting', 'Anti-Money Laundering (AML) intro'],
        timeframe: '1–2 Years',
        growthDriver: 'Digital banking teller transition and merchant onboarding',
      },
      {
        stage: 'Mid-Level Officer',
        experience: '3–5 Years',
        monthlyXCD: 5800,
        annualXCD: 69600,
        benchmarkNational: 4100,
        roleTitle: 'Credit Analyst & Loan Officer',
        keyResponsibilities: ['Underwriting mortgage, SME, and eco-resort commercial loans'],
        requiredCredentials: ['OECS Banking Certificate / ACCA Foundation'],
        timeframe: '2–3 Years',
        growthDriver: 'Mortgage growth for new residential and commercial developments',
      },
      {
        stage: 'Senior Manager',
        experience: '5–8 Years',
        monthlyXCD: 9500,
        annualXCD: 114000,
        benchmarkNational: 6000,
        roleTitle: 'Senior Risk & Compliance Manager',
        keyResponsibilities: ['Directing Eastern Caribbean Central Bank (ECCB) compliance audits'],
        requiredCredentials: ['ACAMS Certification / ACCA or CPA qualification'],
        timeframe: '3–4 Years',
        growthDriver: 'Heightened international regulatory compliance and digital payments',
      },
      {
        stage: 'Executive / VP',
        experience: '8+ Years',
        monthlyXCD: 15500,
        annualXCD: 186000,
        benchmarkNational: 9000,
        roleTitle: 'Chief Financial Officer (CFO) / Managing Director',
        keyResponsibilities: ['Full balance sheet governance and investment portfolio management'],
        requiredCredentials: ['Chartered Financial Analyst (CFA) / MBA in Banking'],
        timeframe: 'Career Peak',
        growthDriver: 'Executive bank leadership across the Commonwealth and OECS region',
      },
    ],
  },
  'Healthcare & Medical': {
    sector: 'Healthcare & Medical',
    parishHotspots: 'Dominica China Friendship Hospital (Roseau), Marigot Hospital, Portsmouth Health Centre',
    description:
      'Modernized healthcare facilities expanding clinical specialties, biomedical engineering, and district health centers.',
    stages: [
      {
        stage: 'Entry Level',
        experience: '0–2 Years',
        monthlyXCD: 2800,
        annualXCD: 33600,
        benchmarkNational: 2300,
        roleTitle: 'Staff Nurse / Clinical Medical Assistant',
        keyResponsibilities: ['Inpatient triage, emergency room care, and medical records'],
        requiredCredentials: ['DSC Nursing Associate Degree / Dominica Nursing Council License'],
        timeframe: '1–2 Years',
        growthDriver: 'National healthcare recruitment across all health districts',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 5200,
        annualXCD: 62400,
        benchmarkNational: 3800,
        roleTitle: 'Specialized Clinical Nurse / Biomedical Equipment Tech',
        keyResponsibilities: ['Operating dialysis, diagnostic radiology, and ICU monitors'],
        requiredCredentials: ['Post-Basic Specialty Nursing Certificate / Biomedical Tech Cert'],
        timeframe: '2–3 Years',
        growthDriver: 'New specialized units at the modern Friendship Hospital in Roseau',
      },
      {
        stage: 'Senior Supervisor',
        experience: '5–8 Years',
        monthlyXCD: 8500,
        annualXCD: 102000,
        benchmarkNational: 5800,
        roleTitle: 'Department Head Nurse / Health Facility Administrator',
        keyResponsibilities: ['Directing ward operations, staffing rosters, and clinical safety SOPs'],
        requiredCredentials: ['B.Sc. in Nursing Administration / UWI Health Management Cert'],
        timeframe: '3–4 Years',
        growthDriver: 'Supervisory leadership over hospital wings and specialized clinics',
      },
      {
        stage: 'Executive / Chief Medical Officer',
        experience: '8+ Years',
        monthlyXCD: 14500,
        annualXCD: 174000,
        benchmarkNational: 8800,
        roleTitle: 'Medical Director / Hospital Chief Executive Officer',
        keyResponsibilities: ['Leading national healthcare delivery, public health policy, and physician staffing'],
        requiredCredentials: ['Medical Doctorate (MBBS/MD) + Specialist Fellowship / MHA'],
        timeframe: 'Career Peak',
        growthDriver: 'Executive governance of national public health and private wellness clinics',
      },
    ],
  },
  'Education & Training': {
    sector: 'Education & Training',
    parishHotspots: 'Dominica State College (Stockfarm, Roseau), UWI Open Campus, Secondary Schools',
    description:
      'Crucial sector developing Dominica’s talent in technical vocations, tourism, science, and digital computing.',
    stages: [
      {
        stage: 'Entry Level',
        experience: '0–2 Years',
        monthlyXCD: 2600,
        annualXCD: 31200,
        benchmarkNational: 2200,
        roleTitle: 'Assistant Teacher / Laboratory Demonstrator',
        keyResponsibilities: ['Classroom instruction, science lab demos, student grading'],
        requiredCredentials: ['DSC Associate Degree / Certified Teacher Training Diploma'],
        timeframe: '1–2 Years',
        growthDriver: 'National education literacy and STEM initiative expansion',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 4600,
        annualXCD: 55200,
        benchmarkNational: 3600,
        roleTitle: 'Certified Secondary Educator / Technical Lecturer',
        keyResponsibilities: ['Curriculum delivery in science, technical trades, and business subjects'],
        requiredCredentials: ['B.Sc. in Education / Technical Vocational CVQ Assessor'],
        timeframe: '2–3 Years',
        growthDriver: 'Expansion of TVET technical apprenticeships across schools',
      },
      {
        stage: 'Senior Supervisor',
        experience: '5–8 Years',
        monthlyXCD: 7200,
        annualXCD: 86400,
        benchmarkNational: 5200,
        roleTitle: 'Head of Department / Senior College Lecturer',
        keyResponsibilities: ['Managing academic faculties, curriculum accreditation, and examinations'],
        requiredCredentials: ['M.Ed. or Master Degree in Specialized Discipline'],
        timeframe: '3–4 Years',
        growthDriver: 'Accreditation leadership for Caribbean Examinations Council (CXC) & DSC degrees',
      },
      {
        stage: 'Executive / Dean',
        experience: '8+ Years',
        monthlyXCD: 12000,
        annualXCD: 144000,
        benchmarkNational: 7800,
        roleTitle: 'Principal / College Dean / Director of Academic Affairs',
        keyResponsibilities: ['Leading academic governance, institutional accreditation, and research partnerships'],
        requiredCredentials: ['Ph.D. or Ed.D. / Senior Academic Fellowship'],
        timeframe: 'Career Peak',
        growthDriver: 'Executive stewardship of Dominica’s premier tertiary education bodies',
      },
    ],
  },
  'Logistics & Marine Services': {
    sector: 'Logistics & Marine Services',
    parishHotspots: 'Portsmouth Cabrits Marina, Roseau Deep Water Harbour, Woodbridge Bay',
    description:
      'Booming maritime tourism, international yachting services in Prince Rupert Bay, and container freight logistics.',
    stages: [
      {
        stage: 'Entry Level',
        experience: '0–2 Years',
        monthlyXCD: 2700,
        annualXCD: 32400,
        benchmarkNational: 2200,
        roleTitle: 'Marina Dockhand / Customs Logistics Clerk',
        keyResponsibilities: ['Berthing support, fuel bunkering, customs declaration filing'],
        requiredCredentials: ['Maritime Safety Card / VHF Radio License'],
        timeframe: '1–2 Years',
        growthDriver: 'Surge in superyacht and charter vessel calls to Portsmouth',
      },
      {
        stage: 'Mid-Level Specialist',
        experience: '3–5 Years',
        monthlyXCD: 5200,
        annualXCD: 62400,
        benchmarkNational: 3800,
        roleTitle: 'Marine Technician / Customs Brokerage Specialist',
        keyResponsibilities: ['Diesel engine troubleshooting, fiberglass repairs, freight clearance'],
        requiredCredentials: ['ABYC Marine Certification / Licensed Customs Broker'],
        timeframe: '2–3 Years',
        growthDriver: 'Year-round technical servicing for cruising yachts and commercial barges',
      },
      {
        stage: 'Senior Lead',
        experience: '5–8 Years',
        monthlyXCD: 8500,
        annualXCD: 102000,
        benchmarkNational: 5700,
        roleTitle: 'Marina Operations Director / Freight Terminal Manager',
        keyResponsibilities: ['Managing port facility security (ISPS), vessel berthing schedules, and crane ops'],
        requiredCredentials: ['Captain License (Master 200GT) / Port Management Diploma'],
        timeframe: '3–4 Years',
        growthDriver: 'Modernization of Cabrits cruise terminal and yachting infrastructure',
      },
      {
        stage: 'Executive / Harbour Master',
        experience: '8+ Years',
        monthlyXCD: 14500,
        annualXCD: 174000,
        benchmarkNational: 8600,
        roleTitle: 'Chief Maritime Officer / Port Authority Executive',
        keyResponsibilities: ['Overall governance of national shipping lanes, marine pilotage, and maritime treaties'],
        requiredCredentials: ['Master Mariner (Class 1) or Maritime Law Post-Grad'],
        timeframe: 'Career Peak',
        growthDriver: 'Sovereign port authority oversight across all Commonwealth anchorages',
      },
    ],
  },
};

export const VisualCareerPathing: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<JobSector>(
    'Information Technology & Digital'
  );
  const [payPeriod, setPayPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(1);

  const careerData = SECTOR_CAREER_PATHS[selectedSector] || SECTOR_CAREER_PATHS['Information Technology & Digital'];
  const activeStage = careerData.stages[activeStageIndex] || careerData.stages[0];

  // Prepare chart data
  const chartData = careerData.stages.map((st) => ({
    stage: st.stage,
    salary: payPeriod === 'monthly' ? st.monthlyXCD : st.annualXCD,
    nationalAverage: payPeriod === 'monthly' ? st.benchmarkNational : st.benchmarkNational * 12,
    roleTitle: st.roleTitle,
    experience: st.experience,
  }));

  const maxSalary = Math.max(...chartData.map((d) => d.salary));
  const minSalary = Math.min(...chartData.map((d) => d.salary));
  const growthMultiplier = ((maxSalary - minSalary) / minSalary * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Interactive Recharts Compensation Visualizer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Dominica Career Pathing & Salary Growth
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Visualize progression trajectories, benchmark salary expectations in Eastern Caribbean Dollars (XCD), and explore the exact certifications required to advance from entry-level to director tier in Dominica.
          </p>
        </div>

        {/* Sector Quick Metric */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 self-start md:self-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
            Potential Salary Multiplier
          </span>
          <span className="text-3xl font-black font-mono text-white mt-0.5 block">
            +{growthMultiplier}%
          </span>
          <span className="text-[11px] text-emerald-200">
            From Entry to Executive
          </span>
        </div>
      </div>

      {/* SECTOR & VIEW CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Sector Selector */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>Select Target Industry / Sector:</span>
          </label>
          <select
            value={selectedSector}
            onChange={(e) => {
              setSelectedSector(e.target.value as JobSector);
              setActiveStageIndex(1); // default to mid-level
            }}
            className="w-full text-xs sm:text-sm font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            {Object.keys(SECTOR_CAREER_PATHS).map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Pay Period Switcher */}
        <div className="flex items-center gap-2 self-start lg:self-end">
          <span className="text-xs font-bold text-slate-600">Display Metric:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPayPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                payPeriod === 'monthly'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EC$ Monthly
            </button>
            <button
              type="button"
              onClick={() => setPayPeriod('annual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                payPeriod === 'annual'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EC$ Annual
            </button>
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION DASHBOARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Visual Trajectory Curve
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-display mt-1">
              {careerData.sector} Salary Progression
            </h3>
            <p className="text-xs text-slate-500">
              Hotspots: <strong className="text-slate-700">{careerData.parishHotspots}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span className="font-semibold text-slate-700">{careerData.sector} Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              <span className="font-semibold text-slate-500">Dominica National Benchmark</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="nationalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#475569' }}
                tickFormatter={(value) => `EC$ ${value.toLocaleString()}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                        <span className="font-bold text-amber-300 block">{label}</span>
                        <span className="text-[11px] text-slate-300 block">
                          Role: <strong className="text-white">{data.roleTitle}</strong> ({data.experience})
                        </span>
                        <div className="pt-1 border-t border-slate-700 flex items-center justify-between gap-4 font-mono">
                          <span className="text-emerald-400 font-bold">
                            EC$ {data.salary.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            Nat. Avg: EC$ {data.nationalAverage.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="salary"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salaryGradient)"
                name="Sector Salary"
              />
              <Area
                type="monotone"
                dataKey="nationalAverage"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#nationalGradient)"
                name="Dominica National Average"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4 STAGES INTERACTIVE STEPPER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
          {careerData.stages.map((st, idx) => {
            const isSelected = activeStageIndex === idx;
            return (
              <button
                key={st.stage}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Step {idx + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {st.experience}
                  </span>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 line-clamp-1">
                  {st.roleTitle}
                </h4>

                <div className="mt-2 flex items-center justify-between font-mono text-xs">
                  <span className="font-black text-emerald-800">
                    EC$ {st.monthlyXCD.toLocaleString()}/mo
                  </span>
                  <span className="text-[10px] text-slate-400">
                    EC$ {(st.annualXCD / 1000).toFixed(0)}k/yr
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED STAGE DEEP-DIVE CARD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase text-[10px] tracking-widest bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Stage {activeStageIndex + 1} Competency Audit
              </span>
              <span className="text-xs text-slate-400">• {activeStage.timeframe}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              {activeStage.roleTitle}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {careerData.description}
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Dominica Market Benchmark
            </span>
            <span className="text-2xl font-mono font-black text-emerald-400 mt-0.5 block">
              EC$ {activeStage.monthlyXCD.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-300">/ month</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              EC$ {activeStage.annualXCD.toLocaleString()} per annum
            </span>
          </div>
        </div>

        {/* 2 Column Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Key Deliverables */}
          <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/80">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Core Deliverables & Workplace Focus</span>
            </h4>
            <ul className="space-y-2 text-slate-300">
              {activeStage.keyResponsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Dominica & Global Certifications */}
          <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/80">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Required Accreditations to Qualify</span>
            </h4>
            <div className="space-y-2">
              {activeStage.requiredCredentials.map((cert, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 font-semibold">{cert}</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded">
                    Key Milestone
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              💡 <em>Growth Driver:</em> {activeStage.growthDriver}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
