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
        model: 'gemini-2.5-flash',
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
