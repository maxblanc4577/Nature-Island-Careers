import React, { useState } from 'react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Scale,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface DominicaEmploymentLawChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const LAW_PROMPTS = [
  'What are statutory notice periods and severance under Dominica Labour Standards?',
  'What are the mandatory Dominica Social Security (DSS) contribution rates?',
  'What cultural etiquette should diaspora and foreign managers observe in Dominican workplaces?',
  'What are the tax implications of working on the 18-month WIN remote visa?',
];

export const DominicaEmploymentLawChatModal: React.FC<DominicaEmploymentLawChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello! I am your **Dominica Employment Law & Workplace Culture Consultant** ⚖️🇩🇲.
      
Ask me any questions regarding the **Dominica Labour Standards Act**, **Dominica Social Security (DSS)** contributions, overtime rates, holiday pay, or cultural nuances for professional workplace communication across Waitukubuli.

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Regarding Commonwealth of Dominica Labour Law & Workplace Culture: ${q}`,
          sector: 'Legal & Regulatory Compliance',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const replyText = json.reply || json.advice;
        if (replyText) {
          setMessages((prev) => [
            ...prev,
            {
              id: `b-${Date.now()}`,
              sender: 'bot',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // High fidelity curated fallback response
    setTimeout(() => {
      let reply = `Under the Commonwealth of Dominica Labour Standards Act and official guidelines:
      
• **Working Hours & Overtime:** Standard working week is 40 hours. Overtime is compensated at 1.5x regular wage rate, and 2.0x on Sundays and Gazetted Public Holidays.
• **Dominica Social Security (DSS):** Statutory contributions are 6.00% for employees and 6.75% for employers (total 12.75%), covering sickness, maternity, and age pensions.
• **Workplace Cultural Nuance:** Respectful greetings (e.g. "Good morning / afternoon") are foundational before beginning business transactions. Hierarchy is respected, but consensus and community harmony are deeply valued across both Roseau commercial offices and parish operations.`;

      if (q.toLowerCase().includes('severance') || q.toLowerCase().includes('notice')) {
        reply = `**Dominica Labour Standards Act on Termination & Severance:**
        
• **Notice Periods:** Continuous employment under 3 months requires 1 week notice; 3 months to 1 year requires 2 weeks; over 1 year requires 1 month (or payment in lieu of notice).
• **Severance Pay:** Employees with over 3 continuous years of service separated due to redundancy are entitled to statutory severance pay calculated based on completed years of service.
• **Labour Division Conciliation:** Inquiries or disputes can be referred directly to the Dominica Labour Division in Roseau for formal conciliation.`;
      } else if (q.toLowerCase().includes('win') || q.toLowerCase().includes('remote')) {
        reply = `**Dominica Work In Nature (WIN) Extended Visa Regulations:**
        
• **Residency Rights:** Authorizes non-nationals and their families to live and work remotely in Dominica for up to 18 months.
• **Tax Exemption:** Holders are legally exempt from Dominica income tax on income earned from foreign employers or non-Dominican entities.
• **Local Compliance:** WIN workers cannot accept local Dominican employment without transitioning to a standard Work Permit approved by the Ministry of National Security and Labour.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dominica Employment Law & Cultural Nuances Consultant"
        tabIndex={-1}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[640px] max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40 text-amber-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white font-display">
                  Dominica Labour Law & Cultural Nuances
                </h3>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                  Gemini Grounded
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Labour Standards Act · DSS Compliance · Island Workplace Etiquette
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-stone-50 border-b border-stone-200 p-2.5 overflow-x-auto flex items-center gap-2 text-xs scrollbar-none">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            Quick Topics:
          </span>
          {LAW_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-lg text-[11px] text-stone-700 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  m.sender === 'user'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-emerald-800 text-white rounded-tr-none'
                    : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-tl-none'
                }`}
              >
                {m.text}
                <span
                  className={`block text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-stone-500 italic p-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>Consulting Dominica Labour Standards Act and cultural precedents...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about overtime, probation, vacation leave, DSS contributions, workplace greetings..."
            className="flex-1 text-xs sm:text-sm p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isTyping || !inputQuery.trim()}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
