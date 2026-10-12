// ==UserScript==
// @name         NYT Games Dark
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  A proper dark mode for NYT Games in the browser (Connections, Wordle and the rest), using NYT's own dark colors so the game colors stay true
// @version      1.0.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @match        https://www.nytimes.com/games/*
// @match        https://www.nytimes.com/puzzles/*
// @match        https://www.nytimes.com/crosswords*
// @match        https://www.nytimes.com/*/crosswords/*
// @match        https://www.nytimes.com/interactive/*-bot.html
// @match        https://www.nytimes.com/spotlight/spelling-bee-forum*
// @match        https://www.nytimes.com/spotlight/wordle-review*
// @match        https://www.nytimes.com/spotlight/games-*
// @match        https://www.nytimes.com/column/wordplay*
// @match        https://help.nytimes.com/*
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
  // Hints, companions, forums and the game bots are news-style pages, not game pages. NYT gives
  // them their own dark colors (the app's), switched by a class on <html>; the script swaps it.
  // The help center has none, so it gets only the generic darkening below.
  const ARTICLE = location.host !== 'www.nytimes.com' || !/^\/(games|puzzles|crosswords)(\/|$)/.test(location.pathname);

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
    html.nytd-dark .pz-nav-drawer .pz-icon:is([class*=arrow], [class*=chevron], [class*=caret]) { filter: invert(1); }
    html.nytd-dark .pz-nav-drawer .pz-nav__button { background: transparent !important; color: #f8f8f8 !important; border-color: #565758 !important; }

    /* plain white or gray areas NYT gave no dark colors (Wordle's start screen, promo cards,
       archives, the home page, the footer): marked by the script, since only the neutral ones
       should change, not the colorful ones. Text is marked separately (data-nytd-ink), by the
       background it actually sits on. */
    html.nytd-dark [data-nytd-panel] { background-color: #1b1b1b !important; color: #f8f8f8 !important; }
    html.nytd-dark [data-nytd-panel=shape] { background-color: #3a3a3c !important; }
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
    /* days with no solve on the crossword stats chart (striped with a gradient) */
    html.nytd-dark .time-bar.no-stats { background-color: #1b1b1b !important; background-image: repeating-linear-gradient(-45deg, #1b1b1b, #1b1b1b 5px, #262626 5px, #262626 10px) !important; }
    /* the crossword archive and the crossword itself */
    html.nytd-dark :is(.tab__tabNav, .archive_date-selector-container) { border-color: #3a3a3c !important; }
    html.nytd-dark .tab__tabNav .active { box-shadow: inset 0 -2px #f8f8f8; }
    html.nytd-dark .archive_today[data-nytd-panel] { border-color: #565758 !important; }
    /* the crossword grid, in dark colors like the NYT app's: dark squares with light letters,
       the current word in deep blue, the selected square still yellow */
    html.nytd-dark .xwd__cell--cell { fill: #2c2c2e !important; }
    html.nytd-dark .xwd__cell--block { fill: #000 !important; }
    html.nytd-dark .xwd__cell--shaded { fill: #48484a !important; }
    html.nytd-dark .xwd__cell--related { fill: #4d4529 !important; }
    html.nytd-dark .xwd__cell--highlighted { fill: #24476a !important; }
    html.nytd-dark .xwd__cell--highlighted.xwd__cell--shaded { fill: #2f5578 !important; }
    html.nytd-dark .xwd__cell--related.xwd__cell--highlighted { fill: #2c5459 !important; }
    html.nytd-dark .xwd__cell--selected { fill: #ffda00 !important; }
    html.nytd-dark .xwd__cell--selected.xwd__cell--shaded { fill: #e6c400 !important; }
    html.nytd-dark .xwd__cell text { fill: #f8f8f8; }
    html.nytd-dark .xwd__cell--penciled text:last-of-type { fill: #9a9a9e; }
    html.nytd-dark .xwd__cell:has(.xwd__cell--selected) text { fill: #121212; }
    html.nytd-dark .xwd__cell--penciled:has(.xwd__cell--selected) text:last-of-type { fill: #5a5a5e; }
    /* the clue for the current word (in the list, above the grid, and over the phone keyboard) */
    html.nytd-dark .xwd__clue--selected, html.nytd-dark [class*=xwd__clue-bar][class*=--bar] { background-color: #24476a !important; }
    html.nytd-dark :is(.xwd__clue--selected, [class*=xwd__clue-bar][class*=--bar]),
    html.nytd-dark :is(.xwd__clue--selected, [class*=xwd__clue-bar][class*=--bar]) * { color: #f8f8f8 !important; }
    html.nytd-dark .xwd__clue--highlighted { border-color: #24476a !important; }
    html.nytd-dark [class*=xwd__toolbar_icon] { filter: invert(1); }
    /* the crossword on phones: its sticky toolbar, dropdown menus and the special keyboard keys */
    html.nytd-dark .xwd__toolbar--wrapper { background-color: var(--bg-page, #121212) !important; }
    html.nytd-dark .xwd__menu--item { background-color: #1b1b1b !important; color: #f8f8f8 !important; border-color: #3a3a3c !important; }
    html.nytd-dark .hg-button.custom { background-color: #565758 !important; }
    /* the backspace key: an outline, not a white blob (NYT's dark colors fill its shape) */
    html.nytd-dark .hg-button.icon svg:has(line) :is(path, line) { fill: none !important; stroke: #f8f8f8 !important; }
    html.nytd-dark .xwd__tool--active { background-color: #3a3a3c !important; }
    html.nytd-dark .xwd__modal--close .pz-icon-close { filter: brightness(2.5); }
    /* menus and toolbars that light up on hover (crossword Reveal/Check, Spelling Bee's More) */
    html.nytd-dark :is(.xwd__tool--button :hover, .pz-dropdown__button:hover, .pz-dropdown__menu-item:hover, .pz-toolbar-button:hover),
    html.nytd-dark :is(.xwd__tool--button :hover, .pz-dropdown__button:hover) * { background-color: #2c2c2e !important; color: #f8f8f8 !important; }
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
  const neutralLight = c => Math.min(...c) > 200 && Math.max(...c) - Math.min(...c) < 14;
  const isPlainLight = el => {
    const c = rgb(getComputedStyle(el).backgroundColor);
    return !!c && neutralLight(c);
  };
  // White fades drawn with gradients (over the edge of a scrolling list or bar): the same
  // gradient in the darkened panel color. The page's own inline value is kept to put back.
  const fades = new Map();
  function darkenFade(el) {
    if (fades.has(el)) return;
    const img = getComputedStyle(el).backgroundImage;
    if (!img.includes('gradient')) return;
    const dark = img.replace(/rgba?\((\d+), (\d+), (\d+)((?:, [\d.]+)?)\)/g, (m, r, g, b, a) =>
      neutralLight([+r, +g, +b]) ? `${a ? 'rgba' : 'rgb'}(27, 27, 27${a})` : m);
    if (dark === img) return;
    fades.set(el, [el.style.getPropertyValue('background-image'), el.style.getPropertyPriority('background-image')]);
    el.style.setProperty('background-image', dark, 'important');
  }
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
  const DARK_ICON = /black|puzzle-progress|arrow|chevron|carr?et|print|list-view|close|t-logo/i;
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
    '[id$="-root"]:not(#pz-game-root)', '.pz-footer', // home, stats and Spelling Bee pages: #hub-root, #stats-root…
    '[class*="ArchiveLayout-module_wrapper"]',
    '.tab__tabNav', '.archive_date-selector-container', '.archive_buttons-right', '.archive_mode-toggle',
  ].join(', ');
  const SCAN = 'div, section, aside, article, header, footer, nav, ul, ol, li, a, button, span, h1, h2, h3, h4, h5, h6, p, label, img, i, em, strong, b, small, td, th, dt, dd, figcaption, blockquote, summary, time';
  // Elements already looked at, with the class, style and child count they had then. A rescan
  // (after every change to the page) only looks again at new elements or ones that changed;
  // the rest would only give the same answer, at a cost on long pages and slow phones.
  let checked = new WeakMap();
  const changed = el => {
    const sig = (el.getAttribute('class') || '') + '|' + (el.getAttribute('style') || '') + '|' + el.childNodes.length;
    if (checked.get(el) === sig) return false;
    checked.set(el, sig);
    return true;
  };
  function markPanels() {
    if (!document.documentElement.classList.contains('nytd-dark')) return;
    const roots = [...document.querySelectorAll(PANELS)];
    if (ARTICLE && document.body) roots.push(document.body);
    const els = new Set();
    for (const root of roots) { els.add(root); for (const el of root.querySelectorAll(SCAN)) els.add(el); }
    const fresh = [...els].filter(changed);
    for (const el of fades.keys()) if (!el.isConnected) fades.delete(el); // don't hold on to removed elements
    let marked = false;
    // backgrounds first (outside in), so the text pass sees the final backdrops
    for (const el of fresh) {
      if ('nytdPanel' in el.dataset || 'nytdFlip' in el.dataset) continue;
      // the primary button is the one we deliberately make light: leave it
      if (el.matches('button[class*=primary i], button[class*=primary i] *')) continue;
      if (!el.matches('.time-bar')) darkenFade(el);
      if (!isPlainLight(el)) continue;
      marked = true;
      // a light button drawn with a dark icon image: flip the whole button
      if (DARK_ICON.test(iconUrl(el))) el.dataset.nytdFlip = '';
      // an empty shape (a chart bar, an empty calendar day) stays a visible gray
      else el.dataset.nytdPanel = el.childElementCount || el.textContent.trim() ? '' : 'shape';
    }
    // a newly darkened area changes the backdrop of everything inside it: look at all text
    // and icons again then, otherwise only at what changed
    const look = marked ? els : fresh;
    // news-style pages: black logos and icons (the masthead, menu, search) on a dark backdrop
    // only when every shape is drawn in black: icons already in NYT's light colors, and
    // colorful drawings (game icons), are left alone
    if (ARTICLE) for (const svg of document.body.querySelectorAll('svg')) {
      if (!changed(svg) && !marked) continue;
      if ('nytdFlip' in svg.dataset || svg.closest('[data-nytd-flip]') || svg.getBoundingClientRect().width > 400) continue;
      const paints = [];
      for (const shape of svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line, text')) {
        const cs = getComputedStyle(shape);
        for (const c of [cs.fill, cs.stroke]) if (c !== 'none') paints.push(rgb(c));
      }
      if (paints.length && paints.every(c => !c || lightness(c) < 0.25) && !backdropIsLight(svg)) svg.dataset.nytdFlip = '';
    }
    for (const el of look) {
      if ('nytdFlip' in el.dataset || 'nytdInk' in el.dataset || el.closest('[data-nytd-flip]')) continue;
      if (DARK_ICON.test(iconUrl(el))) { if (!backdropIsLight(el)) el.dataset.nytdFlip = ''; continue; }
      if (!hasOwnText(el)) continue;
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
    for (const [el, [value, priority]] of fades) el.style.setProperty('background-image', value, priority);
    fades.clear();
    checked = new WeakMap(); // look at everything afresh next time dark is on
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
  // news-style pages: NYT's tpl-always-light → tpl-always-dark, put back when turned off
  let tplLight = null;
  function tpl(dark) {
    const c = document.documentElement.classList;
    if (dark) {
      if (tplLight === null) tplLight = c.contains('tpl-always-light');
      // (only touch the class list when it changes: the observer on <html> would loop)
      if (c.contains('tpl-always-light')) c.remove('tpl-always-light');
      if (!c.contains('tpl-always-dark')) c.add('tpl-always-dark');
    } else if (tplLight !== null) {
      c.remove('tpl-always-dark'); if (tplLight) c.add('tpl-always-light');
      tplLight = null;
    }
  }
  function apply() {
    const dark = wantDark();
    document.documentElement.classList.toggle('nytd-dark', dark);
    if (ARTICLE) tpl(dark);
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
  const NAV = '.pz-nav__title, #js-logo-nav';
  function showToggle() {
    const nav = document.querySelector(NAV);
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
    // (pages without the header, like Wordle's, never get a toggle: don't keep trying)
    new MutationObserver(() => {
      if (!document.getElementById('nytd-toggle')?.isConnected && document.querySelector(NAV)) later();
      else if (!panelQueued) { panelQueued = true; setTimeout(() => { panelQueued = false; markPanels(); }, 150); }
    }).observe(document.body, { childList: true, subtree: true });
    if (style.parentNode !== document.head) document.head.appendChild(style);
    apply();
  };
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch, { once: true });
  // stylesheets still loading can make a first look wrong: look at everything again once they're in
  window.addEventListener('load', () => { checked = new WeakMap(); markPanels(); }, { once: true });

  if (window.__NYTD_TEST__) window.__nytd = { apply, markPanels, get mode() { return mode; } };
})();
