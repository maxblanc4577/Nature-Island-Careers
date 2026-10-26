import React, { useState, useId } from 'react';
import {
  BrandLogo,
  BrandLogoMark,
} from './BrandLogo';
import {
  getContrastRatio,
  getWcagRating,
  hexToRgb,
  hexToHsl,
  isColorLight,
} from '../utils/colorUtils';
import { loadGoogleFont } from '../utils/fontLoader';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Download,
  Eye,
  ShieldCheck,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Sliders,
  Type,
  Palette,
  Layout,
  Maximize2,
  Minimize2,
  X,
  Layers,
  MapPin,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  Heart,
  Grid,
  Info,
  Smartphone,
  Monitor,
} from 'lucide-react';

export interface BrandColorSwatch {
  name: string;
  role: string;
  hex: string;
  description: string;
}

export const OFFICIAL_BRAND_PALETTE: BrandColorSwatch[] = [
  {
    name: 'Dominican Forest Green',
    role: 'Primary Background & Core Lockup',
    hex: '#082407',
    description: 'Deep rainforest floor of Waitukubuli; anchors official logos and high-contrast badges.',
  },
  {
    name: 'Emerald Rainforest',
    role: 'Primary Action & Accent',
    hex: '#15803D',
    description: 'Lush tropical vegetation; used for primary buttons, active states, and success indicators.',
  },
  {
    name: 'Nature Lime',
    role: 'Vibrant Growth & Subtitle Accent',
    hex: '#5BC22B',
    description: 'Young sprout leaves and energy; accents the CAREERS wordmark and interactive highlights.',
  },
  {
    name: 'Caribbean Sun Gold',
    role: 'Solar Warmth & Opportunity',
    hex: '#F59E0B',
    description: 'Golden rising sun rays symbolizing vocational potential and morning optimism.',
  },
  {
    name: 'Daylight Amber',
    role: 'Highlight & Attention Glow',
    hex: '#FACC15',
    description: 'Core solar dome glow that illuminates the central emblem rays.',
  },
  {
    name: 'Nature Isle Canvas',
    role: 'Light Neutral Surface',
    hex: '#F8FAF8',
    description: 'Crisp, high-legibility off-white background with subtle green undertones.',
  },
  {
    name: 'Volcanic Slate',
    role: 'Dark Typography & High Contrast',
    hex: '#0F172A',
    description: 'Dominican volcanic stone; provides maximum legibility for body text and telemetry.',
  },
];

export interface FontPairingPreset {
  id: string;
  name: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  vibe: string;
}

export const FONT_PAIRING_PRESETS: FontPairingPreset[] = [
  {
    id: 'eco_modern',
    name: 'Modern Eco-Tech (Recommended)',
    displayFont: 'Plus Jakarta Sans',
    bodyFont: 'DM Sans',
    description: 'Crisp geometric display paired with balanced humanist body copy. Forward-looking, clean, and authoritative.',
    vibe: 'Sustainable Tech & Clean Energy',
  },
  {
    id: 'caribbean_trust',
    name: 'Caribbean Executive & Civic Trust',
    displayFont: 'Playfair Display',
    bodyFont: 'Plus Jakarta Sans',
    description: 'High-contrast editorial serif display paired with clean sans body. Ideal for government, ministerial, and institutional announcements.',
    vibe: 'Institutional & High-Level Leadership',
  },
  {
    id: 'neo_grotesque',
    name: 'Neo-Grotesque Workforce',
    displayFont: 'Outfit',
    bodyFont: 'Public Sans',
    description: 'Clean modern neo-grotesque fonts built for digital density, classifieds scannability, and high legibility across mobile displays.',
    vibe: 'Universal Accessibility & Classifieds',
  },
];

export interface SocialMockupSpecs {
  platform: 'facebook' | 'twitter' | 'instagram';
  title: string;
  dimensions: string;
  aspectRatio: string;
  recommendedFormat: string;
  safeZoneNotes: string;
}

export const SOCIAL_SPECS: Record<'facebook' | 'twitter' | 'instagram', SocialMockupSpecs> = {
  facebook: {
    platform: 'facebook',
    title: 'Facebook Page Cover Photo',
    dimensions: '820 × 312 px (Desktop) / 640 × 360 px (Mobile)',
    aspectRatio: '16:9 / 2.63:1 responsive',
    recommendedFormat: 'PNG (under 100 KB) or sRGB JPG',
    safeZoneNotes: 'Keep critical text within the central 640 × 312 px zone to avoid mobile cropping and avatar overlap on left.',
  },
  twitter: {
    platform: 'twitter',
    title: 'Twitter / X Profile Header Banner',
    dimensions: '1500 × 500 px',
    aspectRatio: '3:1 Aspect Ratio',
    recommendedFormat: 'PNG or JPG (max 2 MB)',
    safeZoneNotes: 'Account for bottom-left circular profile avatar (approx 130px diameter) and responsive viewport edge clipping.',
  },
  instagram: {
    platform: 'instagram',
    title: 'Instagram Profile Picture & Highlights',
    dimensions: '1080 × 1080 px (1:1 Circle)',
    aspectRatio: '1:1 Square (Masked to Circle)',
    recommendedFormat: 'PNG or JPG (rendered at 150 × 150 px)',
    safeZoneNotes: 'Circular crop removes the corners. Center all emblem elements within the inner 80% circle radius.',
  },
};

interface BrandIdentityGeneratorProps {
  onClose?: () => void;
  isOpenAsModal?: boolean;
}

export const BrandIdentityGenerator: React.FC<BrandIdentityGeneratorProps> = ({
  onClose,
  isOpenAsModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'facebook' | 'twitter' | 'instagram' | 'palette' | 'typography'>('all');
  const [selectedFontPairing, setSelectedFontPairing] = useState<FontPairingPreset>(FONT_PAIRING_PRESETS[0]);
  const [brandSlogan, setBrandSlogan] = useState('Connecting Dominica to Sustainable Career Opportunities');
  const [brandSubtitle, setBrandSubtitle] = useState('Geothermal Energy · Eco-Tourism · Tech & Remote WIN · NEP Apprenticeships');
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  // Load selected fonts dynamically via Google Fonts loader
  React.useEffect(() => {
    loadGoogleFont(selectedFontPairing.displayFont);
    loadGoogleFont(selectedFontPairing.bodyFont);
  }, [selectedFontPairing]);

  const handleCopyHex = (hex: string) => {
    try {
      navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyShareLink = () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : 'https://natureislandcareers.com';
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      data-testid="brand-identity-generator-root"
      className="bg-stone-50 min-h-screen text-slate-900 pb-20 font-sans"
    >
      {/* Top Header / Modal Nav */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#082407] p-1 border border-lime-500/40 shadow-xs shrink-0 flex items-center justify-center">
              <BrandLogoMark className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-950 font-display tracking-tight">
                  Brand Identity & Social Mockup Studio
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  Official Kit
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Official Dominica brand assets, color palette, typography hierarchy, and social translation mockups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="safe-zone-toggle"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                showSafeZones
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
              title="Toggle safe zone guidelines and avatar cutout guides"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showSafeZones ? 'Safe Zones On' : 'Safe Zones Off'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1.5 shadow-2xs"
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Kit'}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Brand Identity Generator"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2 text-xs font-bold border-t border-stone-100 no-scrollbar">
          <button
            type="button"
            data-testid="tab-all-mockups"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>All Mockups Overview</span>
          </button>

          <button
            type="button"
            data-testid="tab-facebook-cover"
            onClick={() => setActiveTab('facebook')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'facebook'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-blue-700 hover:bg-stone-100'
            }`}
          >
            <span>Facebook Cover Photo (820×312)</span>
          </button>

          <button
            type="button"
            data-testid="tab-twitter-header"
            onClick={() => setActiveTab('twitter')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'twitter'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-slate-900 hover:bg-stone-100'
            }`}
          >
            <span>Twitter / X Header (1500×500)</span>
          </button>

          <button
            type="button"
            data-testid="tab-instagram-profile"
            onClick={() => setActiveTab('instagram')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'instagram'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-rose-700 hover:bg-stone-100'
            }`}
          >
            <span>Instagram Profile & Highlights</span>
          </button>

          <button
            type="button"
            data-testid="tab-color-palette"
            onClick={() => setActiveTab('palette')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'palette'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Brand Palette</span>
          </button>

          <button
            type="button"
            data-testid="tab-typography"
            onClick={() => setActiveTab('typography')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'typography'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography Pairings</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Dynamic Customization Control Bar */}
        <section
          data-testid="brand-customization-toolbar"
          className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                Live Brand Translation Controls
              </h2>
              <p className="text-xs text-stone-500">
                Modify headline copy or switch typography pairings to see mockups adapt in real time
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-400 font-medium">Font Pairing:</span>
              <select
                data-testid="font-pairing-selector"
                value={selectedFontPairing.id}
                onChange={(e) => {
                  const found = FONT_PAIRING_PRESETS.find((p) => p.id === e.target.value);
                  if (found) setSelectedFontPairing(found);
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-300 font-bold bg-stone-50 text-stone-900 focus:outline-none focus:border-emerald-600 text-xs cursor-pointer"
              >
                {FONT_PAIRING_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.displayFont})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Social Banner Headline (Primary Slogan)
              </label>
              <input
                type="text"
                value={brandSlogan}
                data-testid="brand-slogan-input"
                onChange={(e) => setBrandSlogan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 bg-stone-50/50"
                placeholder="e.g. Connecting Dominica to Sustainable Career Opportunities"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Sector Highlights / Subtitle
              </label>
              <input
                type="text"
                value={brandSubtitle}
                data-testid="brand-subtitle-input"
                onChange={(e) => setBrandSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-stone-900 focus:outline-none focus:border-emerald-600 bg-stone-50/50"
                placeholder="e.g. Geothermal Energy · Eco-Tourism · Tech & Remote WIN · NEP"
              />
            </div>
          </div>
        </section>

        {/* SECTION 1: FACEBOOK COVER PHOTO MOCKUP */}
        {(activeTab === 'all' || activeTab === 'facebook') && (
          <section
            data-testid="facebook-cover-mockup-section"
            className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  f
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Facebook Page Cover Photo Mockup
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
                    <span>{SOCIAL_SPECS.facebook.dimensions}</span>
                    <span>·</span>
                    <span>{SOCIAL_SPECS.facebook.aspectRatio}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                Official Page Profile
              </div>
            </div>

            {/* Simulated Facebook Interface Frame */}
            <div className="bg-[#F0F2F5] rounded-xl border border-stone-300/80 overflow-hidden shadow-inner">
              
              {/* Simulated Browser / FB Top Chrome */}
              <div className="bg-[#1877F2] text-white px-4 py-2 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg tracking-tight">facebook</span>
                  <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] text-white/90">
                    <span>🔍</span>
                    <span>Search Nature Island Careers</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/90">
                  <span>Home</span>
                  <span>Jobs</span>
                  <span>Commonwealth of Dominica</span>
                </div>
              </div>

              {/* COVER PHOTO CANVAS CONTAINER */}
              <div className="relative w-full overflow-hidden bg-[#082407]">
                {/* 16:9 / 2.63:1 Responsive Canvas */}
                <div className="relative w-full aspect-[2.63/1] min-h-[220px] sm:min-h-[280px] md:min-h-[312px] flex items-center justify-between p-6 sm:p-10 select-none overflow-hidden">
                  
                  {/* Background Layers: Forest Deep + Dominica Waterfalls Scrim + Solar Rays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#082407] via-[#0b330a] to-[#15803D]/90 z-0" />
                  
                  {/* Subtle Geometric Rising Sun Glow in Canvas Background */}
                  <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/20 via-lime-500/10 to-transparent blur-2xl pointer-events-none" />

                  {/* Leaf Pattern Watermark Backdrop */}
                  <div className="absolute right-10 bottom-0 opacity-15 pointer-events-none w-72 h-72">
                    <BrandLogoMark className="w-full h-full text-lime-400" />
                  </div>

                  {/* Safe Zone Overlay if enabled */}
                  {showSafeZones && (
                    <div
                      data-testid="fb-safe-zone-overlay"
                      className="absolute inset-x-8 sm:inset-x-16 inset-y-4 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none z-20 flex flex-col justify-between p-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-300 bg-slate-950/70 px-2 py-0.5 rounded w-max">
                        <span>Safe Content Area (640 × 312 px)</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300 bg-slate-950/70 px-2 py-0.5 rounded w-max self-end">
                        <span>Visible on all mobile & desktop viewports</span>
                      </div>
                    </div>
                  )}

                  {/* Canvas Main Typography Content */}
                  <div className="relative z-10 max-w-xl text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-lime-400/40 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#5BC22B]">
                      <span>🇩🇲 Official Commonwealth of Dominica Portal</span>
                    </div>

                    <h4
                      style={{ fontFamily: selectedFontPairing.displayFont }}
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md"
                    >
                      {brandSlogan}
                    </h4>

                    <p
                      style={{ fontFamily: selectedFontPairing.bodyFont }}
                      className="text-xs sm:text-sm text-lime-100/90 font-medium leading-relaxed max-w-lg drop-shadow-xs"
                    >
                      {brandSubtitle}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-700/80 backdrop-blur-xs text-white text-[11px] font-bold border border-emerald-500/60 shadow-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-lime-300" />
                        <span>NEP & CSME Certified</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-xs text-amber-300 text-[11px] font-mono font-bold border border-amber-400/30">
                        natureislandcareers.com
                      </span>
                    </div>
                  </div>

                  {/* Right Side Emblem Badge Lockup */}
                  <div className="relative z-10 hidden md:flex flex-col items-center justify-center p-5 rounded-2xl bg-[#082407]/90 border border-lime-400/40 shadow-2xl backdrop-blur-sm text-center">
                    <BrandLogoMark className="w-24 h-20" />
                    <span className="text-white font-black text-base uppercase tracking-tight mt-1">
                      NATURE ISLAND
                    </span>
                    <span className="text-[#5BC22B] font-extrabold text-[10px] uppercase tracking-[0.34em]">
                      CAREERS
                    </span>
                  </div>
                </div>

                {/* Simulated Facebook Page Lower Info Bar with Overlapping Profile Avatar */}
                <div className="bg-white border-t border-stone-200 px-4 sm:px-8 py-4 relative z-20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Left: Avatar overlap + Page Identity */}
                    <div className="flex items-center gap-4">
                      {/* Overlapping Profile Avatar */}
                      <div className="relative -mt-12 sm:-mt-16 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#082407] p-2 sm:p-2.5 border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                        <BrandLogoMark className="w-full h-full" />
                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Verified Brand">
                          ✓
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            Nature Island Careers 🇩🇲
                          </h5>
                          <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white" />
                        </div>
                        <p className="text-xs text-stone-500 font-medium">
                          @natureislandcareers · Employment Agency · 18.4K followers · 15.2K likes
                        </p>
                      </div>
                    </div>

                    {/* Right: Simulated Page Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        Visit Classifieds Portal
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
                      >
                        Send Message
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                      >
                        •••
                      </button>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Specs Footer */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-stone-700">
                Design Spec: <strong className="font-mono text-stone-900">{SOCIAL_SPECS.facebook.dimensions}</strong>
              </span>
              <span>{SOCIAL_SPECS.facebook.safeZoneNotes}</span>
            </div>
          </section>
        )}

        {/* SECTION 2: TWITTER / X PROFILE HEADER BANNER */}
        {(activeTab === 'all' || activeTab === 'twitter') && (
          <section
            data-testid="twitter-header-mockup-section"
            className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 font-mono">
                  𝕏
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Twitter / X Header Banner Mockup
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
                    <span>{SOCIAL_SPECS.twitter.dimensions}</span>
                    <span>·</span>
                    <span>{SOCIAL_SPECS.twitter.aspectRatio}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                Verified Organization Profile
              </div>
            </div>

            {/* Simulated X / Twitter Container */}
            <div className="bg-black text-white rounded-xl border border-stone-800 overflow-hidden shadow-2xl">
              
              {/* Simulated Twitter Top Nav */}
              <div className="bg-black/90 backdrop-blur-md px-4 py-2 flex items-center gap-4 border-b border-stone-800 text-xs">
                <span className="text-stone-400 font-bold cursor-pointer">←</span>
                <div>
                  <div className="flex items-center gap-1 font-black text-sm">
                    <span>Nature Island Careers</span>
                    <span className="text-amber-400 text-xs" title="Verified Gold Organization">✓</span>
                  </div>
                  <span className="text-[10px] text-stone-400">3,412 Posts</span>
                </div>
              </div>

              {/* TWITTER 3:1 HEADER BANNER */}
              <div className="relative w-full aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[260px] bg-gradient-to-r from-[#082407] via-[#0A3D11] to-[#14532D] p-5 sm:p-8 flex items-center justify-between overflow-hidden select-none">
                
                {/* Sunlight Radial Arc */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-amber-500/15 via-lime-500/10 to-transparent pointer-events-none" />

                {/* Geometric Horizon Sunburst Arc */}
                <div className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full border-2 border-lime-500/20 pointer-events-none" />
                <div className="absolute -left-16 -bottom-20 w-72 h-72 rounded-full border-2 border-amber-400/20 pointer-events-none" />

                {/* Safe Zone Boundary */}
                {showSafeZones && (
                  <div
                    data-testid="twitter-safe-zone-overlay"
                    className="absolute inset-4 sm:inset-6 border-2 border-dashed border-amber-400/60 rounded-xl pointer-events-none z-20 flex items-start justify-between p-1.5"
                  >
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/80 px-2 py-0.5 rounded">
                      Twitter 3:1 Safe Content Zone
                    </span>
                    <span className="text-[10px] font-mono text-stone-300 bg-black/80 px-2 py-0.5 rounded">
                      1500 × 500 px
                    </span>
                  </div>
                )}

                {/* Banner Content */}
                <div className="relative z-10 space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#5BC22B]">
                      COMMONWEALTH OF DOMINICA
                    </span>
                    <span className="text-stone-400">·</span>
                    <span className="text-[11px] text-stone-300">Waitukubuli</span>
                  </div>

                  <h4
                    style={{ fontFamily: selectedFontPairing.displayFont }}
                    className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight"
                  >
                    {brandSlogan}
                  </h4>

                  <p
                    style={{ fontFamily: selectedFontPairing.bodyFont }}
                    className="text-[11px] sm:text-xs text-stone-300 leading-snug line-clamp-2"
                  >
                    {brandSubtitle}
                  </p>

                  <div className="pt-2 flex items-center gap-3 text-[11px] font-mono text-amber-300">
                    <span>⚡ Geothermal Energy</span>
                    <span>•</span>
                    <span>🌴 Eco-Tourism</span>
                    <span>•</span>
                    <span>💻 Remote WIN Visa</span>
                  </div>
                </div>

                {/* Right Emblem Stamp */}
                <div className="relative z-10 hidden sm:flex items-center gap-3 bg-black/50 border border-lime-500/40 rounded-xl px-4 py-2.5 backdrop-blur-md">
                  <BrandLogoMark className="w-12 h-10" />
                  <div className="leading-tight text-left">
                    <span className="block text-xs font-black uppercase text-white">Nature Island</span>
                    <span className="block text-[10px] font-extrabold uppercase text-[#5BC22B] tracking-widest">Careers</span>
                  </div>
                </div>

              </div>

              {/* TWITTER LOWER PROFILE BAR */}
              <div className="p-4 sm:p-6 bg-black relative">
                <div className="flex items-start justify-between">
                  {/* Left: Cutout Circular Avatar Overlap */}
                  <div className="relative -mt-14 sm:-mt-20 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#082407] p-2 border-4 border-black overflow-hidden shadow-2xl shrink-0 flex items-center justify-center">
                    <BrandLogoMark className="w-full h-full" />
                  </div>

                  {/* Follow Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      Follow
                    </button>
                  </div>
                </div>

                {/* Profile Text & Bio */}
                <div className="mt-2 space-y-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-base font-black text-white">
                      <span>Nature Island Careers 🇩🇲</span>
                      <span className="text-amber-400 text-xs">✓</span>
                    </div>
                    <span className="text-stone-400 font-mono text-xs">@NatureIslandJobs</span>
                  </div>

                  <p className="text-stone-200 text-xs leading-relaxed max-w-xl">
                    Official employment classifieds & vocational intelligence for the Commonwealth of Dominica. Connecting talent to Geothermal, Eco-Tourism, Digital & NEP opportunities across 10 parishes. 🌴⚡
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      Roseau, Commonwealth of Dominica
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <LinkIcon className="w-3.5 h-3.5" />
                      natureislandcareers.com
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      Joined September 2024
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span>
                      <strong className="text-white font-mono">384</strong> <span className="text-stone-400">Following</span>
                    </span>
                    <span>
                      <strong className="text-white font-mono">24.8K</strong> <span className="text-stone-400">Followers</span>
                    </span>
                  </div>
                </div>

                {/* Profile Tabs */}
                <div className="mt-4 flex items-center justify-around border-t border-stone-800 pt-3 text-xs text-stone-400 font-bold">
                  <span className="text-white border-b-2 border-emerald-500 pb-2">Posts</span>
                  <span>Replies</span>
                  <span>Highlights</span>
                  <span>Media</span>
                </div>
              </div>

            </div>

            {/* Specs Footer */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-stone-700">
                Design Spec: <strong className="font-mono text-stone-900">{SOCIAL_SPECS.twitter.dimensions}</strong>
              </span>
              <span>{SOCIAL_SPECS.twitter.safeZoneNotes}</span>
            </div>
          </section>
        )}

        {/* SECTION 3: INSTAGRAM PROFILE PICTURE & HIGHLIGHTS MOCKUP */}
        {(activeTab === 'all' || activeTab === 'instagram') && (
          <section
            data-testid="instagram-profile-mockup-section"
            className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  📸
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    Instagram Profile Picture & Grid Translation
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
                    <span>{SOCIAL_SPECS.instagram.dimensions}</span>
                    <span>·</span>
                    <span>{SOCIAL_SPECS.instagram.aspectRatio}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                Verified Business Account
              </div>
            </div>

            {/* Instagram Profile UI Wrapper */}
            <div className="bg-white rounded-xl border border-stone-300 max-w-2xl mx-auto overflow-hidden shadow-xl">
              
              {/* Instagram App Top Header */}
              <div className="border-b border-stone-200 px-4 py-3 flex items-center justify-between text-xs font-black">
                <span className="text-stone-400 cursor-pointer">←</span>
                <div className="flex items-center gap-1 font-mono">
                  <span>natureislandcareers</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                </div>
                <span className="text-stone-400 cursor-pointer">•••</span>
              </div>

              {/* Profile Header: Avatar + Counts */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Circular Avatar with Active Story Gradient Ring */}
                  <div className="relative group cursor-pointer shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <div
                          data-testid="instagram-circular-avatar"
                          className="w-full h-full rounded-full bg-[#082407] p-2 flex items-center justify-center overflow-hidden"
                        >
                          <BrandLogoMark className="w-full h-full" />
                        </div>
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                      +
                    </span>
                  </div>

                  {/* Followers / Following Counts */}
                  <div className="flex-1 flex items-center justify-around text-center">
                    <div>
                      <span className="block font-black text-sm sm:text-base font-mono text-slate-900">142</span>
                      <span className="text-[11px] text-stone-500">posts</span>
                    </div>
                    <div>
                      <span className="block font-black text-sm sm:text-base font-mono text-slate-900">19.6K</span>
                      <span className="text-[11px] text-stone-500">followers</span>
                    </div>
                    <div>
                      <span className="block font-black text-sm sm:text-base font-mono text-slate-900">284</span>
                      <span className="text-[11px] text-stone-500">following</span>
                    </div>
                  </div>

                </div>

                {/* Profile Bio */}
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <span style={{ fontFamily: selectedFontPairing.displayFont }}>Nature Island Careers 🇩🇲</span>
                    <span className="text-stone-400 text-[11px] font-normal">| Classifieds & Jobs</span>
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    🌿 The premier job board for the Commonwealth of Dominica<br />
                    ⚡ Geothermal Energy · Eco-Resorts · IT & Remote WIN<br />
                    🎓 NEP Apprenticeships & CARICOM CSME Certified<br />
                    📍 Waitukubuli / Roseau, Dominica
                  </p>
                  <a
                    href="#link"
                    onClick={(e) => e.preventDefault()}
                    className="text-emerald-800 font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>linkin.bio/natureislandcareers</span>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Follow
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
                  >
                    Email
                  </button>
                </div>

                {/* Story Highlights Circles */}
                <div className="pt-2 flex items-center gap-4 overflow-x-auto no-scrollbar text-center text-[10px] font-bold text-stone-700">
                  <div className="space-y-1 shrink-0 cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-stone-200 hover:bg-emerald-400 transition-colors mx-auto">
                      <div className="w-full h-full rounded-full bg-[#082407] flex items-center justify-center text-white text-base">
                        💼
                      </div>
                    </div>
                    <span>Hot Jobs</span>
                  </div>

                  <div className="space-y-1 shrink-0 cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-stone-200 hover:bg-emerald-400 transition-colors mx-auto">
                      <div className="w-full h-full rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 text-base font-black">
                        EC$
                      </div>
                    </div>
                    <span>Salaries</span>
                  </div>

                  <div className="space-y-1 shrink-0 cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-stone-200 hover:bg-emerald-400 transition-colors mx-auto">
                      <div className="w-full h-full rounded-full bg-[#082407] flex items-center justify-center text-white text-base">
                        💻
                      </div>
                    </div>
                    <span>Remote WIN</span>
                  </div>

                  <div className="space-y-1 shrink-0 cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-stone-200 hover:bg-emerald-400 transition-colors mx-auto">
                      <div className="w-full h-full rounded-full bg-amber-600 flex items-center justify-center text-white text-base">
                        🎓
                      </div>
                    </div>
                    <span>NEP Trainees</span>
                  </div>

                  <div className="space-y-1 shrink-0 cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-stone-200 hover:bg-emerald-400 transition-colors mx-auto">
                      <div className="w-full h-full rounded-full bg-teal-800 flex items-center justify-center text-white text-base">
                        🌴
                      </div>
                    </div>
                    <span>10 Parishes</span>
                  </div>
                </div>

                {/* 3x2 Grid Feed Preview demonstrating brand palette & typography */}
                <div className="pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-center gap-6 pb-2 text-stone-400 text-xs border-b border-stone-100">
                    <span className="text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center gap-1 font-bold">
                      <Grid className="w-3.5 h-3.5" />
                      POSTS
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1.5">
                    {/* Post 1: Geothermal Turbine Engineer */}
                    <div className="aspect-square bg-[#082407] rounded-md p-2 flex flex-col justify-between text-white border border-lime-500/20 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded">HOT</span>
                        <BrandLogoMark className="w-4 h-4 text-lime-400" />
                      </div>
                      <div className="text-[10px] font-black leading-tight text-white">
                        Geothermal SCADA Role
                      </div>
                      <span className="text-[8px] font-mono text-lime-300">EC$8,500/mo</span>
                    </div>

                    {/* Post 2: Eco-Tourism Resort Manager */}
                    <div className="aspect-square bg-emerald-800 rounded-md p-2 flex flex-col justify-between text-white border border-emerald-600/30 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Secret Bay</span>
                      <div className="text-[10px] font-black leading-tight text-white">
                        Eco-Resort Manager
                      </div>
                      <span className="text-[8px] text-emerald-100 font-mono">Portsmouth</span>
                    </div>

                    {/* Post 3: Parish Salary Benchmark 2026 */}
                    <div className="aspect-square bg-gradient-to-br from-amber-600 to-amber-800 rounded-md p-2 flex flex-col justify-between text-white border border-amber-400/30 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <span className="text-[9px] font-bold text-amber-200">BENCHMARK</span>
                      <div className="text-[10px] font-black leading-tight text-white">
                        2026 Parish Wage Guide
                      </div>
                      <span className="text-[8px] text-amber-100 font-mono">All 10 Parishes</span>
                    </div>

                    {/* Post 4: Remote Work in Nature */}
                    <div className="aspect-square bg-[#0A3D11] rounded-md p-2 flex flex-col justify-between text-white border border-lime-500/30 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <span className="text-[9px] text-teal-300 font-bold">WIN VISA</span>
                      <div className="text-[10px] font-black leading-tight text-white">
                        Dominica WIN Extended
                      </div>
                      <span className="text-[8px] text-lime-200 font-mono">Remote Global</span>
                    </div>

                    {/* Post 5: CSME Free Movement */}
                    <div className="aspect-square bg-slate-900 rounded-md p-2 flex flex-col justify-between text-white border border-slate-700 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <span className="text-[9px] text-indigo-300 font-bold">CARICOM</span>
                      <div className="text-[10px] font-black leading-tight text-white">
                        CSME Free Movement
                      </div>
                      <span className="text-[8px] text-stone-300">Dominica Passports</span>
                    </div>

                    {/* Post 6: Agro-Forestry Organic Lead */}
                    <div className="aspect-square bg-emerald-900 rounded-md p-2 flex flex-col justify-between text-white border border-emerald-500/20 shadow-2xs hover:scale-[1.02] transition-transform cursor-pointer">
                      <span className="text-[9px] text-lime-300 font-bold">ORGANIC</span>
                      <div className="text-[10px] font-black leading-tight text-white">
                        Kalinago Agro-Tech
                      </div>
                      <span className="text-[8px] text-lime-100 font-mono">Salybia</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Specs Footer */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-stone-700">
                Design Spec: <strong className="font-mono text-stone-900">{SOCIAL_SPECS.instagram.dimensions}</strong>
              </span>
              <span>{SOCIAL_SPECS.instagram.safeZoneNotes}</span>
            </div>
          </section>
        )}

        {/* SECTION 4: OFFICIAL COLOR PALETTE SPECIFICATION & CONTRAST RATIOS */}
        {(activeTab === 'all' || activeTab === 'palette') && (
          <section
            data-testid="brand-palette-section"
            className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-700" />
                  Official Dominica Color Palette & Contrast Validation
                </h3>
                <p className="text-xs text-stone-500">
                  Authentic colors extracted from the brand identity with Hex, RGB, HSL, and WCAG AA/AAA contrast ratios
                </p>
              </div>

              <div className="text-xs text-stone-500 font-medium">
                Click any swatch to copy Hex code
              </div>
            </div>

            {/* Swatches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {OFFICIAL_BRAND_PALETTE.map((swatch) => {
                const rgb = hexToRgb(swatch.hex);
                const hsl = hexToHsl(swatch.hex);
                const contrastWithDark = getContrastRatio(swatch.hex, '#082407');
                const contrastWithLight = getContrastRatio(swatch.hex, '#FFFFFF');
                const bestContrast = isColorLight(swatch.hex) ? contrastWithDark : contrastWithLight;
                const wcag = getWcagRating(bestContrast);

                return (
                  <div
                    key={swatch.hex}
                    data-testid={`color-swatch-${swatch.hex.replace('#', '')}`}
                    onClick={() => handleCopyHex(swatch.hex)}
                    className="group bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200/90 overflow-hidden transition-all duration-200 cursor-pointer shadow-xs hover:border-emerald-500 flex flex-col justify-between"
                  >
                    <div>
                      {/* Color Preview Block */}
                      <div
                        style={{ backgroundColor: swatch.hex }}
                        className="h-24 w-full flex items-end justify-between p-2.5 transition-transform group-hover:scale-[1.01]"
                      >
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded shadow-2xs ${
                            isColorLight(swatch.hex) ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                          }`}
                        >
                          {swatch.hex}
                        </span>

                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs">
                          {wcag.score}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 leading-tight">
                            {swatch.name}
                          </h4>
                          {copiedHex === swatch.hex && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Copied!
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-800 block">
                          {swatch.role}
                        </span>

                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                          {swatch.description}
                        </p>
                      </div>
                    </div>

                    {/* Technical Values Bar */}
                    <div className="p-2.5 border-t border-stone-200/70 bg-white text-[10px] font-mono text-stone-600 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>RGB:</span>
                        <span className="font-bold">{rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>HSL:</span>
                        <span className="font-bold">{hsl}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-700">
                        <span>WCAG vs {isColorLight(swatch.hex) ? 'Dark' : 'Light'}:</span>
                        <span className="font-bold">{bestContrast}:1 ({wcag.score})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5: TYPOGRAPHY HIERARCHY & FONT PAIRINGS */}
        {(activeTab === 'all' || activeTab === 'typography') && (
          <section
            data-testid="brand-typography-section"
            className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  Dominica Typographic Hierarchy & Pairings
                </h3>
                <p className="text-xs text-stone-500">
                  Authoritative headline type paired with readable body copy and tabular telemetry fonts
                </p>
              </div>

              <div className="flex items-center gap-2">
                {FONT_PAIRING_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedFontPairing(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      selectedFontPairing.id === p.id
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Type Scale Demo */}
            <div className="space-y-4 p-5 bg-stone-50/70 rounded-xl border border-stone-200/80">
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                  Display Headline (H1 / Hero / Social Banners) — {selectedFontPairing.displayFont} 900 Black
                </span>
                <h2
                  style={{ fontFamily: selectedFontPairing.displayFont }}
                  className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight"
                >
                  Sustainable Careers for Dominica & the Nature Isle
                </h2>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                  Section Header (H2 / Cards) — {selectedFontPairing.displayFont} 700 Bold
                </span>
                <h3
                  style={{ fontFamily: selectedFontPairing.displayFont }}
                  className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                >
                  Empowering Talent Across Roseau, Portsmouth & the 10 Parishes
                </h3>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                  Body Prose & Descriptions — {selectedFontPairing.bodyFont} 400 Regular
                </span>
                <p
                  style={{ fontFamily: selectedFontPairing.bodyFont }}
                  className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-3xl"
                >
                  Nature Island Careers connects Dominican jobseekers and international talent under the Dominica Work In Nature (WIN) Extended Visa with vetted employers in Geothermal Energy, Eco-Tourism, Sustainable Agro-Processing, and Information Technology.
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                  Telemetry, Currency & Dates — Monospace Tabular Figures (JetBrains Mono / tabular-nums)
                </span>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-emerald-800 font-bold tabular-nums">
                  <span className="bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                    EC$ 8,500 – 11,200 / month
                  </span>
                  <span className="bg-stone-200 text-stone-800 px-2.5 py-1 rounded-md">
                    ≈ $3,148 – $4,148 USD
                  </span>
                  <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md">
                    Deadline: 2026-11-30 17:00 AST
                  </span>
                </div>
              </div>

            </div>

          </section>
        )}

      </main>
    </div>
  );
};
