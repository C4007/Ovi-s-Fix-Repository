/* Ovi's Fix — the AI PC assistant panel on /pc-builder.
   The customer types a budget and a use. The server asks Google Gemini (see lib/assistant.js); if that is not
   possible the same question is answered here by the built-in planner. Either way the build is checked with the
   builder's own rules (compatibility, wattage, CPU/GPU balance) using the live stock and prices, and one button
   loads it into the builder. */
import { T, lang, esc, money, shop, priceInfo, shortName } from "/js/shop-core.js";
import { icon } from "/js/icons.js";
import { ROW, flatten } from "/js/builder-logic.js";
import { evaluate, selectionFromPicks, localReply } from "/js/assistant-core.js";

const OPEN_KEY = "ovisfix-ai-open";
const history = []; // survives a language switch: [{ role, text, build?, useCase?, source? }]

const readOpen = () => { try { return localStorage.getItem(OPEN_KEY) !== "0"; } catch (e) { return true; } };
const writeOpen = (v) => { try { localStorage.setItem(OPEN_KEY, v ? "1" : "0"); } catch (e) { /* ignore */ } };

export function mountAssistant({ root, getSel, getUseCase, applyBuild, describeBalance }) {
  let busy = false;
  let open = readOpen();
  const byId = () => shop().byId;
  const products = () => shop().products;

  const chips = [
    { label: T("assistant.chip1"), text: T("assistant.chip1Text") },
    { label: T("assistant.chip2"), text: T("assistant.chip2Text") },
    { label: T("assistant.chip3"), text: T("assistant.chip3Text") },
    { label: T("assistant.chip4"), text: T("assistant.chip4Text") },
  ];

  /* ---- one proposed build, as a quote ticket ---- */
  function buildCard(m, i) {
    const sel = selectionFromPicks(m.build, byId());
    const items = flatten(sel, byId());
    if (!items.length) return "";
    const ev = evaluate(sel, byId(), m.useCase || getUseCase());
    const total = items.reduce((s, x) => s + priceInfo(x.p).price * x.qty, 0);
    const pre = items.filter((x) => x.p.stock !== "in").length;
    const bad = ev.errors.length + ev.missing.length;
    const tone = bad ? "bad" : ev.warnings.length ? "warn" : "good";
    const status = bad ? T("assistant.checksBad", { n: bad }) : ev.warnings.length ? T("assistant.checksWarn", { n: ev.warnings.length }) : T("assistant.checksOk");
    return `<div class="ai-ticket" data-build="${i}">
      <ul class="ai-parts">${items.map((x) => `<li><span class="ai-part-row">${esc(loc2(ROW[x.row].label))}</span><a href="/product?id=${encodeURIComponent(x.p.id)}" target="_blank" rel="noopener">${esc(shortName(x.p.name))}${x.qty > 1 ? ` ×${x.qty}` : ""}</a><b>${money(priceInfo(x.p).price * x.qty)}</b></li>`).join("")}</ul>
      <div class="ai-total"><span>${esc(T("assistant.total"))}</span><strong>${money(total)}</strong></div>
      <p class="ai-facts"><span>${esc(T("assistant.power", { w: ev.watts.total, psu: ev.watts.recommended }))}</span><span>${esc(describeBalance(ev.balance, m.useCase || getUseCase()))}</span><span>${esc(pre ? T("assistant.preorderN", { n: pre }) : T("assistant.allInStock"))}</span></p>
      <p class="ai-check tone-${tone}">${icon(tone === "good" ? "check" : "alert")}${esc(status)}</p>
      <button type="button" class="btn btn-primary btn-sm" data-use="${i}">${icon("check")}<span>${esc(T("assistant.useBuild"))}</span></button>
    </div>`;
  }
  const loc2 = (v) => (v && typeof v === "object" ? v[lang()] || v.en : v);

  function messagesHTML() {
    if (!history.length) {
      return `<div class="ai-empty"><p>${esc(T("assistant.lead"))}</p><div class="ai-chips">${chips.map((c, i) => `<button type="button" class="chip" data-chip="${i}">${esc(c.label)}</button>`).join("")}</div></div>`;
    }
    return history.map((m, i) => m.role === "user"
      ? `<div class="ai-msg ai-me"><p>${esc(m.text)}</p></div>`
      : `<div class="ai-msg ai-bot"><p>${esc(m.text).replace(/\n/g, "<br>")}</p>${m.build ? buildCard(m, i) : ""}${m.source ? `<small class="ai-src">${esc(T(m.source === "ai" ? "assistant.viaAi" : "assistant.viaLocal"))}</small>` : ""}</div>`).join("")
      + (busy ? `<div class="ai-msg ai-bot ai-busy" role="status"><p><span class="ai-dots" aria-hidden="true"><i></i><i></i><i></i></span>${esc(T("assistant.thinking"))}</p></div>` : "");
  }

  function paint(keepScroll = false) {
    root.innerHTML = `<section class="ai-panel ${open ? "is-open" : ""}" aria-label="${esc(T("assistant.title"))}">
      <header class="ai-head">
        <span class="ai-ic">${icon("bolt")}</span>
        <div class="ai-title"><strong>${esc(T("assistant.title"))}</strong><span class="ai-beta">Beta</span></div>
        ${history.length ? `<button type="button" class="link-btn" data-new>${esc(T("assistant.newChat"))}</button>` : ""}
        <button type="button" class="btn btn-secondary btn-sm" data-toggle aria-expanded="${open}">${esc(open ? T("assistant.hide") : T("assistant.show"))}</button>
      </header>
      ${open ? `<div class="ai-body">
        <div class="ai-log" data-log aria-live="polite">${messagesHTML()}</div>
        <form class="ai-form" data-form>
          <input name="q" type="text" maxlength="500" autocomplete="off" placeholder="${esc(T("assistant.placeholder"))}" aria-label="${esc(T("assistant.placeholder"))}" ${busy ? "disabled" : ""}>
          <button type="submit" class="btn btn-primary btn-sm" ${busy ? "disabled" : ""}>${icon("send")}<span>${esc(T("assistant.send"))}</span></button>
        </form>
        <p class="ai-note">${icon("info")}${esc(T("assistant.privacy"))}</p>
      </div>` : ""}
    </section>`;
    const log = root.querySelector("[data-log]");
    if (log && !keepScroll) log.scrollTop = log.scrollHeight;
  }

  async function ask(text) {
    text = text.trim().slice(0, 500);
    if (!text || busy) return;
    history.push({ role: "user", text });
    busy = true; paint();
    const messages = history.slice(-8).map(({ role, text: t }) => ({ role, text: t }));
    const sel = getSel();
    const current = {};
    for (const [row, list] of Object.entries(sel)) if (list.length) current[row] = list.map((x) => x.id);
    let out = null, tooMany = false;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, useCase: getUseCase(), lang: lang(), current }),
        signal: AbortSignal.timeout(32000),
      });
      if (res.status === 429) tooMany = true;
      else if (res.ok) out = await res.json();
    } catch (err) { /* offline, timeout or no API: the built-in planner answers below */ }
    if (tooMany) out = { ok: true, source: "local", reply: T("assistant.tooMany"), build: null };
    else if (!out || !out.ok) out = { ok: true, source: "local", ...localReply({ messages, products: products(), lang: lang(), useCase: getUseCase() }) };
    history.push({ role: "assistant", text: out.reply || T("assistant.error"), build: out.build || null, useCase: out.useCase, source: out.source });
    busy = false; paint();
    root.querySelector("input[name=q]")?.focus({ preventScroll: true });
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-toggle]")) { open = !open; writeOpen(open); paint(true); return; }
    if (e.target.closest("[data-new]")) { history.length = 0; paint(); return; }
    const chip = e.target.closest("[data-chip]");
    if (chip) { ask(chips[Number(chip.dataset.chip)].text); return; }
    const use = e.target.closest("[data-use]");
    if (use) {
      const m = history[Number(use.dataset.use)];
      if (m?.build) applyBuild(selectionFromPicks(m.build, byId()), m.useCase || getUseCase());
    }
  });
  root.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector("input[name=q]");
    const v = input.value;
    input.value = "";
    ask(v);
  });

  paint();
  return { repaint: () => paint(true) };
}
