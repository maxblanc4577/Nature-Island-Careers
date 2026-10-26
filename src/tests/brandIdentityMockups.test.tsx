import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BrandIdentityGenerator,
  OFFICIAL_BRAND_PALETTE,
  FONT_PAIRING_PRESETS,
  SOCIAL_SPECS,
} from '../components/BrandIdentityGenerator';
import {
  getContrastRatio,
  getWcagRating,
  hexToRgb,
  hexToHsl,
  isColorLight,
} from '../utils/colorUtils';

describe('Brand Identity Generator & Social Media Profile Mockups', () => {
  it('defines the official brand color palette with authentic Dominica hues', () => {
    expect(OFFICIAL_BRAND_PALETTE.length).toBeGreaterThanOrEqual(7);

    const forestGreen = OFFICIAL_BRAND_PALETTE.find((c) => c.hex.toLowerCase() === '#082407');
    const emeraldGreen = OFFICIAL_BRAND_PALETTE.find((c) => c.hex.toLowerCase() === '#15803d');
    const natureLime = OFFICIAL_BRAND_PALETTE.find((c) => c.hex.toLowerCase() === '#5bc22b');
    const goldenSun = OFFICIAL_BRAND_PALETTE.find((c) => c.hex.toLowerCase() === '#f59e0b');

    expect(forestGreen).toBeDefined();
    expect(forestGreen?.name).toContain('Forest Green');
    expect(emeraldGreen).toBeDefined();
    expect(natureLime).toBeDefined();
    expect(goldenSun).toBeDefined();
  });

  it('calculates WCAG contrast ratios and ratings accurately for brand palette colors', () => {
    const forestOnWhite = getContrastRatio('#082407', '#FFFFFF');
    expect(forestOnWhite).toBeGreaterThanOrEqual(7.0);
    const rating = getWcagRating(forestOnWhite);
    expect(rating.score).toBe('AAA');
    expect(rating.pass).toBe(true);

    const rgb = hexToRgb('#082407');
    expect(rgb).toEqual({ r: 8, g: 36, b: 7 });

    const hsl = hexToHsl('#082407');
    expect(hsl).toContain('°');
    expect(isColorLight('#082407')).toBe(false);
    expect(isColorLight('#F8FAF8')).toBe(true);
  });

  it('provides curated font pairings suitable for the brand identity', () => {
    expect(FONT_PAIRING_PRESETS.length).toBeGreaterThanOrEqual(3);
    const defaultPairing = FONT_PAIRING_PRESETS[0];
    expect(defaultPairing.displayFont).toBe('Plus Jakarta Sans');
    expect(defaultPairing.bodyFont).toBe('DM Sans');
  });

  it('includes specifications for Facebook Cover, Twitter Header, and Instagram Profile', () => {
    expect(SOCIAL_SPECS.facebook.dimensions).toContain('820 × 312');
    expect(SOCIAL_SPECS.twitter.dimensions).toContain('1500 × 500');
    expect(SOCIAL_SPECS.instagram.dimensions).toContain('1080 × 1080');
  });

  it('renders the complete BrandIdentityGenerator component with all mockups and tools', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandIdentityGenerator, {
        onClose: () => {},
      })
    );

    expect(html).toContain('brand-identity-generator-root');
    expect(html).toContain('Brand Identity &amp; Social Mockup Studio');

    // Tab buttons
    expect(html).toContain('tab-all-mockups');
    expect(html).toContain('tab-facebook-cover');
    expect(html).toContain('tab-twitter-header');
    expect(html).toContain('tab-instagram-profile');
    expect(html).toContain('tab-color-palette');
    expect(html).toContain('tab-typography');

    // Facebook Cover Mockup assertions
    expect(html).toContain('facebook-cover-mockup-section');
    expect(html).toContain('Facebook Page Cover Photo Mockup');
    expect(html).toContain('820 × 312 px');
    expect(html).toContain('Nature Island Careers 🇩🇲');
    expect(html).toContain('fb-safe-zone-overlay');

    // Twitter Header Mockup assertions
    expect(html).toContain('twitter-header-mockup-section');
    expect(html).toContain('Twitter / X Header Banner Mockup');
    expect(html).toContain('1500 × 500 px');
    expect(html).toContain('@NatureIslandJobs');
    expect(html).toContain('24.8K');
    expect(html).toContain('twitter-safe-zone-overlay');

    // Instagram Profile Mockup assertions
    expect(html).toContain('instagram-profile-mockup-section');
    expect(html).toContain('Instagram Profile Picture &amp; Grid Translation');
    expect(html).toContain('instagram-circular-avatar');
    expect(html).toContain('natureislandcareers');
    expect(html).toContain('Hot Jobs');
    expect(html).toContain('Salaries');

    // Brand Palette assertions
    expect(html).toContain('brand-palette-section');
    expect(html).toContain('Dominican Forest Green');
    expect(html).toContain('#082407');
    expect(html).toContain('Emerald Rainforest');
    expect(html).toContain('#15803D');

    // Typography section assertions
    expect(html).toContain('brand-typography-section');
    expect(html).toContain('Dominica Typographic Hierarchy &amp; Pairings');
  });
});
