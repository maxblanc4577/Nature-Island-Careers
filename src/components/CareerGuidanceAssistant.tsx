import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { DOMINICA_NETWORKING_EVENTS } from '../data/resumeDefaults';
import { ResumeLibrary } from './ResumeLibrary';
import { CareerSkillsGapAnalyzer } from './CareerSkillsGapAnalyzer';
import { InterviewPrepSimulation } from './InterviewPrepSimulation';
import { VisualCareerPathing } from './VisualCareerPathing';
import { ResumeParserTool } from './ResumeParserTool';
import { DominicaIndustryNews } from './DominicaIndustryNews';
import { CareerInterviewFlashcards } from './CareerInterviewFlashcards';
import { DominicaEmploymentLawChatModal } from './DominicaEmploymentLawChatModal';
import { NetworkingEvent, JobSector, JobListing } from '../types';
import {
  Compass,
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Mic,
  Award,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  Zap,
  Building,
  Target,
  FolderLock,
  TrendingUp,
  FileText,
  Globe,
  Scale,
  Lightbulb,
  Layers,
  DollarSign,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

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

// Pre-seeded Dominica Interview Scenarios
const MOCK_INTERVIEW_QUESTIONS: Record<
  string,
  {
    questions: {
      id: string;
      question: string;
      context: string;
      sampleAnswer: string;
    }[];
  }
> = {
  general: {
    questions: [
      {
        id: 'q1',
        question:
          'Tell me about a time you had to adapt quickly when unexpected logistical or weather challenges disrupted your workplace.',
        context:
          'Evaluates resilience, tropical climate readiness, and creative problem-solving in Dominica.',
        sampleAnswer:
          'During severe tropical weather, our main server network lost power. I immediately switched our critical customer records to our offline cached ledger and coordinated with our local ISP in Roseau, ensuring our guests and clients experienced zero service delays.',
      },
      {
        id: 'q2',
        question:
          'How do you collaborate effectively with cross-parish community members and local stakeholders who may have differing cultural perspectives?',
        context:
          'Tests community ethos, local respect, and Caribbean team harmony.',
        sampleAnswer:
          'I prioritize active listening and respectful dialogue. When working on a regional initiative between Roseau and Portsmouth, I scheduled community sessions in advance to understand local concerns, building trust and shared ownership of the project goals.',
      },
      {
        id: 'q3',
        question:
          'What makes you passionate about contributing your professional talents to the Commonwealth of Dominica’s economy?',
        context:
          'Evaluates long-term commitment to island development and sustainable growth.',
        sampleAnswer:
          'Dominica is leading the world in climate resilience and sustainable eco-tourism. I want my skills to directly advance our island’s self-reliance, empowering local talent and demonstrating that world-class work thrives right here in Waitukubuli.',
      },
    ],
  },
};

export const CareerGuidanceAssistant: React.FC = () => {
  const { jobs } = useJobContext();

  const [activeTab, setActiveTab] = useState<
    | 'chat'
    | 'career_pathing'
    | 'interview_prep'
    | 'flashcards'
    | 'skills_gap'
    | 'resume_parser'
    | 'industry_news'
    | 'networking_events'
    | 'resume_library'
  >('chat');

  // Floating Law & Culture Chat Modal State
  const [isLawChatOpen, setIsLawChatOpen] = useState(false);

  // Career Tips Sidebar State
  const [tipCategory, setTipCategory] = useState<'interview' | 'salary'>('interview');
  const [dynamicTipText, setDynamicTipText] = useState<string>('');
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  const fetchDynamicTip = async (category: 'interview' | 'salary') => {
    setIsLoadingTip(true);
    try {
      const res = await fetch('/api/career/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:
            category === 'interview'
              ? 'Provide a concise, practical, highly specific tip for acing a job interview with a top employer in the Commonwealth of Dominica (e.g. cultural rapport, local references, handling tropical weather/transport).'
              : 'Provide a concise, practical tip for negotiating salary in Eastern Caribbean Dollars (XCD / EC$) with a Dominica employer, including allowances, statutory DSS, and gratuity.',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.advice) {
          setDynamicTipText(json.advice);
          setIsLoadingTip(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    if (category === 'interview') {
      setDynamicTipText(
        '🇩🇲 Dominica Interview Tip: Emphasize both your technical credentials and your local community grounding. Dominican interview panels appreciate candidates who highlight cross-parish adaptability and reference respected local community or educational institutions like Dominica State College.'
      );
    } else {
      setDynamicTipText(
        '💰 Dominica Salary Tip: Always frame compensation in Eastern Caribbean Dollars (EC$ / XCD) and inquire about benefits such as fuel/vehicle allowance for cross-parish commutes (e.g. Roseau to Portsmouth/Laudat) and statutory Dominica Social Security (DSS) contributions.'
      );
    }
    setIsLoadingTip(false);
  };

  // Chat State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock Interview State
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
  } | null>(null);

  // Networking Events State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Advisor Chat Logic
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/career/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.advice) {
          const botMsg: Message = {
            id: `msg-${Date.now()}-bot`,
            sender: 'assistant',
            text: json.advice,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Default advisor response
    setTimeout(() => {
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: 'assistant',
        text: `### Dominica Career Insight & Advice 🇩🇲\n\nThank you for asking about **${query}**.\n\n1. **Local Employer Priority:** Dominica employers prioritize demonstrated reliability, integrity, and proactive parish community engagement.\n2. **Statutory Benefits:** Ensure any job offer reflects statutory **Dominica Social Security (DSS)** contributions and compliant Caribbean leave benefits.\n3. **Continuous Upskilling:** Pair your practical experience with recognized certifications through Dominica State College (DSC) or international accredited credentials.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  // Mock Interview Evaluation
  const questionsList = MOCK_INTERVIEW_QUESTIONS.general.questions;
  const currentQuestion = questionsList[currentQuestionIndex];

  const handleEvaluateAnswer = async () => {
    if (!candidateAnswer.trim()) return;
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/career/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          candidateAnswer,
          jobTitle: selectedJob?.title,
          company: selectedJob?.company,
          sector: selectedJob?.sector,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.score) {
          setEvaluationResult(json);
          setIsEvaluating(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // High quality fallback
    setTimeout(() => {
      setEvaluationResult({
        score: 86,
        strengths: [
          'Directly addressed the question with a concrete Caribbean situational example.',
          'Demonstrated calm problem-solving and proactive communication under pressure.',
          'Highlighted consideration for colleagues and Dominica stakeholder relations.',
        ],
        improvements: [
          'Quantify outcomes where possible (e.g. "restored operations within 45 minutes").',
          'Mention familiar Dominica systems or institutions to demonstrate island grounding.',
        ],
        modelAnswer: currentQuestion.sampleAnswer,
      });
      setIsEvaluating(false);
    }, 800);
  };

  const handleNextQuestion = () => {
    setEvaluationResult(null);
    setCandidateAnswer('');
    setCurrentQuestionIndex((prev) => (prev + 1) % questionsList.length);
  };

  // Calendar .ics generator for networking events
  const downloadIcs = (event: NetworkingEvent) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nature Island Careers//Dominica Career Portal//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@natureislandcareers.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${event.calendarStart}`,
      `DTEND:${event.calendarEnd}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
      `LOCATION:${event.venue}, ${event.parish}, Dominica`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^\w]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = (event: NetworkingEvent) => {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${event.calendarStart}/${event.calendarEnd}&details=${encodeURIComponent(
      `${event.description}\n\nOrganizer: ${event.organizer}`
    )}&location=${encodeURIComponent(`${event.venue}, ${event.parish}, Dominica`)}`;
  };

  const filteredEvents =
    selectedCategory === 'All'
      ? DOMINICA_NETWORKING_EVENTS
      : DOMINICA_NETWORKING_EVENTS.filter((e) => e.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Nature Island Talent Accelerator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Career Guidance & Interview Suite
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            AI-powered Dominica market advisory, interactive Gemini mock interviews calibrated for local employers, and upcoming island networking events.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white p-2 rounded-2xl shadow-xs border">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'chat'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Dominica Advisor Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('career_pathing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'career_pathing'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Visual Career Pathing</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-black">
            Recharts
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interview_prep')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'interview_prep'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Interview Prep Simulation</span>
          <span className="bg-amber-400/20 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            Gemini AI
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flashcards')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'flashcards'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Interview Flashcards</span>
          <span className="bg-amber-400/20 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            3D Flip
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills_gap')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'skills_gap'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4 text-amber-400" />
          <span>Skills Gap Analysis</span>
          <span className="bg-amber-400/20 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            Trending Roles
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resume_parser')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'resume_parser'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-500" />
          <span>AI Resume Parser</span>
          <span className="bg-blue-400/20 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            Auto-Fill
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('industry_news')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'industry_news'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4 text-teal-500" />
          <span>Dominica Industry News</span>
          <span className="bg-teal-400/20 text-teal-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            Grounded
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('networking_events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'networking_events'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>Dominica Networking Events & Fairs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resume_library')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'resume_library'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderLock className="w-4 h-4 text-amber-500" />
          <span>Resume & Cover Letter Library</span>
          <span className="bg-amber-400/20 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black">
            Version History
          </span>
        </button>
      </div>

      {/* TAB 1: ADVISOR CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Chat Container (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
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
                        ? 'bg-emerald-800 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-800 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Advisor is researching Dominica market insights...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about Dominica salaries, eco-resort careers, Laudat geothermal jobs, DSC courses..."
                className="flex-1 text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputText.trim()}
                className="px-5 py-3 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Career Tips & Dominica Market Insights Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Dynamic Career Tips Sidebar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Dominica Career Tips
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Market Tailored
                </span>
              </div>

              {/* Tips Category Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTipCategory('interview')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    tipCategory === 'interview'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Interview Prep
                </button>
                <button
                  type="button"
                  onClick={() => setTipCategory('salary')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    tipCategory === 'salary'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salary Negotiation
                </button>
              </div>

              {/* Dynamic Tip Content Card */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2 text-xs leading-relaxed">
                {dynamicTipText ? (
                  <p className="text-emerald-950 font-medium whitespace-pre-line animate-in fade-in">
                    {dynamicTipText}
                  </p>
                ) : tipCategory === 'interview' ? (
                  <div className="space-y-1.5 text-emerald-950">
                    <p className="font-bold text-emerald-900">🇩🇲 Dominica Interview Strategy:</p>
                    <ul className="space-y-1 text-[11px] list-disc list-inside text-emerald-900/90">
                      <li>Address interview panels with cordial Caribbean greetings ("Good morning / afternoon").</li>
                      <li>Prepare examples showing weather & transport resilience (handling tropical rains or cross-parish logistics).</li>
                      <li>Highlight recognized local institutions (e.g. Dominica State College, UWI Open Campus).</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-emerald-950">
                    <p className="font-bold text-emerald-900">💰 Salary Negotiation in Dominica:</p>
                    <ul className="space-y-1 text-[11px] list-disc list-inside text-emerald-900/90">
                      <li>Always quote target ranges in <strong>Eastern Caribbean Dollars (EC$ / XCD)</strong>.</li>
                      <li>Factor in <strong>Dominica Social Security (DSS)</strong>: 6.00% employee / 6.75% employer.</li>
                      <li>Inquire about vehicle/fuel allowances for positions requiring cross-parish travel (Roseau to Portsmouth/Laudat).</li>
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fetchDynamicTip(tipCategory)}
                  disabled={isLoadingTip}
                  className="w-full py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-1"
                >
                  {isLoadingTip ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Generating AI Tip...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Get Dynamic AI {tipCategory === 'interview' ? 'Interview' : 'Salary'} Tip</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Prompt Questions:
                </span>
                {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full p-2 text-left text-[11px] bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition-all cursor-pointer text-slate-700 leading-snug truncate block"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Dominica Employment Facts Snapshot */}
            <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-xs space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                Waitukubuli Employment Hub
              </span>
              <h4 className="font-bold text-sm text-white">Dominica Quick Facts</h4>
              <ul className="text-xs space-y-2 text-emerald-100/90 leading-relaxed">
                <li>• <strong>Currency:</strong> Eastern Caribbean Dollar (XCD), pegged at EC$ 2.70 : $1 USD.</li>
                <li>• <strong>Statutory DSS:</strong> 6.75% employer / 6.00% employee contribution.</li>
                <li>• <strong>WIN Extended Stay:</strong> Legal 18-month remote permit with 0% local income tax on foreign revenues.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL CAREER PATHING */}
      {activeTab === 'career_pathing' && (
        <div className="animate-in fade-in">
          <VisualCareerPathing />
        </div>
      )}

      {/* TAB 3: INTERVIEW PREP SIMULATION */}
      {activeTab === 'interview_prep' && (
        <div className="animate-in fade-in">
          <InterviewPrepSimulation jobs={jobs} />
        </div>
      )}

      {/* TAB 4: INTERVIEW FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="animate-in fade-in">
          <CareerInterviewFlashcards />
        </div>
      )}

      {/* TAB 4: SKILLS GAP ANALYSIS */}
      {activeTab === 'skills_gap' && (
        <div className="animate-in fade-in">
          <CareerSkillsGapAnalyzer jobs={jobs} />
        </div>
      )}

      {/* TAB 5: AI RESUME PARSER */}
      {activeTab === 'resume_parser' && (
        <div className="animate-in fade-in">
          <ResumeParserTool />
        </div>
      )}

      {/* TAB 6: DOMINICA INDUSTRY NEWS (SEARCH GROUNDED) */}
      {activeTab === 'industry_news' && (
        <div className="animate-in fade-in">
          <DominicaIndustryNews />
        </div>
      )}

      {/* TAB 7: NETWORKING EVENTS & FAIRS */}
      {activeTab === 'networking_events' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Event Category:
              </span>
              <div className="flex flex-wrap gap-1">
                {['All', 'Career Fair', 'Tech & Innovation', 'Workshop', 'Industry Meetup'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredEvents.length} upcoming Dominica gatherings
            </span>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {evt.category}
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {evt.isFree ? 'Free Admission' : 'Ticketed Event'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-display">
                    {evt.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{evt.venue} ({evt.parish})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Organizer: {evt.organizer}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                {/* Event Actions with Calendar Integration */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {evt.attendeesCount}+ registered attendees
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Add to Google Calendar direct link */}
                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google Calendar</span>
                    </a>

                    {/* Download standard .ICS file */}
                    <button
                      type="button"
                      onClick={() => downloadIcs(evt)}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Download Apple / Outlook .ics calendar event file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ICS</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: RESUME & COVER LETTER LIBRARY */}
      {activeTab === 'resume_library' && (
        <div className="animate-in fade-in">
          <ResumeLibrary />
        </div>
      )}

      {/* PERSISTENT FLOATING CHAT BUTTON FOR DOMINICA EMPLOYMENT LAW & WORKPLACE CULTURE */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsLawChatOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer border border-emerald-500/40 hover:scale-105 active:scale-95"
          title="Ask Gemini about Dominica employment laws and workplace cultural nuances"
          aria-label="Ask about Dominica employment laws and workplace cultural nuances"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>Dominica Law & Culture</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-emerald-200 font-medium">
              Ask Gemini AI Advisor
            </div>
          </div>
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isLawChatOpen && (
        <DominicaEmploymentLawChatModal
          isOpen={isLawChatOpen}
          onClose={() => setIsLawChatOpen(false)}
        />
      )}
    </div>
  );
};
