import React, { useState } from 'react';
import { Compass, Sparkles, Send, Bot, User, CheckCircle2, BookOpen, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'assistant',
    text: `Welcome to the **Nature Island Career Advisor**! 🇩🇲

I provide tailored guidance for careers across the Commonwealth of Dominica. Whether you're a Dominica State College (DSC) graduate, an experienced tradesperson, a diaspora professional planning your return, or a digital nomad exploring the **Work In Nature (WIN)** permit, I'm here to support your journey.

For personalized advisory or enterprise recruiter assistance, you can also contact our team directly at **info@natureislandcareers.com**.

How can I assist your career search today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_PROMPTS = [
  'How do I tailor my resume for Dominica luxury eco-resorts like Secret Bay or Fort Young?',
  'What technical skills are in high demand for the Dominica Geothermal Development in Laudat?',
  'What are the eligibility criteria for the Dominica Work In Nature (WIN) remote permit?',
  'What are standard starting salaries for DSC graduates in Roseau?',
];

export const CareerGuidanceAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const getAssistantResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('eco-resort') || q.includes('hospitality') || q.includes('secret bay') || q.includes('fort young')) {
      return `### Tailoring for Dominica's Eco-Resort & Hospitality Sector 🌿

1. **Highlight Sustainability & Green Credentials:**
   Dominica's top resorts (Secret Bay, Coulibri Ridge, Fort Young) prioritize eco-certifications (Green Globe, LEED). Emphasize experience with farm-to-table culinary, solar conservation, or water stewardship.
2. **Local Flora, Fauna & Marine Knowledge:**
   Even in front-of-house or management roles, having familiarity with Dominica's 365 rivers, Morne Trois Pitons National Park, and marine reserves (Soufrière/Scotts Head) demonstrates authentic guest hospitality.
3. **Certifications & Training:**
   Highlight any Discover Dominica Authority (DDA) customer care training, HACCP food hygiene certifications, or DSC hospitality diplomas.
4. **Compensation Insight:**
   Experienced supervisors and department heads command between **EC$ 4,500 – EC$ 8,000 / month**, frequently supplemented by gratuity pools, staff transport, and duty meals.`;
    }

    if (q.includes('geothermal') || q.includes('renewable') || q.includes('energy') || q.includes('laudat')) {
      return `### Dominica Geothermal Project & Clean Energy Careers ⚡

1. **Active Projects:**
   The Dominica Geothermal Development Company (DGDC) in Laudat (St. George) is building Dominica's first commercial geothermal plant to power 70%+ of the island.
2. **In-Demand Skills:**
   - High-voltage electrical engineering & SCADA systems
   - Environmental monitoring & watershed preservation
   - Civil infrastructure & mountain drilling safety (climate resilience)
   - GIS mapping & environmental impact assessment (EIA)
3. **Compensation Range:**
   Technical specialists range from **EC$ 6,000 to EC$ 14,000 / month** depending on certifications.
4. **Recommended Pathway:**
   Graduates with STEM backgrounds or mechanical certifications should submit credentials directly through verified classified openings or Ministry of Public Works apprenticeship programs.`;
    }

    if (q.includes('win') || q.includes('remote') || q.includes('visa') || q.includes('permit') || q.includes('nomad')) {
      return `### Dominica Work In Nature (WIN) Extended Stay Permit 💻🌴

1. **What is WIN?**
   Launched by the Government of Dominica, the WIN program allows remote professionals and digital nomads to live and work legally in Dominica for up to 18 months.
2. **Key Requirements:**
   - Minimum expected income of **$50,000 USD / year** (or equivalent savings).
   - Remote employment with an entity outside Dominica, or freelance consulting.
   - Clean police record & valid international health insurance.
3. **Island Digital Infrastructure:**
   High-speed fiber internet is widely available in Roseau, Portsmouth, Canefield, and key eco-hubs. Co-working lounges and fiber-backed resorts offer seamless Zoom/Meet environments.
4. **Income Tax Exemption:**
   WIN certificate holders are exempt from Dominica local personal income tax on their foreign earnings!`;
    }

    if (q.includes('salary') || q.includes('dsc') || q.includes('graduate') || q.includes('starting')) {
      return `### Entry-Level Compensation Benchmarks for Dominica Graduates 🎓

1. **Dominica State College (DSC) Associates & Diplomas:**
   - **Administrative & Retail:** EC$ 1,800 – EC$ 2,500 / month
   - **Banking & Insurance (Roseau):** EC$ 2,800 – EC$ 3,800 / month
   - **IT & Web Support:** EC$ 3,000 – EC$ 4,200 / month
   - **Hospitality & Culinary:** EC$ 2,200 – EC$ 3,400 / month (+ service charge)
2. **Statutory Benefits:**
   Ensure your contract includes statutory **Dominica Social Security (DSS)** contributions (currently 6.75% employer / 6% employee).
3. **Growth Advice:**
   Pair your formal degree with internationally recognized digital certifications (Google, AWS, Project Management) to accelerate into mid-level positions within 18–24 months.`;
    }

    return `### Dominica Career Insight & Advice

Thank you for your question regarding **"${query}"**.

Here are three key strategies for succeeding in the Dominica job market:

1. **Parish-Specific Networking:**
   While Roseau (St. George) remains the primary commercial and public administrative center, Portsmouth (St. John) offers strong opportunities around the Cabrits marina, medical facilities, and education. Consider your commute and housing when evaluating offers.
2. **Cross-Sector Resilience:**
   Employers in Dominica heavily value versatile team members who understand climate resilience, digital communications, and customer relationship management.
3. **Direct Recruiter Contact:**
   Use the **Waitukubuli Jobs** classifieds board to submit your resume directly to verified employers with verified corporate email domains (.dm).

Feel free to ask for specific interview practice questions or resume bullet point suggestions!`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = getAssistantResponse(text);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-800/80 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-600/40">
              🇩🇲 Nature Isle Employment Guidance
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Nature Island Career Advisor</h2>
          <p className="text-sm text-emerald-100/90 max-w-xl">
            Interactive career mentorship, resume optimization for Dominican employers, and parish labor benchmarks. Contact: info@natureislandcareers.com
          </p>
        </div>
        <div className="hidden sm:flex p-3 bg-emerald-800/40 rounded-2xl border border-emerald-500/30">
          <Compass className="w-10 h-10 text-emerald-300 animate-spin-slow" />
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Suggested Career Questions:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs whitespace-pre-line'
                }`}
              >
                <div>{msg.text}</div>
                <span
                  className={`block text-[10px] mt-2 font-medium ${
                    msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-600'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1">Advisor analyzing Dominica labor benchmarks...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about careers, resumes, salaries, or permits in Dominica..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
