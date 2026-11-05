/* ==========================================================================
   Ovi's Fix — builder-logic.js
   The "brain" of the PC Builder, with no screen code in it:
     • selection helpers (what is chosen, share links, loading a pre-built PC)
     • compatibility rules (socket, RAM type, slots, case size, cooler, PSU)
     • estimated wattage and recommended PSU
     • CPU ↔ GPU balance ("bottleneck") estimate
   Numbers here are estimates. The wattage uses each part's real max power
   draw (Admin → Products → "Power draw"); the balance uses a relative
   performance score ("Performance score") entered for CPUs and graphics cards.
   ========================================================================== */

import { BUILDER_ROWS, rowOfSub } from "./catalog-schema.js";

export const ROW = Object.fromEntries(BUILDER_ROWS.map((r) => [r.key, r]));
export const REQUIRED_ROWS = BUILDER_ROWS.filter((r) => r.required).map((r) => r.key);

/* --------------------------------------------------------------- selection */
export const emptySelection = () => Object.fromEntries(BUILDER_ROWS.map((r) => [r.key, []]));

const spec = (p, k) => p?.specs?.[k];
const asArr = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v]);
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const first = (sel, key, byId) => {
  const it = sel[key]?.[0];
  return it ? byId.get(it.id) || null : null;
};
const listOf = (sel, key, byId) => (sel[key] || []).map((it) => ({ p: byId.get(it.id), qty: it.qty })).filter((x) => x.p);

/** Drop products that no longer exist and clamp row limits — keeps old saved builds from breaking. */
export function sanitizeSelection(sel, byId) {
  const out = emptySelection();
  for (const row of BUILDER_ROWS) {
    for (const it of (sel?.[row.key] || []).slice(0, row.max)) {
      const p = byId.get(it?.id);
      if (!p || !row.subs.includes(p.sub)) continue;
      out[row.key].push({ id: p.id, qty: Math.min(row.qty, Math.max(1, Math.floor(it.qty) || 1)) });
    }
  }
  return out;
}

export function flatten(sel, byId) {
  const out = [];
  for (const row of BUILDER_ROWS) for (const { p, qty } of listOf(sel, row.key, byId)) out.push({ row: row.key, p, qty });
  return out;
}

export function missingRequired(sel) {
  return REQUIRED_ROWS.filter((k) => !(sel[k] || []).length);
}

/** Pre-built PC → builder selection (each part goes to the row its category belongs to). */
export function selectionFromParts(parts, byId) {
  const sel = emptySelection();
  for (const { id, qty } of parts) {
    const p = byId.get(id);
    if (!p) continue;
    const row = rowOfSub(p.sub);
    if (!row) continue;
    const existing = sel[row.key].find((x) => x.id === id);
    if (existing) existing.qty = Math.min(row.qty, existing.qty + qty);
    else if (sel[row.key].length < row.max) sel[row.key].push({ id, qty: Math.min(row.qty, qty) });
  }
  return sel;
}

/* Share links: the whole build packed into one URL-safe string. */
export function encodeSelection(sel) {
  const compact = {};
  for (const [k, arr] of Object.entries(sel)) if (arr.length) compact[k] = arr.map((i) => (i.qty > 1 ? `${i.id}*${i.qty}` : i.id));
  const json = JSON.stringify(compact);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeSelection(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/"))));
    const compact = JSON.parse(json);
    const sel = emptySelection();
    for (const row of BUILDER_ROWS) {
      for (const token of compact[row.key] || []) {
        const [id, qty] = String(token).split("*");
        sel[row.key].push({ id, qty: Number(qty) || 1 });
      }
    }
    return sel;
  } catch (err) {
    return null;
  }
}

/* ------------------------------------------------------------------- watts */
const DEFAULT_W = { cpu: 95, cooler: 5, mobo: 45, ram: 5, storage: 5, fan: 2, keyboard: 1, mouse: 1, wifi: 3 };
const PSU_SIZES = [350, 450, 500, 550, 600, 650, 700, 750, 850, 1000, 1200, 1500];

export function recommendPsu(total) {
  const target = total * 1.3; // 30% headroom keeps the PSU in its efficient range and leaves room to upgrade
  return PSU_SIZES.find((s) => s >= target) || 1600;
}

export function estimateWatts(sel, byId) {
  const parts = [];
  let total = 0;
  for (const row of BUILDER_ROWS) {
    for (const { p, qty } of listOf(sel, row.key, byId)) {
      const w = (p.tdp ?? DEFAULT_W[row.key] ?? 0) * qty;
      if (w > 0) { parts.push({ row: row.key, name: p.name, w, qty }); total += w; }
    }
  }
  const overhead = parts.length ? 30 : 0; // USB devices, fans on the board, conversion losses
  total += overhead;
  return { total: Math.round(total), parts, overhead, recommended: parts.length ? recommendPsu(total) : 0 };
}

/* ------------------------------------------------------------ compatibility */
const ramSticks = (rams) => rams.reduce((s, { p, qty }) => s + (num(spec(p, "ramSticks")) || 1) * qty, 0);
const ramGB = (rams) => rams.reduce((s, { p, qty }) => s + num(spec(p, "ramSize")) * qty, 0);
const isNvme = (p) => /nvme|m\.2/i.test(String(spec(p, "formFactor") || ""));

/** Whole-build checks. Each issue: { level: "error"|"warn"|"info", rows: [...], text: {en, bn} } */
export function checkBuild(sel, byId) {
  const issues = [];
  const add = (level, rows, en, bn) => issues.push({ level, rows, text: { en, bn } });
  const cpu = first(sel, "cpu", byId), mobo = first(sel, "mobo", byId), cooler = first(sel, "cooler", byId);
  const gpu = first(sel, "gpu", byId), psu = first(sel, "psu", byId), cs = first(sel, "case", byId);
  const rams = listOf(sel, "ram", byId), stores = listOf(sel, "storage", byId);
  const watts = estimateWatts(sel, byId);

  if (cpu && mobo && spec(cpu, "socket") && spec(mobo, "socket") && spec(cpu, "socket") !== spec(mobo, "socket")) {
    add("error", ["cpu", "mobo"], `The CPU socket (${spec(cpu, "socket")}) does not match the motherboard socket (${spec(mobo, "socket")}).`, `CPU সকেট (${spec(cpu, "socket")}) মাদারবোর্ডের সকেটের (${spec(mobo, "socket")}) সাথে মেলে না।`);
  }
  if (cpu && mobo && cpu.brand && platformOfBoard(mobo) && cpu.brand !== platformOfBoard(mobo)) {
    add("error", ["cpu", "mobo"], `A ${cpu.brand} processor does not fit an ${platformOfBoard(mobo)} motherboard.`, `${cpu.brand} প্রসেসর ${platformOfBoard(mobo)} মাদারবোর্ডে লাগে না।`);
  }
  if (mobo && spec(mobo, "memType")) {
    for (const { p } of rams) {
      if (spec(p, "ramType") && spec(p, "ramType") !== spec(mobo, "memType")) {
        add("error", ["ram", "mobo"], `The RAM is ${spec(p, "ramType")} but this motherboard only takes ${spec(mobo, "memType")}.`, `RAM ${spec(p, "ramType")}, কিন্তু এই মাদারবোর্ড শুধু ${spec(mobo, "memType")} সাপোর্ট করে।`);
        break;
      }
    }
  }
  if (mobo && rams.length) {
    const slots = num(spec(mobo, "ramSlots"));
    const sticks = ramSticks(rams);
    if (slots && sticks > slots) add("error", ["ram", "mobo"], `You added ${sticks} RAM sticks but the motherboard has only ${slots} RAM slots.`, `আপনি ${sticks}টি RAM স্টিক নিয়েছেন, কিন্তু মাদারবোর্ডে মাত্র ${slots}টি স্লট আছে।`);
    else if (sticks === 1 && slots >= 2) add("info", ["ram"], "A single RAM stick runs in single-channel mode. Two matching sticks are noticeably faster in games and editing.", "একটি RAM স্টিকে single-channel মোডে চলে। দুটি একই RAM স্টিক গেমিং ও এডিটিংয়ে বেশ দ্রুত।");
  }
  if (mobo && cs) {
    const sup = asArr(spec(cs, "boardSupport"));
    if (sup.length && spec(mobo, "formFactor") && !sup.includes(spec(mobo, "formFactor"))) {
      add("error", ["mobo", "case"], `A ${spec(mobo, "formFactor")} motherboard will not fit this case (it supports ${sup.join(", ")}).`, `${spec(mobo, "formFactor")} মাদারবোর্ড এই কেসে লাগবে না (সাপোর্ট করে: ${sup.join(", ")})।`);
    }
  }
  if (cpu && cooler) {
    const socks = asArr(spec(cooler, "socket"));
    if (socks.length && spec(cpu, "socket") && !socks.includes(spec(cpu, "socket"))) {
      add("error", ["cpu", "cooler"], `This cooler does not list ${spec(cpu, "socket")} support.`, `এই কুলার ${spec(cpu, "socket")} সকেট সাপোর্টের তালিকায় নেই।`);
    }
  }
  if (cpu && !cooler && !asArr(spec(cpu, "features")).includes("Cooler Included")) {
    add("warn", ["cooler"], "This CPU does not come with a cooler. Add a CPU cooler.", "এই CPU-র সাথে কুলার আসে না। একটি CPU কুলার যোগ করুন।");
  }
  if (cpu && !gpu && !asArr(spec(cpu, "features")).includes("Integrated Graphics")) {
    add("warn", ["gpu"], "This CPU has no built-in graphics. Add a graphics card or the PC will have no display output.", "এই CPU-তে বিল্ট-ইন গ্রাফিক্স নেই। গ্রাফিক্স কার্ড যোগ না করলে ডিসপ্লে আউটপুট পাবেন না।");
  }
  if (psu && watts.total) {
    const w = num(spec(psu, "watts"));
    if (w && w < watts.total) add("error", ["psu"], `The power supply (${w}W) is below the estimated load (${watts.total}W).`, `পাওয়ার সাপ্লাই (${w}W) আনুমানিক লোডের (${watts.total}W) চেয়ে ছোট।`);
    else if (w && w < watts.recommended) add("warn", ["psu"], `Estimated load is ${watts.total}W. A ${watts.recommended}W or larger power supply is recommended for headroom.`, `আনুমানিক লোড ${watts.total}W। নিরাপদ হেডরুমের জন্য ${watts.recommended}W বা বড় পাওয়ার সাপ্লাই সুপারিশ করা হয়।`);
    if (gpu && num(spec(gpu, "recPsu")) > w && w >= watts.total) add("warn", ["gpu", "psu"], `This graphics card recommends a ${num(spec(gpu, "recPsu"))}W power supply.`, `এই গ্রাফিক্স কার্ডের জন্য ${num(spec(gpu, "recPsu"))}W পাওয়ার সাপ্লাই সুপারিশ করা হয়।`);
  } else if (!psu && cpu && mobo && !(cs && spec(cs, "powerSupply") === "Included")) {
    add("warn", ["psu"], "No power supply selected yet. The PC cannot run without one.", "এখনো পাওয়ার সাপ্লাই বাছাই করা হয়নি। এটি ছাড়া পিসি চলবে না।");
  }
  if (psu && cs && spec(cs, "powerSupply") === "Included") {
    add("info", ["psu", "case"], "This case already includes a power supply. You may not need to buy another.", "এই কেসের সাথে পাওয়ার সাপ্লাই আছে। আলাদা পাওয়ার সাপ্লাই না-ও লাগতে পারে।");
  }
  if (stores.length && stores.every(({ p }) => p.sub === "hdd")) {
    add("warn", ["storage"], "Only a hard disk is selected. Add an SSD for fast start-up and apps.", "শুধু হার্ড ডিস্ক নেওয়া হয়েছে। দ্রুত স্টার্টআপ ও অ্যাপের জন্য একটি SSD যোগ করুন।");
  }
  if (mobo && stores.some(({ p }) => isNvme(p)) && asArr(spec(mobo, "mbFeatures")).length && !asArr(spec(mobo, "mbFeatures")).includes("M.2 NVMe")) {
    add("warn", ["storage", "mobo"], "This motherboard does not list an M.2 NVMe slot.", "এই মাদারবোর্ডে M.2 NVMe স্লট তালিকাভুক্ত নেই।");
  }
  const order = { error: 0, warn: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

/* ----------------------------------------------- motherboard-first fitting */
/* The motherboard is the first choice. From then on every list shows ONLY parts that fit it:
     CPU     → same socket AND same platform (an Intel board never shows AMD processors)
     RAM     → same memory type (DDR4 / DDR5), enough free slots, within the board's max memory
     Cooler  → supports the board's socket
     Casing  → takes the board's size (ATX / Micro-ATX / Mini-ITX)
     Storage → M.2 NVMe drives only if the board lists an M.2 NVMe slot                       */
export const BOARD_FILTERED_ROWS = ["cpu", "cooler", "ram", "case", "storage"];

export const platformOfBoard = (board) => {
  const t = spec(board, "processorType");
  if (t) return String(t);
  const sock = String(spec(board, "socket") || "");
  return /^AM/i.test(sock) ? "AMD" : /^LGA/i.test(sock) ? "Intel" : "";
};

/** Short facts to show above a chooser, e.g. [{k:"Socket", v:"AM5"}, {k:"Platform", v:"AMD"}]. */
export function boardFit(rowKey, board) {
  if (!board) return [];
  const out = [];
  const add = (k, v) => { if (v !== "" && v !== undefined && v !== null) out.push({ k, v: String(v) }); };
  if (rowKey === "cpu") { add("Socket", spec(board, "socket")); add("Platform", platformOfBoard(board)); }
  if (rowKey === "cooler") add("Socket", spec(board, "socket"));
  if (rowKey === "ram") { add("Memory Type", spec(board, "memType")); add("RAM Slots", spec(board, "ramSlots")); if (spec(board, "maxMem")) add("Max Memory", `${num(spec(board, "maxMem"))} GB`); }
  if (rowKey === "case") add("Form Factor", spec(board, "formFactor"));
  if (rowKey === "storage") { const f = asArr(spec(board, "mbFeatures")); if (f.length) add("M.2 NVMe", f.includes("M.2 NVMe") ? "Yes" : "No"); }
  return out;
}

/** Does product `p` fit into builder row `rowKey` given the current selection? (used by the chooser) */
export function productCompat(rowKey, p, sel, byId) {
  const bad = (en, bn) => ({ ok: false, reason: { en, bn } });
  const board = first(sel, "mobo", byId), cpu = first(sel, "cpu", byId), cooler = first(sel, "cooler", byId), cs = first(sel, "case", byId), psu = first(sel, "psu", byId);
  const rams = listOf(sel, "ram", byId);
  const ps = p.specs || {};

  if (ROW[rowKey]?.needsBoard && !board) return bad("Choose a motherboard first", "আগে মাদারবোর্ড বাছাই করুন");

  if (rowKey === "cpu") {
    const sock = spec(board, "socket");
    if (!ps.socket || (sock && ps.socket !== sock)) return bad(`Needs a ${ps.socket || "different"} board — yours is ${sock}`, `${ps.socket || "অন্য"} বোর্ড লাগবে — আপনারটি ${sock}`);
    const plat = platformOfBoard(board);
    if (plat && p.brand && p.brand !== plat) return bad(`${p.brand} processors do not fit an ${plat} motherboard`, `${p.brand} প্রসেসর ${plat} মাদারবোর্ডে লাগে না`);
    const socks = cooler ? asArr(spec(cooler, "socket")) : [];
    if (socks.length && !socks.includes(ps.socket)) return bad(`Your cooler does not support ${ps.socket}`, `আপনার কুলার ${ps.socket} সাপোর্ট করে না`);
  }
  if (rowKey === "ram") {
    const mt = spec(board, "memType");
    if (mt && ps.ramType !== mt) return bad(`Your board takes ${mt}, not ${ps.ramType || "this type"}`, `আপনার বোর্ড ${mt} সাপোর্ট করে, ${ps.ramType || "এই টাইপ"} নয়`);
    const slots = num(spec(board, "ramSlots"));
    if (slots && ramSticks(rams) + (num(ps.ramSticks) || 1) > slots) return bad("No free RAM slot left on your board", "আপনার বোর্ডে ফাঁকা RAM স্লট নেই");
    const maxMem = num(spec(board, "maxMem"));
    if (maxMem && ramGB(rams) + num(ps.ramSize) > maxMem) return bad(`Goes over the board's ${maxMem} GB memory limit`, `বোর্ডের ${maxMem} GB মেমোরি সীমা পেরিয়ে যায়`);
  }
  if (rowKey === "cooler") {
    const socks = asArr(ps.socket);
    const target = spec(cpu, "socket") || spec(board, "socket");
    if (!socks.length) return { ok: true, warn: { en: "Socket support not listed — please check with us", bn: "সকেট সাপোর্ট উল্লেখ নেই — আমাদের কাছ থেকে জেনে নিন" } };
    if (target && !socks.includes(target)) return bad(`Does not support ${target}`, `${target} সাপোর্ট করে না`);
  }
  if (rowKey === "case") {
    const sup = asArr(ps.boardSupport), ff = spec(board, "formFactor");
    if (!sup.length) return { ok: true, warn: { en: "Board sizes not listed — please check with us", bn: "বোর্ডের সাইজ উল্লেখ নেই — আমাদের কাছ থেকে জেনে নিন" } };
    if (ff && !sup.includes(ff)) return bad(`Your ${ff} board will not fit`, `আপনার ${ff} বোর্ড লাগবে না`);
  }
  if (rowKey === "storage" && board && isNvme(p)) {
    const f = asArr(spec(board, "mbFeatures"));
    if (f.length && !f.includes("M.2 NVMe")) return bad("Your board has no M.2 NVMe slot", "আপনার বোর্ডে M.2 NVMe স্লট নেই");
  }
  if (rowKey === "mobo") {
    // Picking a different board is always allowed; parts that no longer fit are removed afterwards.
    const clash = conflictsWithBoard(p, sel, byId);
    if (clash.length) {
      const names = [...new Set(clash.map((c) => ROW[c.row].label.en))].join(", ");
      return { ok: true, warn: { en: `Will remove parts that don't fit: ${names}`, bn: `মানানসই নয় এমন পার্টস সরানো হবে: ${names}` } };
    }
  }
  if (rowKey === "psu") {
    const est = estimateWatts(sel, byId).total;
    const w = num(ps.watts);
    if (est && w && w < est) return bad(`Too small for your parts (about ${est}W needed)`, `আপনার পার্টসের জন্য ছোট (প্রায় ${est}W লাগবে)`);
    if (est && w && w < recommendPsu(est)) return { ok: true, warn: { en: `Tight: ${recommendPsu(est)}W+ recommended`, bn: `সীমিত: ${recommendPsu(est)}W+ সুপারিশকৃত` } };
  }
  if (rowKey === "gpu" && psu && num(ps.recPsu) && num(spec(psu, "watts")) && num(ps.recPsu) > num(spec(psu, "watts"))) {
    return { ok: true, warn: { en: `Recommends a ${num(ps.recPsu)}W PSU — yours is ${num(spec(psu, "watts"))}W`, bn: `${num(ps.recPsu)}W PSU সুপারিশ করা হয় — আপনারটি ${num(spec(psu, "watts"))}W` } };
  }
  return { ok: true };
}

/** Parts already chosen that would NOT fit if `board` became the motherboard. */
export function conflictsWithBoard(board, sel, byId) {
  const only = emptySelection();
  only.mobo = [{ id: board.id, qty: 1 }];
  const out = [];
  for (const rowKey of BOARD_FILTERED_ROWS) {
    sel[rowKey]?.forEach((it, index) => {
      const p = byId.get(it.id);
      if (p && !productCompat(rowKey, p, only, byId).ok) out.push({ row: rowKey, index, p });
    });
  }
  const slots = num(spec(board, "ramSlots"));
  if (slots && ramSticks(listOf(sel, "ram", byId)) > slots && !out.some((c) => c.row === "ram")) {
    const last = (sel.ram || []).length - 1;
    if (last >= 0) out.push({ row: "ram", index: last, p: byId.get(sel.ram[last].id) });
  }
  return out;
}

/** Remove the parts that don't fit `board`. Returns { sel, removed: [{row, p}] } (the input is not modified). */
export function pruneForBoard(sel, board, byId) {
  const next = JSON.parse(JSON.stringify(sel));
  const removed = [];
  const clash = conflictsWithBoard(board, sel, byId);
  for (const rowKey of BOARD_FILTERED_ROWS) {
    const drop = new Set(clash.filter((c) => c.row === rowKey).map((c) => c.index));
    if (!drop.size) continue;
    removed.push(...[...drop].map((i) => ({ row: rowKey, p: byId.get(sel[rowKey][i].id) })));
    next[rowKey] = sel[rowKey].filter((_, i) => !drop.has(i));
  }
  return { sel: next, removed };
}

/* ------------------------------------------------- CPU ↔ GPU balance (bottleneck) */
/* Scores are on a relative gaming scale: Ryzen 5 5600 = 100 for CPUs, RTX 4060 = 100 for GPUs.
   A pair is "balanced" when the CPU can keep the GPU busy at the chosen workload. */
export const USE_CASES = {
  "gaming-1080": { k: 1.0, label: { en: "Gaming at 1080p", bn: "1080p গেমিং" } },
  "gaming-1440": { k: 0.8, label: { en: "Gaming at 1440p", bn: "1440p গেমিং" } },
  "gaming-4k": { k: 0.6, label: { en: "Gaming at 4K", bn: "4K গেমিং" } },
  creator: { k: 1.3, label: { en: "Video editing & 3D", bn: "ভিডিও এডিটিং ও থ্রিডি" } },
};

export function cpuScore(p) {
  if (!p) return 0;
  if (p.perf) return p.perf;
  return Math.round((num(spec(p, "cores")) || 4) * 5 + (num(spec(p, "clock")) || 3.5) * 14 + 20); // rough fallback when no score is entered
}
export function gpuScore(p) {
  if (!p) return 0;
  if (p.perf) return p.perf;
  return Math.round((p.tdp || 75) * 0.75); // rough fallback: bigger power draw ≈ bigger card
}

export function analyzeBalance(sel, byId, useCase = "gaming-1080") {
  const cpu = first(sel, "cpu", byId), gpu = first(sel, "gpu", byId);
  if (!cpu) return { state: "none" };
  const uc = USE_CASES[useCase] || USE_CASES["gaming-1080"];
  const rams = listOf(sel, "ram", byId);
  const notes = [];
  let memFactor = 1;
  if (rams.length && ramSticks(rams) === 1) { memFactor *= 0.92; notes.push("single-channel"); }
  if (rams.length && ramGB(rams) < 16) { memFactor *= 0.95; notes.push("low-ram"); }
  if (!gpu) {
    const hasIgpu = asArr(spec(cpu, "features")).includes("Integrated Graphics") || cpu.igpu > 0;
    return { state: "igpu", hasIgpu, notes };
  }
  const c = cpuScore(cpu) * memFactor, g = gpuScore(gpu), need = g * uc.k;
  const ratio = c / need;
  if (ratio < 1) {
    const pct = Math.round((1 - ratio) * 100);
    const state = pct < 8 ? "balanced" : pct < 20 ? "mild" : pct < 35 ? "moderate" : "severe";
    return { state, side: "cpu", pct, value: -Math.min(100, pct), cpu: Math.round(c), gpu: g, need: Math.round(need), notes };
  }
  const head = Math.round((1 - 1 / ratio) * 100);
  return { state: head < 35 ? "balanced" : "gpu-limited", side: "gpu", pct: head, value: Math.min(100, head), cpu: Math.round(c), gpu: g, need: Math.round(need), notes };
}
