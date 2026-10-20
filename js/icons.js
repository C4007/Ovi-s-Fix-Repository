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
  ram: '<rect x="2.5" y="7.5" width="19" height="8" rx="1.2"/><path d="M6 15.5V18.5M10 15.5V18.5M14 15.5V18.5M18 15.5V18.5M6 11.5h2.2M10.9 11.5h2.2M15.8 11.5H18"/>',
  ssd: '<rect x="3" y="7" width="18" height="10" rx="1.6"/><path d="M6.5 10.5h5M6.5 13.5h3"/><circle cx="17" cy="12" r="1.2"/>',
  hdd: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><circle cx="11" cy="11" r="3.8"/><circle cx="11" cy="11" r=".9"/><path d="M15.5 14.5l2.2 3"/>',
  gpu: '<rect x="2.5" y="7" width="19" height="9.5" rx="1.5"/><circle cx="8" cy="11.8" r="2.6"/><circle cx="15.5" cy="11.8" r="2.6"/><path d="M5 16.5v2M9 16.5v2M13 16.5v2"/>',
  psu: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="9.5" cy="12" r="3.4"/><path d="M15.5 9.5h3M15.5 12h3M15.5 14.5h3"/>',
  case: '<rect x="6" y="2.8" width="12" height="18.4" rx="1.8"/><path d="M9 7h6M9 10h6"/><circle cx="12" cy="16" r="2"/>',
  fan: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.8"/><path d="M12 10.2c0-3 2-4 3.5-3.4M13.8 12c3 0 4 2 3.4 3.5M12 13.8c0 3-2 4-3.5 3.4M10.2 12c-3 0-4-2-3.4-3.5"/>',
  cooler: '<rect x="3.5" y="3.5" width="17" height="14" rx="2"/><path d="M3.5 8h17M3.5 12.5h17M8 17.5v3M16 17.5v3"/>',
  mobo: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><rect x="7" y="7" width="5" height="5" rx=".8"/><path d="M15 7h2.5M15 10h2.5M7 15h10M7 17.5h6"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="1.8"/><path d="M9 20.5h6M12 16.5v4"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.4"/><path d="M2.5 18.5h19l-1.4-3.5H3.9z"/>',
  keyboard: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 13.8h.01M18 13.8h.01M9 14h6"/>',
  mouse: '<rect x="6.5" y="3" width="11" height="18" rx="5.5"/><path d="M12 3v6.5M6.5 9.5h11"/>',
  headphone: '<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4" height="6.5" rx="1.5"/><rect x="17" y="14" width="4" height="6.5" rx="1.5"/>',
  speaker: '<rect x="5.5" y="2.8" width="13" height="18.4" rx="2"/><circle cx="12" cy="15" r="3.4"/><circle cx="12" cy="7.3" r="1.4"/>',
  pad: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><rect x="14" y="9" width="4" height="6" rx="2"/>',
  wifi: '<path d="M2.8 9.2a13 13 0 0118.4 0M5.9 12.4a8.6 8.6 0 0112.2 0M9 15.6a4.2 4.2 0 016 0"/><circle cx="12" cy="19" r="1"/>',
  lan: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 17v2.5M12 17v2.5M17 17v2.5M7 7V4.5M12 7V4.5M17 7V4.5"/>',
  router: '<rect x="3" y="13" width="18" height="6.5" rx="1.8"/><path d="M7 16.2h.01M10.5 16.2h.01M7 13V6.5M17 13V6.5"/>',
  ups: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M13 7l-3 4.5h4L11 16.5"/>',
  cart: '<path d="M3 4h2.3l2.2 10.2a1.5 1.5 0 001.5 1.2h8a1.5 1.5 0 001.5-1.1L20 8H6.2"/><circle cx="9.5" cy="19.3" r="1.2"/><circle cx="16.5" cy="19.3" r="1.2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  filter: '<path d="M3.5 5.5h17M6.5 12h11M10 18.5h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 001.5 1.3h6.4a1.5 1.5 0 001.5-1.3L17.5 7M10 11v6M14 11v6"/>',
  print: '<path d="M7 9V3.5h10V9M7 17.5H4.5v-8h15v8H17M7 14h10v6.5H7z"/>',
  save: '<path d="M5 3.5h11.5L20.5 7.5V19a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V5A1.5 1.5 0 015 3.5z"/><path d="M7.5 3.5V9h8V3.5M7.5 20.5v-6h9v6"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.4"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  chevrondown: '<path d="M6 9l6 6 6-6"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  scale: '<path d="M12 4v16M5 20h14M5 7l-2.5 6a3 3 0 005 0zM19 7l-2.5 6a3 3 0 005 0zM5 7h14"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.3v.01"/>',
  info: '<circle cx="12" cy="12" r="9.3"/><path d="M12 11v5.5M12 7.8v.01"/>',
  store: '<path d="M3.5 9.5l1.5-5h14l1.5 5M3.5 9.5a2.8 2.8 0 005.5 0 2.8 2.8 0 005.5 0 2.8 2.8 0 005.5 0M5 12.5V20h14v-7.5M10 20v-4.5h4V20"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 005 5l-9.2 9.2a2.1 2.1 0 01-3-3l9.2-9.2a4 4 0 01-2-1z"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
  list: '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4.5 19.5h15"/>',
  upload: '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M4.5 19.5h15"/>',
  clock: '<circle cx="12" cy="12" r="9.3"/><path d="M12 7v5.5l3.5 2"/>',
  edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 00-3-3L5 17z"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/>',
  box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
};

export function icon(name, extraClass) {
  const body = paths[name] || "";
  const cls = extraClass ? ` class="${extraClass}"` : "";
  return WRAP_OPEN.replace("<svg ", `<svg${cls} `) + body + WRAP_CLOSE;
}

/** Just the inner SVG paths (used where a custom <svg> wrapper is needed, e.g. product placeholders). */
export function iconBody(name) {
  return paths[name] || "";
}
