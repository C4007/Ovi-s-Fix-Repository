/* ==========================================================================
   Ovi's Fix — assistant-core.js
   The shared "brain" of the AI PC assistant. No screen code, no network code,
   so the SAME file runs in the browser and on the server (lib/assistant.js).

   What it does
     • turns the shop's live product list into a short catalogue the AI can read
       (only parts that are In stock or can be pre-ordered are offered)
     • checks any build with the PC Builder's own rules: compatibility, wattage
       and the CPU ↔ GPU balance ("bottleneck") from builder-logic.js
     • has its own planner that builds a PC from a budget and a use case with those
       same rules — used when the AI is busy, out of free quota, or not set up
   ========================================================================== */

import { BUILDER_ROWS, SUBS } from "./catalog-schema.js";
import {
  ROW, emptySelection, sanitizeSelection, flatten, missingRequired, estimateWatts, checkBuild, analyzeBalance,
  productCompat, platformOfBoard, recommendPsu, USE_CASES,
} from "./builder-logic.js";

/** Rows the assistant may fill, in the order a build is made (motherboard first). */
export const AI_ROWS = ["mobo", "cpu", "cooler", "ram", "storage", "gpu", "psu", "case", "os", "antivirus", "monitor", "keyboard", "mouse"];
const spec = (p, k) => p?.specs?.[k];
const asArr = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v]);
const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };

/* ----------------------------------------------------------------- prices / stock */
export const unitPrice = (p) => (p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price);
/** A part the assistant may use: we hold it or can order it, and it has a real price. */
export const usable = (p) => (p.stock === "in" || p.stock === "pre") && unitPrice(p) > 0;
const stockRank = (p) => (p.stock === "in" ? 0 : 1);

export function totalOf(sel, byId) {
  return flatten(sel, byId).reduce((s, x) => s + unitPrice(x.p) * x.qty, 0);
}

/* ------------------------------------------------------------- catalogue for the AI */
const shortSpecs = (row, p) => {
  const f = (k) => asArr(spec(p, k)).join("/");
  switch (row) {
    case "mobo": return `${f("socket")} ${f("memType")} ${f("formFactor")} slots${f("ramSlots")} max${f("maxMem")}GB ${asArr(spec(p, "mbFeatures")).includes("M.2 NVMe") ? "M2" : "noM2"}${asArr(spec(p, "mbFeatures")).includes("Wi-Fi") ? " wifi" : ""}`;
    case "cpu": return `${f("socket")} ${f("cores")}c perf${p.perf || "?"} ${p.tdp || "?"}W${p.igpu > 0 || asArr(spec(p, "features")).includes("Integrated Graphics") ? " iGPU" : " noGPU"}${asArr(spec(p, "features")).includes("Cooler Included") ? " cooler-in-box" : ""}`;
    case "cooler": return `${f("coolerType")} ${f("socket")}`;
    case "ram": return `${f("ramType")} ${f("ramSize")}GB x${f("ramSticks") || 1} ${f("ramSpeed")}`;
    case "storage": return `${p.sub} ${f("ssdCapacity") || f("hddCapacity")} ${f("formFactor")}`;
    case "gpu": return `${f("chipset")} ${f("memSize")}GB perf${p.perf || "?"} ${p.tdp || "?"}W psu${f("recPsu")}W`;
    case "psu": return `${f("watts")}W ${f("efficiency")} ${f("modular")}`;
    case "case": return `${f("boardSupport")}${spec(p, "powerSupply") === "Included" ? " psu-included" : ""}`;
    case "os": return `${f("edition")} ${f("licenseType")}`;
    case "antivirus": return `${f("devices")}dev ${f("validity")}`;
    case "monitor": return `${f("screenSize")}in ${f("resolution")} ${f("refreshRate")}Hz`;
    default: return "";
  }
};

/** One short line per part: id|row|name|price|IN or PRE|specs. */
export function catalogForAI(products) {
  const lines = [];
  for (const row of AI_ROWS) {
    const subs = ROW[row].subs;
    for (const p of products.filter((x) => subs.includes(x.sub) && usable(x)).sort((a, b) => stockRank(a) - stockRank(b) || unitPrice(a) - unitPrice(b))) {
      lines.push(`${p.id}|${row}|${p.name.slice(0, 70)}|${unitPrice(p)}|${p.stock === "in" ? "IN" : "PRE"}|${shortSpecs(row, p)}`);
    }
  }
  return lines.join("\n");
}

/* --------------------------------------------------------------- check one build */
/** Everything the PC Builder would say about this build, in one plain object. */
export function evaluate(sel, byId, useCase = "gaming-1080") {
  const issues = checkBuild(sel, byId);
  const items = flatten(sel, byId);
  const unavailable = items.filter((x) => !usable(x.p)).map((x) => x.p.id);
  return {
    errors: issues.filter((i) => i.level === "error"),
    warnings: issues.filter((i) => i.level === "warn"),
    missing: missingRequired(sel),
    watts: estimateWatts(sel, byId),
    balance: analyzeBalance(sel, byId, useCase),
    total: totalOf(sel, byId),
    unavailable,
  };
}

/** Problems short enough to hand back to the AI so it can fix them. */
export function problemsOf(ev, budget = 0) {
  const out = [];
  if (budget && ev.total > budget * 1.02) out.push(`The total is ৳${ev.total} but the budget is ৳${budget}. Choose cheaper parts so the total is at or below the budget`);
  for (const e of ev.errors) out.push(e.text.en);
  for (const k of ev.missing) out.push(`Missing required part: ${ROW[k].label.en}`);
  for (const id of ev.unavailable) out.push(`${id} is not available`);
  if (["moderate", "severe"].includes(ev.balance.state)) out.push(`CPU/GPU balance is poor: the CPU holds the graphics card back by about ${ev.balance.pct}%`);
  return out;
}

/** Turn the AI's answer ({row: [{id, qty}]}) into a safe selection. Unknown ids and wrong rows are dropped. */
export function selectionFromPicks(picks, byId) {
  const raw = emptySelection();
  for (const [row, list] of Object.entries(picks || {})) {
    if (!ROW[row] || !Array.isArray(list)) continue;
    for (const it of list.slice(0, 4)) {
      const id = typeof it === "string" ? it : it?.id;
      const qty = typeof it === "object" ? Number(it?.qty) || 1 : 1;
      if (typeof id === "string" && raw[row]) raw[row].push({ id, qty });
    }
  }
  return sanitizeSelection(raw, byId);
}

/* --------------------------------------------------------- reading the request */
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const ascii = (s) => String(s || "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** "80k", "80,000", "1.2 lakh", "১,২০,০০০" → 80000 … (returns 0 if no budget is found). */
export function parseBudget(text) {
  const t = ascii(text).toLowerCase();
  let best = 0;
  for (const m of t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lac|lakhs|লাখ|হাজার|thousand|tk|taka|bdt|৳)?/g)) {
    let n = parseFloat(m[1].replace(/,/g, ""));
    const unit = m[2] || "";
    if (/^(k|thousand|হাজার)$/.test(unit)) n *= 1000;
    else if (/^(lakh|lac|lakhs|লাখ)$/.test(unit)) n *= 100000;
    if (n >= 15000 && n <= 3000000 && n > best) best = n;
  }
  return Math.round(best);
}

export function detectUseCase(text, fallback = "gaming-1080") {
  const t = ascii(text).toLowerCase();
  if (/4k|2160/.test(t)) return "gaming-4k";
  if (/1440|2k|qhd/.test(t)) return "gaming-1440";
  if (/video|edit|render|3d|premiere|blender|davinci|creator|animation|design|ভিডিও|এডিট|ডিজাইন/.test(t)) return "creator";
  if (/gam|fps|valorant|pubg|fortnite|cs2|gta|গেম/.test(t)) return "gaming-1080";
  return fallback;
}
export const wantsOffice = (text) => /office|study|student|browsing|class|school|accounts|everyday|অফিস|পড়া|ব্রাউজ/.test(ascii(text).toLowerCase()) && !/gam|game|গেম/.test(ascii(text).toLowerCase());
const wantsOs = (text) => /windows|\bos\b|operating|licen[cs]e|উইন্ডোজ/.test(ascii(text).toLowerCase());
const wantsAv = (text) => /antivirus|anti-virus|security|অ্যান্টি/.test(ascii(text).toLowerCase());

/* ============================================================== the local planner */
const cheapest = (list) => list.slice().sort((a, b) => stockRank(a) - stockRank(b) || unitPrice(a) - unitPrice(b))[0] || null;
const capGB = (p) => { const c = String(spec(p, "ssdCapacity") || spec(p, "hddCapacity") || spec(p, "capacity") || ""); const n = num(c); return /tb/i.test(c) ? n * 1000 : n; };
const hasIgpu = (p) => p.igpu > 0 || asArr(spec(p, "features")).includes("Integrated Graphics");

/**
 * Build a PC for a budget, using only parts we can supply, the builder's compatibility rules,
 * and the CPU ↔ GPU balance for the chosen use case.
 * Returns { sel, ev, why } or { sel: null, why } when the budget is too small.
 */
export function planBuild({ products, budget, useCase = "gaming-1080", office = false, os = false, antivirus = false }) {
  const list = products.filter(usable);
  const byId = new Map(products.map((p) => [p.id, p]));
  const pick = (row) => list.filter((p) => ROW[row].subs.includes(p.sub));
  const cpus = pick("cpu"), gpus = pick("gpu"), boards = pick("mobo"), rams = pick("ram"), stores = pick("storage"), cases = pick("case"), psus = pick("psu"), coolers = pick("cooler");
  const ramTarget = useCase === "creator" && budget >= 90000 ? 32 : office || budget < 50000 ? 8 : 16;
  const storeTarget = useCase === "creator" && budget >= 100000 ? 1000 : budget < 60000 ? 250 : 500;
  const gpuOptions = office ? [null] : [null, ...gpus];
  let best = null;

  for (const cpu of cpus) {
    if (!gpuOptions.includes(null) && !hasIgpu(cpu)) continue;
    const socket = spec(cpu, "socket");
    const boardChoices = boards.filter((b) => spec(b, "socket") === socket && (!platformOfBoard(b) || platformOfBoard(b) === cpu.brand))
      .sort((a, b) => stockRank(a) - stockRank(b) || unitPrice(a) - unitPrice(b)).slice(0, 3);
    for (const board of boardChoices) {
      const base = emptySelection();
      base.mobo = [{ id: board.id, qty: 1 }];
      base.cpu = [{ id: cpu.id, qty: 1 }];
      const memType = spec(board, "memType");
      // Two matching sticks (dual channel) are faster, so a 2-stick kit comes first; a single stick only if there is no kit.
      const okRam = (r, gb) => spec(r, "ramType") === memType && num(spec(r, "ramSize")) >= gb && productCompat("ram", r, base, byId).ok;
      const dual = !office && budget >= 60000; // on a tight budget the cheapest enough RAM wins
      const ramFallback = (dual && cheapest(rams.filter((r) => okRam(r, ramTarget) && num(spec(r, "ramSticks")) >= 2)))
        || cheapest(rams.filter((r) => okRam(r, ramTarget))) || cheapest(rams.filter((r) => okRam(r, 8)));
      if (!ramFallback) continue;
      const ssds = stores.filter((s) => s.sub === "ssd" && capGB(s) >= storeTarget && productCompat("storage", s, base, byId).ok);
      const store = cheapest(ssds) || cheapest(stores.filter((s) => s.sub === "ssd" && productCompat("storage", s, base, byId).ok));
      if (!store) continue;
      const csSeparate = cheapest(cases.filter((c) => productCompat("case", c, base, byId).ok && spec(c, "powerSupply") !== "Included"));
      const csWithPsu = cheapest(cases.filter((c) => productCompat("case", c, base, byId).ok && spec(c, "powerSupply") === "Included"));
      if (!csSeparate && !csWithPsu) continue;
      const needsCooler = !asArr(spec(cpu, "features")).includes("Cooler Included");
      const cooler = needsCooler ? cheapest(coolers.filter((c) => productCompat("cooler", c, base, byId).ok && (cpu.tdp < 150 || unitPrice(c) >= 2600))) : null;
      if (needsCooler && !cooler) continue;
      for (const gpu of gpuOptions) {
        if (!gpu && !hasIgpu(cpu)) continue;
        // Two ways to power the PC: a separate power supply, or (small PCs only) a case that already includes one.
        for (const mode of ["separate", "included"]) {
          const cs = mode === "separate" ? csSeparate : csWithPsu;
          if (!cs) continue;
          const sel = JSON.parse(JSON.stringify(base));
          sel.ram = [{ id: ramFallback.id, qty: 1 }];
          sel.storage = [{ id: store.id, qty: 1 }];
          sel.case = [{ id: cs.id, qty: 1 }];
          if (cooler) sel.cooler = [{ id: cooler.id, qty: 1 }];
          if (gpu) sel.gpu = [{ id: gpu.id, qty: 1 }];
          const est = estimateWatts(sel, byId);
          if (mode === "included") {
            if (gpu || est.total > 190) continue; // a bundled power supply is only enough for a small office PC
          } else {
            // big enough for the estimated load AND the graphics card's own advice
            const psu = cheapest(psus.filter((p) => num(spec(p, "watts")) >= Math.max(est.recommended, num(spec(gpu, "recPsu")))));
            if (!psu) continue;
            sel.psu = [{ id: psu.id, qty: 1 }];
          }
          let cost = totalOf(sel, byId);
          if (os) { const o = cheapest(pick("os").filter((p) => spec(p, "edition") === "Home")) || cheapest(pick("os")); if (o) { sel.os = [{ id: o.id, qty: 1 }]; cost += unitPrice(o); } }
          if (antivirus) { const a = cheapest(pick("antivirus").filter((p) => num(spec(p, "devices")) <= 3)); if (a) { sel.antivirus = [{ id: a.id, qty: 1 }]; cost += unitPrice(a); } }
          if (cost > budget) continue;
          const ev = evaluate(sel, byId, useCase);
          if (ev.errors.length || ev.missing.length) continue;
          const bal = ev.balance;
          const penalty = bal.state === "severe" ? 80 : bal.state === "moderate" ? 45 : bal.state === "mild" ? 12 : 0;
          const inStockBonus = flatten(sel, byId).filter((x) => x.p.stock === "in").length * 0.5;
          // Score = how fast the PC really is. A game is limited by the slower of CPU and GPU (the same idea as the
          // builder's balance meter), so a stronger CPU than the GPU needs is wasted money and scores nothing extra.
          let perf;
          if (office || !gpu) perf = Math.min(cpu.perf || 60, 110) * 0.5;
          else if (useCase === "creator") perf = 0.55 * (bal.cpu || 0) + 0.45 * (bal.gpu || 0);
          else perf = Math.min(bal.cpu || 0, bal.need || 0) + 0.05 * ((bal.cpu || 0) + (bal.need || 0));
          const score = perf - penalty + inStockBonus - (cost / budget) * (office ? 30 : 6);
          if (!best || score > best.score) best = { score, sel, ev, cost };
        }
      }
    }
  }
  if (!best) return { sel: null, why: "budget" };

  // Spend what is left: more storage first, then more RAM.
  let { sel } = best;
  const upgrade = (row, candidates, better) => {
    const cur = byId.get(sel[row][0].id);
    let leftover = budget - totalOf(sel, byId);
    const opts = candidates.filter((c) => c.id !== cur.id && better(c, cur) && unitPrice(c) - unitPrice(cur) <= leftover && productCompat(row, c, { ...sel, [row]: [] }, byId).ok)
      .sort((a, b) => unitPrice(b) - unitPrice(a));
    if (opts[0]) { const trial = JSON.parse(JSON.stringify(sel)); trial[row] = [{ id: opts[0].id, qty: 1 }]; if (!evaluate(trial, byId, useCase).errors.length) sel = trial; }
  };
  upgrade("storage", stores.filter((s) => s.sub === "ssd"), (c, cur) => capGB(c) > capGB(cur) && capGB(c) <= 2000);
  upgrade("ram", rams, (c, cur) => num(spec(c, "ramSize")) > num(spec(cur, "ramSize")) && num(spec(c, "ramSize")) <= 32 && spec(c, "ramType") === spec(cur, "ramType"));
  return { sel, ev: evaluate(sel, byId, useCase), why: "ok" };
}

/* ---------------------------------------------------------- plain-language reply */
const fmt = (n) => "৳" + Math.round(n).toLocaleString("en-US");
export function describePlan({ sel, ev }, byId, lang = "en", useCase = "gaming-1080", budget = 0) {
  const cpu = byId.get(sel.cpu?.[0]?.id), gpu = byId.get(sel.gpu?.[0]?.id);
  const uc = USE_CASES[useCase]?.label?.[lang] || USE_CASES[useCase]?.label?.en || "";
  const pre = flatten(sel, byId).filter((x) => x.p.stock !== "in").length;
  const b = ev.balance;
  const bal = lang === "bn"
    ? (b.state === "balanced" || b.state === "gpu-limited" ? `${uc}-এর জন্য CPU ও GPU ভালোভাবে মানানসই।` : b.state === "igpu" ? "এটি বিল্ট-ইন গ্রাফিক্সে চলবে।" : `CPU গ্রাফিক্স কার্ডকে প্রায় ${b.pct}% পিছিয়ে রাখতে পারে।`)
    : (b.state === "balanced" || b.state === "gpu-limited" ? `The CPU and graphics card are well matched for ${uc.toLowerCase()}.` : b.state === "igpu" ? "This one uses the CPU's built-in graphics." : `The CPU may hold the graphics card back by about ${b.pct}%.`);
  const bundled = !sel.psu?.length;
  if (lang === "bn") {
    return `${budget ? `${fmt(budget)} বাজেটে ` : ""}${cpu?.name || "CPU"}${gpu ? ` ও ${gpu.name}` : ""} দিয়ে একটি বিল্ড সাজিয়েছি। মোট ${fmt(ev.total)}। ${bal} ${bundled ? `আনুমানিক ${ev.watts.total}W — কেসের সাথে আসা পাওয়ার সাপ্লাইই এই হালকা পিসির জন্য যথেষ্ট।` : `আনুমানিক ${ev.watts.total}W, তাই ${ev.watts.recommended}W বা বড় পাওয়ার সাপ্লাই ঠিক আছে।`}${pre ? ` ${pre}টি পার্ট প্রি-অর্ডার লাগবে।` : " সব পার্টই এখন স্টকে আছে।"}`;
  }
  return `${budget ? `For ${fmt(budget)}, ` : ""}I built this around the ${cpu?.name || "CPU"}${gpu ? ` and ${gpu.name}` : ""}. Total ${fmt(ev.total)}. ${bal} ${bundled ? `Estimated load is ${ev.watts.total} W — the power supply that comes with the case is enough for this light PC.` : `Estimated load is ${ev.watts.total} W, so a ${ev.watts.recommended} W or larger power supply is right.`}${pre ? ` ${pre} part${pre > 1 ? "s" : ""} would be pre-ordered.` : " Everything is in stock now."}`;
}

/** The planner as one call: read the message, plan, and describe. */
export function planFromText({ text, products, lang = "en", useCase: fallbackUseCase = "gaming-1080", budgetHint = 0 }) {
  const budget = parseBudget(text) || budgetHint;
  const office = wantsOffice(text);
  const useCase = detectUseCase(text, fallbackUseCase);
  if (!budget) return { ok: false, need: "budget", useCase };
  const opts = { products, useCase, office, os: wantsOs(text), antivirus: wantsAv(text) };
  const plan = planBuild({ ...opts, budget });
  if (!plan.sel) {
    // Too small: find roughly what the cheapest working PC costs from our stock.
    let suggest = 0;
    for (let b = Math.ceil(budget * 1.1 / 1000) * 1000; b <= budget * 2.6 && !suggest; b = Math.ceil(b * 1.12 / 1000) * 1000) {
      const bigger = planBuild({ ...opts, budget: b });
      if (bigger.sel) suggest = Math.ceil(bigger.ev.total / 1000) * 1000;
    }
    return { ok: false, need: "more-budget", useCase, budget, suggest };
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  return { ok: true, useCase, budget, sel: plan.sel, ev: plan.ev, reply: describePlan(plan, byId, lang, useCase, budget) };
}

/** Compact selection for sending/saving: { row: [{id, qty}] } without empty rows. */
export const pack = (sel) => Object.fromEntries(Object.entries(sel).filter(([, a]) => a.length));

/**
 * The built-in planner as a chat answer ({ reply, useCase, build }). Used by the server when the AI is
 * unavailable and by the browser when the server cannot be reached, so the assistant always answers.
 */
export function localReply({ messages, products, lang = "en", useCase = "gaming-1080" }) {
  const lastText = messages[messages.length - 1]?.text || "";
  // An earlier budget carries over only when this message is still about the PC ("make it cheaper", "for editing"…).
  const aboutPc = !!parseBudget(lastText) || /pc|computer|build|gaming|game|office|edit|render|cheap|cost|more|less|budget|taka|tk|bdt|storage|ram|gpu|monitor|windows|কম্পিউটার|পিসি|গেম|অফিস|বাজেট|টাকা|সস্তা|বেশি|কম/i.test(ascii(lastText));
  if (!aboutPc) {
    return { useCase, build: null, reply: lang === "bn" ? "আমি পিসি বিল্ড সাজাতে সাহায্য করতে পারি। আপনার বাজেট কত এবং পিসি দিয়ে কী করবেন (গেমিং, অফিস, ভিডিও এডিটিং) বলুন।" : "I can help you build a PC. Tell me your budget and what you will use it for (gaming, office, video editing)." };
  }
  const budgetHint = [...messages].reverse().map((m) => parseBudget(m.text)).find(Boolean) || 0;
  const plan = planFromText({ text: lastText, products, lang, useCase, budgetHint });
  if (plan.ok) return { reply: plan.reply, useCase: plan.useCase, build: pack(plan.sel) };
  const bn = lang === "bn";
  if (plan.need === "budget") {
    return { useCase: plan.useCase, build: null, reply: bn ? "আপনার বাজেট কত এবং পিসি দিয়ে কী করবেন (গেমিং, অফিস, ভিডিও এডিটিং)? তাহলে আপনার জন্য একটি বিল্ড সাজিয়ে দিই।" : "What is your budget, and what will you use the PC for (gaming, office, video editing)? Then I can put a build together for you." };
  }
  const need = plan.suggest ? `৳${plan.suggest.toLocaleString("en-US")}` : "";
  return {
    useCase: plan.useCase, build: null,
    reply: bn
      ? `এই বাজেটে আমাদের স্টক থেকে একটি কাজের পিসি সাজানো যাচ্ছে না।${need ? ` সবচেয়ে কম খরচের কাজের পিসি হবে প্রায় ${need}।` : ""} বাজেট একটু বাড়ানো যাবে?`
      : `I can't build a working PC from our stock for that budget.${need ? ` The cheapest one that works is about ${need}.` : ""} Could you raise the budget a little?`,
  };
}

export { BUILDER_ROWS, SUBS };
