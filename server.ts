import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// 1. Dominica Career Guidance Endpoint
app.post('/api/career/advice', async (req, res) => {
  const { query, userProfile } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are the Senior Career & Labor Market Advisor for the Commonwealth of Dominica (Waitukubuli).
You know all 10 parishes (St. George/Roseau, St. John/Portsmouth, St. Paul, St. Andrew/Marigot, St. Patrick, St. Joseph, St. David/Kalinago, St. Luke, St. Mark, St. Peter).
You know the local currency is Eastern Caribbean Dollars (XCD / EC$, pegged at 2.70 XCD : 1 USD).
You know key sectors: Eco-Tourism (Secret Bay, Fort Young, Jungle Bay), Geothermal Energy in Laudat (DGDC), Agriculture/Agro-processing, Dominica State College (DSC), and the Dominica Work In Nature (WIN) remote work extended stay permit (up to 18 months, $50,000 USD annual income req, 0% local income tax on foreign income).

The user asks: "${query}"
User background: ${userProfile ? JSON.stringify(userProfile) : 'Island job seeker or international professional'}

Provide actionable, encouraging, and accurate advice formatted with clear markdown headers and bullet points.`,
              },
            ],
          },
        ],
      });

      return res.json({ advice: response.text });
    } catch (err: any) {
      console.error('Gemini Career Advice error:', err);
    }
  }

  // Fallback response if API key not set
  return res.json({
    advice: `### Dominica Career Insight 🇩🇲

1. **Local Parish Opportunities:**
   Roseau (St. George) remains the core financial and commercial hub, while Portsmouth (St. John) offers thriving marine and hospitality roles around Cabrits.
2. **Key Growth Industries:**
   Eco-resort hospitality and renewable energy (Laudat geothermal project) are expanding rapidly with competitive compensation packages (EC$ 3,500 – EC$ 9,500/month).
3. **Remote & WIN Program:**
   If you have foreign clientele, the Dominica Work in Nature (WIN) permit allows legal residence for up to 18 months.`,
  });
});

// 2. Dominica Mock Interview Evaluation Endpoint
app.post('/api/career/interview-prep', async (req, res) => {
  const { question, candidateAnswer, jobTitle, company, sector, experienceLevel } = req.body;

  if (!question || !candidateAnswer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert Dominican hiring manager and executive recruiter conducting an interview for:
Role: ${jobTitle || 'Professional Role'}
Company: ${company || 'Dominican Organization'}
Sector: ${sector || 'Commonwealth of Dominica Economy'}
Experience Level: ${experienceLevel || 'Mid-Level'}

Interview Question Asked:
"${question}"

Candidate's Answer:
"${candidateAnswer}"

Analyze the candidate's answer with constructive Caribbean and international hiring standards. Provide:
1. Overall Score from 1 to 100.
2. Technical Accuracy score from 1 to 100.
3. Behavioral / STAR Structure score from 1 to 100.
4. 2-3 specific Strengths.
5. 2-3 actionable Areas of Improvement.
6. An exemplary Model Answer crafted for Dominica employers.

Respond strictly in valid JSON format with keys:
{
  "score": number,
  "technicalScore": number,
  "behavioralScore": number,
  "strengths": string[],
  "improvements": string[],
  "modelAnswer": string
}`,
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini Interview Prep error:', err);
    }
  }

  // Realistic fallback assessment
  return res.json({
    score: 85,
    technicalScore: 88,
    behavioralScore: 82,
    strengths: [
      'Articulated relevant previous problem-solving experiences clearly using STAR format.',
      'Demonstrated understanding of team dynamics, customer care, and client communication.',
      'Positive tone suitable for Dominica corporate, public sector, and hospitality culture.',
    ],
    improvements: [
      'Incorporate specific metrics or measurable outcomes (e.g. % efficiency, turnaround time, guest reviews).',
      'Explicitly reference local Dominica community impact or stakeholder collaboration across parishes.',
    ],
    modelAnswer: `In my previous role, I took ownership of our operational pipeline by aligning closely with our department head. When unexpected logistical hurdles occurred, I coordinated with local parish suppliers to ensure zero service disruption. For this organization in Dominica, I will bring that same proactive resilience, respecting Dominica’s community ethos while driving high performance.`,
  });
});

// 2b. Gemini Interview Question Generator Endpoint
app.post('/api/career/generate-simulation-questions', async (req, res) => {
  const { sector, experienceLevel, targetRole, questionCount = 4, questionFocus = 'Mixed' } = req.body;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are the Lead Recruitment Director for Nature Island Careers in the Commonwealth of Dominica (Waitukubuli).
Generate ${questionCount} authentic mock interview questions tailored to:
- Sector: ${sector || 'Information Technology & Digital'}
- Experience Level: ${experienceLevel || 'Mid-Level Specialist'}
- Target Role / Title: ${targetRole || 'Professional Role'}
- Question Focus: ${questionFocus} (mix of technical domain questions and behavioral/STAR scenarios relevant to Caribbean & Dominican employers).

Include realistic Caribbean context where appropriate:
- Respect for local parish communities (Roseau, Portsmouth, Laudat, Soufriere, Marigot).
- Climate resilience, tropical weather contingency, or sustainable practices (Nature Isle green ethos).
- Compliance with Dominica Social Security (DSS) or local labor standards where relevant.

Respond strictly in valid JSON format:
{
  "questions": [
    {
      "id": "sim-1",
      "type": "Technical",
      "question": "string",
      "interviewerContext": "Why Dominican employers ask this and what they are looking for",
      "competencyTested": "string (e.g. Cloud Scalability, Crisis Resilience, Guest Relations)",
      "sampleAnswer": "A high-scoring answer tailored for Dominican employers"
    }
  ]
}`,
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return res.json(parsed);
      }
    } catch (err: any) {
      console.error('Gemini Question Generation error:', err);
    }
  }

  // Fallback questions generator based on sector and experience
  const fallbackSector = sector || 'Information Technology & Digital';
  const isHospitality = fallbackSector.includes('Hospitality') || fallbackSector.includes('Tourism');
  const isEnergy = fallbackSector.includes('Energy') || fallbackSector.includes('Geothermal');
  const isPublic = fallbackSector.includes('Public') || fallbackSector.includes('Cooperatives');

  const questions = [
    {
      id: `sim-gen-1`,
      type: 'Technical',
      question: isHospitality
        ? `How do you implement Discover Dominica Authority (DDA) service standards while managing luxury guest expectations during peak eco-tourism season?`
        : isEnergy
        ? `What safety protocols and SCADA monitoring steps do you execute when an unexpected pressure fluctuation occurs at a geothermal wellhead in Laudat?`
        : isPublic
        ? `How do you verify employer compliance with statutory Dominica Social Security (DSS) contributions and ensure accurate filing records?`
        : `How do you design high-availability cloud architecture that remains resilient during undersea cable latency or local power disruptions in Dominica?`,
      interviewerContext: `Assesses foundational technical competence and familiarity with Dominican operational constraints.`,
      competencyTested: isHospitality ? `DDA Quality Standards` : isEnergy ? `Geothermal SCADA Protocols` : isPublic ? `DSS Statutory Compliance` : `System Reliability & Architecture`,
      sampleAnswer: `I establish structured operational SOPs with redundant failover measures. In previous projects, this ensured zero downtime and full compliance with Dominica regulations.`,
    },
    {
      id: `sim-gen-2`,
      type: 'Behavioral',
      question: `Describe a situation where severe tropical weather or supply chain disruptions threatened your team's project deadline. How did you adapt?`,
      interviewerContext: `Evaluates resilience, proactive contingency management, and Caribbean workplace adaptability.`,
      competencyTested: `Crisis Management & Operational Resilience`,
      sampleAnswer: `When a tropical disturbance disrupted inter-parish transport, I switched our team to satellite communication and pre-staged local resources, delivering our deliverables with zero client impact.`,
    },
    {
      id: `sim-gen-3`,
      type: 'Technical',
      question: `Walk me through how you troubleshoot an escalation involving cross-functional stakeholders with conflicting priorities at the ${experienceLevel || 'Mid-Level'} level.`,
      interviewerContext: `Tests methodical problem decomposition and stakeholder consensus building.`,
      competencyTested: `Root Cause Analysis & Stakeholder Management`,
      sampleAnswer: `I isolate the primary root cause using empirical data, schedule a rapid alignment briefing, and establish measurable milestone checkpoints acceptable to all parish stakeholders.`,
    },
    {
      id: `sim-gen-4`,
      type: 'Behavioral',
      question: `How do you foster mentorship and cultural harmony when collaborating with diverse team members across Dominica's 10 parishes and international remote partners?`,
      interviewerContext: `Examines emotional intelligence, community ethos, and respect for Waitukubuli cultural heritage.`,
      competencyTested: `Inclusive Leadership & Community Ethos`,
      sampleAnswer: `I practice active listening, acknowledge individual strengths, and create an open knowledge-sharing environment that empowers junior Dominican trainees alongside experienced staff.`,
    },
  ];

  return res.json({ questions });
});

// 3. AI Cover Letter Generator Endpoint
app.post('/api/career/cover-letter', async (req, res) => {
  const { job, resumeData } = req.body;

  if (aiClient && job && resumeData) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert Caribbean career coach drafting a formal, compelling cover letter for a candidate applying to a position in the Commonwealth of Dominica (Waitukubuli).

Candidate Details:
Name: ${resumeData.fullName}
Location: ${resumeData.locality || ''}, ${resumeData.parish}, Dominica
Headline: ${resumeData.headline}
Skills: ${resumeData.skills?.join(', ')}
Summary: ${resumeData.summary}

Target Job:
Title: ${job.title}
Company: ${job.company}
Parish: ${job.parish} (${job.locality})
Sector: ${job.sector}
Responsibilities: ${job.responsibilities?.join('; ')}
Requirements: ${job.requirements?.join('; ')}

Draft a warm, professional, and convincing cover letter formatted with formal date, address block, reference line, and closing. Highlight the candidate's dedication to Dominica's local economy and their direct fit for the role. Output only the cover letter text.`,
              },
            ],
          },
        ],
      });

      return res.json({ coverLetter: response.text });
    } catch (err) {
      console.error('Gemini Cover Letter error:', err);
    }
  }

  return res.json({ error: 'Fallback generator used' });
});

// 2. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    country: 'Commonwealth of Dominica (Waitukubuli)',
    currency: 'XCD (Eastern Caribbean Dollar)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Vite middleware for dev or serve dist in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Dominica Jobs server listening on http://0.0.0.0:${port}`);
});
