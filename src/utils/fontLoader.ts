// Dynamic Google Fonts Loader

const loadedFonts = new Set<string>();

export function loadGoogleFont(fontFamily: string) {
  if (!fontFamily || loadedFonts.has(fontFamily)) return;

  const fontParam = fontFamily.replace(/\s+/g, '+');
  const linkId = `google-font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`;

  if (document.getElementById(linkId)) {
    loadedFonts.add(fontFamily);
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontParam}:wght@300;400;500;600;700;800;900&display=swap`;
  
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
}
