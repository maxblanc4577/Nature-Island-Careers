import React, { useId } from 'react';

interface BrandLogoProps {
  /**
   * - 'header': Emblem mark inside dark forest-green badge + stacked NATURE ISLAND / CAREERS wordmark
   * - 'card': Full centered stacked logo inside the dark forest-green (#082407) container matching the official brand lockup
   * - 'footer': Emblem mark + light wordmark for dark backgrounds
   * - 'mark': Only the rising sun & leaves emblem mark
   */
  variant?: 'header' | 'card' | 'footer' | 'mark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export const BrandLogoMark: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="195 105 410 275"
      className={className}
      role="img"
      aria-label="Nature Island Careers Emblem"
      data-testid="brand-logo-svg"
    >
      <defs>
        <linearGradient id={`sunRays_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF04D" />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="85%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <radialGradient id={`sunCore_${uid}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#FFFF4D" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="85%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <linearGradient id={`sunRim_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={`leafBody_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#84CC16" />
          <stop offset="55%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id={`lowerLeaf_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id={`leafOutline_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D9F99D" />
          <stop offset="50%" stopColor="#A3E635" />
          <stop offset="100%" stopColor="#86EFAC" />
        </linearGradient>
      </defs>

      {/* 7 Pointed Rising Sun Rays */}
      <path
        d="M 326 258 L 264 212 L 346 232 L 296 164 L 363 213 L 343 136 L 385 204 L 400 120 L 415 204 L 457 136 L 437 213 L 504 164 L 454 232 L 536 212 L 474 258 Z"
        fill={`url(#sunRays_${uid})`}
        stroke={`url(#sunRim_${uid})`}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Glowing Sun Dome */}
      <ellipse cx="400" cy="262" rx="58" ry="44" fill={`url(#sunCore_${uid})`} />
      <path
        d="M 350 245 Q 400 225 450 245 Q 422 276 400 330 Q 378 276 350 245 Z"
        fill={`url(#sunCore_${uid})`}
      />

      {/* Left Large Leaf */}
      <path
        d="M 394 338 C 386 286, 355 252, 300 248 C 258 245, 232 238, 216 218 C 220 264, 236 306, 278 314 C 324 322, 362 320, 388 345 Z"
        fill={`url(#leafBody_${uid})`}
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M 390 340 C 374 300, 336 278, 268 276"
        fill="none"
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Right Large Leaf */}
      <path
        d="M 406 338 C 414 286, 445 252, 500 248 C 542 245, 568 238, 584 218 C 580 264, 564 306, 522 314 C 476 322, 438 320, 412 345 Z"
        fill={`url(#leafBody_${uid})`}
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M 410 340 C 426 300, 464 278, 532 276"
        fill="none"
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Lower Left Sprout Leaf */}
      <path
        d="M 392 346 C 365 326, 326 328, 298 344 C 320 364, 356 352, 392 354 Z"
        fill={`url(#lowerLeaf_${uid})`}
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 388 349 C 362 338, 336 340, 314 346"
        fill="none"
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Lower Right Sprout Leaf */}
      <path
        d="M 408 346 C 435 326, 474 328, 502 344 C 480 364, 444 352, 408 354 Z"
        fill={`url(#lowerLeaf_${uid})`}
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 412 349 C 438 338, 464 340, 486 346"
        fill="none"
        stroke={`url(#leafOutline_${uid})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Central Stem Base */}
      <path
        d="M 392 332 L 391 364 Q 400 370 409 364 L 408 332 Z"
        fill={`url(#leafOutline_${uid})`}
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  className = '',
  size = 'md',
}) => {
  if (variant === 'mark') {
    const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
    return (
      <div
        data-testid="brand-logo-mark"
        className={`relative rounded-xl bg-[#082407] flex items-center justify-center shadow-md border border-lime-500/30 overflow-hidden shrink-0 ${dim} ${className}`}
      >
        <BrandLogoMark className="w-[88%] h-[88%]" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        data-testid="brand-logo-card"
        className={`inline-flex flex-col items-center justify-center bg-[#082407] px-6 py-4 rounded-2xl border border-lime-500/30 shadow-lg select-none ${className}`}
      >
        <BrandLogoMark className={size === 'lg' ? 'w-28 h-20' : 'w-20 h-14'} />
        <div className="text-center mt-1 leading-none">
          <span
            className={`block font-black tracking-wide text-white uppercase ${
              size === 'lg' ? 'text-2xl' : 'text-lg'
            }`}
          >
            NATURE ISLAND
          </span>
          <span
            className={`block font-extrabold text-[#5BC22B] uppercase tracking-[0.38em] mt-1 pl-[0.38em] ${
              size === 'lg' ? 'text-xs' : 'text-[10px]'
            }`}
          >
            CAREERS
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div
        data-testid="brand-logo-footer"
        className={`inline-flex items-center gap-3 select-none ${className}`}
      >
        <div className="w-12 h-12 rounded-xl bg-[#082407] flex items-center justify-center shadow-md border border-lime-500/30 shrink-0 p-1">
          <BrandLogoMark className="w-full h-full" />
        </div>
        <div className="leading-none">
          <span className="block font-black text-[17px] tracking-wide text-white uppercase">
            NATURE ISLAND
          </span>
          <span className="block font-extrabold text-[11px] text-[#5BC22B] uppercase tracking-[0.35em] mt-1">
            CAREERS
          </span>
        </div>
      </div>
    );
  }

  // Default: 'header'
  return (
    <div
      data-testid="brand-logo-header"
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <div className="relative w-11 h-11 rounded-xl bg-[#082407] flex items-center justify-center shadow-md shadow-emerald-950/20 border border-lime-500/40 overflow-hidden shrink-0 p-1">
        <BrandLogoMark className="w-full h-full" />
      </div>
      <div className="leading-none">
        <span className="block font-black text-[15px] sm:text-[16px] tracking-tight text-slate-900 uppercase">
          NATURE ISLAND
        </span>
        <span className="block font-extrabold text-[10px] sm:text-[11px] text-[#4AA81E] uppercase tracking-[0.34em] mt-0.5">
          CAREERS
        </span>
      </div>
    </div>
  );
};
