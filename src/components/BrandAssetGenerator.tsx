import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Lock,
  Download,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export type BrandAssetType =
  | 'logo_variation'
  | 'social_facebook_cover'
  | 'social_twitter_header'
  | 'social_instagram_post'
  | 'social_linkedin_banner';

export type BrandAssetAspectRatio = '1:1' | '16:9' | '4:3' | '3:4' | '9:16';

export type BrandAssetStyle =
  | 'minimal_badge'
  | 'emerald_crest'
  | 'geothermal_modern'
  | 'editorial_caribbean';

export interface BrandAssetPreset {
  id: BrandAssetType;
  label: string;
  category: 'Logo Variation' | 'Social Template';
  defaultAspectRatio: BrandAssetAspectRatio;
  description: string;
}

export const BRAND_ASSET_PRESETS: BrandAssetPreset[] = [
  {
    id: 'logo_variation',
    label: 'Emblem & Logo Variation',
    category: 'Logo Variation',
    defaultAspectRatio: '1:1',
    description: 'Clean studio emblem exploring botanical rainforest motifs & Dominica sunrise geometry.',
  },
  {
    id: 'social_facebook_cover',
    label: 'Facebook Page Cover Template',
    category: 'Social Template',
    defaultAspectRatio: '16:9',
    description: 'Wide hero composition with clean left typography safe-zone & Waitukubuli backdrop.',
  },
  {
    id: 'social_twitter_header',
    label: 'Twitter / X Header Banner',
    category: 'Social Template',
    defaultAspectRatio: '16:9',
    description: 'Panoramic dark-emerald banner keeping bottom-left profile avatar zone clear.',
  },
  {
    id: 'social_instagram_post',
    label: 'Instagram Editorial Square Card',
    category: 'Social Template',
    defaultAspectRatio: '1:1',
    description: 'Square editorial spotlight frame for WIN Remote Visa & job announcement posts.',
  },
  {
    id: 'social_linkedin_banner',
    label: 'LinkedIn Executive Company Banner',
    category: 'Social Template',
    defaultAspectRatio: '16:9',
    description: 'Corporate Caribbean gradient banner engineered for ministerial & employer outreach.',
  },
];

export const BRAND_STYLE_OPTIONS: {
  id: BrandAssetStyle;
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'minimal_badge',
    label: 'Minimalist Vector Badge',
    subtitle: 'Crisp Swiss silhouettes & negative space',
  },
  {
    id: 'emerald_crest',
    label: 'Emerald Heritage Crest',
    subtitle: 'Civic prestige with subtle gold linework',
  },
  {
    id: 'geothermal_modern',
    label: 'Geothermal Clean-Tech',
    subtitle: 'Botanical energy & geometric rays',
  },
  {
    id: 'editorial_caribbean',
    label: 'Editorial Dominica Luxe',
    subtitle: 'Sunlit rainforest depth & organic warmth',
  },
];

export const BRAND_PALETTE_MOTIFS: {
  id: string;
  label: string;
  value: string;
  swatches: string[];
}[] = [
  {
    id: 'official_forest',
    label: 'Official Forest & Nature Lime',
    value: 'Dominican Forest Green (#082407), Emerald Rainforest (#15803D), Nature Lime (#5BC22B), Sun Gold (#F59E0B)',
    swatches: ['#082407', '#15803D', '#5BC22B', '#F59E0B'],
  },
  {
    id: 'volcanic_gold',
    label: 'Volcanic Slate & Caribbean Gold',
    value: 'Volcanic Slate (#0F172A), Deep Emerald (#064E3B), Caribbean Sun Gold (#F59E0B), Daylight Amber (#FACC15)',
    swatches: ['#0F172A', '#064E3B', '#F59E0B', '#FACC15'],
  },
  {
    id: 'canopy_light',
    label: 'Nature Isle Canvas & Rainforest',
    value: 'Nature Isle Canvas (#F8FAF8), Emerald Rainforest (#15803D), Dominican Forest (#082407), Nature Lime (#5BC22B)',
    swatches: ['#F8FAF8', '#15803D', '#082407', '#5BC22B'],
  },
];

export interface GeneratedBrandAsset {
  id: string;
  dataUrl: string;
  mimeType: string;
  assetType: BrandAssetType;
  aspectRatio: BrandAssetAspectRatio;
  style: BrandAssetStyle;
  paletteFocus: string;
  promptUsed: string;
  notes?: string;
  model: string;
  generatedAt: string;
}

export interface BrandAssetGeneratorProps {
  isAdmin?: boolean;
  adminToken?: string;
  onOpenAdminLogin?: () => void;
  defaultHeadline?: string;
}

export function resolveAdminAuthToken(explicitToken?: string): string {
  if (explicitToken && explicitToken.trim()) {
    return explicitToken.trim();
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('natureisland_admin_token')?.trim() || '';
    }
  } catch {
    // ignore storage restriction
  }
  return '';
}

export const BrandAssetGenerator: React.FC<BrandAssetGeneratorProps> = ({
  isAdmin = false,
  adminToken,
  onOpenAdminLogin,
  defaultHeadline = 'Connecting Dominica to Sustainable Career Opportunities',
}) => {
  const [assetType, setAssetType] = useState<BrandAssetType>('logo_variation');
  const [aspectRatio, setAspectRatio] = useState<BrandAssetAspectRatio>('1:1');
  const [style, setStyle] = useState<BrandAssetStyle>('minimal_badge');
  const [paletteMotifId, setPaletteMotifId] = useState<string>(BRAND_PALETTE_MOTIFS[0].id);
  const [headline, setHeadline] = useState<string>(defaultHeadline);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedBrandAsset[]>([]);

  const selectedPalette =
    BRAND_PALETTE_MOTIFS.find((p) => p.id === paletteMotifId) || BRAND_PALETTE_MOTIFS[0];

  const handleSelectPreset = (preset: BrandAssetPreset) => {
    setAssetType(preset.id);
    setAspectRatio(preset.defaultAspectRatio);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isGenerating) return;

    const token = resolveAdminAuthToken(adminToken);
    if (!token) {
      setErrorMsg(
        'Administrative session token is missing or expired. Please sign in again via the Admin Console Gateway.'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/brand/generate-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          assetType,
          aspectRatio,
          style,
          paletteFocus: selectedPalette.value,
          headline: headline.trim(),
          customPrompt: customPrompt.trim(),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok || !payload?.asset?.dataUrl) {
        const message =
          payload?.error ||
          `Failed to generate asset (HTTP ${response.status}). Check your Gemini API configuration in Settings > Secrets.`;
        setErrorMsg(message);
        return;
      }

      setGeneratedAssets((prev) => [payload.asset as GeneratedBrandAsset, ...prev]);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Network error while contacting the server-side image generation service.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAdmin) {
    return (
      <section
        data-testid="brand-asset-admin-lock"
        className="bg-slate-950 text-slate-100 rounded-2xl border border-emerald-800/60 p-6 sm:p-8 shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-900/70 border border-emerald-700/60 text-amber-300 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-display">
                  AI Brand Asset Generator (Administrator Access Required)
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                High-resolution logo variations and social media templates generated via Gemini are restricted to authorized platform administrators (
                <span className="font-mono text-emerald-300">info@natureislecareers.com</span>).
              </p>
            </div>
          </div>

          {onOpenAdminLogin && (
            <button
              type="button"
              data-testid="brand-asset-login-btn"
              onClick={onOpenAdminLogin}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <Shield className="w-4 h-4" />
              <span>Sign In as Administrator</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="brand-asset-generator-studio"
      className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#082407] text-lime-300 flex items-center justify-center border border-emerald-700 shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 font-display">
              AI Brand Asset & Logo Variation Studio
            </h2>
            <p className="text-xs text-stone-500">
              Generate high-resolution Dominica logo variations & social media templates server-side via Gemini Image Generation
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-emerald-700" />
          <span>Admin Session Verified</span>
        </span>
      </div>

      {/* Generator Controls Form */}
      <form onSubmit={handleGenerate} className="space-y-5 text-xs">
        {/* Preset Selector Grid */}
        <div className="space-y-2">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700">
            1. Select Brand Asset Template Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {BRAND_ASSET_PRESETS.map((preset) => {
              const active = assetType === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`asset-preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    active
                      ? 'bg-[#082407] text-white border-[#082407] shadow-sm ring-2 ring-emerald-500/40'
                      : 'bg-stone-50 hover:bg-stone-100 text-slate-900 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs">{preset.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        active ? 'bg-emerald-800 text-lime-300' : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      {preset.defaultAspectRatio}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Art Direction & Aspect Ratio Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Visual Aesthetic Style */}
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700">
              2. Visual Direction Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BRAND_STYLE_OPTIONS.map((opt) => {
                const active = style === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`asset-style-${opt.id}`}
                    onClick={() => setStyle(opt.id)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[11px] text-stone-500 font-normal">{opt.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio & Palette Motif */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="brand-asset-aspect-ratio"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1"
              >
                3. Output Aspect Ratio
              </label>
              <select
                id="brand-asset-aspect-ratio"
                data-testid="brand-asset-aspect-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as BrandAssetAspectRatio)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="1:1">1:1 Square (Logos, Instagram)</option>
                <option value="16:9">16:9 Landscape (Covers, Headers)</option>
                <option value="4:3">4:3 Presentation Card</option>
                <option value="3:4">3:4 Portrait Poster</option>
                <option value="9:16">9:16 Vertical Story</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="brand-asset-palette-select"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1"
              >
                4. Palette Motif
              </label>
              <select
                id="brand-asset-palette-select"
                data-testid="brand-asset-palette-select"
                value={paletteMotifId}
                onChange={(e) => setPaletteMotifId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {BRAND_PALETTE_MOTIFS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Palette className="w-3.5 h-3.5 text-stone-400" />
                {selectedPalette.swatches.map((hex) => (
                  <span
                    key={hex}
                    style={{ backgroundColor: hex }}
                    title={hex}
                    className="w-4 h-4 rounded border border-stone-300 inline-block"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Copy & Creative Prompt Refinement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="brand-asset-headline-input"
              className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1"
            >
              Campaign Theme / Headline Context
            </label>
            <input
              id="brand-asset-headline-input"
              data-testid="brand-asset-headline-input"
              type="text"
              maxLength={120}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Geothermal Energy & Remote WIN Careers in Dominica"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50/70 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="brand-asset-prompt-input"
              className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1"
            >
              Custom Art Direction Notes (Optional)
            </label>
            <input
              id="brand-asset-prompt-input"
              data-testid="brand-asset-prompt-input"
              type="text"
              maxLength={600}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Subtle waterfall mist, clean vector badge spacing, warm morning sun glow"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50/70 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {errorMsg && (
          <div
            data-testid="brand-asset-error"
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2.5 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Brand Asset Generation Failed</div>
              <p className="text-red-700 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-stone-500">
            Powered by <span className="font-mono font-bold text-stone-700">gemini-3.1-flash-lite-image</span> · Server-side key isolated
          </div>
          <button
            type="submit"
            data-testid="generate-brand-asset-btn"
            disabled={isGenerating}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Brand Asset...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-lime-300" />
                <span>Generate AI Brand Asset</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Gallery */}
      {generatedAssets.length > 0 ? (
        <div data-testid="generated-assets-gallery" className="space-y-4 pt-4 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Generated Brand Assets ({generatedAssets.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setGeneratedAssets([])}
              className="text-xs font-bold text-stone-500 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session Gallery</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedAssets.map((asset) => {
              const ext = asset.mimeType.includes('jpeg') ? 'jpg' : 'png';
              const filename = `nature-island-${asset.assetType}-${asset.id}.${ext}`;
              return (
                <article
                  key={asset.id}
                  data-testid="generated-asset-card"
                  className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div className="bg-slate-900 flex items-center justify-center p-3">
                    <img
                      src={asset.dataUrl}
                      alt={`${asset.assetType} in ${asset.style} style`}
                      className="max-h-72 w-auto rounded-lg object-contain shadow-md"
                    />
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-900 capitalize">
                        {asset.assetType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-700">
                        {asset.aspectRatio}
                      </span>
                    </div>
                    {asset.notes && (
                      <p className="text-[11px] text-stone-600 leading-relaxed">{asset.notes}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-stone-500">
                        {new Date(asset.generatedAt).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={asset.dataUrl}
                          download={filename}
                          data-testid={`download-asset-${asset.id}`}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg inline-flex items-center gap-1.5 text-[11px] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {ext.toUpperCase()}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          data-testid="generated-assets-empty"
          className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-6 text-center space-y-2"
        >
          <ImageIcon className="w-6 h-6 text-stone-400 mx-auto" />
          <p className="text-xs font-bold text-stone-700">No AI assets generated yet in this session</p>
          <p className="text-[11px] text-stone-500 max-w-md mx-auto">
            Choose a logo variation or social media template preset above and click Generate AI Brand Asset to produce downloadable artwork.
          </p>
        </div>
      )}
    </section>
  );
};
