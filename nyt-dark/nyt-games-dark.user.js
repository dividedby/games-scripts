// ==UserScript==
// @name         NYT Games Dark
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  A proper dark mode for NYT Games in the browser (Connections, Wordle and the rest), using NYT's own dark colors so the game colors stay true
// @version      0.1.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @match        https://www.nytimes.com/games/*
// @match        https://www.nytimes.com/puzzles/*
// @match        https://www.nytimes.com/crosswords*
// @grant        none
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/dividedby/games-scripts/main/nyt-dark/nyt-games-dark.user.js
// @updateURL    https://raw.githubusercontent.com/dividedby/games-scripts/main/nyt-dark/nyt-games-dark.user.js
// ==/UserScript==

(() => {
  'use strict';

  // NYT already ships a full dark color set for its games (the one its apps use), switched
  // on by <body data-mode="dark" class="display-settings-enabled">, plus older ".dark" rules.
  // The website just never turns it on. This script does, and patches the few parts of the
  // page that have no dark colors of their own (the site header and the page background).

  const MODE_KEY = 'nytd:mode';          // 'auto' (follow the system) | 'dark' | 'light'
  const MODES = ['auto', 'dark', 'light'];
  const LABEL = { auto: 'Auto', dark: 'Dark', light: 'Light' };
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  let mode = MODES.includes(ls.get(MODE_KEY, 'auto')) ? ls.get(MODE_KEY, 'auto') : 'auto';
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  const wantDark = () => mode === 'dark' || (mode === 'auto' && !!system?.matches);

  // ---------- the parts NYT left out ----------
  const CSS = `
    html.nytd-dark, html.nytd-dark body { background: var(--bg-page, #121212) !important; color-scheme: dark; }
    html.nytd-dark .pz-ad-box, html.nytd-dark .pz-section-filled { background: transparent !important; }
    html.nytd-dark .pz-nav, html.nytd-dark .pz-nav__title,
    html.nytd-dark .pz-game-title-bar, html.nytd-dark .pz-game-title-bar * { color: #f8f8f8 !important; }
    html.nytd-dark .pz-nav__logo rect { fill: transparent !important; }
    html.nytd-dark .pz-nav__logo path { fill: #f8f8f8 !important; }
    html.nytd-dark .pz-nav__hamburger-inner,
    html.nytd-dark .pz-nav__hamburger-inner::before,
    html.nytd-dark .pz-nav__hamburger-inner::after { background-color: #f8f8f8 !important; }
    #nytd-toggle { font: 600 12px/1 nyt-franklin, helvetica, arial, sans-serif; color: inherit; background: transparent;
      border: 1px solid currentColor; border-radius: 999px; padding: 5px 10px; margin-left: 12px; cursor: pointer;
      opacity: .75; align-self: center; white-space: nowrap; }
    #nytd-toggle:hover { opacity: 1; }
    html.nytd-dark #nytd-toggle { color: #f8f8f8; }

    /* the site menu (the ☰ drawer) */
    html.nytd-dark .pz-nav-drawer, html.nytd-dark .pz-nav-drawer__account { background: #121212 !important; color: #f8f8f8 !important; }
    html.nytd-dark .pz-nav-drawer * { border-top-color: #3a3a3c !important; border-bottom-color: #3a3a3c !important; }
    html.nytd-dark .pz-nav-drawer :is(a, a *, h2, h3, h4, li, p):not([class*=ctaButton i]):not([class*=ctaButton i] *) { color: #f8f8f8 !important; }
    html.nytd-dark .pz-nav-drawer svg:not([class*=icon i]) path { fill: currentColor; }
    html.nytd-dark .pz-nav-drawer .pz-nav__button { background: transparent !important; color: #f8f8f8 !important; border-color: #565758 !important; }

    /* plain white or gray panels NYT gave no dark colors (Wordle's start screen, promo cards):
       marked by the script, since only the neutral ones should change, not the colorful ones */
    html.nytd-dark [data-nytd-panel] { background-color: #1b1b1b !important; color: #f8f8f8 !important; }
    html.nytd-dark [data-nytd-panel] :is(h1, h2, h3, h4, p, span, div, a):not([style*=background]) { color: #f8f8f8; }
    html.nytd-dark [data-nytd-panel] button[class*=primary i] { background: #f8f8f8 !important; color: #121212 !important; }
    html.nytd-dark [data-nytd-panel] button:not([class*=primary i]) { color: #f8f8f8 !important; border-color: #f8f8f8 !important; }
  `;

  // A light, colorless background (white or light gray), as opposed to a game's brand color
  const isPlainLight = el => {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && +m[3] < 0.5)) return false;
    const [r, g, b] = m.map(Number);
    return Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 14;
  };
  // only inside the screens NYT draws over the game: start screens, results and promos
  const PANELS = '[class*="Welcome-module_contentWelcome"], [class*="_moment_"], [role="dialog"], [class*="Modal-module"], [class*="pz-moment"]';
  function markPanels() {
    if (!document.documentElement.classList.contains('nytd-dark')) return;
    for (const root of document.querySelectorAll(PANELS)) {
      for (const el of [root, ...root.querySelectorAll('div, section, aside, a')]) {
        if (!('nytdPanel' in el.dataset) && isPlainLight(el)) el.dataset.nytdPanel = '';
      }
    }
  }

  // ---------- switching ----------
  // what we switched on, so turning dark off only undoes our own changes
  const added = new Map(); // element -> { settings, dark }
  function meta(name, content) {
    let m = document.head?.querySelector(`meta[name="${name}"][data-nytd]`);
    if (content == null) { m?.remove(); return; }
    if (!document.head) return;
    if (!m) { m = document.createElement('meta'); m.name = name; m.dataset.nytd = ''; document.head.appendChild(m); }
    m.content = content;
  }
  function apply() {
    const dark = wantDark();
    document.documentElement.classList.toggle('nytd-dark', dark);
    // tell dark-mode extensions (Dark Reader, Noir) the page is already dark, so they stand back
    meta('darkreader-lock', dark ? '' : null);
    meta('color-scheme', dark ? 'dark' : null);
    // on <html> too, so NYT's dark colors reach the page background (CSS variables set on
    // <body> alone don't apply to <html>)
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      const mine = added.get(el) || { settings: false, dark: false };
      if (dark) {
        if (el.dataset.mode !== 'dark') el.dataset.mode = 'dark';
        if (!el.classList.contains('display-settings-enabled')) { el.classList.add('display-settings-enabled'); mine.settings = true; }
        if (el === document.body && !el.classList.contains('dark')) { el.classList.add('dark'); mine.dark = true; }
      } else {
        if (el.dataset.mode === 'dark') el.dataset.mode = 'light';
        if (mine.settings) { el.classList.remove('display-settings-enabled'); mine.settings = false; }
        if (mine.dark) { el.classList.remove('dark'); mine.dark = false; }
      }
      added.set(el, mine);
    }
    if (dark) markPanels();
    else for (const el of document.querySelectorAll('[data-nytd-panel]')) delete el.dataset.nytdPanel;
    showToggle();
  }

  // ---------- the toggle in the site header ----------
  function showToggle() {
    const nav = document.querySelector('.pz-nav__title, #js-logo-nav');
    let t = document.getElementById('nytd-toggle');
    if (!nav) return;
    if (!t) {
      t = document.createElement('button');
      t.id = 'nytd-toggle';
      t.type = 'button';
      t.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
        ls.set(MODE_KEY, mode);
        apply();
      });
    }
    if (t.previousElementSibling !== nav) nav.after(t);
    const label = `◐ ${LABEL[mode]}`;
    if (t.textContent !== label) t.textContent = label;
    t.title = mode === 'auto' ? 'Dark mode: following your device (tap for always dark)'
      : mode === 'dark' ? 'Dark mode: always on (tap for always light)' : 'Dark mode: off (tap to follow your device)';
  }

  // ---------- start as early as possible, and keep it on as the page re-renders ----------
  const style = document.createElement('style');
  style.id = 'nytd-style';
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
  document.documentElement.classList.toggle('nytd-dark', wantDark());

  system?.addEventListener?.('change', apply);
  window.addEventListener('storage', e => { if (e.key === MODE_KEY) { mode = ls.get(MODE_KEY, 'auto'); apply(); } });

  let queued = false, panelQueued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; apply(); }); } };
  const watch = () => {
    // the game sometimes rewrites <body>'s attributes; put ours back
    new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-mode'] });
    new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-mode'] });
    // the header is rendered late; place the toggle when it appears
    new MutationObserver(() => {
      if (!document.getElementById('nytd-toggle')?.isConnected) later();
      else if (!panelQueued) { panelQueued = true; setTimeout(() => { panelQueued = false; markPanels(); }, 150); }
    }).observe(document.body, { childList: true, subtree: true });
    if (style.parentNode !== document.head) document.head.appendChild(style);
    apply();
  };
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch, { once: true });

  if (window.__NYTD_TEST__) window.__nytd = { apply, get mode() { return mode; } };
})();
