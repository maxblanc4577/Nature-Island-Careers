export interface SkillSuggestionItem {
  skill: string;
  category: 'Technical' | 'Domain & Operations' | 'Leadership & Soft Skills';
  reason?: string;
}

export interface SkillSuggestionResponse {
  jobTitle: string;
  suggestedSkills: string[];
  detailedSuggestions: SkillSuggestionItem[];
  source: 'gemini' | 'contextual';
}

const ROLE_SKILL_LIBRARY: Array<{
  pattern: RegExp;
  skills: SkillSuggestionItem[];
}> = [
  {
    pattern: /\b(hospitality|hotel|resort|tourism|eco-tourism|guest|concierge|front desk|chef|culinary|food|tour|travel)\b/i,
    skills: [
      { skill: 'Luxury Guest Relations & VIP Concierge', category: 'Domain & Operations', reason: 'Delivering 5-star eco-resort guest satisfaction' },
      { skill: 'Discover Dominica Authority (DDA) Standards', category: 'Domain & Operations', reason: 'Certified hospitality and sustainable tourism compliance' },
      { skill: 'Property Management Systems (Opera / Cloudbeds)', category: 'Technical', reason: 'Reservations, occupancy optimization, and billing' },
      { skill: 'Sustainable Eco-Resort Operations', category: 'Domain & Operations', reason: 'Green hospitality practices aligned with Nature Isle standards' },
      { skill: 'HACCP Food Safety & Quality Control', category: 'Domain & Operations', reason: 'International hygiene and hospitality safety compliance' },
      { skill: 'Revenue & Occupancy Yield Management', category: 'Technical', reason: 'Seasonal pricing strategy and booking conversion' },
      { skill: 'Multicultural Team Leadership', category: 'Leadership & Soft Skills', reason: 'Coordinating front-of-house and hospitality staff' },
      { skill: 'Event & Eco-Excursion Coordination', category: 'Domain & Operations', reason: 'Curating Waitukubuli trail and marine guest experiences' },
    ],
  },
  {
    pattern: /\b(geothermal|energy|renewable|electrical|mechanical|scada|power|civil|construction|site|safety|hse|grid)\b/i,
    skills: [
      { skill: 'SCADA & High-Voltage Grid Telemetry', category: 'Technical', reason: 'Real-time power generation and substation monitoring' },
      { skill: 'Geothermal Plant Operations & Maintenance', category: 'Domain & Operations', reason: 'Steam turbine and renewable energy lifecycle management' },
      { skill: 'OSHA / HSE Occupational Safety Compliance', category: 'Domain & Operations', reason: 'Zero-incident field safety and hazard mitigation' },
      { skill: 'Climate-Resilient Infrastructure Design', category: 'Technical', reason: 'Hurricane-resistant engineering for Caribbean infrastructure' },
      { skill: 'AutoCAD & Technical Blueprint Interpretation', category: 'Technical', reason: 'Precision engineering schematics and site layouts' },
      { skill: 'Environmental Impact Assessment (EIA)', category: 'Domain & Operations', reason: 'Protecting Dominica ecosystems during infrastructure delivery' },
      { skill: 'Preventive Maintenance Scheduling', category: 'Leadership & Soft Skills', reason: 'Maximizing equipment uptime and asset reliability' },
      { skill: 'Substation & Turbine Diagnostics', category: 'Technical', reason: 'High-voltage equipment testing and fault resolution' },
    ],
  },
  {
    pattern: /\b(finance|financial|accountant|accounting|bank|banking|audit|auditor|tax|payroll|bookkeeper|bookkeeping|credit|treasury|economist)\b/i,
    skills: [
      { skill: 'IFRS Financial Reporting & Reconciliation', category: 'Technical', reason: 'International accounting standards and ledger accuracy' },
      { skill: 'Dominica Social Security (DSS) & Payroll Compliance', category: 'Domain & Operations', reason: 'Statutory employer/employee contribution administration' },
      { skill: 'Eastern Caribbean (XCD/USD) Treasury Management', category: 'Domain & Operations', reason: 'ECCB regulatory compliance and foreign exchange operations' },
      { skill: 'Internal Auditing & Risk Controls', category: 'Domain & Operations', reason: 'Fraud prevention and statutory financial governance' },
      { skill: 'QuickBooks / SAP ERP & Advanced Excel', category: 'Technical', reason: 'Automated financial modeling, pivot tables, and forecasting' },
      { skill: 'AML / KYC Regulatory Compliance', category: 'Domain & Operations', reason: 'Anti-money laundering due diligence for Caribbean banking' },
      { skill: 'Budget Variance & Cost Optimization', category: 'Leadership & Soft Skills', reason: 'Strategic capital allocation and expense management' },
      { skill: 'Financial Forecasting & Cash Flow Modeling', category: 'Technical', reason: 'Multi-year liquidity and capital planning' },
    ],
  },
  {
    pattern: /\b(nurse|nursing|medical|health|healthcare|clinical|doctor|physician|pharmacy|pharmacist|patient|hospital|triage)\b/i,
    skills: [
      { skill: 'Patient Triage & Acute Clinical Assessment', category: 'Technical', reason: 'Rapid diagnostic prioritization and vital sign monitoring' },
      { skill: 'Electronic Health Records (EHR / EMR)', category: 'Technical', reason: 'Accurate clinical documentation and patient privacy' },
      { skill: 'Infection Control & Sterilization Protocols', category: 'Domain & Operations', reason: 'Hospital safety standards and WHO clinical hygiene' },
      { skill: 'Community & Parish Primary Healthcare', category: 'Domain & Operations', reason: 'Public health outreach across Dominica health districts' },
      { skill: 'Emergency & Disaster Medical Response', category: 'Domain & Operations', reason: 'Mass-casualty and hurricane medical preparedness' },
      { skill: 'Medication Administration & Pharmacology', category: 'Technical', reason: 'Safe dosage verification and therapeutic monitoring' },
      { skill: 'Compassionate Patient & Family Advocacy', category: 'Leadership & Soft Skills', reason: 'Clear bedside communication and culturally sensitive care' },
    ],
  },
  {
    pattern: /\b(marketing|brand|social media|content|digital marketing|seo|copywriter|copywriting|public relations|communications|sales|business development)\b/i,
    skills: [
      { skill: 'SEO / SEM & Digital Campaign Analytics', category: 'Technical', reason: 'Driving organic acquisition and measurable conversion ROI' },
      { skill: 'Multi-Channel Content Strategy', category: 'Domain & Operations', reason: 'Engaging storytelling across social, email, and web' },
      { skill: 'CRM Pipeline Management (HubSpot / Salesforce)', category: 'Technical', reason: 'Lead nurturing, customer retention, and revenue tracking' },
      { skill: 'Brand Positioning & Public Relations', category: 'Domain & Operations', reason: 'Building market authority across Caribbean and global audiences' },
      { skill: 'Conversion Rate Optimization (CRO)', category: 'Technical', reason: 'Funnel analysis and landing page performance tuning' },
      { skill: 'Strategic B2B & Partnership Negotiation', category: 'Leadership & Soft Skills', reason: 'Closing high-value commercial agreements' },
    ],
  },
  {
    pattern: /\b(teacher|education|educator|lecturer|instructor|professor|curriculum|training|academic|school|tutor)\b/i,
    skills: [
      { skill: 'CXC / CAPE & Tertiary Curriculum Design', category: 'Domain & Operations', reason: 'Structured lesson planning aligned with Caribbean standards' },
      { skill: 'Digital Learning Management Systems (LMS)', category: 'Technical', reason: 'Interactive hybrid and virtual classroom delivery' },
      { skill: 'Student Assessment & Differentiated Instruction', category: 'Domain & Operations', reason: 'Tailoring pedagogy to diverse learner needs' },
      { skill: 'NEP Youth Mentorship & Vocational Coaching', category: 'Leadership & Soft Skills', reason: 'Preparing graduates for workforce readiness in Dominica' },
      { skill: 'Classroom Management & Behavioral Support', category: 'Leadership & Soft Skills', reason: 'Fostering inclusive, high-engagement learning environments' },
    ],
  },
  {
    pattern: /\b(agriculture|agro|farm|agronomist|agronomy|crop|food processing|fisheries|marine|export|supply chain|logistics)\b/i,
    skills: [
      { skill: 'Climate-Smart Sustainable Agriculture', category: 'Domain & Operations', reason: 'Resilient crop cultivation and soil conservation' },
      { skill: 'Agro-Processing Quality & Export Standards', category: 'Technical', reason: 'Value-added food production and CARICOM export compliance' },
      { skill: 'Cold-Chain & Maritime Port Logistics', category: 'Domain & Operations', reason: 'Coordinating freight across Roseau and Portsmouth ports' },
      { skill: 'Supply Chain & Inventory Optimization', category: 'Technical', reason: 'Minimizing spoilage and streamlining vendor procurement' },
      { skill: 'Cooperative & Smallholder Farmer Liaison', category: 'Leadership & Soft Skills', reason: 'Strengthening parish agricultural cooperatives' },
    ],
  },
  {
    pattern: /\b(software|developer|engineer|frontend|backend|full-stack|fullstack|web|react|typescript|cloud|devops|information technology|systems|network|cyber|cybersecurity)\b/i,
    skills: [
      { skill: 'TypeScript & JavaScript (ES6+)', category: 'Technical', reason: 'Core language proficiency for modern software engineering' },
      { skill: 'React & Modern Frontend Architecture', category: 'Technical', reason: 'Component-driven UI engineering and state management' },
      { skill: 'Node.js & RESTful API Design', category: 'Technical', reason: 'Scalable backend services and microservice integration' },
      { skill: 'Cloud Infrastructure (AWS / GCP)', category: 'Technical', reason: 'High-availability cloud deployment and serverless scaling' },
      { skill: 'CI/CD Pipelines & DevOps', category: 'Technical', reason: 'Automated testing, containerization, and release workflows' },
      { skill: 'Cybersecurity & Data Protection', category: 'Domain & Operations', reason: 'Secure authentication, encryption, and OWASP compliance' },
      { skill: 'PostgreSQL & NoSQL Databases', category: 'Technical', reason: 'Data modeling, query optimization, and indexing' },
      { skill: 'Agile Scrum & Sprint Delivery', category: 'Leadership & Soft Skills', reason: 'Cross-functional engineering collaboration and velocity' },
    ],
  },
  {
    pattern: /\b(data|analyst|analytics|scientist|machine learning|business intelligence|statistician)\b/i,
    skills: [
      { skill: 'SQL & Relational Data Modeling', category: 'Technical', reason: 'Complex data extraction and warehouse querying' },
      { skill: 'Python (Pandas / NumPy)', category: 'Technical', reason: 'Statistical analysis and automated data pipelines' },
      { skill: 'Executive KPI Dashboards (Power BI / Tableau)', category: 'Technical', reason: 'Visualizing actionable insights for stakeholders' },
      { skill: 'Predictive Analytics & Forecasting', category: 'Domain & Operations', reason: 'Trend modeling and demand forecasting' },
      { skill: 'Data Governance & Quality Assurance', category: 'Domain & Operations', reason: 'Ensuring dataset integrity and audit compliance' },
      { skill: 'A/B Testing & Experimentation', category: 'Technical', reason: 'Hypothesis-driven product and operational optimization' },
      { skill: 'Stakeholder Data Storytelling', category: 'Leadership & Soft Skills', reason: 'Translating quantitative findings into strategic decisions' },
    ],
  },
];

const DEFAULT_EXECUTIVE_SKILLS: SkillSuggestionItem[] = [
  { skill: 'Cross-Functional Team Leadership', category: 'Leadership & Soft Skills', reason: 'Guiding multidisciplinary teams toward shared KPIs' },
  { skill: 'Strategic Project Management (Agile / PMP)', category: 'Domain & Operations', reason: 'On-time, on-budget milestone execution' },
  { skill: 'Operational Process Optimization', category: 'Domain & Operations', reason: 'Streamlining workflows and improving service turnaround' },
  { skill: 'Stakeholder & Executive Communication', category: 'Leadership & Soft Skills', reason: 'Aligning internal leadership and external partners' },
  { skill: 'Data-Driven KPI Reporting & Analysis', category: 'Technical', reason: 'Tracking performance metrics and operational benchmarks' },
  { skill: 'Risk Mitigation & Business Continuity', category: 'Domain & Operations', reason: 'Ensuring resilient operations and regulatory compliance' },
  { skill: 'Budget & Resource Allocation', category: 'Domain & Operations', reason: 'Maximizing cost efficiency across departmental initiatives' },
  { skill: 'Client Relationship & Service Excellence', category: 'Leadership & Soft Skills', reason: 'Delivering high satisfaction and long-term retention' },
];

export function generateContextualSkillSuggestions(params: {
  jobTitle: string;
  sector?: string;
  company?: string;
  existingSkills?: string[];
}): SkillSuggestionResponse {
  const rawTitle = (params.jobTitle || '').trim();
  const searchPool = `${rawTitle} ${params.sector || ''} ${params.company || ''}`.toLowerCase();

  const matchedItems: SkillSuggestionItem[] = [];
  const seen = new Set<string>();

  const addItem = (item: SkillSuggestionItem) => {
    const key = item.skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      matchedItems.push(item);
    }
  };

  for (const group of ROLE_SKILL_LIBRARY) {
    if (group.pattern.test(searchPool)) {
      for (const s of group.skills) {
        addItem(s);
      }
    }
  }

  // If title has custom words not matched yet, synthesize a role-specific skill at the top
  if (rawTitle.length >= 3 && matchedItems.length === 0) {
    const cleanRole = rawTitle.replace(/[^a-zA-Z0-9\s/-]/g, '').trim();
    if (cleanRole) {
      addItem({
        skill: `${cleanRole} Operations & Best Practices`,
        category: 'Domain & Operations',
        reason: `Core domain execution for ${cleanRole}`,
      });
      addItem({
        skill: `${cleanRole} Technical Workflow & QA`,
        category: 'Technical',
        reason: `Quality assurance and tooling for ${cleanRole}`,
      });
    }
  }

  for (const fallback of DEFAULT_EXECUTIVE_SKILLS) {
    if (matchedItems.length >= 8) break;
    addItem(fallback);
  }

  const finalItems = matchedItems.slice(0, 8);
  return {
    jobTitle: rawTitle || 'Professional Role',
    suggestedSkills: finalItems.map((i) => i.skill),
    detailedSuggestions: finalItems,
    source: 'contextual',
  };
}

export async function fetchGeminiSkillSuggestions(params: {
  jobTitle: string;
  company?: string;
  sector?: string;
  existingSkills?: string[];
  highlights?: string[];
}): Promise<SkillSuggestionResponse> {
  const localFallback = generateContextualSkillSuggestions(params);
  if (!params.jobTitle || params.jobTitle.trim().length < 2) {
    return localFallback;
  }

  try {
    const response = await fetch('/api/career/suggest-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: params.jobTitle.trim(),
        company: params.company || '',
        sector: params.sector || '',
        existingSkills: params.existingSkills || [],
        highlights: params.highlights || [],
      }),
    });

    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.suggestedSkills) && data.suggestedSkills.length > 0) {
        const detailed: SkillSuggestionItem[] = Array.isArray(data.detailedSuggestions)
          ? data.detailedSuggestions
          : data.suggestedSkills.map((s: string) => ({
              skill: s,
              category: 'Technical' as const,
              reason: `Recommended by Gemini AI for ${params.jobTitle}`,
            }));
        return {
          jobTitle: params.jobTitle.trim(),
          suggestedSkills: data.suggestedSkills,
          detailedSuggestions: detailed,
          source: data.source || 'gemini',
        };
      }
    }
  } catch {
    // Fall back to contextual suggestions in offline / test environments
  }

  return localFallback;
}
