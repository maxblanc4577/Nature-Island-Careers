import { ResumeLibraryDocument } from '../types';

export const INITIAL_RESUME_LIBRARY: ResumeLibraryDocument[] = [
  {
    id: 'doc-lib-1',
    title: 'Marcus Blanc – Senior Cloud Architect & Full-Stack CV',
    docType: 'Resume',
    sector: 'Information Technology & Digital',
    status: 'Active',
    currentVersion: 'v3.2',
    lastModified: '2026-09-28 16:45 AST',
    parish: 'St. George',
    tags: ['React', 'AWS Solutions Architect', 'Docker', 'PostgreSQL', 'WIN Remote Ready'],
    content: `MARCUS BLANC
Full-Stack Developer & Cloud Systems Specialist
Roseau Waterfront, St. George, Commonwealth of Dominica • Phone: +1 (767) 275-8842
Email: marcus.blanc@waitukubuli.dm • DSS Registration: DSS-098241
Portfolio: https://marcusblanc.dev • LinkedIn: linkedin.com/in/marcusblanc-dm

PROFESSIONAL SUMMARY
Results-driven Dominican software engineer and cloud architect with 5+ years of experience engineering resilient web applications, REST APIs, and microservices. Proven success leading technical teams and mentoring interns under the Dominica National Employment Programme (NEP).

EMPLOYMENT HISTORY
Senior Web & Cloud Architect — Waitukubuli Digital Labs (Roseau, Dominica)
2023-01 to Present
- Engineered high-availability cloud systems reducing latency by 42% for OECS clients.
- Led continuous integration and deployment on AWS/Docker with 99.98% uptime.
- Mentored 6 Dominican junior engineers through the national NEP initiative.

Software Developer — Caribbean Cloud Solutions (Portsmouth, Dominica)
2021-03 to 2022-12
- Developed React/TypeScript analytics dashboards for banking and tourism clients.
- Integrated National Bank of Dominica (NBD) and Stripe EC$ payment processing.

EDUCATION & CREDENTIALS
- Associate of Science in Computer Science — Dominica State College (DSC), President’s List
- Bachelor of Science (Hons) in Software Engineering — UWI Open Campus Dominica
- AWS Certified Solutions Architect – Associate (2024)`,
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: '2023-01-15 09:12 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Initial baseline resume following DSC graduation and first junior position.',
        snapshotContent: `Marcus Blanc - Junior Software Developer CV v1.0. Education: Dominica State College. Skills: JavaScript, HTML, CSS, SQL.`,
      },
      {
        version: 'v2.0',
        timestamp: '2024-04-10 11:30 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Added Caribbean Cloud Solutions employment history and NBD payment integration experience.',
        snapshotContent: `Marcus Blanc - Full-Stack Developer CV v2.0. Added React and Node.js projects in Dominica.`,
      },
      {
        version: 'v3.0',
        timestamp: '2025-08-22 14:05 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Promoted to Senior Architect at Waitukubuli Digital Labs; added NEP youth mentorship deliverables.',
        snapshotContent: `Marcus Blanc - Senior Architect CV v3.0. Added team leadership and cloud microservices achievements.`,
      },
      {
        version: 'v3.2',
        timestamp: '2026-09-28 16:45 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Added AWS Certified Solutions Architect credential and WIN remote permit compliance.',
        snapshotContent: `Marcus Blanc - Senior Cloud Architect CV v3.2. Current active version with AWS credentials.`,
      },
    ],
  },
  {
    id: 'doc-lib-2',
    title: 'Eco-Resort Operations & Guest Experience Director CV',
    docType: 'Resume',
    sector: 'Eco-Tourism & Hospitality',
    status: 'Active',
    currentVersion: 'v2.1',
    lastModified: '2026-09-25 10:20 AST',
    parish: 'St. John',
    tags: ['Secret Bay', 'Cabrits', 'DDA Certified', 'Green Globe', 'HACCP'],
    content: `MARCUS BLANC
Sustainable Tourism Leader & Eco-Resort Operations Manager
Picard / Portsmouth, St. John, Commonwealth of Dominica
Phone: +1 (767) 275-8842 • Email: marcus.blanc@waitukubuli.dm

EXECUTIVE PROFILE
Over 4 years of leadership in Dominica’s luxury eco-tourism sector. Adept at coordinating guest excursions across Morne Trois Pitons National Park and marine sanctuaries, stewarding Green Globe certifications, and training local hospitality cohorts.

EXPERIENCE
Guest Experience & Eco-Tours Manager — Cabrits Resort & Nature Retreat (Portsmouth)
2022-06 to Present
- Directed luxury guest services and a team of 20 licensed local guides.
- Maintained a 98.4% guest satisfaction index, earning the 2025 Discover Dominica Award.
- Pioneered resort zero-plastic policy and local farm-to-table procurement.

EDUCATION & LICENSES
- Associate Degree in Hospitality & Tourism Management — Dominica State College
- Discover Dominica Authority (DDA) Certified Tour & Customer Care Specialist
- Emergency First Response CPR / Wilderness First Aid — Dominica Red Cross Society`,
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: '2024-02-18 10:00 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Created hospitality-focused CV after completing DSC tourism coursework.',
        snapshotContent: `Marcus Blanc - Hospitality Trainee CV v1.0. Focus on front desk and tour coordination.`,
      },
      {
        version: 'v2.0',
        timestamp: '2025-06-12 15:30 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Added Cabrits Resort guest operations management and DDA certification.',
        snapshotContent: `Marcus Blanc - Guest Experience Manager CV v2.0. Added DDA protocols and team supervision.`,
      },
      {
        version: 'v2.1',
        timestamp: '2026-09-25 10:20 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Added Red Cross Wilderness First Aid and Green Globe audit achievements.',
        snapshotContent: `Marcus Blanc - Eco-Resort Operations Director CV v2.1. Updated certifications.`,
      },
    ],
  },
  {
    id: 'doc-lib-3',
    title: 'Secret Bay Luxury Eco-Resort – Tailored Cover Letter',
    docType: 'Cover Letter',
    sector: 'Eco-Tourism & Hospitality',
    status: 'Active',
    currentVersion: 'v1.2',
    lastModified: '2026-09-24 13:15 AST',
    parish: 'St. John',
    tags: ['Secret Bay', 'Cover Letter', 'Portsmouth', 'Eco-Resort'],
    content: `Marcus Blanc
Picard, St. John, Commonwealth of Dominica
Email: marcus.blanc@waitukubuli.dm | Phone: +1 (767) 275-8842

September 24, 2026

General Manager & Human Resources
Secret Bay Luxury Eco-Resort
Portsmouth, St. John, Commonwealth of Dominica

RE: Application for Guest Relations & Sustainability Coordinator (Ref #SB-2026)

Dear Hiring Committee,

I am writing to express my profound admiration for Secret Bay’s commitment to world-class regenerative tourism and to submit my application for the Guest Relations & Sustainability Coordinator position.

As a Dominica native who has spent years guiding visitors through our rainforests and marine reserves, I understand that true Caribbean hospitality is rooted in environmental stewardship. In my recent role at Cabrits Resort, I led guest satisfaction to 98.4% while successfully managing our zero-waste initiative in partnership with local St. John farmers.

I hold an Associate Degree from Dominica State College and active Discover Dominica Authority (DDA) certification. I would welcome the opportunity to bring my passion, local heritage knowledge, and guest leadership to the Secret Bay team.

Thank you for your time and consideration.

Warm regards,
Marcus Blanc`,
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: '2026-09-20 11:00 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Initial cover letter draft for northern Dominica eco-resort opportunities.',
        snapshotContent: `Draft cover letter for eco-resort positions in St. John.`,
      },
      {
        version: 'v1.2',
        timestamp: '2026-09-24 13:15 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Customized paragraphs referencing Secret Bay’s specific Green Globe ethos and local farming partnerships.',
        snapshotContent: `Secret Bay customized cover letter draft v1.2 with local references.`,
      },
    ],
  },
  {
    id: 'doc-lib-4',
    title: 'Dominica Geothermal Development Company (DGDC) Field Tech CV',
    docType: 'Resume',
    sector: 'Renewable Energy & Geothermal',
    status: 'Draft',
    currentVersion: 'v1.1',
    lastModified: '2026-09-18 08:50 AST',
    parish: 'St. George',
    tags: ['Laudat', 'Geothermal', 'SCADA', 'DOMLEC', 'Renewable Energy'],
    content: `MARCUS BLANC
Renewable Energy & Electrical Systems Technician
Roseau / Laudat, St. George, Commonwealth of Dominica
Email: marcus.blanc@waitukubuli.dm • Phone: +1 (767) 275-8842

OBJECTIVE
Motivated technician seeking to contribute to the Commonwealth of Dominica’s historic transition to 100% renewable power generation through the Laudat Geothermal Project.

SKILLS & CERTIFICATIONS
- High-voltage electrical testing & transmission grid protocols
- SCADA industrial automation systems & data logging
- Environmental monitoring in Morne Trois Pitons buffer zones
- Industrial Safety & CPR / First Aid certified

EDUCATION
- Associate of Applied Science in Electrical Engineering Technology — Dominica State College
- Renewable Energy & Microgrids Workshop — CARICOM / DGDC Training Unit`,
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: '2026-09-10 14:20 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Initial technical CV compiled for geothermal clean energy openings.',
        snapshotContent: `DGDC Technical CV v1.0. Initial draft.`,
      },
      {
        version: 'v1.1',
        timestamp: '2026-09-18 08:50 AST',
        author: 'Marcus Blanc',
        changeSummary: 'Added Laudat wellhead transmission testing and SCADA monitoring details.',
        snapshotContent: `DGDC Technical CV v1.1 with SCADA details.`,
      },
    ],
  },
];
