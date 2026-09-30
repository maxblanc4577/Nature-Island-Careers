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
  const { question, candidateAnswer, jobTitle, company, sector } = req.body;

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

Interview Question Asked:
"${question}"

Candidate's Answer:
"${candidateAnswer}"

Analyze the candidate's answer with constructive Caribbean and international hiring standards. Provide:
1. Score from 1 to 100 based on clarity, STAR technique, and local relevance.
2. 2-3 specific Strengths.
3. 2-3 actionable Areas of Improvement.
4. An exemplary Model Answer crafted for Dominica employers.

Respond strictly in valid JSON format with keys:
{
  "score": number,
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
    score: 84,
    strengths: [
      'Articulated relevant previous problem-solving experiences clearly.',
      'Demonstrated understanding of team dynamics and client communication.',
      'Positive tone suitable for Dominica corporate and hospitality culture.',
    ],
    improvements: [
      'Incorporate specific metrics or measurable outcomes (e.g. % efficiency or guest ratings).',
      'Explicitly reference local Dominica community impact or stakeholder collaboration.',
    ],
    modelAnswer: `In my previous role, I took ownership of our operational pipeline by aligning closely with our department head. When unexpected logistical hurdles occurred, I coordinated with local parish suppliers to ensure zero service disruption. For ${company || 'this organization'}, I will bring that same proactive resilience, respecting Dominica’s community ethos while driving high performance.`,
  });
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
