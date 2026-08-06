/* ==========================================================================
   Ovi's Fix — icons.js
   A small hand-drawn, single-family outline icon set (no external icon
   library dependency, so the site has zero runtime deps beyond web fonts).
   ========================================================================== */

const WRAP_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const WRAP_CLOSE = "</svg>";

const paths = {
  report: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2.5a1 1 0 011-1h4a1 1 0 011 1V3"/><path d="M9 12.5l2 2 4-4.5"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="10" width="4" height="4"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/>',
  tag: '<path d="M12.6 2.6a2 2 0 00-1.42-.6H4.5a2 2 0 00-2 2v6.68a2 2 0 00.58 1.42l8.83 8.83a2 2 0 002.83 0l7.17-7.17a2 2 0 000-2.83z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  home: '<path d="M3.5 11L12 3.5 20.5 11"/><path d="M5.5 9.7V19a1 1 0 001 1H9.5v-6h5v6H18a1 1 0 001-1V9.7"/>',
  shield: '<path d="M12 2.5l7.5 3.4v5.4c0 4.6-3.2 7.9-7.5 9.2-4.3-1.3-7.5-4.6-7.5-9.2V5.9z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
  database: '<ellipse cx="12" cy="5.2" rx="7.5" ry="2.7"/><path d="M4.5 5.2v6c0 1.5 3.36 2.7 7.5 2.7s7.5-1.2 7.5-2.7v-6"/><path d="M4.5 11.2v6c0 1.5 3.36 2.7 7.5 2.7s7.5-1.2 7.5-2.7v-6"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M3 6l9 6.5L21 6"/>',
  phone: '<path d="M6.6 10.9a15 15 0 006.5 6.5l2.1-2.1a1 1 0 011-.25 10.6 10.6 0 003.4.55 1 1 0 011 1V19.9a1 1 0 01-1 1A16.5 16.5 0 013.1 4.1a1 1 0 011-1h3.4a1 1 0 011 1 10.6 10.6 0 00.55 3.4 1 1 0 01-.25 1z"/>',
  pin: '<path d="M19.5 10c0 5.8-7.5 11.2-7.5 11.2S4.5 15.8 4.5 10a7.5 7.5 0 1115 0z"/><circle cx="12" cy="10" r="2.6"/>',
  facebook: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M14 9h-1.3a1.3 1.3 0 00-1.3 1.3V12h2.6l-.4 2.6h-2.2V20"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/>',
  youtube: '<rect x="2.2" y="5.5" width="19.6" height="13" rx="4"/><path d="M10 9.3l5.6 2.7-5.6 2.7z" fill="currentColor" stroke="none"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.2 10.2V17M7.2 7.3v.02M11.4 17v-4.6a1.9 1.9 0 013.8 0V17M11.4 12.4V17"/>',
  whatsapp: '<path d="M12 2.8a9.2 9.2 0 00-7.9 13.8L3 21.2l4.7-1.2A9.2 9.2 0 1012 2.8z"/><path d="M8.4 8.6c0-.3.25-.5.55-.5h.9c.28 0 .53.18.62.45l.55 1.5c.1.28 0 .58-.2.77l-.53.5c.5 1.1 1.3 1.9 2.4 2.4l.5-.53c.2-.2.5-.28.77-.2l1.5.55c.27.1.45.35.45.62v.9c0 .3-.2.55-.5.55-3.2.35-6.7-3.1-6.5-6.5z"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.6A8.6 8.6 0 119.4 4a7.1 7.1 0 0010.6 10.6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M7 17L17 7M7 7h10v10"/>',
  send: '<path d="M21.5 2.5L10.8 13.2M21.5 2.5l-6.8 19-4-9-9-4z"/>',
  check: '<circle cx="12" cy="12" r="9.3"/><path d="M8 12.4l2.6 2.6 5.4-6"/>',
};

export function icon(name, extraClass) {
  const body = paths[name] || "";
  const cls = extraClass ? ` class="${extraClass}"` : "";
  return WRAP_OPEN.replace("<svg ", `<svg${cls} `) + body + WRAP_CLOSE;
}
