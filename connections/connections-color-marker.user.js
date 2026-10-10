// ==UserScript==
// @name         Connections Palette
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  Color-code NYT Connections tiles as you work out the groups, then submit them in the order you choose, like purple first for a reverse rainbow
// @version      1.0.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @match        https://www.nytimes.com/games/connections*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js
// @updateURL    https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js
// ==/UserScript==

(() => {
  'use strict';

  // ORDER index matches the game's data-level on solved groups (0 yellow … 3 purple)
  const COLORS = [
    { key: 'yellow', hex: '#f9df6d', hotkey: '1' },
    { key: 'green',  hex: '#a0c35a', hotkey: '2' },
    { key: 'blue',   hex: '#b0c4ef', hotkey: '3' },
    { key: 'purple', hex: '#ba81c5', hotkey: '4' },
  ];
  const HEX = Object.fromEntries(COLORS.map(c => [c.key, c.hex]));
  const ORDER = COLORS.map(c => c.key);
  // sort modes, cycled by the Sort button: rows top-to-bottom in this color order, or off.
  // The same order decides what Go submits next and when Go asks "Sure?".
  const SORT_MODES = {
    reverse: { label: 'P→Y', title: 'Reverse rainbow: purple, blue, green, yellow', order: [...ORDER].reverse() },
    rainbow: { label: 'Y→P', title: 'Rainbow: yellow, green, blue, purple', order: ORDER },
    off:     { label: 'Off', title: 'Off: tiles stay in the game\'s order (Go still goes purple first)', order: null },
  };
  const SORT_CYCLE = ['reverse', 'rainbow', 'off'];
  const MAX_PER_COLOR = 4;
  const KEEP_DAYS = 60;
  const CONFIRM_MS = 4000;
  const GRACE_MS = 1500; // after "Sure?" expires, Go ignores taps this long so a late tap can't submit a different color

  let ready = false; // true once the first setup has run
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ls = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  // ---------- storage (per puzzle date, keyed by word so shuffles don't matter) ----------
  // Today's puzzle has no date in its URL, so it's filed under the day the page was opened:
  // left open past midnight, it still shows (and saves to) that day's puzzle.
  const openedOn = new Date().toLocaleDateString('en-CA');
  const puzzleId = () => location.pathname.match(/\d{4}-\d{2}-\d{2}/)?.[0] || openedOn;
  const marksKey = () => 'ccm:' + puzzleId();
  const maybeKey = () => 'ccm:maybe:' + puzzleId();
  const guessKey = () => 'ccm:guesses:' + puzzleId();
  const oldAwayKey = () => 'ccm:1away:' + puzzleId(); // before 0.5: one-away guesses only
  const USED_KEY = 'ccm:used';

  const up = s => String(s).trim().toUpperCase();
  // a tile's text holds the word twice (visible + screen-reader copy); only used when
  // the tile has no data-flip-id. Words like TARTAR are safe because flip ids come first.
  const undouble = s => {
    s = up(s);
    const h = s.length / 2;
    return s.length % 2 === 0 && s.slice(0, h) === s.slice(h) ? s.slice(0, h) : s;
  };

  function touch() {
    const used = ls.get(USED_KEY, {});
    used[puzzleId()] = Date.now();
    ls.set(USED_KEY, used);
  }
  const save = () => { ls.set(marksKey(), marks); ls.set(maybeKey(), maybes); touch(); };
  const saveGuesses = () => { ls.set(guessKey(), guesses); touch(); };

  // drop data for puzzles not touched in KEEP_DAYS (by last use, not puzzle date,
  // so archive puzzles you're playing now are kept)
  try {
    const used = ls.get(USED_KEY, {});
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    for (const k of Object.keys(localStorage)) {
      const d = k.match(/^ccm:(?:1away:|guesses:|maybe:)?(\d{4}-\d{2}-\d{2})$/)?.[1];
      if (!d) continue;
      if (!used[d]) used[d] = Date.now(); // first seen: start its clock now
      else if (used[d] < cutoff) ls.del(k);
    }
    for (const d of Object.keys(used)) if (used[d] < cutoff) delete used[d];
    ls.set(USED_KEY, used);
  } catch {}

  let marks = ls.get(marksKey(), {});
  // "maybe" colors: { word: [colors] } — an undecided tile's candidate colors (shown as a split
  // outline). A tile is either decided (one color, in marks) or undecided (here), never both;
  // only decided tiles count toward Go, auto-fill and the 4-per-color limit.
  let maybes = ls.get(maybeKey(), {});
  // wrong guesses for this puzzle, oldest first: { w: [4 words, sorted], away: was it "One away" }
  const loadGuesses = () => {
    const g = ls.get(guessKey(), null);
    if (g) return g;
    return ls.get(oldAwayKey(), []).map(w => ({ w, away: true })); // migrate
  };
  let guesses = loadGuesses();
  let lastId = puzzleId();

  const SORT_KEY = 'ccm:sort';
  let sortMode = (() => {
    let v; try { v = localStorage.getItem(SORT_KEY); } catch {}
    return SORT_MODES[v] ? v : v === '0' ? 'off' : 'reverse'; // '1'/'0' from older versions
  })();
  const COLLAPSE_KEY = 'ccm:collapsed';

  // ---------- settings (⚙ on the palette), saved per browser ----------
  const SETTINGS_KEY = 'ccm:settings';
  // help: one line shown in the panel; tip: the longer explanation, shown on hover
  const SETTINGS = [
    { key: 'oneAway',   def: false, label: 'Mark "One away" guesses', help: 'Red letters on tiles from one-away guesses' },
    { key: 'history',   def: false, label: 'Guess history', help: '📜 lists your wrong guesses',
      tip: '📜 on the palette lists your wrong guesses, with one-aways flagged. Repeating one reminds you whether it was one away' },
    { key: 'maybes',    def: false, label: 'Maybe colors', help: '? lets a tile be several colors at once',
      tip: 'With ? on, colors you tap are added to the selected tiles\' options, splitting the outline between them (yellow or green: half each). Tap a color again to remove it. Split tiles don\'t count toward Go, auto-fill or the 4-per-color limit until one color is left' },
    { key: 'autoFill',  def: true,  label: 'Auto-fill the last group', help: 'The last 4 tiles get the last color',
      tip: 'Once three colors have 4 tiles, the last 4 get the remaining color' },
    { key: 'reconcile', def: true,  label: 'Fix my colors after a solve', help: 'Swap colors to match solved groups',
      tip: 'If your purple turns out to be blue, swap purple and blue everywhere. Off: only the solved tiles change' },
    { key: 'goButton',  def: true,  label: 'Go button', help: 'Submits a color\'s 4 tiles for you' },
    { key: 'orderWarn', def: true,  label: 'Ask before going out of order', help: '"Sure?" before submitting out of order' },
    { key: 'letters',   def: false, label: 'Show color letters', help: 'Y/G/B/P letters, for colorblind players' },
    { key: 'keys',      def: true,  label: 'Keyboard shortcuts', help: '1–4 colors, 0 clear, Z undo, G go',
      tip: '1–4 colors, 0 clear, Z undo, G go, Esc lets go of a tapped color; with maybe colors on, M maybe mode and Shift+1–4 add or remove an option' },
    { key: 'left',      def: false, label: 'Palette on the left', help: 'Move the palette to the bottom-left' },
  ];
  const DEFAULTS = Object.fromEntries(SETTINGS.map(o => [o.key, o.def]));
  let settings = { ...DEFAULTS, ...ls.get(SETTINGS_KEY, {}) };
  const opt = k => settings[k];

  // ---------- reading the board ----------
  const tiles = () => [...document.querySelectorAll('[data-testid="card-label"]')];
  const wordOf = el => el.dataset.flipId ? up(el.dataset.flipId) : undouble(el.textContent);
  const isSelected = el => /selected/i.test(el.className); // the game's Card-module_selected class
  const selectedTiles = () => tiles().filter(isSelected);
  // the puzzle's 16 words once the board is fully known; counts ignore anything else
  let puzzleWords = null;
  const countOf = color => Object.entries(marks)
    .filter(([w, c]) => c === color && (!puzzleWords || puzzleWords.has(w))).length;

  const submitButton = () => document.querySelector('[data-testid="submit-btn"]') || gameButton(/^submit$/i);
  const attr = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const gameButton = re => [...document.querySelectorAll('button')]
    .find(b => re.test(b.textContent.trim()) && !panel.contains(b));

  // The game reacts to pointerdown, not click, so a plain el.click() only flips the
  // hidden checkbox without telling the game. Send the full sequence a real tap makes.
  function press(el) {
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, composed: true, button: 0,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
      pointerId: 1, pointerType: 'mouse', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', o));
    el.dispatchEvent(new MouseEvent('mousedown', o));
    el.dispatchEvent(new PointerEvent('pointerup', o));
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.click();
  }

  // solved groups: their real color (data-level, or background as a fallback) and words
  function solvedGroups() {
    return [...document.querySelectorAll('[data-testid="solved-category-container"]')].map(s => {
      let color = ORDER[+s.dataset.level];
      if (!color) {
        const bg = getComputedStyle(s).backgroundColor;
        color = COLORS.find(c => {
          const n = parseInt(c.hex.slice(1), 16);
          return bg === `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
        })?.key;
      }
      const words = [...s.querySelectorAll('ol li')].map(li => up(li.textContent)).filter(Boolean);
      return { color, words };
    }).filter(g => g.color && g.words.length === 4);
  }
  const solvedColors = () => new Set(solvedGroups().map(g => g.color));

  // the next color to submit: first unsolved one in the sort order (reverse rainbow when sort is off)
  const playOrder = () => SORT_MODES[sortMode].order || SORT_MODES.reverse.order;
  const nextColor = () => { const s = solvedColors(); return playOrder().find(c => !s.has(c)) || null; };

  // ---------- styles ----------
  // Everything with a color lives inside closed shadow roots (the palette, and a <ccm-mark>
  // overlay inside each tile), so page-darkening extensions like Dark Reader can't recolor
  // the marks. The page-level CSS below only positions things.
  const pageCss = document.createElement('style');
  pageCss.textContent = `
    [data-ccm], [data-ccm-away], [data-ccm-split] { position: relative; }
    ccm-mark { position: absolute; inset: 0; display: block; pointer-events: none; border-radius: inherit; z-index: 1; }
  `;
  document.head.appendChild(pageCss);

  const MARK_CSS = `
    :host { border-radius: inherit; }
    .ring { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 5px var(--c); }
    .dot {
      position: absolute; top: 6px; right: 6px; min-width: 12px; height: 12px; box-sizing: border-box;
      border-radius: 6px; background: var(--c); border: 1px solid rgba(0,0,0,.35);
      font: 800 10px/10px system-ui, sans-serif; color: #111; text-align: center;
    }
    .dot.letter { min-width: 16px; height: 16px; padding: 0 3px; border-radius: 8px; line-height: 14px; top: 5px; right: 5px; }
    .pie {
      position: absolute; inset: 0; border-radius: inherit; padding: 5px; background: var(--g);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
    }
    .away {
      position: absolute; left: 6px; bottom: 6px; font: 700 10px/1 system-ui, sans-serif; letter-spacing: 1px;
      color: #fff; background: #c0392b; border-radius: 4px; padding: 2px 3px;
    }
  `;

  const PANEL_CSS = `
    :host { all: initial; }
    #ccm-panel {
      --bg: rgba(255,255,255,.96); --fg: #222; --line: #ccc; --btn: #eee; --sheet: #fff; --muted: #666; --sep: #eee; --on: #000;
      position: fixed; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 2147483000;
      display: flex; gap: 6px; align-items: center; padding: 6px 8px;
      background: var(--bg); border: 1px solid var(--line); border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,.15); font: 600 12px/1 system-ui, sans-serif; color: var(--fg);
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-theme=dark]) #ccm-panel {
      --bg: rgba(32,33,34,.96); --fg: #eee; --line: #4a4b4c; --btn: #3a3b3c; --sheet: #26272a; --muted: #aaa; --sep: #3a3b3c; --on: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,.5);
    }
    button {
      min-width: 30px; height: 30px; border-radius: 6px; border: 2px solid transparent;
      cursor: pointer; font: inherit; color: var(--fg); background: var(--btn); padding: 0 6px; margin: 0;
    }
    button.swatch { color: #222; }
    button.active { border-color: var(--on); }
    .full { text-decoration: line-through; text-decoration-thickness: 2px; }
    .solved { opacity: .6; }
    .warn { background: #c0392b !important; color: #fff !important; opacity: 1; }
    .notready, .off { opacity: .45; }
    #ccm-panel.shake { animation: ccm-shake .3s; }
    #ccm-panel.collapsed > :not(.ccm-toggle) { display: none; }
    #ccm-panel.collapsed { padding: 4px; }
    #ccm-panel.left { right: auto; left: 12px; }
    .ccm-gear { font-size: 17px; line-height: 1; }
    .ccm-undo, .ccm-erase { font-size: 15px; }
    .ccm-toggle { font-size: 14px; }
    #ccm-panel.nogo .ccm-go { display: none; }
    #ccm-settings {
      position: absolute; right: 0; bottom: calc(100% + 8px); width: 270px; max-width: calc(100vw - 24px);
      background: var(--sheet); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      padding: 10px 12px; font: 500 13px/1.3 system-ui, sans-serif; color: var(--fg); cursor: default;
      max-height: calc(100vh - 90px); overflow-y: auto; box-sizing: border-box;
    }
    #ccm-history {
      position: absolute; right: 0; bottom: calc(100% + 8px); width: 290px; max-width: calc(100vw - 24px); box-sizing: border-box;
      background: var(--sheet); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      padding: 10px 12px; font: 500 13px/1.35 system-ui, sans-serif; color: var(--fg); cursor: default;
      max-height: calc(100vh - 90px); overflow-y: auto;
    }
    #ccm-history ol { margin: 0; padding-left: 20px; }
    #ccm-history li { padding: 3px 0; }
    #ccm-history .away { font: 700 10px/1 system-ui, sans-serif; color: #fff; background: #c0392b; border-radius: 4px; padding: 2px 4px; white-space: nowrap; }
    #ccm-history .empty { margin: 0; color: var(--muted); }
    #ccm-note {
      position: absolute; right: 0; bottom: calc(100% + 8px); white-space: nowrap;
      background: #222; color: #fff; border-radius: 8px; padding: 8px 10px; font: 600 13px/1 system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,.25);
    }
    #ccm-panel.left #ccm-settings, #ccm-panel.left #ccm-history, #ccm-panel.left #ccm-note { right: auto; left: 0; }
    #ccm-settings[hidden], #ccm-history[hidden], #ccm-note[hidden] { display: none; }
    #ccm-panel.nohist .ccm-hist, #ccm-panel.nomaybe .ccm-maybe { display: none; }
    .ccm-maybe { font-weight: 800; }
    #ccm-panel.maybemode .ccm-maybe { background: var(--fg); color: var(--bg); border-color: var(--fg); }
    #ccm-panel.maybemode button.swatch { border: 2px dashed var(--fg); }
    /* Open palette, two rows: the colors and Go on top, the tools below (a zero-height
       ::after item breaks the line). CSS order only; the buttons' DOM order never changes. */
    #ccm-panel { flex-wrap: wrap; max-width: calc(100vw - 24px); box-sizing: border-box; }
    #ccm-panel:not(.collapsed) { width: 290px; row-gap: 0; }
    #ccm-panel:not(.collapsed)::after { content: ''; order: 3; flex-basis: 100%; height: 0; margin-top: 6px; }
    #ccm-panel:not(.collapsed) > button { order: 4; flex: 1 1 auto; }
    #ccm-panel:not(.collapsed) > button.swatch { order: 1; flex: 1 1 0; height: 36px; }
    #ccm-panel:not(.collapsed) > .ccm-go { order: 2; flex: 1.6 1 0; height: 36px; }
    .ccm-more { display: none; font-size: 18px; }
    h4 { margin: 0 0 6px; font: 700 13px/1.2 system-ui, sans-serif; }
    label { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; cursor: pointer; }
    input { margin: 2px 0 0; width: 16px; height: 16px; flex: none; accent-color: #6a6958; }
    small { display: block; color: var(--muted); font-size: 11px; }
    .row { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--sep); }
    .row button { flex: 1; height: 30px; font: 600 12px system-ui, sans-serif; }
    /* keyboard shortcuts mean nothing on a touch-only device */
    @media (hover: none) and (pointer: coarse) { label.desk { display: none; } }
    @keyframes ccm-shake { 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
    @media (max-width: 480px) {
      #ccm-panel { right: 6px; bottom: calc(6px + env(safe-area-inset-bottom, 0px)); gap: 3px; padding: 4px 5px; max-width: calc(100vw - 12px); }
      #ccm-panel.left { right: auto; left: 6px; }
      #ccm-panel.offboard { bottom: calc(76px + env(safe-area-inset-bottom, 0px)); } /* clear NYT's buttons and banners */
      label { padding: 7px 0; }
      #ccm-panel > button { min-width: 30px; height: 42px; padding: 0 4px; }
      /* open on a phone: one full-width row (colors, ⌫, ↶, ?, Go, ⋯) so it stays clear of the
         game's buttons; ⋯ swaps that row for the other tools (sort, 📜, ⚙, hide) and back,
         so the palette never grows over Shuffle and Submit */
      #ccm-panel:not(.collapsed) { left: 6px; right: 6px; width: auto; max-width: none; column-gap: 3px; }
      #ccm-panel:not(.collapsed) > button { flex: 1 1 auto; min-width: 26px; padding: 0 2px; height: 42px; }
      #ccm-panel:not(.collapsed) > button.swatch { order: 1; flex: 1.3 1 0; height: 42px; }
      #ccm-panel:not(.collapsed) > :is(.ccm-erase, .ccm-undo, .ccm-maybe) { order: 2; }
      #ccm-panel:not(.collapsed) > .ccm-go { order: 3; flex: 1.6 1 0; height: 42px; }
      #ccm-panel:not(.collapsed) > .ccm-more { order: 4; display: block; flex: 0 0 44px; }
      #ccm-panel:not(.collapsed)::after { display: none; }
      #ccm-panel:not(.collapsed) > :is(.ccm-sort, .ccm-hist, .ccm-gear, .ccm-toggle) { order: 3; }
      #ccm-panel:not(.collapsed):not(.more) > :is(.ccm-sort, .ccm-hist, .ccm-gear, .ccm-toggle),
      #ccm-panel.more:not(.collapsed) > :is(.swatch, .ccm-erase, .ccm-undo, .ccm-maybe, .ccm-go) { display: none; }
    }
  `;

  // dark when NYT's own dark mode or Dark Reader is on
  const isDark = () => document.body?.dataset.mode === 'dark' || document.body?.classList.contains('dark') ||
    document.documentElement.dataset.darkreaderScheme === 'dark';

  // ---------- panel ----------
  const host = document.createElement('div');
  host.id = 'ccm-root';
  const shadow = host.attachShadow({ mode: 'closed' });
  // tests, or localStorage 'ccm:debug' = 'true' for live testing: lets page scripts reach the palette
  if (window.__CCM_TEST__ || ls.get('ccm:debug', false) === true) window.__ccmRoot = shadow;
  const shadowCss = document.createElement('style');
  shadowCss.textContent = PANEL_CSS;
  shadow.appendChild(shadowCss);
  const panel = document.createElement('div');
  panel.id = 'ccm-panel';
  panel.title = 'Select tiles, then tap a color to mark them (⌫ removes marks). With nothing selected: tap two colors to swap them, or a color then Go to submit it; Go alone submits the next color. ⚙ for settings.';
  const addButton = (label, onClick, bg) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (bg) b.style.background = bg;
    b.addEventListener('mousedown', e => e.preventDefault()); // keep focus on the board
    b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
    panel.appendChild(b);
    return b;
  };
  const btns = {};
  for (const c of COLORS) { btns[c.key] = addButton('0', () => assign(c.key), c.hex); btns[c.key].classList.add('swatch'); }
  const eraseBtn = addButton('⌫', () => assign('erase'));
  eraseBtn.classList.add('ccm-erase');
  eraseBtn.title = 'Remove the color from the selected tiles';
  eraseBtn.setAttribute('aria-label', 'Remove color');
  const undoBtn = addButton('↶', () => undo());
  undoBtn.classList.add('ccm-undo');
  undoBtn.title = 'Undo your last color change';
  const sortBtn = addButton('', () => {
    sortMode = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length];
    try { localStorage.setItem(SORT_KEY, sortMode); } catch {}
    showSort();
    apply();
  });
  function showSort() {
    const m = SORT_MODES[sortMode];
    sortBtn.textContent = m.label;
    sortBtn.title = m.title + ' (tap to change)';
    sortBtn.classList.toggle('active', !!m.order);
  }
  sortBtn.classList.add('ccm-sort');
  showSort();
  const goBtn = addButton('Go ▶', () => onGo());
  goBtn.classList.add('ccm-go');
  const maybeBtn = addButton('?', () => setMaybeMode(!maybeMode));
  maybeBtn.classList.add('ccm-maybe');
  maybeBtn.title = 'Maybe mode: colors you tap are added to the tiles\' options instead of replacing their color';
  let maybeMode = false;
  function setMaybeMode(on) {
    const was = maybeMode;
    maybeMode = !!on && opt('maybes');
    maybeBtn.classList.toggle('active', maybeMode);
    maybeBtn.setAttribute('aria-pressed', String(maybeMode));
    panel.classList.toggle('maybemode', maybeMode);
    if (maybeMode) arm(null);
    else if (was && ready) apply(); // catch up on the sorting held back during maybe mode
  }
  const histBtn = addButton('📜', () => toggleHistory());
  histBtn.classList.add('ccm-hist');
  histBtn.title = 'Your wrong guesses on this puzzle';
  const gearBtn = addButton('⚙', () => toggleSettings());
  gearBtn.title = 'Settings';
  gearBtn.classList.add('ccm-gear');

  // settings popover
  const sheet = document.createElement('div');
  sheet.id = 'ccm-settings';
  sheet.hidden = true;
  sheet.innerHTML = '<h4>Color Marker settings</h4>' +
    SETTINGS.map(o => `<label${o.key === 'keys' ? ' class="desk"' : ''} title="${attr(o.tip || o.help)}"><input type="checkbox" data-k="${o.key}"><span>${o.label}<small>${o.help}</small></span></label>`).join('') +
    '<div class="row"><button type="button" data-act="clear">Clear this puzzle</button><button type="button" data-act="reset">Reset settings</button></div>';
  sheet.addEventListener('click', e => e.stopPropagation());
  sheet.addEventListener('change', e => {
    const k = e.target.dataset?.k;
    if (!k) return;
    settings[k] = e.target.checked;
    ls.set(SETTINGS_KEY, settings);
    applySettings();
  });
  sheet.querySelector('[data-act=clear]').addEventListener('click', () => {
    if (confirm('Clear all color marks for this puzzle?')) { remember(); marks = {}; maybes = {}; save(); apply(); }
  });
  sheet.querySelector('[data-act=reset]').addEventListener('click', () => {
    settings = { ...DEFAULTS };
    ls.set(SETTINGS_KEY, settings);
    applySettings();
  });
  panel.appendChild(sheet);
  const histSheet = document.createElement('div');
  histSheet.id = 'ccm-history';
  histSheet.hidden = true;
  histSheet.addEventListener('click', e => e.stopPropagation());
  panel.appendChild(histSheet);
  const noteEl = document.createElement('div');
  noteEl.id = 'ccm-note';
  noteEl.hidden = true;
  panel.appendChild(noteEl);
  function toggleSettings(open = sheet.hidden) {
    sheet.hidden = !open;
    gearBtn.classList.toggle('active', open);
    if (open) toggleHistory(false);
  }
  document.addEventListener('click', e => {
    if (e.composedPath().includes(host)) return;
    if (!sheet.hidden) toggleSettings(false);
    if (!histSheet.hidden) toggleHistory(false);
  });
  function applySettings() {
    for (const box of sheet.querySelectorAll('input[data-k]')) box.checked = !!settings[box.dataset.k];
    panel.classList.toggle('left', opt('left'));
    panel.classList.toggle('nogo', !opt('goButton'));
    panel.classList.toggle('nohist', !opt('history'));
    panel.classList.toggle('nomaybe', !opt('maybes'));
    if (!opt('maybes')) setMaybeMode(false);
    if (!opt('history')) toggleHistory(false);
    if (ready) apply();
  }
  // The palette stays tucked away until a puzzle board is on screen (not on the Play splash
  // or the results page). On the board it follows your own ▾/🎨 choice.
  let userCollapsed = ls.get(COLLAPSE_KEY, false);
  let onBoard = false;
  let peek = false; // 🎨 tapped while no board is showing
  const toggleBtn = addButton('▾', () => {
    if (!onBoard) { peek = !peek; showCollapsed(); return; }
    userCollapsed = !userCollapsed;
    ls.set(COLLAPSE_KEY, userCollapsed);
    showCollapsed();
  });
  toggleBtn.classList.add('ccm-toggle');
  // phones only: ⋯ swaps the row to the less-used tools; ‹ swaps back
  const moreBtn = addButton('⋯', () => showMore(!panel.classList.contains('more')));
  moreBtn.classList.add('ccm-more');
  function showMore(on) {
    panel.classList.toggle('more', on);
    moreBtn.textContent = on ? '‹' : '⋯';
    moreBtn.title = on ? 'Back to the colors' : 'More: sort, history, settings, hide';
  }
  showMore(false);
  function showCollapsed() {
    const on = onBoard ? userCollapsed : !peek;
    panel.classList.toggle('collapsed', on);
    panel.classList.toggle('offboard', !onBoard);
    if (on) { toggleSettings(false); toggleHistory(false); showMore(false); }
    toggleBtn.textContent = on ? '🎨' : '▾';
    toggleBtn.title = on ? 'Show the color palette' : 'Hide the palette';
  }
  showCollapsed();
  shadow.appendChild(panel);
  document.body.appendChild(host);
  function showTheme() {
    const t = isDark() ? 'dark' : 'light';
    if (host.dataset.theme !== t) host.dataset.theme = t;
  }

  // a color tapped with nothing selected: waiting for a second color (swap) or Go (submit)
  let armed = null;
  function arm(c) {
    armed = c;
    for (const k of ORDER) { btns[k].classList.toggle('active', k === c); btns[k].setAttribute('aria-pressed', String(k === c)); }
    clearConfirm();
    showGo();
  }
  function shake() {
    panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake');
  }
  panel.addEventListener('animationend', () => panel.classList.remove('shake'));

  // Go is tinted with the color it will submit
  function showGo() {
    if (confirmFor) return;
    const c = armed || nextColor();
    goBtn.textContent = 'Go ▶';
    goBtn.style.background = c ? HEX[c] : '';
    const n = c ? tiles().filter(t => marks[wordOf(t)] === c).length : 0;
    const full = n === 4;
    goBtn.classList.toggle('notready', !full); // dimmed: Go would just shake
    goBtn.title = !c ? 'Nothing left to submit'
      : !full ? `${c} needs 4 tiles to submit (has ${n})`
      : armed ? `Select the 4 ${armed} tiles and submit`
      : `Submit the next color in order (${c})`;
  }

  function swapColors(a, b) {
    const flip = c => c === a ? b : c === b ? a : c;
    for (const [w, c] of Object.entries(marks)) marks[w] = flip(c);
    for (const [w, cs] of Object.entries(maybes)) maybes[w] = sortColors(cs.map(flip));
  }
  const sortColors = cs => ORDER.filter(c => cs.includes(c));
  // keeps each tile either decided or undecided. An undecided tile down to one candidate
  // becomes that color's mark when the color has room (else it stays a dashed one-color maybe).
  function settle() {
    for (const w of Object.keys(maybes)) {
      const cs = sortColors([...(maybes[w] || []), ...(marks[w] ? [marks[w]] : [])]);
      if (!cs.length) delete maybes[w];
      else if (cs.length === 1 && (marks[w] === cs[0] || countOf(cs[0]) < MAX_PER_COLOR)) {
        marks[w] = cs[0]; delete maybes[w];
      } else { maybes[w] = cs; delete marks[w]; }
    }
  }
  const snapshot = () => JSON.stringify({ m: marks, y: maybes });
  function restore(snap) {
    const o = JSON.parse(snap);
    marks = o.m; maybes = o.y;
  }

  // ---------- undo: snapshots of your marks before each change you make ----------
  let undoStack = [];
  const UNDO_LIMIT = 50;
  function remember() {
    undoStack.push(snapshot());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    showUndo();
  }
  function showUndo() { undoBtn.classList.toggle('off', !undoStack.length); }
  function undo() {
    if (submitting || !undoStack.length) { shake(); return; }
    restore(undoStack.pop());
    arm(null);
    save();
    apply();
    showUndo();
  }

  // ---------- assign color to the current selection, then deselect ----------
  function assign(color) {
    if (submitting) return; // Go is selecting tiles; don't recolor them mid-submit
    const sel = selectedTiles();
    const solved = solvedColors();
    if (!sel.length) {
      if (maybeMode) { shake(); return; } // maybes go on selected tiles
      if (!HEX[color] || solved.has(color)) { arm(null); shake(); return; } // nothing to arm
      if (!armed) { arm(color); return; }
      if (armed !== color) { remember(); swapColors(armed, color); save(); apply(); }
      arm(null);
      return;
    }
    arm(null);
    const words = sel.map(wordOf);
    const before = snapshot();
    if (color === 'erase') {
      for (const w of words) { delete marks[w]; delete maybes[w]; }
    } else if (maybeMode) {
      // toggle the tapped color among the selection's options (on for all if any lacks it):
      // one option is a plain mark, two or more split the outline
      if (solved.has(color)) { shake(); return; }
      const opts = w => maybes[w] || (marks[w] ? [marks[w]] : []);
      const add = words.some(w => !opts(w).includes(color));
      for (const w of words) {
        const cs = new Set(opts(w));
        if (add) cs.add(color); else cs.delete(color);
        delete marks[w];
        if (cs.size) maybes[w] = sortColors([...cs]); else delete maybes[w];
      }
      settle();
      if (opt('autoFill')) autoFill(); // a split down to one color may have filled a third color
    } else {
      if (solved.has(color)) { shake(); return; } // that group is already solved
      const incoming = words.filter(w => marks[w] !== color);
      const outgoing = words.filter(w => marks[w] === color);
      if (countOf(color) + incoming.length > MAX_PER_COLOR) {
        // color is full: if you selected as many of its tiles as new ones, exchange them,
        // e.g. TENOR (blue) + LAB (purple) → purple makes TENOR purple and LAB blue
        if (!outgoing.length || outgoing.length !== incoming.length) { shake(); return; } // selection stays
        incoming.forEach((w, i) => {
          const old = marks[w];
          if (old) marks[outgoing[i]] = old; else delete marks[outgoing[i]];
          if (maybes[w]) { maybes[outgoing[i]] = maybes[w]; delete maybes[w]; } // an undecided tile's options move too
          marks[w] = color;
        });
      } else {
        for (const w of incoming) { marks[w] = color; delete maybes[w]; }
        if (opt('autoFill')) autoFill();
      }
      settle();
    }
    if (snapshot() !== before) { undoStack.push(before); if (undoStack.length > UNDO_LIMIT) undoStack.shift(); showUndo(); }
    save();
    apply();
    deselectAll();
  }

  // three colors have 4 each and exactly 4 tiles are left (blank, split, or already the last
  // color) → they all get the last color. Counts include words from groups you've already
  // solved, so it works mid-game too.
  function autoFill() {
    const full = ORDER.filter(k => countOf(k) === MAX_PER_COLOR);
    if (full.length !== 3) return;
    const last = ORDER.find(k => !full.includes(k));
    const rest = tiles().map(wordOf).filter(w => !marks[w] || marks[w] === last);
    if (rest.length !== 4) return;
    for (const w of rest) { marks[w] = last; delete maybes[w]; }
  }

  // ---------- after a group is solved, correct the colors to match the game ----------
  // If what you marked purple turns out to be blue, purple and blue swap everywhere, so the
  // tiles you had as blue become purple. A swap needs at least 3 of the 4 words to share a
  // color, so one stray tile can't trigger it. Afterwards a solved color is used up: any
  // other tile still wearing it gets unmarked. Safe to run repeatedly.
  function reconcileSolved(groups) {
    if (!groups.length) return;
    const before = snapshot();
    for (const { color: real, words } of groups) {
      if (!opt('reconcile')) { for (const w of words) marks[w] = real; continue; } // only the solved tiles
      const tally = {};
      for (const w of words) if (marks[w]) tally[marks[w]] = (tally[marks[w]] || 0) + 1;
      const guessed = Object.keys(tally).find(c => tally[c] >= 3);
      if (guessed && guessed !== real) swapColors(guessed, real);
      for (const w of words) marks[w] = real;
    }
    if (opt('reconcile')) {
      const solvedAs = new Map(groups.flatMap(g => g.words.map(w => [w, g.color])));
      const solved = new Set(groups.map(g => g.color));
      for (const [w, c] of Object.entries(marks)) {
        if (solved.has(c) && solvedAs.get(w) !== c) delete marks[w];
      }
    }
    // a solved color drops out of every undecided tile (yellow-or-green becomes green once
    // yellow is solved), and solved tiles are decided
    const solvedWords = new Set(groups.flatMap(g => g.words));
    const solvedSet = new Set(groups.map(g => g.color));
    for (const [w, cs] of Object.entries(maybes)) {
      const keep = solvedWords.has(w) ? [] : cs.filter(c => !solvedSet.has(c));
      if (keep.length) maybes[w] = keep; else delete maybes[w];
    }
    settle();
    if (snapshot() !== before) save();
  }

  // ---------- guess history ----------
  // Every Submit (yours or Go's) is watched: a guess that solves a group is forgotten, one the
  // game counts as a mistake is kept, flagged if the game said "One away". Recorded always
  // (it's just this browser's storage); the settings only decide what's shown.
  const mistakesLeft = () => {
    const n = parseInt(document.querySelector('[data-testid="mistake-count"]')?.textContent, 10);
    return Number.isNaN(n) ? null : n;
  };
  const sameGuess = (a, b) => a.join('|') === b.join('|');
  let pending = null; // { w, before, away, recorded }
  let pollTimer = null;
  window.addEventListener('click', e => {
    const b = e.target.closest?.('button');
    if (!b || b !== submitButton()) return;
    const w = selectedTiles().map(wordOf).sort();
    if (w.length !== 4) return;
    const old = guesses.find(g => sameGuess(g.w, w));
    if (old) { // the game will just say "Already guessed"
      if (opt('history')) note(old.away ? 'Already guessed · it was one away' : 'Already guessed');
      return;
    }
    pending = { w, before: mistakesLeft(), away: false, recorded: null, at: Date.now() };
    clearInterval(pollTimer);
    pollTimer = setInterval(() => { if (!pending || Date.now() - pending.at > 6000) { pending = null; clearInterval(pollTimer); } else apply(); }, 150);
  }, true);
  function checkGuess() {
    if (!pending) return;
    const p = pending;
    if (solvedGroups().some(g => p.w.every(w => g.words.includes(w)))) { pending = null; return; } // right
    const toast = document.querySelector('[data-testid="connection-toast"]')?.textContent || '';
    if (/one away/i.test(toast)) p.away = true;
    const left = mistakesLeft();
    if (!p.recorded && p.before != null && left != null && left < p.before) {
      p.recorded = { w: p.w, away: p.away };
      guesses.push(p.recorded);
      saveGuesses();
    } else if (p.recorded && p.away && !p.recorded.away) { // toast showed up after the count dropped
      p.recorded.away = true;
      saveGuesses();
    }
  }

  // a short note above the palette (e.g. a repeated guess)
  let noteTimer = null;
  function note(text) {
    noteEl.textContent = text;
    noteEl.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { noteEl.hidden = true; }, 2600);
  }

  function renderHistory() {
    const wrong = guesses.length;
    const label = '📜' + (wrong ? wrong : '');
    if (histBtn.textContent !== label) histBtn.textContent = label;
    if (histSheet.hidden) return;
    histSheet.innerHTML = '<h4>Wrong guesses</h4>' + (wrong
      ? '<ol>' + guesses.map(g => `<li>${g.w.map(x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;')).join(' · ')}${g.away ? ' <span class="away">one away</span>' : ''}</li>`).join('') + '</ol>'
      : '<p class="empty">No wrong guesses yet.</p>');
  }
  function toggleHistory(open = histSheet.hidden) {
    histSheet.hidden = !open;
    histBtn.classList.toggle('active', open);
    if (open) { toggleSettings(false); renderHistory(); }
  }

  // ---------- Go: submit the armed color, or the next one in order ----------
  let confirmFor = null, confirmTimer = null;
  let goQuietUntil = 0;
  function clearConfirm() {
    clearTimeout(confirmTimer);
    confirmFor = null;
    goBtn.classList.remove('warn');
  }
  function onGo() {
    if (submitting || !opt('goButton')) return;
    if (Date.now() < goQuietUntil) { shake(); return; } // a tap meant for an expired "Sure?"
    const next = nextColor();
    const color = armed || next;
    if (!color) { shake(); return; }
    if (tiles().filter(t => marks[wordOf(t)] === color).length !== 4) { arm(null); shake(); return; }
    // out of order? ask once: Go turns red "Sure?", a second tap within 4s submits
    if (opt('orderWarn') && SORT_MODES[sortMode].order && armed && next && armed !== next && confirmFor !== armed) {
      clearConfirm();
      confirmFor = armed;
      goBtn.textContent = 'Sure?';
      goBtn.title = `${armed} before ${next} breaks the ${SORT_MODES[sortMode].title.split(':')[0].toLowerCase()} order. Tap again to submit anyway.`;
      goBtn.classList.add('warn');
      confirmTimer = setTimeout(() => { arm(null); showGo(); goQuietUntil = Date.now() + GRACE_MS; }, CONFIRM_MS); // let go of the color too
      return;
    }
    clearConfirm();
    submitColor(color);
  }

  // select a color's 4 tiles, then press the game's Submit
  let submitting = false;
  async function submitColor(color) {
    const targets = tiles().filter(t => marks[wordOf(t)] === color).map(wordOf);
    if (targets.length !== 4) { arm(null); shake(); return; } // need exactly 4 of that color on the board
    submitting = true;
    arm(null);
    try {
      if (selectedTiles().length) await deselectAll();
      for (const w of targets) {
        const t = tiles().find(x => wordOf(x) === w); // re-find in case of re-render
        if (t && !isSelected(t)) { press(t); await sleep(80); }
      }
      // wait for the game to register all 4 and enable Submit. Presses made while the game
      // is still animating a solve can be dropped, so press any that didn't take again.
      for (let i = 0; i < 40; i++) {
        if (i % 8 === 7) {
          const sel = selectedTiles().map(wordOf);
          if (sel.length < 4 && sel.every(w => targets.includes(w)))
            for (const w of targets) {
              const t = tiles().find(x => wordOf(x) === w);
              if (t && !isSelected(t)) { press(t); await sleep(80); }
            }
        }
        const btn = submitButton();
        const sel = selectedTiles().map(wordOf);
        if (btn && !btn.disabled && sel.length === 4 && targets.every(w => sel.includes(w))) {
          btn.click();
          return;
        }
        await sleep(50);
      }
      shake(); // couldn't confirm the selection; leave it for you to check and submit by hand
    } finally {
      submitting = false;
    }
  }

  // press the game's own "Deselect All" button, then tap off anything still selected
  async function deselectAll() {
    const btn = gameButton(/deselect\s*all/i);
    if (btn && !btn.disabled) { btn.click(); await sleep(150); }
    for (const t of tiles()) if (isSelected(t)) { press(t); await sleep(60); }
  }

  // Once all 16 words are known (board + solved groups), saved marks for words that aren't
  // in this puzzle are leftovers. Old versions saved tile text doubled ("LITTLELITTLE");
  // those are renamed to the real word, anything else is dropped.
  function tidyKeys(groups) {
    const words = new Set([...tiles().map(wordOf), ...groups.flatMap(g => g.words)]);
    if (words.size !== 16) { puzzleWords = null; return; }
    // just moved to another date in the same page: wait until its board has rendered,
    // or the old board's words would make every new mark look like a leftover
    const sig = [...words].sort().join('|');
    if (staleBoard && sig === staleBoard) { puzzleWords = null; return; }
    staleBoard = null;
    puzzleWords = words;
    let changed = false;
    for (const store of [marks, maybes]) {
      const keys = Object.keys(store);
      if (keys.length && !keys.some(k => words.has(k) || words.has(undouble(k)))) continue; // none fit: wrong board, keep them
      for (const k of keys) {
        if (words.has(k)) continue;
        const u = undouble(k);
        if (u !== k && words.has(u) && !store[u]) store[u] = store[k];
        delete store[k];
        changed = true;
      }
    }
    if (changed) save();
  }

  // ---------- the colored overlay inside each marked tile ----------
  let staleBoard = null; // the previous puzzle's words, right after a date change
  const markRoots = new WeakMap(); // <ccm-mark> → its closed shadow root
  function drawMark(tile, color, away, maybe = []) {
    let m = [...tile.children].find(n => n.localName === 'ccm-mark');
    if (!color && !away && !maybe.length) { if (m) m.remove(); return; }
    const key = `${color || ''}|${away}|${opt('letters') ? 1 : 0}|${maybe.join(',')}`;
    if (m && m.dataset.k === key) return; // already drawn
    if (!m) {
      m = document.createElement('ccm-mark');
      const r = m.attachShadow({ mode: 'closed' });
      markRoots.set(m, r);
      tile.appendChild(m);
    }
    m.dataset.k = key;
    const r = markRoots.get(m);
    const cs = color ? [color] : maybe;
    const letters = opt('letters') ? cs.map(c => c[0].toUpperCase()).join('') : '';
    // decided: a solid outline. Undecided: the outline split like a pie, one slice per
    // candidate color clockwise from the top; a lone candidate (its color is full) is dashed.
    const fill = cs.length > 1
      ? `conic-gradient(${cs.map((c, i) => `${HEX[c]} ${i * 100 / cs.length}% ${(i + 1) * 100 / cs.length}%`).join(', ')})`
      : !color && cs.length ? `repeating-conic-gradient(${HEX[cs[0]]} 0 6deg, transparent 0 12deg)` : '';
    r.innerHTML = `<style>${MARK_CSS}</style>` +
      (color ? `<div class="ring" style="--c:${HEX[color]}"></div>` : '') +
      (fill ? `<div class="pie" style="--g:${fill}"></div>` : '') +
      // the corner dot only appears to carry letters
      (letters ? `<div class="dot letter" style="--c:${cs.length > 1 ? '#fff' : HEX[cs[0]]}">${letters}</div>` : '') +
      (away ? `<div class="away">${away}</div>` : '');
  }

  // ---------- draw everything ----------
  function apply() {
    if (puzzleId() !== lastId) { // moved to another date
      const old = new Set([...tiles().map(wordOf), ...solvedGroups().flatMap(g => g.words)]);
      staleBoard = old.size === 16 ? [...old].sort().join('|') : null;
      lastId = puzzleId();
      marks = ls.get(marksKey(), {});
      maybes = ls.get(maybeKey(), {});
      guesses = loadGuesses();
      pending = null;
      undoStack = [];
      showUndo();
      arm(null);
      if (maybeMode) { maybeMode = false; maybeBtn.classList.remove('active'); maybeBtn.setAttribute('aria-pressed', 'false'); panel.classList.remove('maybemode'); }
    }
    checkGuess();
    const groups = solvedGroups();
    tidyKeys(groups);
    const unsettled = snapshot();
    settle(); // also merges 0.6 data, where a tile could have a mark and maybes
    if (snapshot() !== unsettled) save();
    reconcileSolved(groups);
    const solved = new Set(groups.map(g => g.color));

    // letter badges for "One away" guesses (A = first, B = second, …)
    const badge = {};
    // a guess is settled once a solved group holds 3 of its words; its badge is dropped
    // (letters stay the same for the others)
    const aways = guesses.filter(g => g.away).map(g => g.w);
    if (opt('oneAway')) aways.forEach((g, i) => {
      if (groups.some(sg => g.filter(w => sg.words.includes(w)).length >= 3)) return;
      g.forEach(w => { badge[w] = (badge[w] || '') + String.fromCharCode(65 + i); });
    });

    const ts = tiles();
    const present = new Set();
    for (const el of ts) {
      const w = wordOf(el);
      present.add(w);
      const c = HEX[marks[w]] ? marks[w] : null;
      if (c) { if (el.dataset.ccm !== c) el.dataset.ccm = c; }
      else if (el.dataset.ccm) delete el.dataset.ccm;
      if (badge[w]) { if (el.dataset.ccmAway !== badge[w]) el.dataset.ccmAway = badge[w]; }
      else if (el.dataset.ccmAway) delete el.dataset.ccmAway;
      const split = !c && maybes[w]?.length ? maybes[w].join(',') : '';
      if (split) { if (el.dataset.ccmSplit !== split) el.dataset.ccmSplit = split; }
      else if (el.dataset.ccmSplit) delete el.dataset.ccmSplit;
      drawMark(el, c, badge[w] || '', c ? [] : (maybes[w] || []));
    }
    for (const k of ORDER) {
      const n = [...present].filter(w => marks[w] === k).length;
      const label = (opt('letters') ? k[0].toUpperCase() : '') + (solved.has(k) ? '✓' : n);
      if (btns[k].textContent !== label) { // only touch the DOM on change
        btns[k].textContent = label;
        const name = k[0].toUpperCase() + k.slice(1);
        btns[k].setAttribute('aria-label', solved.has(k) ? `${name}, solved` : `${name}, ${n} marked`);
        btns[k].title = solved.has(k) ? `${name} is solved` : `${name}: ${n} of 4 marked. Tap to color the selected tiles`;
      }
      btns[k].classList.toggle('solved', solved.has(k));
      btns[k].classList.toggle('full', !solved.has(k) && n === MAX_PER_COLOR);
    }
    if (armed && solved.has(armed)) arm(null);
    showGo();
    showTheme();
    renderHistory();
    if (onBoard !== ts.length > 0) { onBoard = ts.length > 0; peek = false; showCollapsed(); }
    arrange(ts);
  }

  // ---------- visual grouping ----------
  // Uses CSS `order` on the board's grid cells, so it only moves tiles on screen.
  // The game's own state is untouched; Shuffle still shuffles and the grouping is reapplied.
  function boardOf(ts) {
    if (ts.length < 2) return null;
    let b = ts[0].parentElement;
    while (b && !ts.every(t => b.contains(t))) b = b.parentElement;
    return b;
  }
  function cellOf(t, board) {
    let n = t;
    while (n.parentElement && n.parentElement !== board) n = n.parentElement;
    return n;
  }
  const setOrder = (el, v) => { if (el.style.order !== v) el.style.setProperty('order', v); };
  let lastBoard = null;
  function arrange(ts) {
    const board = boardOf(ts) || lastBoard;
    if (!board) return;
    lastBoard = board;
    const sortOrder = SORT_MODES[sortMode].order;
    if (!sortOrder) {
      for (const c of board.children) if (c.style.order) c.style.removeProperty('order');
      return;
    }
    if (!/grid|flex/.test(getComputedStyle(board).display)) return; // layout we can't reorder
    // in maybe mode tiles hold still while you add options; they re-sort when ? goes off
    // (unless the board itself changed, like a newly solved row, which needs placing)
    if (maybeMode && [...board.children].every(c => c.style.order !== '')) return;
    const cells = ts.map(t => cellOf(t, board));
    const cellSet = new Set(cells);
    // anything else on the board (solved-group rows) stays on top, in its own order
    [...board.children].forEach((c, i) => { if (!cellSet.has(c)) setOrder(c, String(i - 1000)); });
    const unmarked = [];
    const split = []; // undecided tiles stay together, matching combinations side by side
    const byColor = Object.fromEntries(ORDER.map(k => [k, []]));
    ts.forEach((t, i) => {
      const w = wordOf(t);
      if (byColor[marks[w]]) byColor[marks[w]].push(cells[i]);
      else if (maybes[w]?.length) split.push([maybes[w].map(c => sortOrder.indexOf(c)).sort((a, b) => a - b), cells[i]]);
      else unmarked.push(cells[i]);
    });
    // by combination, in sort order: purple-or-blue, then purple-or-blue-or-green, then purple-or-green, …
    const byCombo = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
    split.sort((a, b) => byCombo(a[0], b[0]));
    const seq = [];
    for (const k of sortOrder) {
      if (!byColor[k].length) continue;
      seq.push(...byColor[k]);
      // pad the row with blank tiles, then splits if there aren't enough
      while (seq.length % 4 && (unmarked.length || split.length)) seq.push(unmarked.length ? unmarked.shift() : split.shift()[1]);
    }
    seq.push(...split.map(s => s[1]), ...unmarked);
    seq.forEach((c, i) => setOrder(c, String(i)));
  }

  // ---------- another tab on the same puzzle changed something: pick it up ----------
  window.addEventListener('storage', e => {
    // marks and maybes are written together; read both so a half-arrived update
    // can't be "settled" and saved back over the other tab's change
    if (e.key === marksKey() || e.key === maybeKey()) {
      marks = ls.get(marksKey(), {}); maybes = ls.get(maybeKey(), {});
      undoStack = []; showUndo(); // undoing here would quietly revert the other tab's change
    }
    else if (e.key === guessKey()) guesses = loadGuesses();
    else if (e.key === SETTINGS_KEY) { settings = { ...DEFAULTS, ...ls.get(SETTINGS_KEY, {}) }; applySettings(); return; }
    else if (e.key === SORT_KEY) { const v = e.newValue; if (SORT_MODES[v]) { sortMode = v; showSort(); } }
    else return;
    apply();
  });

  // ---------- keyboard ----------
  window.addEventListener('keydown', e => {
    // never while typing somewhere (including inside another extension's shadow root)
    const t = e.composedPath?.()[0] || e.target;
    if (e.isComposing || t.isContentEditable ||
        t.closest?.('textarea, select, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])')) return;
    if (e.metaKey || e.ctrlKey || e.altKey || !opt('keys')) return;
    const digit = e.code?.match(/^(?:Digit|Numpad)([0-4])$/)?.[1];
    if (e.shiftKey && digit && opt('maybes')) { // Shift+1–4: a maybe without entering maybe mode
      const was = maybeMode; maybeMode = true;
      assign(digit === '0' ? 'erase' : COLORS.find(c => c.hotkey === digit).key);
      maybeMode = was;
      if (!was) apply(); // a one-off option: sort as usual
      return;
    }
    if ((e.key === 'm' || e.key === 'M') && opt('maybes')) { setMaybeMode(!maybeMode); return; }
    const c = COLORS.find(c => c.hotkey === e.key);
    if (c) assign(c.key);
    else if (e.key === '0') assign('erase');
    else if (e.key === 'Escape' && armed) arm(null);
    else if (e.key === 'g' || e.key === 'G') onGo();
    else if (e.key === 'z' || e.key === 'Z') undo();
  });

  // ---------- redraw when the game re-renders (ignoring our own palette updates) ----------
  // Watches the game's own container (#pz-game-root) rather than the whole page, so ads and
  // other page activity don't cause redraws; falls back to the page until the game appears.
  // Also watches the light/dark switches on <body> and <html>. Our own overlays are ignored.
  const ours = n => n.nodeType === 1 && (n === host || n.localName === 'ccm-mark');
  let queued = false, watched = null;
  const mo = new MutationObserver(muts => {
    if (watched === document.body || !watched?.isConnected) watch();
    if (queued) return;
    if (muts.every(m => m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(ours))) return;
    queued = true;
    const run = () => { queued = false; apply(); };
    if (document.hidden) setTimeout(run, 50); else requestAnimationFrame(run);
  });
  function watch() {
    const r = document.getElementById('pz-game-root') || document.body;
    if (r === watched && r.isConnected) return;
    mo.disconnect();
    watched = r;
    // one observe() per node: a second call on the same node would replace its options
    const theme = { attributes: true, attributeFilter: ['data-mode'] };
    if (r === document.body) mo.observe(r, { childList: true, subtree: true, characterData: true, ...theme });
    else {
      mo.observe(r, { childList: true, subtree: true, characterData: true });
      mo.observe(document.body, { childList: true, ...theme }); // notice the game root being swapped out
    }
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-darkreader-scheme'] });
  }
  watch();

  applySettings();
  ready = true;
  showUndo();
  apply();
})();
