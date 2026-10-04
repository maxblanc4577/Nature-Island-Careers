import React, { useState } from 'react';
import { JobSector } from '../types';
import {
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Award,
  BookOpen,
  Building,
  MapPin,
  RefreshCw,
  Loader2,
  Check,
  Zap,
} from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  sector: JobSector;
  context: string;
  keyPoints: string[];
  modelAnswer: string;
  difficulty: 'Entry-Level' | 'Mid-Senior' | 'Leadership';
}

const DOMINICA_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    sector: 'Renewable Energy & Geothermal',
    question: 'How would you address safety protocols and emergency isolation when working on high-voltage transmission lines near active geothermal wellheads in Laudat?',
    context: 'Evaluates geothermal plant risk awareness, H2S gas detection familiarity, and DOMLEC grid safety adherence.',
    keyPoints: [
      'Lockout/Tagout (LOTO) protocols compliant with Dominica Electricity Services (DOMLEC).',
      'Atmospheric H2S and toxic gas monitoring protocols in volcanic valleys.',
      'Active communication with the Roseau dispatch control center.',
    ],
    modelAnswer:
      'In Laudat’s volcanic terrain, electrical safety requires dual monitoring: rigorous Lockout/Tagout (LOTO) on high-voltage switchgear, and active personal H2S gas detection. Before line isolation, I coordinate directly with DOMLEC load dispatchers, verify grounding conductors, and ensure our crew maintains secondary radio redundancy due to valley signal shadows.',
    difficulty: 'Mid-Senior',
  },
  {
    id: 'fc-2',
    sector: 'Eco-Tourism & Hospitality',
    question: 'A high-profile guest at an eco-resort requests an excursion during an unexpected heavy rainfall advisory along the Waitukubuli Trail. How do you handle this diplomatically?',
    context: 'Tests tropical guest safety balance, diplomatic Caribbean hospitality, and knowledge of Forestry Division trail advisories.',
    keyPoints: [
      'Prioritize life safety and Forestry Division legal alerts over guest demands.',
      'Offer alternative weather-proof luxury experiences (e.g. geothermal sulfur springs in Wotten Waven).',
      'Explain Dominica topography and flash-flood dynamics respectfully.',
    ],
    modelAnswer:
      'I would immediately acknowledge their adventurous spirit, but explain that Dominica’s steep rainforest catchment areas make flash floods hazardous during sudden rainfall advisories. Rather than simply saying no, I offer a premier alternative—such as a private covered soak at Ti Kwen Glo Cho sulfur springs in Wotten Waven followed by an authentic culinary tasting—rescheduling the ridge trek once the Forestry Division gives an all-clear.',
    difficulty: 'Mid-Senior',
  },
  {
    id: 'fc-3',
    sector: 'Information Technology & Digital',
    question: 'How do you design high-availability cloud architecture for a Dominican enterprise considering potential subsea fiber cuts or hurricane disruptions?',
    context: 'Assesses resilience engineering, multi-region failover, and Dominica local network constraints.',
    keyPoints: [
      'Multi-region cloud infrastructure (e.g. us-east / Caribbean nodes).',
      'Local caching and offline-first Progressive Web App (PWA) sync.',
      'Cellular LTE / Starlink satellite fallback configurations.',
    ],
    modelAnswer:
      'Resilient Caribbean architecture requires zero single-points-of-failure. I configure multi-region cloud deployment with automatic failover, implement local encrypted SQLite/IndexedDB caching on client devices so operations continue offline during network blackouts, and establish dual ISP uplink failover between Digicel, Flow, and Starlink backup.',
    difficulty: 'Leadership',
  },
  {
    id: 'fc-4',
    sector: 'Banking & Financial Services',
    question: 'How do you navigate Eastern Caribbean Central Bank (ECCB) regulatory compliance and anti-money laundering (AML) requirements when onboarding international remote workers and diaspora investors in Dominica?',
    context: 'Assesses knowledge of ECCB monetary union regulations, source-of-funds verification, and CARICOM banking standards.',
    keyPoints: [
      'ECCB regulatory guidelines and Financial Services Unit (FSU) compliance.',
      'Proof of overseas tax compliance and WIN Remote Visa verification.',
      'Rigorous source-of-wealth documentation and PEP screening.',
    ],
    modelAnswer:
      'I follow a thorough risk-based due diligence framework under ECCB and Dominica FSU regulations. For WIN remote permit holders or diaspora investors, I verify their verified overseas employer tax filings, notarized source-of-wealth documentation, and cross-reference international sanctions databases, ensuring full compliance without creating unnecessary friction for legitimate investors.',
    difficulty: 'Mid-Senior',
  },
  {
    id: 'fc-5',
    sector: 'Agriculture & Agro-Processing',
    question: 'What quality control measures must be enforced in Roseau when preparing root crops and hot peppers for phytosanitary export certification to CARICOM regional partners?',
    context: 'Tests knowledge of DEXIA packing house protocols, agricultural pest management, and post-harvest handling.',
    keyPoints: [
      'Ministry of Agriculture phytosanitary inspection standards.',
      'Cold-chain temperature control for tropical produce to prevent post-harvest spoilage.',
      'Traceability labeling referencing specific parish farm plots.',
    ],
    modelAnswer:
      'I enforce strict post-harvest protocols starting at farm collection: careful washing and mechanical sorting to eliminate soil residues, humidity-controlled curing for dasheen and ginger, and precise cold-storage at DEXIA-approved temperatures. Each crate is labeled with farm traceability IDs ready for Ministry of Agriculture phytosanitary inspectors prior to seafreight loading.',
    difficulty: 'Entry-Level',
  },
  {
    id: 'fc-6',
    sector: 'Healthcare & Medical',
    question: 'How do you handle patient triage and emergency resource allocation at Dominica China Friendship Hospital when severe weather isolates peripheral health clinics in eastern parishes?',
    context: 'Evaluates public health emergency response, inter-facility communication, and island ambulance logistics.',
    keyPoints: [
      'Dominica Ministry of Health disaster triage protocols.',
      'Emergency tele-health coordination with Marigot and Grand Bay health centers.',
      'Strategic stockpile management of IV fluids, oxygen, and emergency blood products.',
    ],
    modelAnswer:
      'I activate the hospital disaster protocol immediately: establish radio communication with district medical officers in Marigot and Grand Bay, clear non-critical beds for inbound transfers, and triage patients using standard color-coded severity. If roads are blocked by landslides, I coordinate with the disaster committee for helicopter transport or local clinic stabilization until access is restored.',
    difficulty: 'Leadership',
  },
];

export const CareerInterviewFlashcards: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<JobSector | 'All'>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const availableCards =
    selectedSector === 'All'
      ? DOMINICA_FLASHCARDS
      : DOMINICA_FLASHCARDS.filter((c) => c.sector === selectedSector);

  const currentCard = availableCards[currentIndex] || availableCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % availableCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + availableCards.length) % availableCards.length);
  };

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateAiFlashcard = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/career/generate-simulation-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedSector === 'All' ? 'Dominica Professional' : selectedSector,
          sector: selectedSector === 'All' ? 'Dominica Economy' : selectedSector,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const q = data.questions[0];
          const newCard: Flashcard = {
            id: `ai-fc-${Date.now()}`,
            sector: selectedSector === 'All' ? 'Information Technology & Digital' : selectedSector,
            question: q.question,
            context: q.context || 'Generated by Gemini AI tailored for Dominica employer interview standards.',
            keyPoints: [
              'Clear situational CARICOM/Dominica context.',
              'Demonstrate proactive conflict resolution and island grounding.',
              'Highlight resilience and quantifiable results.',
            ],
            modelAnswer: q.sampleAnswer || 'Provide a structured STAR response showcasing direct Caribbean leadership and problem solving.',
            difficulty: 'Mid-Senior',
          };
          DOMINICA_FLASHCARDS.unshift(newCard);
          setCurrentIndex(0);
          setIsFlipped(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Interview Mastery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Dominica Career Interview Flashcards
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Test your knowledge against real-world Caribbean interview scenarios. Flip each card to reveal expert-guided model answers and critical Dominica workplace nuances.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleGenerateAiFlashcard}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isLoadingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Card with Gemini...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Generate New AI Flashcard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sector Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          'All',
          'Renewable Energy & Geothermal',
          'Eco-Tourism & Hospitality',
          'Information Technology & Digital',
          'Banking & Financial Services',
          'Agriculture & Agro-Processing',
          'Healthcare & Medical',
        ].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => {
              setSelectedSector(sec as any);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSector === sec
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {sec === 'All' ? 'All Industries' : sec}
          </button>
        ))}
      </div>

      {/* Progress & Card Position Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Card {currentIndex + 1} of {availableCards.length}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{masteredIds.length} Scenarios Mastered</span>
        </span>
      </div>

      {/* 3D Flip Flashcard */}
      <div className="perspective-1000 min-h-[380px] sm:min-h-[340px]">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full min-h-[380px] sm:min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-lg border ${
            isFlipped
              ? 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 border-emerald-700/60 text-white'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-emerald-600/50'
          } p-6 sm:p-8 flex flex-col justify-between`}
        >
          {/* Top Kicker */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  isFlipped
                    ? 'bg-emerald-800/80 text-emerald-200 border border-emerald-600/50'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentCard.sector}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isFlipped
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {currentCard.difficulty}
              </span>
            </div>

            <span className="text-[11px] font-medium flex items-center gap-1 opacity-75">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Click to view question' : 'Click card to reveal model answer'}</span>
            </span>
          </div>

          {/* Card Body Content */}
          <div className="my-auto py-4 space-y-4">
            {!isFlipped ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Interview Scenario Question</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold leading-relaxed text-slate-950 font-display">
                  "{currentCard.question}"
                </h3>
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Employer Context: </span>
                  {currentCard.context}
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Expert-Guided Model Answer</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed italic bg-emerald-900/30 p-4 rounded-xl border border-emerald-700/40">
                  "{currentCard.modelAnswer}"
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] block">
                    Key Evaluator Checkpoints:
                  </span>
                  <ul className="space-y-1 text-[11px] text-emerald-200/90 list-disc list-inside">
                    {currentCard.keyPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Bottom Card Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100/20 text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered(currentCard.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                masteredIds.includes(currentCard.id)
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isFlipped
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{masteredIds.includes(currentCard.id) ? 'Mastered' : 'Mark as Mastered'}</span>
            </button>

            <span className="text-[11px] font-semibold text-slate-400">
              Waitukubuli Interview Practice Module
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Prev / Next Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Scenario</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Flip Card</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <span>Next Scenario</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
