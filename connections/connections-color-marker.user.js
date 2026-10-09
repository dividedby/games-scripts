// ==UserScript==
// @name         Connections Color Marker
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  Mark NYT Connections tiles with the color you think they are, then submit them in order (built for reverse-rainbow solves)
// @version      0.2.1
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
    off:     { label: 'Off', title: 'Unsorted: the game\'s own order', order: null },
  };
  const SORT_CYCLE = ['reverse', 'rainbow', 'off'];
  const MAX_PER_COLOR = 4;
  const KEEP_DAYS = 60;
  const CONFIRM_MS = 3000;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ls = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  // ---------- storage (per puzzle date, keyed by word so shuffles don't matter) ----------
  const puzzleId = () =>
    location.pathname.match(/\d{4}-\d{2}-\d{2}/)?.[0] ||
    new Date().toLocaleDateString('en-CA'); // today's puzzle has no date in the URL
  const marksKey = () => 'ccm:' + puzzleId();
  const awayKey = () => 'ccm:1away:' + puzzleId();
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
  const save = () => { ls.set(marksKey(), marks); touch(); };
  const saveAways = () => { ls.set(awayKey(), aways); touch(); };

  // drop data for puzzles not touched in KEEP_DAYS (by last use, not puzzle date,
  // so archive puzzles you're playing now are kept)
  try {
    const used = ls.get(USED_KEY, {});
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    for (const k of Object.keys(localStorage)) {
      const d = k.match(/^ccm:(?:1away:)?(\d{4}-\d{2}-\d{2})$/)?.[1];
      if (!d) continue;
      if (!used[d]) used[d] = Date.now(); // first seen: start its clock now
      else if (used[d] < cutoff) ls.del(k);
    }
    for (const d of Object.keys(used)) if (used[d] < cutoff) delete used[d];
    ls.set(USED_KEY, used);
  } catch {}

  let marks = ls.get(marksKey(), {});
  let aways = ls.get(awayKey(), []); // "One away" guesses: arrays of 4 words
  let lastId = puzzleId();

  const SORT_KEY = 'ccm:sort';
  let sortMode = (() => {
    let v; try { v = localStorage.getItem(SORT_KEY); } catch {}
    return SORT_MODES[v] ? v : v === '0' ? 'off' : 'reverse'; // '1'/'0' from older versions
  })();
  const COLLAPSE_KEY = 'ccm:collapsed';

  // ---------- settings (⚙ on the palette), saved per browser ----------
  const SETTINGS_KEY = 'ccm:settings';
  const SETTINGS = [
    { key: 'oneAway',   def: false, label: 'Mark "One away" guesses', help: 'Red letters on the tiles of guesses the game called one away' },
    { key: 'autoFill',  def: true,  label: 'Auto-fill the last group', help: 'Once three colors have 4 tiles, the last 4 get the remaining color' },
    { key: 'reconcile', def: true,  label: 'Fix my colors after a solve', help: 'If your purple turns out to be blue, swap purple and blue everywhere. Off: only the solved tiles change' },
    { key: 'goButton',  def: true,  label: 'Go button', help: 'Submit a color\'s 4 tiles for you. Off: marking only' },
    { key: 'orderWarn', def: true,  label: 'Ask before going out of order', help: 'Go asks "Sure?" when you submit a color ahead of your sort order' },
    { key: 'keys',      def: true,  label: 'Keyboard shortcuts', help: '1–4 colors, 0 erase, G go, Esc cancel' },
    { key: 'left',      def: false, label: 'Palette on the left', help: 'Move the palette to the bottom-left corner' },
  ];
  const DEFAULTS = Object.fromEntries(SETTINGS.map(o => [o.key, o.def]));
  let settings = { ...DEFAULTS, ...ls.get(SETTINGS_KEY, {}) };
  const opt = k => settings[k];

  // ---------- reading the board ----------
  function tiles() {
    const t = [...document.querySelectorAll('[data-testid="card-label"]')];
    return t.length ? t : [...document.querySelectorAll('label')]
      .filter(l => l.querySelector('input[type="checkbox"]') && !l.closest('#ccm-panel')); // not our settings
  }
  const wordOf = el => el.dataset.flipId ? up(el.dataset.flipId) : undouble(el.textContent);
  const isSelected = el => /selected/i.test(el.className); // the game's Card-module_selected class
  const selectedTiles = () => tiles().filter(isSelected);
  // the puzzle's 16 words once the board is fully known; counts ignore anything else
  let puzzleWords = null;
  const countOf = color => Object.entries(marks)
    .filter(([w, c]) => c === color && (!puzzleWords || puzzleWords.has(w))).length;

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
  const css = document.createElement('style');
  css.textContent = `
    [data-ccm], [data-ccm-away] { position: relative; }
    [data-ccm] { box-shadow: inset 0 0 0 5px var(--ccm) !important; }
    [data-ccm]::after {
      content: ''; position: absolute; top: 6px; right: 6px; width: 12px; height: 12px;
      border-radius: 50%; background: var(--ccm); border: 1px solid rgba(0,0,0,.35);
      pointer-events: none;
    }
    [data-ccm-away]::before {
      content: attr(data-ccm-away); position: absolute; left: 6px; bottom: 6px;
      font: 700 10px/1 system-ui, sans-serif; letter-spacing: 1px; color: #fff;
      background: #c0392b; border-radius: 4px; padding: 2px 3px; pointer-events: none;
    }
    #ccm-panel {
      position: fixed; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 99999;
      display: flex; gap: 6px; align-items: center; padding: 6px 8px;
      background: rgba(255,255,255,.95); border: 1px solid #ccc; border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,.15); font: 600 12px/1 system-ui, sans-serif; color: #222;
    }
    #ccm-panel button {
      min-width: 30px; height: 30px; border-radius: 6px; border: 2px solid transparent;
      cursor: pointer; font: inherit; color: #222; background: #eee; padding: 0 6px;
    }
    #ccm-panel button.active { border-color: #000; }
    #ccm-panel .full { text-decoration: line-through; opacity: .7; }
    #ccm-panel .solved { opacity: .45; }
    #ccm-panel .warn { background: #c0392b !important; color: #fff; opacity: 1; }
    #ccm-panel .notready { opacity: .45; }
    #ccm-panel.shake { animation: ccm-shake .3s; }
    #ccm-panel.collapsed > :not(.ccm-toggle) { display: none; }
    #ccm-panel.collapsed { padding: 4px; }
    #ccm-panel.left { right: auto; left: 12px; }
    #ccm-panel .ccm-gear { font-size: 17px; line-height: 1; }
    #ccm-settings {
      position: absolute; right: 0; bottom: calc(100% + 8px); width: 270px; max-width: calc(100vw - 24px);
      background: #fff; border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.18);
      padding: 10px 12px; font: 500 13px/1.3 system-ui, sans-serif; color: #222; cursor: default;
    }
    #ccm-panel.left #ccm-settings { right: auto; left: 0; }
    #ccm-settings[hidden] { display: none; }
    #ccm-settings h4 { margin: 0 0 6px; font: 700 13px/1.2 system-ui, sans-serif; }
    #ccm-settings label { display: flex; gap: 8px; align-items: flex-start; padding: 5px 0; cursor: pointer; }
    #ccm-settings input { margin: 2px 0 0; width: 16px; height: 16px; flex: none; accent-color: #5a594e; }
    #ccm-settings small { display: block; color: #666; font-size: 11px; }
    #ccm-settings .row { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
    #ccm-settings .row button { flex: 1; height: 30px; font: 600 12px system-ui, sans-serif; }
    #ccm-panel.nogo .ccm-go { display: none; }
    @keyframes ccm-shake { 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
    @media (max-width: 480px) {
      #ccm-panel { right: 6px; bottom: calc(6px + env(safe-area-inset-bottom, 0px)); gap: 3px; padding: 4px 5px; font-size: 12px; }
      #ccm-panel.left { right: auto; left: 6px; }
      #ccm-settings label { padding: 7px 0; }
      #ccm-panel button { min-width: 32px; height: 42px; padding: 0 5px; }
    }
  `;
  document.head.appendChild(css);

  // ---------- panel ----------
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
  for (const c of COLORS) btns[c.key] = addButton('0', () => assign(c.key), c.hex);
  addButton('⌫', () => assign('erase'));
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
  showSort();
  const goBtn = addButton('Go ▶', () => onGo());
  goBtn.classList.add('ccm-go');
  const gearBtn = addButton('⚙', () => toggleSettings());
  gearBtn.title = 'Settings';
  gearBtn.classList.add('ccm-gear');

  // settings popover
  const sheet = document.createElement('div');
  sheet.id = 'ccm-settings';
  sheet.hidden = true;
  sheet.innerHTML = '<h4>Color Marker settings</h4>' +
    SETTINGS.map(o => `<label title="${o.help}"><input type="checkbox" data-k="${o.key}"><span>${o.label}<small>${o.help}</small></span></label>`).join('') +
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
    if (confirm('Clear all color marks for this puzzle?')) { marks = {}; save(); apply(); }
  });
  sheet.querySelector('[data-act=reset]').addEventListener('click', () => {
    settings = { ...DEFAULTS };
    ls.set(SETTINGS_KEY, settings);
    applySettings();
  });
  panel.appendChild(sheet);
  function toggleSettings(open = sheet.hidden) {
    sheet.hidden = !open;
    gearBtn.classList.toggle('active', open);
  }
  document.addEventListener('click', e => { if (!sheet.hidden && !panel.contains(e.target)) toggleSettings(false); });
  function applySettings() {
    for (const box of sheet.querySelectorAll('input[data-k]')) box.checked = !!settings[box.dataset.k];
    panel.classList.toggle('left', opt('left'));
    panel.classList.toggle('nogo', !opt('goButton'));
    if (!opt('oneAway')) pendingGuess = null;
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
  function showCollapsed() {
    const on = onBoard ? userCollapsed : !peek;
    panel.classList.toggle('collapsed', on);
    if (on) toggleSettings(false);
    toggleBtn.textContent = on ? '🎨' : '▾';
    toggleBtn.title = on ? 'Show the color palette' : 'Hide the palette';
  }
  showCollapsed();
  document.body.appendChild(panel);

  // a color tapped with nothing selected: waiting for a second color (swap) or Go (submit)
  let armed = null;
  function arm(c) {
    armed = c;
    for (const k of ORDER) btns[k].classList.toggle('active', k === c);
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
    const ready = n === 4;
    goBtn.classList.toggle('notready', !ready); // dimmed: Go would just shake
    goBtn.title = !c ? 'Nothing left to submit'
      : !ready ? `${c} needs 4 tiles to submit (has ${n})`
      : armed ? `Select the 4 ${armed} tiles and submit`
      : `Submit the next color in order (${c})`;
  }

  function swapColors(a, b) {
    for (const [w, c] of Object.entries(marks)) {
      if (c === a) marks[w] = b;
      else if (c === b) marks[w] = a;
    }
  }

  // ---------- assign color to the current selection, then deselect ----------
  function assign(color) {
    if (submitting) return; // Go is selecting tiles; don't recolor them mid-submit
    const sel = selectedTiles();
    const solved = solvedColors();
    if (!sel.length) {
      if (!HEX[color] || solved.has(color)) { arm(null); shake(); return; } // nothing to arm
      if (!armed) { arm(color); return; }
      if (armed !== color) { swapColors(armed, color); save(); apply(); }
      arm(null);
      return;
    }
    arm(null);
    const words = sel.map(wordOf);
    if (color === 'erase') {
      for (const w of words) delete marks[w];
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
          marks[w] = color;
        });
      } else {
        for (const w of incoming) marks[w] = color;
        if (opt('autoFill')) autoFill();
      }
    }
    save();
    apply();
    deselectAll();
  }

  // three colors have 4 each and the last 4 tiles are unmarked → give them the unused color.
  // Counts include words from groups you've already solved, so it works mid-game too.
  function autoFill() {
    const full = ORDER.filter(k => countOf(k) === MAX_PER_COLOR);
    const unused = ORDER.filter(k => countOf(k) === 0);
    if (full.length !== 3 || unused.length !== 1) return;
    const rest = tiles().map(wordOf).filter(w => !marks[w]);
    if (rest.length !== 4) return;
    for (const w of rest) marks[w] = unused[0];
  }

  // ---------- after a group is solved, correct the colors to match the game ----------
  // If what you marked purple turns out to be blue, purple and blue swap everywhere, so the
  // tiles you had as blue become purple. A swap needs at least 3 of the 4 words to share a
  // color, so one stray tile can't trigger it. Afterwards a solved color is used up: any
  // other tile still wearing it gets unmarked. Safe to run repeatedly.
  function reconcileSolved(groups) {
    if (!groups.length) return;
    const before = JSON.stringify(marks);
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
    if (JSON.stringify(marks) !== before) save();
  }

  // ---------- "One away" guesses ----------
  // Remember what was selected when Submit was pressed; if the game's toast then says
  // "One away", keep that guess and badge its tiles with a letter (A, B, …).
  let pendingGuess = null;
  window.addEventListener('click', e => {
    if (e.target.closest?.('[data-testid="submit-btn"]')) {
      const words = selectedTiles().map(wordOf).sort();
      if (words.length === 4 && opt('oneAway')) pendingGuess = words;
    }
  }, true);
  function checkToast() {
    if (!pendingGuess) return;
    // the guess was right: it shows up as a solved group, nothing to remember
    if (solvedGroups().some(g => pendingGuess.every(w => g.words.includes(w)))) { pendingGuess = null; return; }
    const toast = document.querySelector('[data-testid="connection-toast"]');
    if (!toast || !/one away/i.test(toast.textContent)) return;
    const key = pendingGuess.join('|');
    if (!aways.some(g => g.join('|') === key)) { aways.push(pendingGuess); saveAways(); }
    pendingGuess = null;
  }

  // ---------- Go: submit the armed color, or the next one in order ----------
  let confirmFor = null, confirmTimer = null;
  function clearConfirm() {
    clearTimeout(confirmTimer);
    confirmFor = null;
    goBtn.classList.remove('warn');
  }
  function onGo() {
    if (submitting || !opt('goButton')) return;
    const next = nextColor();
    const color = armed || next;
    if (!color) { shake(); return; }
    if (tiles().filter(t => marks[wordOf(t)] === color).length !== 4) { arm(null); shake(); return; }
    // out of order? ask once: Go turns red "Sure?", a second tap within 3s submits
    if (opt('orderWarn') && SORT_MODES[sortMode].order && armed && next && armed !== next && confirmFor !== armed) {
      clearConfirm();
      confirmFor = armed;
      goBtn.textContent = 'Sure?';
      goBtn.title = `${armed} before ${next} breaks the ${SORT_MODES[sortMode].title.split(':')[0].toLowerCase()} order. Tap again to submit anyway.`;
      goBtn.classList.add('warn');
      confirmTimer = setTimeout(() => { arm(null); showGo(); }, CONFIRM_MS); // let go of the color too
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
      // wait for the game to register all 4 and enable Submit
      for (let i = 0; i < 30; i++) {
        const btn = gameButton(/^submit$/i);
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
    puzzleWords = words;
    let changed = false;
    for (const k of Object.keys(marks)) {
      if (words.has(k)) continue;
      const u = undouble(k);
      if (u !== k && words.has(u) && !marks[u]) marks[u] = marks[k];
      delete marks[k];
      changed = true;
    }
    if (changed) save();
  }

  // ---------- draw everything ----------
  function apply() {
    if (puzzleId() !== lastId) { // moved to another date
      lastId = puzzleId();
      marks = ls.get(marksKey(), {});
      aways = ls.get(awayKey(), []);
      pendingGuess = null;
    }
    checkToast();
    const groups = solvedGroups();
    tidyKeys(groups);
    reconcileSolved(groups);
    const solved = new Set(groups.map(g => g.color));

    // letter badges for "One away" guesses (A = first, B = second, …)
    const badge = {};
    // a guess is settled once a solved group holds 3 of its words; its badge is dropped
    // (letters stay the same for the others)
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
      if (c) {
        if (el.dataset.ccm !== c) { el.dataset.ccm = c; el.style.setProperty('--ccm', HEX[c]); }
      } else if (el.dataset.ccm) {
        delete el.dataset.ccm; el.style.removeProperty('--ccm');
      }
      if (badge[w]) { if (el.dataset.ccmAway !== badge[w]) el.dataset.ccmAway = badge[w]; }
      else if (el.dataset.ccmAway) delete el.dataset.ccmAway;
    }
    for (const k of ORDER) {
      const label = solved.has(k) ? '✓' : String([...present].filter(w => marks[w] === k).length);
      if (btns[k].textContent !== label) btns[k].textContent = label; // only touch the DOM on change
      btns[k].classList.toggle('solved', solved.has(k));
      btns[k].classList.toggle('full', !solved.has(k) && label === String(MAX_PER_COLOR));
    }
    if (armed && solved.has(armed)) arm(null);
    showGo();
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
    const cells = ts.map(t => cellOf(t, board));
    const cellSet = new Set(cells);
    // anything else on the board (solved-group rows) stays on top, in its own order
    [...board.children].forEach((c, i) => { if (!cellSet.has(c)) setOrder(c, String(i - 1000)); });
    const unmarked = [];
    const byColor = Object.fromEntries(ORDER.map(k => [k, []]));
    ts.forEach((t, i) => (byColor[marks[wordOf(t)]] || unmarked).push(cells[i]));
    const seq = [];
    for (const k of sortOrder) {
      if (!byColor[k].length) continue;
      seq.push(...byColor[k]);
      while (seq.length % 4 && unmarked.length) seq.push(unmarked.shift()); // pad the row
    }
    seq.push(...unmarked);
    seq.forEach((c, i) => setOrder(c, String(i)));
  }

  // ---------- keyboard ----------
  window.addEventListener('keydown', e => {
    if (e.target.closest?.('input[type="text"], textarea, [contenteditable]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey || !opt('keys')) return;
    const c = COLORS.find(c => c.hotkey === e.key);
    if (c) assign(c.key);
    else if (e.key === '0') assign('erase');
    else if (e.key === 'Escape' && armed) arm(null);
    else if (e.key === 'g' || e.key === 'G') onGo();
  });

  // ---------- redraw when the game re-renders (ignoring our own palette updates) ----------
  let queued = false;
  new MutationObserver(muts => {
    if (queued || muts.every(m => panel.contains(m.target))) return;
    queued = true;
    const run = () => { queued = false; apply(); };
    if (document.hidden) setTimeout(run, 50); else requestAnimationFrame(run);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  let ready = false;
  applySettings();
  ready = true;
  apply();
})();
