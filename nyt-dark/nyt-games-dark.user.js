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

    /* plain white or gray areas NYT gave no dark colors (Wordle's start screen, promo cards,
       archives, the home page, the footer): marked by the script, since only the neutral ones
       should change, not the colorful ones. Text is marked separately (data-nytd-ink), by the
       background it actually sits on. */
    html.nytd-dark [data-nytd-panel] { background-color: #1b1b1b !important; color: #f8f8f8 !important; }
    html.nytd-dark [data-nytd-ink=light] { color: #f8f8f8 !important; }
    html.nytd-dark [data-nytd-ink=dark] { color: #121212 !important; }
    html.nytd-dark [data-nytd-flip] { filter: invert(.93) hue-rotate(180deg); }
    html.nytd-dark [data-nytd-panel]:not(a, button) { border-color: #3a3a3c !important; }
    html.nytd-dark [data-nytd-panel] hr { background: #3a3a3c !important; border-color: #3a3a3c !important; }
    html.nytd-dark [data-nytd-panel] button[class*=primary i] { background: #f8f8f8 !important; color: #121212 !important; }
    html.nytd-dark [data-nytd-panel] button:not([class*=primary i]) { color: #f8f8f8 !important; border-color: #f8f8f8 !important; }
    html.nytd-dark [data-nytd-panel] button:disabled, html.nytd-dark button[data-nytd-panel]:disabled { opacity: .35; }

    /* game archives (Wordle, Connections, Strands…) */
    html.nytd-dark [class*=ArchiveDatePicker-module_dropDownSelect] { filter: invert(.93); }
    html.nytd-dark [class*=Header-module_archiveHeader],
    html.nytd-dark [class*=ArchiveCalendarGrid-module_daysOfWeekContainer] { border-color: #3a3a3c !important; }
    html.nytd-dark [class*=ArchiveCalendarItem-module_iconBorder] { border-color: #565758 !important; }
    /* the crossword archive and the crossword itself */
    html.nytd-dark :is(.tab__tabNav, .archive_date-selector-container) { border-color: #3a3a3c !important; }
    html.nytd-dark .tab__tabNav .active { box-shadow: inset 0 -2px #f8f8f8; }
    html.nytd-dark .archive_today[data-nytd-panel] { border-color: #565758 !important; }
    html.nytd-dark :is(.xwd__clue--selected, .xwd__clue--selected *) { color: #121212 !important; }
    html.nytd-dark [class*=xwd__toolbar_icon] { filter: invert(1); }
    /* black icons (like a promo card's › arrow) turn light; colored ones are left as they are */
    html.nytd-dark [data-nytd-panel] svg :is(path, polyline, line):is(:not([fill]), [fill="#000"], [fill="#000000"], [fill=black], [fill="#121212"]),
    html.nytd-dark [data-nytd-panel] svg[fill=none] :is(path, polyline, line):not([stroke]) { fill: currentColor; }
    html.nytd-dark [data-nytd-panel] svg [stroke="#000"], html.nytd-dark [data-nytd-panel] svg [stroke=black] { stroke: currentColor; }
    html.nytd-dark [data-nytd-panel] img:is([src*=arrow i], [src*=chevron i], [src*=caret i]) { filter: invert(1); }
  `;

  const rgb = color => {
    const m = color.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && +m[3] < 0.5)) return null; // (mostly) transparent
    return m.slice(0, 3).map(Number);
  };
  const lightness = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // A light, colorless background (white or light gray), as opposed to a game's brand color
  const isPlainLight = el => {
    const c = rgb(getComputedStyle(el).backgroundColor);
    return !!c && Math.min(...c) > 200 && Math.max(...c) - Math.min(...c) < 14;
  };
  // The background an element's text is actually drawn on: dark if it's one we darkened,
  // or if nothing up the tree paints one (the page itself is dark)
  const backdropIsLight = el => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if ('nytdPanel' in e.dataset) return false;
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c) return lightness(c) > 0.55;
    }
    return false;
  };
  // Dark icons (drawn as background images or <img>) that need flipping on a dark background
  const DARK_ICON = /black|puzzle-progress|arrow|chevron|caret|print|list-view|close/i;
  const iconUrl = el => {
    if (el.tagName === 'IMG') return el.getAttribute('src') || '';
    const bg = getComputedStyle(el).backgroundImage;
    return bg.startsWith('url(') ? bg : '';
  };
  const hasOwnText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

  // Where neutral light areas get darkened: the screens NYT draws over a game (start screens,
  // results, promos) and the pages around the games (home page, archives, footer). Never the
  // game boards themselves, which NYT's own dark colors already cover.
  const PANELS = [
    '[class*="Welcome-module_contentWelcome"]', '[class*="_moment_"]', '[role="dialog"]',
    '[class*="Modal-module"]', '[class*="pz-moment"]',
    '#hub-root', '.pz-footer', '[class*="ArchiveLayout-module_wrapper"]',
    '.tab__tabNav', '.archive_date-selector-container', '.archive_buttons-right', '.archive_mode-toggle',
  ].join(', ');
  const SCAN = 'div, section, aside, article, header, footer, nav, ul, li, a, button, span, h1, h2, h3, h4, p, label, img, i';
  function markPanels() {
    if (!document.documentElement.classList.contains('nytd-dark')) return;
    const roots = [...document.querySelectorAll(PANELS)];
    const els = new Set();
    for (const root of roots) { els.add(root); for (const el of root.querySelectorAll(SCAN)) els.add(el); }
    // backgrounds first (outside in), so the text pass sees the final backdrops
    for (const el of els) {
      if ('nytdPanel' in el.dataset || 'nytdFlip' in el.dataset) continue;
      // the primary button is the one we deliberately make light: leave it
      if (el.matches('button[class*=primary i], button[class*=primary i] *')) continue;
      if (!isPlainLight(el)) continue;
      // a light button drawn with a dark icon image: flip the whole button
      if (DARK_ICON.test(iconUrl(el))) el.dataset.nytdFlip = '';
      else el.dataset.nytdPanel = '';
    }
    for (const el of els) {
      if ('nytdFlip' in el.dataset || el.closest('[data-nytd-flip]')) continue;
      if (DARK_ICON.test(iconUrl(el))) { if (!backdropIsLight(el)) el.dataset.nytdFlip = ''; continue; }
      if ('nytdInk' in el.dataset || !hasOwnText(el)) continue;
      const c = rgb(getComputedStyle(el).color);
      if (!c) continue;
      const lightText = lightness(c) > 0.5, lightBack = backdropIsLight(el);
      if (lightText === lightBack) el.dataset.nytdInk = lightBack ? 'dark' : 'light';
    }
  }
  function unmarkPanels() {
    for (const el of document.querySelectorAll('[data-nytd-panel], [data-nytd-ink], [data-nytd-flip]')) {
      delete el.dataset.nytdPanel; delete el.dataset.nytdInk; delete el.dataset.nytdFlip;
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
    else unmarkPanels();
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
