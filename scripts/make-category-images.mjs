// Ovi's Fix — makes one clean HD picture (1200 x 1200, transparent WebP) for every product category.
// Shown on a product card until you upload a real photo for that product in Admin.
//   Needs the "sharp" package (not installed by default):   npm i --no-save sharp
//   Run:                                                     node scripts/make-category-images.mjs
// Output: images/products/<category>.webp  (one per sub-category key in js/catalog-schema.js)
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "images", "products");
fs.mkdirSync(OUT, { recursive: true });

const DEFS = `<defs>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa9c2"/><stop offset=".5" stop-color="#5d6d88"/><stop offset="1" stop-color="#34405a"/></linearGradient>
  <linearGradient id="steelH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4760"/><stop offset=".35" stop-color="#8493ad"/><stop offset=".7" stop-color="#4b5972"/><stop offset="1" stop-color="#2c364b"/></linearGradient>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e3a52"/><stop offset="1" stop-color="#141b2a"/></linearGradient>
  <linearGradient id="pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#24497a"/><stop offset="1" stop-color="#15294a"/></linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ea6ff"/><stop offset="1" stop-color="#2f6fed"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6da86"/><stop offset="1" stop-color="#b8861f"/></linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b63"/><stop offset="1" stop-color="#d12a26"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27437d"/><stop offset=".55" stop-color="#14224a"/><stop offset="1" stop-color="#0a1226"/></linearGradient>
  <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fc"/><stop offset="1" stop-color="#cfd8e8"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2f6fed" stop-opacity=".30"/><stop offset=".7" stop-color="#2f6fed" stop-opacity=".07"/><stop offset="1" stop-color="#2f6fed" stop-opacity="0"/></radialGradient>
  <filter id="sh" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#000" flood-opacity=".42"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
</defs>`;

const R = (x, y, w, h, rx, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const C = (x, y, r, fill, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const L = (x1, y1, x2, y2, stroke, w = 6, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const hi = (x, y, w, rx = 6) => R(x, y, w, 8, rx, "#fff", 'opacity=".18"'); // soft top highlight

function fan(cx, cy, r, blades = 7, bladeFill = "#1a2233", ring = "#2f6fed") {
  let s = C(cx, cy, r, "#0e1422") + C(cx, cy, r, "none", `stroke="${ring}" stroke-width="${r * 0.07}" opacity=".9"`);
  for (let i = 0; i < blades; i++) {
    s += `<g transform="rotate(${(360 / blades) * i} ${cx} ${cy})">${P(`M ${cx} ${cy - r * 0.18} C ${cx + r * 0.55} ${cy - r * 0.5} ${cx + r * 0.5} ${cy - r * 0.88} ${cx + r * 0.04} ${cy - r * 0.9} C ${cx - r * 0.2} ${cy - r * 0.6} ${cx - r * 0.1} ${cy - r * 0.32} ${cx} ${cy - r * 0.18} Z`, bladeFill, 'stroke="#46567a" stroke-width="3"')}</g>`;
  }
  return s + C(cx, cy, r * 0.2, "url(#steel)") + C(cx, cy, r * 0.08, "#0e1422");
}
const pinsRow = (x, y, n, gap, horizontal, fill = "url(#gold)") => Array.from({ length: n }, (_, i) => horizontal ? R(x + i * gap, y, 12, 22, 3, fill) : R(x, y + i * gap, 22, 12, 3, fill)).join("");
const keys = (x, y, cols, rows, w, h, gap, fill, widths = {}) => {
  let s = "";
  for (let r = 0; r < rows; r++) { let cx = x; for (let c = 0; c < cols; c++) { const kw = widths[`${r},${c}`] || w; s += R(cx, y + r * (h + gap), kw, h, 9, fill) + R(cx + 4, y + r * (h + gap) + 4, kw - 8, 8, 4, "#fff", 'opacity=".12"'); cx += kw + gap; } }
  return s;
};
const laptop = (accent, glowing) => `
  ${R(250, 330, 700, 450, 28, "url(#dark)", 'stroke="#46567a" stroke-width="4"')}
  ${R(280, 360, 640, 390, 12, "url(#screen)")}
  ${glowing ? `<ellipse cx="600" cy="640" rx="260" ry="60" fill="${accent}" opacity=".35" filter="url(#soft)"/>` : ""}
  ${R(330, 420, 200, 26, 8, accent, 'opacity=".9"')}${R(330, 470, 340, 16, 8, "#7f8fb3", 'opacity=".55"')}${R(330, 500, 290, 16, 8, "#7f8fb3", 'opacity=".4"')}
  ${R(690, 420, 190, 200, 14, accent, 'opacity=".22"')}${R(716, 560, 24, 40, 5, accent)}${R(752, 530, 24, 70, 5, accent)}${R(788, 490, 24, 110, 5, accent)}${R(824, 455, 24, 145, 5, accent)}
  ${P("M 170 795 L 1030 795 L 990 860 Q 985 872 970 872 L 230 872 Q 215 872 210 860 Z", "url(#steel)")}
  ${R(500, 795, 200, 18, 9, "#243047")}${hi(215, 800, 770)}`;
const monitor = (accent, kind) => `
  ${R(205, 250, 790, 520, kind === "gaming" ? 30 : 22, "url(#dark)", `stroke="${kind === "gaming" ? "#46567a" : "#3a4760"}" stroke-width="5"`)}
  ${R(232, 277, 736, 466, 8, "url(#screen)")}
  ${kind === "pro" ? `<defs><linearGradient id="pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a59"/><stop offset=".35" stop-color="#ffd166"/><stop offset=".65" stop-color="#3ddb96"/><stop offset="1" stop-color="#4c7dff"/></linearGradient></defs>${R(260, 305, 680, 330, 8, "url(#pv)", 'opacity=".85"')}${R(260, 655, 120, 60, 6, "#ff5a52")}${R(400, 655, 120, 60, 6, "#ffd166")}${R(540, 655, 120, 60, 6, "#3ddb96")}${R(680, 655, 120, 60, 6, "#4c7dff")}${R(820, 655, 120, 60, 6, "#a78bfa")}`
    : `<ellipse cx="600" cy="560" rx="330" ry="120" fill="${accent}" opacity=".30" filter="url(#soft)"/>${R(280, 320, 230, 28, 8, accent)}${R(280, 370, 400, 16, 8, "#7f8fb3", 'opacity=".5"')}${R(280, 400, 340, 16, 8, "#7f8fb3", 'opacity=".4"')}${P("M 640 690 L 720 560 L 780 640 L 840 500 L 930 690 Z", accent, 'opacity=".55"')}`}
  ${kind === "gaming" ? R(205, 758, 790, 12, 6, "url(#red)") : ""}
  ${P("M 540 770 L 660 770 L 690 905 L 510 905 Z", "url(#steel)")}${R(410, 905, 380, 34, 17, "url(#steel)")}${hi(412, 908, 376, 8)}`;

const ART = {
  processor: () => `${R(300, 300, 600, 600, 56, "url(#steel)", 'stroke="#aab7cf" stroke-width="4"')}${R(350, 350, 500, 500, 30, "url(#steelH)")}${R(420, 420, 360, 360, 18, "#1b2437", 'stroke="#46567a" stroke-width="4"')}${R(455, 470, 140, 22, 8, "url(#blue)")}${R(455, 515, 290, 14, 7, "#7f8fb3", 'opacity=".55"')}${R(455, 545, 230, 14, 7, "#7f8fb3", 'opacity=".4"')}${P("M 300 300 L 380 300 L 300 380 Z", "url(#gold)")}${pinsRow(330, 262, 14, 32, true)}${pinsRow(330, 916, 14, 32, true)}${pinsRow(262, 330, 14, 32, false)}${pinsRow(916, 330, 14, 32, false)}${hi(310, 308, 580, 20)}`,
  "cpu-cooler": () => `${R(330, 800, 540, 60, 14, "url(#steel)")}${Array.from({ length: 13 }, (_, i) => R(350 + i * 40, 250, 24, 540, 6, "url(#steelH)")).join("")}${[400, 500, 600, 700, 790].map((x) => R(x, 190, 22, 620, 11, "url(#gold)", 'opacity=".95"')).join("")}${R(300, 760, 600, 44, 10, "url(#dark)")}${fan(600, 540, 170, 7, "#1a2233", "#2f6fed")}`,
  motherboard: () => `${R(220, 220, 760, 760, 28, "url(#pcb)", 'stroke="#46567a" stroke-width="5"')}${R(330, 330, 200, 200, 16, "url(#steel)")}${R(365, 365, 130, 130, 10, "#1b2437")}${[620, 670, 720, 770].map((x) => R(x, 270, 30, 300, 8, "url(#dark)", 'stroke="#46567a" stroke-width="3"')).join("")}${R(250, 570, 80, 150, 12, "url(#steelH)")}${R(250, 250, 60, 290, 10, "url(#steelH)")}${R(330, 620, 420, 34, 8, "url(#dark)")}${R(330, 700, 420, 34, 8, "url(#dark)")}${R(330, 780, 420, 34, 8, "url(#dark)")}${R(780, 640, 150, 28, 8, "url(#gold)")}${R(780, 700, 150, 28, 8, "url(#gold)")}${R(790, 860, 110, 70, 10, "url(#steelH)")}${L(540, 430, 600, 430, "#7ea6ff", 5, 'opacity=".7"')}${L(600, 430, 600, 330, "#7ea6ff", 5, 'opacity=".7"')}${L(280, 880, 560, 880, "#7ea6ff", 5, 'opacity=".5"')}${C(595, 330, 9, "#7ea6ff")}`,
  ram: () => [0, 1].map((i) => `<g transform="translate(0 ${i * 190})">${R(160, 300, 880, 190, 22, "url(#dark)", 'stroke="#46567a" stroke-width="4"')}${R(160, 300, 880, 130, 22, "url(#steelH)")}${R(220, 330, 280, 24, 8, "url(#blue)")}${R(220, 372, 200, 14, 7, "#1b2437", 'opacity=".5"')}${R(180, 462, 840, 22, 4, "url(#gold)")}${R(600, 455, 16, 36, 4, "#0e1422")}${hi(170, 306, 860, 20)}</g>`).join(""),
  ssd: () => `${R(200, 310, 800, 210, 26, "url(#dark)", 'stroke="#46567a" stroke-width="4"')}${R(235, 340, 170, 150, 12, "url(#steel)")}${R(430, 340, 170, 150, 12, "url(#steel)")}${R(625, 340, 120, 150, 12, "url(#steel)")}${R(770, 340, 90, 150, 12, "url(#blue)")}${R(930, 310, 70, 210, 8, "url(#gold)")}${R(960, 385, 24, 60, 6, "#0e1422")}${C(222, 415, 14, "#0e1422")}${R(260, 610, 680, 380, 36, "url(#steel)", 'stroke="#aab7cf" stroke-width="4"')}${R(300, 650, 600, 300, 18, "url(#dark)")}${R(350, 705, 240, 28, 8, "url(#blue)")}${R(350, 755, 360, 16, 8, "#7f8fb3", 'opacity=".5"')}${R(350, 785, 300, 16, 8, "#7f8fb3", 'opacity=".4"')}${hi(268, 616, 664, 14)}`,
  hdd: () => `${R(260, 220, 680, 760, 36, "url(#steel)", 'stroke="#aab7cf" stroke-width="4"')}${R(300, 260, 600, 680, 20, "url(#steelH)")}${C(600, 540, 230, "#1b2437", 'stroke="#46567a" stroke-width="6"')}${C(600, 540, 160, "none", 'stroke="#5d6d88" stroke-width="4"')}${C(600, 540, 90, "none", 'stroke="#5d6d88" stroke-width="4"')}${C(600, 540, 34, "url(#steel)")}${P("M 650 330 L 850 250 L 870 290 L 690 400 Z", "url(#blue)")}${R(340, 830, 520, 70, 10, "url(#paper)")}${R(360, 848, 200, 14, 6, "#34405a")}${R(360, 872, 320, 10, 5, "#8493ad")}`,
  "graphics-card": () => `${R(130, 360, 940, 400, 30, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(130, 735, 940, 30, 12, "url(#steel)")}${fan(330, 560, 150, 9)}${fan(640, 560, 150, 9)}${R(830, 410, 200, 300, 16, "url(#steelH)")}${L(850, 460, 1010, 460, "#2f6fed", 6)}${L(850, 500, 1010, 500, "#2f6fed", 6, 'opacity=".6"')}${L(850, 540, 1010, 540, "#2f6fed", 6, 'opacity=".4"')}${R(120, 340, 40, 440, 10, "url(#steel)")}${R(250, 765, 600, 36, 8, "url(#gold)")}${hi(135, 366, 930, 16)}`,
  "power-supply": () => `${R(190, 290, 820, 620, 32, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${C(480, 600, 220, "#0e1422", 'stroke="#46567a" stroke-width="6"')}${[170, 130, 90, 50].map((r) => C(480, 600, r, "none", 'stroke="#46567a" stroke-width="5"')).join("")}${L(260, 600, 700, 600, "#46567a", 4)}${L(480, 380, 480, 820, "#46567a", 4)}${R(760, 340, 200, 120, 12, "url(#paper)")}${R(780, 365, 90, 14, 6, "#34405a")}${R(780, 395, 150, 10, 5, "#8493ad")}${R(780, 418, 110, 10, 5, "#8493ad")}${R(760, 520, 200, 56, 10, "url(#steel)")}${R(760, 600, 200, 56, 10, "url(#steel)")}${R(760, 700, 120, 120, 14, "url(#red)")}${hi(196, 296, 808, 12)}`,
  casing: () => `${R(340, 150, 520, 840, 34, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(375, 185, 450, 650, 16, "#0c1220")}${R(375, 185, 220, 650, 16, "#fff", 'opacity=".05"')}${fan(600, 330, 110, 7, "#1a2233", "#2f6fed")}${fan(600, 600, 110, 7, "#1a2233", "#2f6fed")}${R(405, 740, 390, 70, 10, "url(#steelH)")}${R(375, 855, 450, 24, 8, "url(#steel)")}${C(430, 925, 10, "url(#blue)")}${R(380, 990, 70, 30, 8, "#0e1422")}${R(750, 990, 70, 30, 8, "#0e1422")}${hi(345, 156, 510, 18)}`,
  "casing-fan": () => `${R(250, 250, 700, 700, 60, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${[[300, 300], [900, 300], [300, 900], [900, 900]].map(([x, y]) => C(x, y, 14, "#0e1422")).join("")}${fan(600, 600, 290, 9, "#1a2233", "#2f6fed")}`,
  "gaming-laptop": () => laptop("#ff5a52", true) + keys(300, 818, 12, 1, 44, 16, 6, "#ff5a52"),
  "everyday-laptop": () => laptop("#2f6fed", false),
  "business-laptop": () => laptop("#8fa3c9", false),
  "gaming-monitor": () => monitor("#ff5a52", "gaming"),
  "office-monitor": () => monitor("#2f6fed", "office"),
  "pro-monitor": () => monitor("#2f6fed", "pro"),
  keyboard: () => `${R(110, 360, 980, 470, 40, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${keys(150, 400, 13, 1, 62, 62, 14, "url(#steel)")}${keys(150, 476, 13, 1, 62, 62, 14, "url(#steel)")}${keys(150, 552, 12, 1, 62, 62, 14, "url(#steel)", { "0,0": 100 })}${keys(150, 628, 11, 1, 62, 62, 14, "url(#steel)", { "0,0": 130 })}${R(150, 708, 130, 70, 9, "url(#steel)")}${R(296, 708, 520, 70, 9, "url(#blue)")}${R(832, 708, 100, 70, 9, "url(#steel)")}${R(948, 708, 100, 70, 9, "url(#steel)")}`,
  mouse: () => `${P("M 600 180 C 800 180 880 330 880 560 C 880 800 790 1000 600 1000 C 410 1000 320 800 320 560 C 320 330 400 180 600 180 Z", "url(#steelH)", 'stroke="#aab7cf" stroke-width="5"')}${P("M 600 190 L 600 500", "none", 'stroke="#1b2437" stroke-width="8"')}${P("M 330 500 C 450 520 750 520 870 500", "none", 'stroke="#1b2437" stroke-width="8"')}${R(570, 280, 60, 130, 30, "url(#blue)")}${R(575, 600, 50, 12, 6, "#1b2437", 'opacity=".5"')}${P("M 330 640 C 380 800 440 900 520 960", "none", 'stroke="#2f6fed" stroke-width="10" stroke-linecap="round" opacity=".85"')}`,
  headphone: () => `${P("M 270 640 C 240 240 960 240 930 640", "none", 'stroke="url(#steel)" stroke-width="52" stroke-linecap="round"')}${R(190, 580, 190, 340, 80, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(820, 580, 190, 340, 80, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(215, 625, 120, 250, 55, "url(#blue)")}${R(865, 625, 120, 250, 55, "url(#blue)")}${R(235, 645, 50, 14, 7, "#fff", 'opacity=".25"')}${R(915, 645, 50, 14, 7, "#fff", 'opacity=".25"')}`,
  speaker: () => [[170, 300], [650, 300]].map(([x, y]) => `${R(x, y, 380, 600, 30, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${C(x + 190, y + 170, 62, "#0e1422", 'stroke="#46567a" stroke-width="5"')}${C(x + 190, y + 170, 26, "url(#steel)")}${C(x + 190, y + 400, 130, "#0e1422", 'stroke="#46567a" stroke-width="6"')}${C(x + 190, y + 400, 88, "url(#steel)")}${C(x + 190, y + 400, 34, "#0e1422")}${hi(x + 6, y + 6, 368, 10)}`).join(""),
  "mouse-pad": () => `${R(130, 330, 940, 560, 60, "url(#dark)", 'stroke="#2f6fed" stroke-width="8" stroke-dasharray="26 16"')}${R(170, 370, 860, 480, 36, "none", 'stroke="#46567a" stroke-width="4"')}${P("M 600 520 C 680 520 710 590 710 680 C 710 770 670 820 600 820 C 530 820 490 770 490 680 C 490 590 520 520 600 520 Z", "url(#steelH)")}${L(600, 530, 600, 640, "#1b2437", 6)}${R(580, 560, 40, 70, 20, "url(#blue)")}`,
  "wifi-adapter": () => `${L(380, 300, 360, 640, "url(#steel)", 38)}${L(820, 300, 840, 640, "url(#steel)", 38)}${C(380, 290, 28, "url(#steel)")}${C(820, 290, 28, "url(#steel)")}${R(160, 640, 880, 250, 26, "url(#pcb)", 'stroke="#46567a" stroke-width="5"')}${R(160, 640, 40, 290, 8, "url(#steel)")}${R(260, 690, 220, 150, 14, "url(#steel)")}${R(520, 700, 110, 130, 10, "#0e1422")}${R(660, 700, 110, 130, 10, "#0e1422")}${R(300, 890, 520, 36, 8, "url(#gold)")}${C(830, 765, 24, "url(#blue)")}`,
  "lan-card": () => `${R(180, 400, 840, 400, 26, "url(#pcb)", 'stroke="#46567a" stroke-width="5"')}${R(180, 380, 46, 440, 8, "url(#steel)")}${R(250, 470, 200, 170, 14, "url(#steelH)")}${R(285, 505, 130, 100, 8, "#0e1422")}${Array.from({ length: 6 }, (_, i) => R(298 + i * 18, 560, 10, 36, 3, "url(#gold)")).join("")}${C(300, 490, 9, "#3ddb96")}${C(400, 490, 9, "#ffd166")}${R(520, 500, 130, 130, 12, "url(#dark)")}${R(690, 500, 100, 130, 12, "url(#dark)")}${R(280, 800, 520, 36, 8, "url(#gold)")}`,
  router: () => `${[[330, 170, 300], [600, 140, 600], [870, 170, 900]].map(([x, y, tx]) => L(x, 520, tx > 600 ? x + 50 : tx < 600 ? x - 50 : x, y, "url(#steel)", 40)).join("")}${R(150, 520, 900, 300, 40, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(150, 520, 900, 90, 40, "url(#steelH)")}${[0, 1, 2, 3, 4].map((i) => C(280 + i * 70, 690, 14, i === 4 ? "#ffd166" : "#3ddb96")).join("")}${[0, 1, 2, 3].map((i) => R(700 + i * 78, 650, 58, 56, 8, "#0e1422", 'stroke="#46567a" stroke-width="4"')).join("")}${hi(158, 526, 884, 14)}`,
  ups: () => `${R(230, 240, 740, 700, 40, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(230, 240, 740, 120, 40, "url(#steelH)")}${R(290, 410, 330, 150, 16, "#0b1c2f", 'stroke="#46567a" stroke-width="4"')}${R(320, 440, 120, 22, 8, "url(#blue)")}${R(320, 484, 250, 14, 7, "#7ea6ff", 'opacity=".5"')}${C(720, 485, 38, "url(#red)")}${C(820, 485, 38, "url(#steel)")}${[0, 1, 2].map((i) => R(290 + i * 220, 650, 180, 190, 22, "#0e1422", 'stroke="#46567a" stroke-width="4"')).join("")}${[0, 1, 2].map((i) => R(360 + i * 220, 705, 12, 60, 4, "#46567a") + R(430 + i * 220, 705, 12, 60, 4, "#46567a")).join("")}`,
  antivirus: () => `${P("M 600 170 L 930 290 C 930 640 800 880 600 1010 C 400 880 270 640 270 290 Z", "url(#blue)", 'stroke="#aac4ff" stroke-width="6"')}${P("M 600 230 L 870 330 C 870 620 760 820 600 930 Z", "#fff", 'opacity=".12"')}${P("M 440 590 L 560 710 L 780 460", "none", 'stroke="#fff" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"')}`,
  "operating-system": () => `${R(170, 230, 860, 640, 28, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${R(170, 230, 860, 80, 28, "url(#steelH)")}${C(230, 270, 13, "#ff5a52")}${C(275, 270, 13, "#ffd166")}${C(320, 270, 13, "#3ddb96")}${R(210, 350, 250, 480, 12, "#101827")}${[0, 1, 2, 3, 4].map((i) => R(232, 380 + i * 80, 206, 50, 10, i === 1 ? "url(#blue)" : "#1d2940")).join("")}${R(490, 350, 500, 190, 14, "url(#screen)")}${R(520, 380, 180, 20, 8, "url(#blue)")}${R(520, 420, 380, 12, 6, "#7f8fb3", 'opacity=".5"')}${[0, 1, 2, 3].map((i) => R(490 + i * 128, 570, 116, 116, 14, ["#2f6fed", "#3ddb96", "#ffd166", "#a78bfa"][i], 'opacity=".85"')).join("")}${R(490, 716, 500, 110, 14, "#101827")}`,
  "office-apps": () => `${R(300, 200, 540, 720, 26, "url(#paper)", 'transform="rotate(-6 570 560)"')}${R(360, 150, 540, 720, 26, "url(#paper)", 'stroke="#aab7cf" stroke-width="3"')}${R(420, 230, 300, 34, 10, "url(#blue)")}${R(420, 300, 400, 16, 8, "#8493ad")}${R(420, 335, 360, 16, 8, "#8493ad")}${R(420, 370, 390, 16, 8, "#8493ad")}${[0, 1, 2, 3, 4].map((i) => R(430 + i * 78, 640 - [120, 200, 150, 260, 210][i], 52, [120, 200, 150, 260, 210][i], 8, i === 3 ? "url(#red)" : "url(#blue)")).join("")}${L(420, 650, 830, 650, "#8493ad", 5)}${R(780, 680, 130, 130, 24, "url(#blue)")}${P("M 810 715 L 880 715 M 810 745 L 880 745 M 810 775 L 855 775", "none", 'stroke="#fff" stroke-width="12" stroke-linecap="round"')}`,
  "creative-apps": () => `${C(600, 600, 400, "url(#dark)", 'stroke="#46567a" stroke-width="5"')}${[["#ff5a52", -60], ["#ffd166", -10], ["#3ddb96", 40], ["#2f6fed", 90], ["#a78bfa", 140]].map(([c, a]) => `<g transform="rotate(${a} 600 600)">${C(600, 330, 62, c)}${C(585, 312, 18, "#fff", 'opacity=".3"')}</g>`).join("")}${P("M 470 880 L 800 440 L 860 485 L 530 925 Z", "url(#steelH)", 'stroke="#aab7cf" stroke-width="4"')}${P("M 800 440 L 860 485 L 905 425 C 925 395 890 355 855 375 Z", "url(#gold)")}${P("M 470 880 L 530 925 L 440 960 Z", "url(#blue)")}`,
  "game-keys": () => `${P("M 270 380 C 170 380 120 520 120 650 C 120 760 170 830 240 830 C 300 830 330 790 360 740 L 840 740 C 870 790 900 830 960 830 C 1030 830 1080 760 1080 650 C 1080 520 1030 380 930 380 Z", "url(#dark)", 'stroke="#46567a" stroke-width="6"')}${R(250, 520, 170, 54, 14, "url(#steel)")}${R(308, 462, 54, 170, 14, "url(#steel)")}${C(840, 500, 34, "url(#red)")}${C(920, 570, 34, "url(#blue)")}${C(760, 570, 34, "url(#gold)")}${C(840, 640, 34, "#3ddb96")}${C(480, 650, 58, "#0e1422", 'stroke="#46567a" stroke-width="5"')}${C(480, 650, 34, "url(#steel)")}${C(700, 650, 58, "#0e1422", 'stroke="#46567a" stroke-width="5"')}${C(700, 650, 34, "url(#steel)")}${R(520, 470, 160, 24, 12, "url(#steel)")}`,
  "vpn-tools": () => `${P("M 400 470 L 400 360 C 400 250 800 250 800 360 L 800 470", "none", 'stroke="url(#steel)" stroke-width="64" stroke-linecap="round"')}${R(290, 450, 620, 480, 60, "url(#blue)", 'stroke="#aac4ff" stroke-width="6"')}${C(600, 690, 160, "none", 'stroke="#fff" stroke-width="12" opacity=".75"')}${P("M 440 690 L 760 690 M 600 530 L 600 850", "none", 'stroke="#fff" stroke-width="12" opacity=".75"')}${P("M 600 530 C 520 600 520 780 600 850 C 680 780 680 600 600 530 Z", "none", 'stroke="#fff" stroke-width="12" opacity=".75"')}`,
};

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">${DEFS}<circle cx="600" cy="640" r="500" fill="url(#glow)"/><g filter="url(#sh)">${body}</g></svg>`;

let n = 0;
for (const [name, draw] of Object.entries(ART)) {
  await sharp(Buffer.from(wrap(draw()))).webp({ quality: 88, alphaQuality: 92, effort: 5 }).toFile(path.join(OUT, `${name}.webp`));
  n++;
}
console.log(`Wrote ${n} images to images/products/`);
