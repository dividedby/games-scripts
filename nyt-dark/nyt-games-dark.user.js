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
  `;

  // ---------- switching ----------
  let added = { dark: false, settings: false }; // classes we put on <body>, so we only remove our own
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
    const b = document.body;
    if (!b) return;
    if (dark) {
      if (b.dataset.mode !== 'dark') b.dataset.mode = 'dark';
      if (!b.classList.contains('display-settings-enabled')) { b.classList.add('display-settings-enabled'); added.settings = true; }
      if (!b.classList.contains('dark')) { b.classList.add('dark'); added.dark = true; }
    } else {
      if (b.dataset.mode === 'dark') b.dataset.mode = 'light';
      if (added.settings) { b.classList.remove('display-settings-enabled'); added.settings = false; }
      if (added.dark) { b.classList.remove('dark'); added.dark = false; }
    }
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

  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; apply(); }); } };
  const watch = () => {
    // the game sometimes rewrites <body>'s attributes; put ours back
    new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-mode'] });
    // the header is rendered late; place the toggle when it appears
    new MutationObserver(() => { if (!document.getElementById('nytd-toggle')?.isConnected) later(); })
      .observe(document.body, { childList: true, subtree: true });
    if (style.parentNode !== document.head) document.head.appendChild(style);
    apply();
  };
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch, { once: true });

  if (window.__NYTD_TEST__) window.__nytd = { apply, get mode() { return mode; } };
})();
