import React from 'react';
import { Parish, JobSector } from '../types';
import {
  Search,
  MapPin,
  Briefcase,
  BellRing,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Laptop,
  Clock,
  History,
} from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedParish: Parish | 'All';
  setSelectedParish: (p: Parish | 'All') => void;
  selectedSector: JobSector | 'All';
  setSelectedSector: (s: JobSector | 'All') => void;
  totalJobsCount: number;
  onOpenAlertModal: () => void;
  onOpenRemoteModal: () => void;
  backgroundImageUrl?: string;
  siteName?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedParish,
  setSelectedParish,
  selectedSector,
  setSelectedSector,
  totalJobsCount,
  onOpenAlertModal,
  onOpenRemoteModal,
  backgroundImageUrl = '/nature_island_photo.jpg',
  siteName = 'Nature Island Careers',
}) => {
  const [bgMode, setBgMode] = React.useState<'photo_scotts' | 'trafalgar_falls' | 'emerald_pool' | 'flag'>('photo_scotts');

  // Remember last 3 user-entered search queries
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('natureisland_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3);
        }
      }
    } catch {
      // ignore
    }
    return ['Eco-Resort', 'Software Developer', 'Solar Energy'];
  });
  const [showRecentDropdown, setShowRecentDropdown] = React.useState(false);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 3);
      try {
        localStorage.setItem('natureisland_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSelectRecentSearch = (query: string) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    setShowRecentDropdown(false);
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('natureisland_recent_searches');
    } catch {
      // ignore
    }
  };

  const currentBg =
    bgMode === 'photo_scotts'
      ? (backgroundImageUrl && !backgroundImageUrl.endsWith('.svg') ? backgroundImageUrl : '/nature_island_photo.jpg')
      : bgMode === 'trafalgar_falls'
      ? '/src/assets/images/dominica_trafalgar_falls_1790716659754.jpg'
      : bgMode === 'emerald_pool'
      ? '/src/assets/images/dominica_emerald_pool_1790716670674.jpg'
      : '/dominica_flag.svg';

  const isPhoto = bgMode !== 'flag';

  return (
    <div
      className="relative overflow-hidden text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-800/50 bg-cover bg-center bg-no-repeat transition-all duration-700 min-h-[460px] flex flex-col justify-center"
      style={{
        backgroundImage: `url('${currentBg}')`,
      }}
    >
      {/* Translucent Backdrop Layer so photo is clearly visible with vibrant nature colors while text and search inputs pop */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isPhoto
            ? 'bg-gradient-to-b from-slate-950/40 via-emerald-950/35 to-slate-950/65'
            : 'bg-gradient-to-b from-emerald-950/80 via-slate-950/80 to-emerald-950/90'
        }`}
      />

      {/* Atmospheric Glow Highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center space-y-6">
        {/* Top Controls: Background Switcher & Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 bg-emerald-950/85 border border-emerald-500/50 rounded-full px-3.5 py-1 text-xs font-semibold text-emerald-100 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{siteName} • Commonwealth of Dominica Official Job Exchange</span>
            <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
              10 Parishes + Global Remote
            </span>
          </div>

          {/* Quick Photo Switcher */}
          <div className="inline-flex items-center bg-black/60 border border-white/20 rounded-full p-0.5 backdrop-blur-md text-[11px] font-semibold text-emerald-200">
            <button
              onClick={() => setBgMode('photo_scotts')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                bgMode === 'photo_scotts' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:text-white'
              }`}
              title="Nature Island Scotts Head Coastal Peninsula"
            >
              🌴 Scotts Head
            </button>
            <button
              onClick={() => setBgMode('trafalgar_falls')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                bgMode === 'trafalgar_falls' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:text-white'
              }`}
              title="Dominica Trafalgar Twin Falls Attraction Site"
            >
              🏞️ Trafalgar Falls
            </button>
            <button
              onClick={() => setBgMode('emerald_pool')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                bgMode === 'emerald_pool' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'hover:text-white'
              }`}
              title="Dominica Emerald Pool Morne Trois Pitons National Park"
            >
              🌿 Emerald Pool
            </button>
            <button
              onClick={() => setBgMode('flag')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                bgMode === 'flag' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'hover:text-white'
              }`}
              title="Dominica National Flag"
            >
              🇩🇲 Flag
            </button>
          </div>
        </div>

        {/* Hero Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Find Your Calling in the{' '}
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            Nature Isle of the Caribbean
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-emerald-100/90 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
          Connecting Dominican professionals, diaspora returnees, and digital nomads with verified careers in Roseau, Portsmouth, luxury eco-resorts, renewable energy, and certified <strong>Work In Nature (WIN)</strong> remote roles.
        </p>

        {/* Search Bar Container */}
        <div className="bg-white/10 backdrop-blur-md p-2.5 sm:p-3.5 rounded-2xl border border-white/20 shadow-2xl max-w-4xl mx-auto text-slate-800 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
            {/* Keyword Input with Recent Searches Dropdown */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowRecentDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowRecentDropdown(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveRecentSearch(searchQuery);
                    setShowRecentDropdown(false);
                  }
                }}
                placeholder="Job title, keywords, or company (e.g. Fort Young, Engineer)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />

              {/* Small Dropdown List of Last 3 Searches */}
              {showRecentDropdown && recentSearches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      Recent Searches (Last 3)
                    </span>
                    <button
                      type="button"
                      onMouseDown={handleClearRecentSearches}
                      className="text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onMouseDown={() => handleSelectRecentSearch(item)}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <span className="font-semibold truncate flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                          <span>{item}</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          Search &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parish Dropdown */}
            <div className="sm:col-span-4 relative">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedParish}
                onChange={(e) => setSelectedParish(e.target.value as Parish | 'All')}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer appearance-none"
              >
                <option value="All">All Parishes in Dominica</option>
                <option value="St. George">St. George (Roseau & Capital)</option>
                <option value="St. John">St. John (Portsmouth & Cabrits)</option>
                <option value="St. Paul">St. Paul (Canefield & Mahaut)</option>
                <option value="St. Andrew">St. Andrew (Marigot & Airport)</option>
                <option value="St. Patrick">St. Patrick (Grand Bay & South)</option>
                <option value="St. Joseph">St. Joseph (Salisbury & Mero)</option>
                <option value="St. David">St. David (Kalinago Territory)</option>
                <option value="St. Luke">St. Luke (Pointe Michel)</option>
                <option value="St. Mark">St. Mark (Soufrière & Scotts Head)</option>
                <option value="St. Peter">St. Peter (Colihaut)</option>
                <option value="Island-wide / Remote">Island-wide / Remote (WIN)</option>
              </select>
            </div>

            {/* Sector / Action */}
            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveRecentSearch(searchQuery)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search ({totalJobsCount})</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Tag Chips */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-200/80 font-medium">Quick Searches:</span>
            <button
              onClick={() => {
                setSearchQuery('Eco-Resort');
                setSelectedSector('Eco-Tourism & Hospitality');
              }}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              🌿 Eco-Resort & Spa
            </button>
            <button
              onClick={() => {
                setSearchQuery('Remote');
                setSelectedParish('Island-wide / Remote');
              }}
              className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-teal-400/30"
            >
              💻 Dominica WIN Remote
            </button>
            <button
              onClick={() => {
                setSelectedParish('St. George');
                setSearchQuery('');
              }}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              🏛️ Roseau Commercial
            </button>
            <button
              onClick={() => {
                setSelectedSector('Renewable Energy & Geothermal');
                setSearchQuery('');
              }}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              ⚡ Geothermal & Climate Resilience
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedParish('All');
                setSelectedSector('All');
              }}
              className="text-stone-300 hover:text-white underline text-[11px] ml-auto"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-4 text-center">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-xl sm:text-2xl font-black text-amber-400">{totalJobsCount}+</p>
            <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wide">Active Vacancies</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-xl sm:text-2xl font-black text-emerald-300">10 / 10</p>
            <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wide">Parishes Represented</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-xl sm:text-2xl font-black text-teal-300">EC$ 2.70</p>
            <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wide">Pegged USD Conversion</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <p className="text-xl sm:text-2xl font-black text-rose-300">100%</p>
            <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wide">Verified Employers</p>
          </div>
        </div>

        {/* Subscribe & Remote Callouts */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenAlertModal}
            className="inline-flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold px-4 py-2 rounded-full border border-emerald-600/40 transition-all cursor-pointer shadow-xs"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Parish Job Alert (Email Notifications)</span>
          </button>

          <button
            onClick={onOpenRemoteModal}
            className="inline-flex items-center gap-2 bg-teal-800/80 hover:bg-teal-700 text-teal-100 text-xs font-semibold px-4 py-2 rounded-full border border-teal-500/40 transition-all cursor-pointer shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5 text-teal-300" />
            <span>Dominica Work in Nature (WIN) Extended Stay Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
