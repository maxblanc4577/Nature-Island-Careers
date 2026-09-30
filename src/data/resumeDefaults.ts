import { ResumeVersion, NetworkingEvent, JobSector } from '../types';

export const INITIAL_RESUME_VERSIONS: ResumeVersion[] = [
  {
    id: 'res-ver-1',
    title: 'Technology & Remote Specialist (WIN-Ready)',
    targetSector: 'Information Technology & Digital',
    layoutTemplate: 'modern',
    updatedAt: '2026-09-28',
    data: {
      fullName: 'Marcus Blanc',
      headline: 'Full-Stack Developer & Cloud Systems Specialist',
      email: 'marcus.blanc@waitukubuli.dm',
      phone: '+1 (767) 275-8842',
      parish: 'St. George',
      locality: 'Roseau Waterfront / Canefield',
      dssNumber: 'DSS-098241',
      portfolioUrl: 'https://marcusblanc.dev',
      linkedinUrl: 'https://linkedin.com/in/marcusblanc-dm',
      summary:
        'Results-driven Dominican software engineer and cloud specialist with 5+ years of experience engineering scalable web applications, REST APIs, and resilient infrastructure. Adept at remote collaboration for global teams and local enterprise digital transformations across the Caribbean.',
      experiences: [
        {
          id: 'exp-1',
          title: 'Senior Web & Cloud Architect',
          company: 'Waitukubuli Digital Labs',
          location: 'Roseau, St. George, Dominica',
          startDate: '2023-01',
          endDate: 'Present',
          isCurrent: true,
          highlights: [
            'Architected distributed microservices reducing transaction latency by 42% for Caribbean e-commerce and logistics clients.',
            'Mentored 6 junior Dominican developers and interns through the National Employment Programme (NEP).',
            'Implemented automated CI/CD deployment pipelines on AWS and Docker, achieving 99.98% uptime.',
          ],
        },
        {
          id: 'exp-2',
          title: 'Software Developer',
          company: 'Caribbean Cloud Solutions',
          location: 'Portsmouth / Remote',
          startDate: '2021-03',
          endDate: '2022-12',
          isCurrent: false,
          highlights: [
            'Built responsive React/TypeScript user dashboards for banking and tourism analytics in the OECS region.',
            'Integrated secure Stripe and National Bank of Dominica (NBD) payment gateway interfaces for EC$ transactions.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'Dominica State College (DSC)',
          degree: 'Associate of Science',
          field: 'Computer Science & Information Technology',
          location: 'Stockfarm, Roseau, Dominica',
          graduationYear: '2020',
          honors: 'President’s Honor List · Magna Cum Laude',
        },
        {
          id: 'edu-2',
          institution: 'University of the West Indies (UWI) Open Campus',
          degree: 'Bachelor of Science (Hons)',
          field: 'Software Engineering & Applied Computing',
          location: 'Roseau, Dominica',
          graduationYear: '2023',
          honors: 'First Class Honours',
        },
      ],
      skills: [
        'React & Next.js',
        'TypeScript & JavaScript',
        'Node.js & Express',
        'PostgreSQL & Cloud SQL',
        'AWS Cloud Infrastructure',
        'Docker & Kubernetes',
        'RESTful APIs & GraphQL',
        'Git & GitHub Workflows',
        'Cybersecurity & PCI-DSS Compliance',
        'Agile / Scrum Methodologies',
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'AWS Certified Solutions Architect – Associate',
          issuer: 'Amazon Web Services',
          year: '2024',
          credentialId: 'AWS-PSA-78291',
        },
        {
          id: 'cert-2',
          name: 'Google Professional Cloud Developer',
          issuer: 'Google Cloud Platform',
          year: '2023',
        },
      ],
      languages: ['English (Native)', 'Dominican Creole / Kweyol (Conversational)', 'French (Working)'],
    },
  },
  {
    id: 'res-ver-2',
    title: 'Eco-Hospitality & Guest Operations Manager',
    targetSector: 'Eco-Tourism & Hospitality',
    layoutTemplate: 'creative',
    updatedAt: '2026-09-25',
    data: {
      fullName: 'Marcus Blanc',
      headline: 'Sustainable Tourism Leader & Eco-Resort Operations Manager',
      email: 'marcus.blanc@waitukubuli.dm',
      phone: '+1 (767) 275-8842',
      parish: 'St. John',
      locality: 'Picard / Portsmouth',
      dssNumber: 'DSS-098241',
      summary:
        'Passionate hospitality professional dedicated to showcasing the Commonwealth of Dominica’s natural heritage. Proven track record directing luxury guest services, eco-certification stewardship (Green Globe / LEED), staff training, and VIP excursions across Dominica’s rainforest reserves and marine sanctuaries.',
      experiences: [
        {
          id: 'exp-h1',
          title: 'Guest Experience & Eco-Tours Manager',
          company: 'Cabrits Resort & Nature Retreat',
          location: 'Portsmouth, St. John, Dominica',
          startDate: '2022-06',
          endDate: 'Present',
          isCurrent: true,
          highlights: [
            'Directed luxury guest relations and 20+ licensed local tour guides across Morne Trois Pitons and Cabrits National Park.',
            'Elevated TripAdvisor guest satisfaction index to 98.4%, receiving the 2025 Discover Dominica Excellence Award.',
            'Spearheaded resort zero-plastic initiative and farm-to-table culinary procurement partnering with 15 local farmers.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-h1',
          institution: 'Dominica State College (DSC)',
          degree: 'Associate Degree',
          field: 'Hospitality Studies & Tourism Management',
          location: 'Roseau, Dominica',
          graduationYear: '2021',
          honors: 'Distinction in Caribbean Eco-Tourism',
        },
      ],
      skills: [
        'Luxury Guest Relations',
        'Eco-Certification Stewardship',
        'Discover Dominica Authority (DDA) Protocols',
        'Event & Conference Coordination',
        'Staff Leadership & NEP Mentorship',
        'HACCP Food Safety Standards',
        'Waitukubuli National Trail Guidance',
        'Opera & Micros PMS Systems',
      ],
      certifications: [
        {
          id: 'cert-h1',
          name: 'Certified Caribbean Hospitality Supervisor (CHS)',
          issuer: 'American Hotel & Lodging Educational Institute (AHLEI)',
          year: '2023',
        },
        {
          id: 'cert-h2',
          name: 'Emergency First Response & CPR / Wilderness First Aid',
          issuer: 'Dominica Red Cross Society',
          year: '2025',
        },
      ],
      languages: ['English (Fluent)', 'Dominican Creole (Fluent)', 'French (Conversational)'],
    },
  },
  {
    id: 'res-ver-3',
    title: 'Public Sector, Administration & NEP Coordination',
    targetSector: 'Public Sector & Cooperatives',
    layoutTemplate: 'classic',
    updatedAt: '2026-09-20',
    data: {
      fullName: 'Marcus Blanc',
      headline: 'Administrative Officer & Public Policy Coordinator',
      email: 'marcus.blanc@waitukubuli.dm',
      phone: '+1 (767) 275-8842',
      parish: 'St. George',
      locality: 'Roseau Central',
      dssNumber: 'DSS-098241',
      summary:
        'Diligent administrative professional with extensive experience coordinating government records, statutory reporting for Dominica Social Security (DSS), and community development initiatives under the National Employment Programme. Adept at stakeholder liaison, procurement compliance, and public sector governance.',
      experiences: [
        {
          id: 'exp-p1',
          title: 'Administrative Officer',
          company: 'Ministry of Labour & Public Service',
          location: 'Government Headquarters, Roseau',
          startDate: '2021-09',
          endDate: 'Present',
          isCurrent: true,
          highlights: [
            'Administered documentation and compliance records for over 250 registered private sector employers across 10 parishes.',
            'Coordinated bi-annual labour market statistical surveys in partnership with the Central Statistics Office.',
            'Drafted official correspondence, cabinet briefing summaries, and inter-agency memos.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-p1',
          institution: 'Dominica State College (DSC)',
          degree: 'Associate Degree',
          field: 'Public Administration & Business Studies',
          location: 'Stockfarm, Dominica',
          graduationYear: '2020',
        },
      ],
      skills: [
        'Dominica Civil Service Regulations',
        'Statutory DSS Compliance Auditing',
        'Financial Bookkeeping & Budget Tracking',
        'Records & Archive Management',
        'Microsoft Office 365 (Word, Excel, PowerPoint)',
        'Meeting Minute Taking & Agenda Preparation',
        'Public Relations & Community Outreach',
      ],
      certifications: [
        {
          id: 'cert-p1',
          name: 'Caribbean Vocational Qualification (CVQ) Level 3 in Business Administration',
          issuer: 'CANTA / National Training Agency',
          year: '2022',
        },
      ],
      languages: ['English (Native)', 'Dominican Creole (Fluent)'],
    },
  },
];

export const LINKEDIN_PROFILE_PRESETS = [
  {
    name: 'Tech & Digital Specialist (Marcus Blanc)',
    rawText: `Marcus Blanc
Full-Stack Developer & Cloud Systems Specialist | React, Node.js, AWS
Roseau, Saint George, Dominica • marcus.blanc@waitukubuli.dm • +1 (767) 275-8842

About:
Passionate software engineer from the Commonwealth of Dominica with deep expertise in modern web ecosystems, cloud computing, and high-availability systems. Committed to building Dominica's digital economy.

Experience:
Senior Web & Cloud Architect
Waitukubuli Digital Labs • Full-time
Jan 2023 - Present • 3 yrs 9 mos • Roseau, Dominica
- Spearheaded development of regional cloud platforms.
- Mentored youth and interns through the Dominica National Employment Programme.
- Improved system throughput by 42%.

Software Developer
Caribbean Cloud Solutions • Full-time
Mar 2021 - Dec 2022 • 1 yr 10 mos • Portsmouth, Dominica
- Built financial dashboards and payment integrations with Stripe and NBD.
- Collaborated across distributed OECS teams.

Education:
Dominica State College
Associate of Science, Computer Science & Information Technology
2018 - 2020 • Roseau, Dominica
Honors: President's List

University of the West Indies Open Campus
Bachelor of Science - BS, Software Engineering
2020 - 2023 • Roseau, Dominica

Skills:
React, TypeScript, Node.js, Express, AWS, Cloud Architecture, PostgreSQL, Docker, Git, Agile Methodologies, REST APIs`,
  },
  {
    name: 'Eco-Resort & Tourism Director (Althea Joseph)',
    rawText: `Althea Joseph
Hospitality Operations Director & Eco-Tourism Specialist
Portsmouth, Saint John, Dominica • althea.joseph@ecodominica.dm • +1 (767) 316-9921

About:
Over 8 years of luxury hospitality and sustainable resort leadership on the Nature Isle. Dedicated to authentic guest experiences, environmental preservation, and uplifting local Dominican communities.

Experience:
Director of Guest Experience & Sustainability
Secret Bay Luxury Eco-Resort • Full-time
Feb 2022 - Present • Portsmouth, Dominica
- Directed front-of-house, concierge, and customized private wilderness expeditions.
- Led resort to achieve Green Globe platinum re-certification.

Guest Relations Manager
Fort Young Hotel & Dive Resort • Full-time
Aug 2018 - Jan 2022 • Roseau, Dominica
- Managed oceanfront guest accommodations, marine dive center bookings, and special events.

Education:
Dominica State College
Associate Degree in Tourism & Hospitality Management
2015 - 2017 • Stockfarm, Dominica

Skills:
Luxury Hospitality Management, Eco-Tourism Stewardship, DDA Standards, Staff Leadership, HACCP Certification, Guest Relations, Waitukubuli Trail Coordination`,
  },
  {
    name: 'Renewable Energy & Geothermal Trainee (Darryl Fontaine)',
    rawText: `Darryl Fontaine
Renewable Energy Technician & Electrical Systems Specialist
Laudat, Saint George, Dominica • darryl.fontaine@greenpower.dm • +1 (767) 448-3190

About:
Certified electrical and renewable systems technician contributing to Dominica's journey toward 100% clean geothermal and solar power generation.

Experience:
Geothermal Field Technician
Dominica Geothermal Development Company (DGDC) • Full-time
May 2023 - Present • Laudat, Dominica
- Assist engineers with geothermal wellhead monitoring and high-voltage transmission station testing.
- Ensure strict adherence to environmental watershed protocols in Morne Trois Pitons buffer zone.

Junior Electrician
DOMLEC (Dominica Electricity Services) • Apprentice
Jan 2021 - Apr 2023 • Roseau, Dominica
- Supported grid line maintenance and solar array installations.

Education:
Dominica State College
Associate of Applied Science, Electrical Engineering Technology
2019 - 2021 • Roseau, Dominica

Skills:
High-Voltage Systems, Geothermal Operations, SCADA Monitoring, Solar PV Installation, Industrial Safety, First Aid & CPR, Technical Troubleshooting`,
  },
];

export const DOMINICA_NETWORKING_EVENTS: NetworkingEvent[] = [
  {
    id: 'evt-1',
    title: 'Dominica National Employment Programme (NEP) Career Expo 2026',
    category: 'Career Fair',
    date: 'Thursday, October 15, 2026',
    time: '9:00 AM – 3:30 PM AST',
    venue: 'Dominica State College Auditorium, Stockfarm',
    parish: 'St. George',
    organizer: 'Ministry of Labour, Public Service Reform & NEP Directorate',
    description:
      'The Commonwealth of Dominica’s largest national employment exhibition. Connect in person with over 45 accredited employers across all 10 parishes. On-site resume reviews, NEP trainee registration, and same-day interview screenings for positions in tourism, construction, renewable energy, and public administration.',
    isFree: true,
    attendeesCount: 420,
    registrationUrl: 'https://labour.gov.dm/events/expo2026',
    calendarStart: '20261015T130000Z',
    calendarEnd: '20261015T193000Z',
  },
  {
    id: 'evt-2',
    title: 'Nature Island Tech & Digital Nomad Mixer',
    category: 'Tech & Innovation',
    date: 'Wednesday, October 21, 2026',
    time: '5:30 PM – 8:30 PM AST',
    venue: 'Jungle Bay Eco-Resort Conference Lounge, Soufrière',
    parish: 'St. Mark',
    organizer: 'Dominica Innovation Hub & WIN Remote Community',
    description:
      'An evening of lightning talks, remote work networking, and cocktail mixer for local software developers, digital marketers, and international professionals residing under the Dominica Work In Nature (WIN) extended visa. Featuring talks on AI integration in the Caribbean and Starlink/fiber remote setups.',
    isFree: true,
    attendeesCount: 95,
    registrationUrl: 'https://natureislandcareers.com/events/tech-mixer',
    calendarStart: '20261021T213000Z',
    calendarEnd: '20261022T003000Z',
  },
  {
    id: 'evt-3',
    title: 'Dominica Renewable Energy & Geothermal Symposium',
    category: 'Workshop',
    date: 'Tuesday, November 3, 2026',
    time: '10:00 AM – 2:00 PM AST',
    venue: 'Laudat Geothermal Project Visitor Center',
    parish: 'St. George',
    organizer: 'Dominica Geothermal Development Company (DGDC) & IRENA',
    description:
      'Technical workshop exploring workforce development for Dominica’s transition to 100% renewable power. Includes guided briefing on transmission infrastructure jobs, environmental geology roles, and skilled trades apprenticeships with competitive compensation.',
    isFree: true,
    attendeesCount: 160,
    calendarStart: '20261103T140000Z',
    calendarEnd: '20261103T180000Z',
  },
  {
    id: 'evt-4',
    title: 'Portsmouth Maritime, Yachting & Agro-Processing Forum',
    category: 'Industry Meetup',
    date: 'Saturday, November 14, 2026',
    time: '1:00 PM – 5:00 PM AST',
    venue: 'Cabrits National Park Historic Officers Quarters',
    parish: 'St. John',
    organizer: 'Portsmouth Yacht Club & Dominica Export Promotion Agency (DEXIA)',
    description:
      'Networking forum connecting shipwrights, marine logistics operators, and local agricultural processors with regional Caribbean buyers. Workshops on CARICOM single market export protocols and marine technician certifications.',
    isFree: true,
    attendeesCount: 110,
    calendarStart: '20261114T170000Z',
    calendarEnd: '20261114T210000Z',
  },
  {
    id: 'evt-5',
    title: 'Waitukubuli Sustainable Tourism & Hospitality Job Fair',
    category: 'Career Fair',
    date: 'Friday, November 27, 2026',
    time: '9:30 AM – 3:00 PM AST',
    venue: 'Fort Young Hotel Conference Center, Roseau Waterfront',
    parish: 'St. George',
    organizer: 'Discover Dominica Authority (DDA) & Dominica Hotel and Tourism Association (DHTA)',
    description:
      'High-impact recruitment day for Dominica’s premier resorts, diving operators, and restaurants ahead of the 2026–2027 peak tourism season. Roles for chefs, front desk agents, spa specialists, certified nature guides, and housekeeping supervisors.',
    isFree: true,
    attendeesCount: 280,
    calendarStart: '20261127T133000Z',
    calendarEnd: '20261127T190000Z',
  },
];

export const DOMINICA_SKILL_RECOMMENDATIONS: Record<
  string,
  {
    courseName: string;
    provider: string;
    duration: string;
    url: string;
    sector: JobSector;
    certificationType: string;
  }
> = {
  typescript: {
    courseName: 'TypeScript & Modern Full-Stack Development',
    provider: 'Dominica State College / Coursera Specialization',
    duration: '6 Weeks (Self-paced)',
    url: 'https://www.coursera.org',
    sector: 'Information Technology & Digital',
    certificationType: 'Professional Certificate',
  },
  aws: {
    courseName: 'AWS Cloud Solutions Architecture for Caribbean Enterprises',
    provider: 'AWS Training & UWI Open Campus Dominica',
    duration: '8 Weeks',
    url: 'https://aws.amazon.com/training/',
    sector: 'Information Technology & Digital',
    certificationType: 'Industry Recognized Credential',
  },
  docker: {
    courseName: 'Containerization & DevOps with Docker & Kubernetes',
    provider: 'Google Cloud Skills Boost / DSC Digital Lab',
    duration: '4 Weeks',
    url: 'https://cloud.google.com/training',
    sector: 'Information Technology & Digital',
    certificationType: 'DevOps Badge',
  },
  hospitality: {
    courseName: 'Discover Dominica Authority Customer Care & Tour Standards',
    provider: 'Discover Dominica Authority (DDA) & DHTA',
    duration: '3 Weeks Intensive',
    url: 'https://discoverdominica.com',
    sector: 'Eco-Tourism & Hospitality',
    certificationType: 'National DDA Certification',
  },
  haccp: {
    courseName: 'HACCP Level 2 Food Safety & Eco-Culinary Practices',
    provider: 'Dominica Bureau of Standards (DBOS)',
    duration: '2 Weeks',
    url: 'https://dominicastandards.org',
    sector: 'Eco-Tourism & Hospitality',
    certificationType: 'Statutory Health & Safety Cert',
  },
  firstaid: {
    courseName: 'Wilderness & Marine First Aid / CPR Certification',
    provider: 'Dominica Red Cross Society (Roseau)',
    duration: '1 Weekend (16 hours)',
    url: 'https://redcross.dm',
    sector: 'Eco-Tourism & Hospitality',
    certificationType: 'Red Cross Life Safety Credential',
  },
  renewable: {
    courseName: 'Geothermal Systems & High-Voltage Grid Operations',
    provider: 'Dominica State College & DGDC Technical Institute',
    duration: '12 Weeks',
    url: 'https://dsc.edu.dm',
    sector: 'Renewable Energy & Geothermal',
    certificationType: 'DSC Professional Diploma',
  },
  scada: {
    courseName: 'SCADA & Industrial Automation for Energy Grids',
    provider: 'CARICOM Energy Training / UWI',
    duration: '6 Weeks',
    url: 'https://caricom.org',
    sector: 'Renewable Energy & Geothermal',
    certificationType: 'Regional CARICOM Certificate',
  },
  publicadmin: {
    courseName: 'Dominica Civil Service Regulations & DSS Statutory Compliance',
    provider: 'Ministry of Public Service & Labour Division Training Unit',
    duration: '4 Weeks',
    url: 'https://labour.gov.dm',
    sector: 'Public Sector & Cooperatives',
    certificationType: 'Dominica Public Service Certificate',
  },
};
