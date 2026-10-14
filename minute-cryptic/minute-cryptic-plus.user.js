// ==UserScript==
// @name         Minute Cryptic Plus
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  Minute Cryptic with your phone's own keyboard, and a quicker scribble space: shuffle the letters right in the boxes, send them into a circle with one tap, and put them back
// @version      0.1.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Minute+Cryptic+Plus+Donation
// @contributionAmount  $1
// @match        https://www.minutecryptic.com/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/dividedby/games-scripts/main/minute-cryptic/minute-cryptic-plus.user.js
// @updateURL    https://raw.githubusercontent.com/dividedby/games-scripts/main/minute-cryptic/minute-cryptic-plus.user.js
// ==/UserScript==

// What the game gives us to work with (read from the live site, October 2026):
// - Its keyboard is react-simple-keyboard (.react-simple-keyboard), and the game also
//   listens for keydown on the page, so a key event typed anywhere reaches it.
// - The answer boxes are buttons labeled "Letter N of M, …".
// - The scribble space keeps its state in a React context whose value has readable names:
//   gridAdapter.getCells() (the answer boxes: index, letter, isRevealed), gridAdapter.writeLetter,
//   dragLetterFromGrid, dropTileOnGrid, tiles, layoutMode, changeLayoutMode, shuffleTiles.
//   The script finds it from the scribble space's "Circle layout" button. That's the site's
//   internals, not a public API: if it ever isn't there, the scribble extras do nothing and
//   the game works as usual. Only a cell's index, letter and isRevealed are ever read.

(() => {
  'use strict';
  if (document.documentElement.hasAttribute('data-mcp')) return; // a second copy
  document.documentElement.setAttribute('data-mcp', '');

  const LOG = '[Minute Cryptic Plus]';
  const KBD_KEY = 'mcp:keyboard'; // 'system' (default) or 'site'

  const ls = {
    get(k) {
      try { return localStorage.getItem(k); } catch { return null; } // storage off: defaults
    },
    set(k, v) {
      try { localStorage.setItem(k, v); } catch (e) { console.warn(LOG, 'couldn\'t save a setting:', e.message); }
    },
  };

  // --- the phone's own keyboard ---
  // The game's keyboard is hidden and a tiny text field takes its place. Tapping an answer
  // box focuses it, which brings up the system keyboard; every letter and Backspace typed
  // there reaches the game as the key it already handles, and Done closes the keyboard.
  let keyboard = ls.get(KBD_KEY) === 'site' ? 'site' : 'system';
  const html = document.documentElement;
  const showMode = () => {
    if (keyboard === 'system') html.setAttribute('data-mcp-kbd', 'system');
    else html.removeAttribute('data-mcp-kbd');
    if (kbdBtn) {
      kbdBtn.setAttribute('aria-pressed', String(keyboard === 'system'));
      kbdBtn.title = keyboard === 'system' ? 'Typing with your keyboard. Tap for the game\'s keyboard' : 'Use your own keyboard';
    }
  };

  const style = document.createElement('style');
  style.id = 'mcp-style';
  style.textContent = `
    html[data-mcp-kbd="system"] .react-simple-keyboard { display: none !important; }
    #mcp-input { position: fixed; left: 0; bottom: 0; width: 1px; height: 1px; padding: 0; border: 0;
      margin: 0; opacity: 0; font-size: 16px; /* 16px: iOS doesn't zoom in on focus */ caret-color: transparent; }
    .mcp-btn[aria-pressed="true"] { background: #111 !important; color: #fff !important; }
    .mcp-btn { font-size: 20px; line-height: 1; }
  `;
  document.head.append(style);

  // The field always holds two spaces, so Backspace has something to delete and fires.
  const SENT = '  ';
  const input = document.createElement('input');
  Object.assign(input, { id: 'mcp-input', type: 'text', value: SENT, autocomplete: 'off', spellcheck: false });
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'characters');
  input.setAttribute('enterkeyhint', 'done');
  input.setAttribute('aria-label', 'Type your answer');
  document.body.append(input);

  const send = key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  // A key the keyboard reports properly reaches the game by itself (its keydown bubbles up to
  // the page). Some phone keyboards only say "Unidentified" and then insert text; that text
  // is turned into keys here. `last` keeps the same key from going through both ways.
  let last = { key: '', t: 0 };
  const recent = key => last.key === key && performance.now() - last.t < 100;
  input.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === 'Enter') { e.preventDefault(); e.stopPropagation(); input.blur(); return; } // "done": close the keyboard
    if (/^[a-z]$/.test(key) || key === 'Backspace') {
      last = { key, t: performance.now() };
      e.preventDefault(); // no text in the field; the event itself goes on to the game
    }
  });
  input.addEventListener('beforeinput', e => {
    if (e.inputType === 'insertLineBreak') { e.preventDefault(); input.blur(); return; }
    if (e.inputType === 'deleteContentBackward') {
      e.preventDefault();
      if (!recent('Backspace')) send('Backspace');
      return;
    }
    if (typeof e.data === 'string' && e.inputType.startsWith('insert')) {
      e.preventDefault();
      for (const ch of e.data.toLowerCase()) if (/[a-z]/.test(ch) && !recent(ch)) send(ch);
    }
  });
  // in case a keyboard's insert can't be cancelled: whatever reached the field is typed, then cleared
  input.addEventListener('input', () => {
    const v = input.value;
    if (v === SENT) return;
    if (v.length < SENT.length) send('Backspace');
    for (const ch of v.toLowerCase()) if (/[a-z]/.test(ch)) send(ch);
    input.value = SENT;
  });

  // tapping a box opens the keyboard (in the same tap, as iOS requires; not the scribble
  // space, where taps are for dragging letters)
  document.addEventListener('click', e => {
    if (keyboard !== 'system' || !(e.target instanceof Element)) return;
    if (e.target.closest('button[aria-label^="Letter "]')) input.focus({ preventScroll: true });
  }, true);

  let kbdBtn = null;
  function placeKeyboardButton() {
    if (kbdBtn?.isConnected) return;
    const check = [...document.querySelectorAll('button')].find(b => /^check$/i.test(b.textContent.trim()));
    const scribble = document.querySelector('button[aria-label="Toggle scribble space"]');
    if (!check || !scribble) return;
    kbdBtn = document.createElement('button');
    kbdBtn.type = 'button';
    kbdBtn.id = 'mcp-kbd-btn';
    kbdBtn.className = scribble.className + ' mcp-btn'; // looks like the game's round button
    kbdBtn.textContent = '⌨';
    kbdBtn.setAttribute('aria-label', 'Use your own keyboard');
    kbdBtn.addEventListener('click', () => {
      keyboard = keyboard === 'system' ? 'site' : 'system';
      ls.set(KBD_KEY, keyboard);
      showMode();
      if (keyboard === 'system') input.focus({ preventScroll: true });
      else input.blur();
    });
    check.after(kbdBtn);
    showMode();
  }

  // --- the scribble space ---
  // The game's state for it, found by walking up React's tree from one of its buttons.
  function scribble() {
    const anchor = document.querySelector('button[aria-label="Circle layout"]');
    if (!anchor) return null;
    const k = Object.keys(anchor).find(n => n.startsWith('__reactFiber$'));
    for (let f = k && anchor[k], i = 0; f && i < 80; f = f.return, i++) {
      const v = f.memoizedProps && f.memoizedProps.value;
      if (v && typeof v === 'object' && typeof v.shuffleTiles === 'function' && typeof v.dropTileOnGrid === 'function'
        && typeof v.dragLetterFromGrid === 'function' && v.gridAdapter && typeof v.gridAdapter.getCells === 'function'
        && typeof v.gridAdapter.writeLetter === 'function' && Array.isArray(v.tiles)) return v;
    }
    if (!warned) { warned = true; console.warn(LOG, 'the scribble space has changed; its extras are off until the script is updated'); }
    return null;
  }
  let warned = false;
  const tick = () => new Promise(r => setTimeout(r, 30)); // lets React apply what we just did
  // the boxes the player can change: filled, and not revealed by a hint
  const cells = s => s.gridAdapter.getCells().map(c => ({ index: c.index, letter: c.letter || '', revealed: !!c.isRevealed }))
    .filter(c => !c.revealed);
  const shuffled = a => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  };

  // Shuffle: the game's button mixes up the loose letters; this also mixes up the ones in the
  // boxes, in place (letters a hint revealed stay put).
  function shuffleBoxes() {
    const s = scribble();
    if (!s) return;
    const filled = cells(s).filter(c => c.letter);
    if (filled.length < 2) return;
    const letters = filled.map(c => c.letter);
    let mixed = shuffled(letters);
    for (let n = 0; n < 5 && mixed.join('') === letters.join('') && new Set(letters).size > 1; n++) mixed = shuffled(letters);
    filled.forEach((c, i) => { if (mixed[i] !== c.letter) s.gridAdapter.writeLetter(c.index, mixed[i]); });
  }

  // Circle: takes every letter out of the boxes and lays them all out in a shuffled circle.
  async function circleFromBoxes() {
    let s = scribble();
    if (!s) return false;
    const filled = cells(s).filter(c => c.letter);
    if (!filled.length) return false;
    const area = document.querySelector('[data-scribble-container]')?.getBoundingClientRect();
    const x = area ? area.left + area.width / 2 : 0, y = area ? area.top + 60 : 0;
    for (const c of filled) s.dragLetterFromGrid(c.index, x, y);
    await tick();
    s = scribble();
    if (!s) return true;
    if (s.layoutMode !== 'circle') { s.changeLayoutMode('circle'); await tick(); s = scribble(); }
    s?.shuffleTiles();
    return true;
  }

  // Back to the boxes: the loose letters go into the empty boxes, in the order they're laid
  // out (round a circle clockwise from the top; otherwise row by row). Letters already in
  // boxes, and revealed ones, stay; letters beyond the empty boxes stay loose.
  function backToBoxes() {
    const s = scribble();
    if (!s) return;
    const tiles = s.tiles.filter(t => t && typeof t.id === 'number' && Number.isFinite(t.x) && Number.isFinite(t.y));
    const empty = cells(s).filter(c => !c.letter);
    if (!tiles.length || !empty.length) return;
    let order;
    if (s.layoutMode === 'circle') {
      const cx = tiles.reduce((a, t) => a + t.x, 0) / tiles.length, cy = tiles.reduce((a, t) => a + t.y, 0) / tiles.length;
      const turn = t => (Math.atan2(t.y - cy, t.x - cx) + Math.PI * 2.5) % (Math.PI * 2); // 0 at the top, clockwise
      order = tiles.slice().sort((a, b) => turn(a) - turn(b));
    } else {
      order = tiles.slice().sort((a, b) => Math.round((a.y - b.y) / 24) || a.x - b.x);
    }
    order.slice(0, empty.length).forEach((t, i) => s.dropTileOnGrid(t.id, empty[i].index));
  }

  // The game's own Shuffle and Circle buttons get the extras (its Shuffle still runs).
  const shuffleButton = () => document.querySelector('button[aria-label="Circle layout"]')
    ?.parentElement?.parentElement?.querySelector(':scope > button:not(.mcp-btn)');
  window.addEventListener('click', e => {
    if (!(e.target instanceof Element)) return;
    const b = e.target.closest('button');
    if (!b) return;
    if (b === shuffleButton()) shuffleBoxes();
    else if (b.getAttribute('aria-label') === 'Circle layout') {
      const s = scribble();
      if (!s || !cells(s).some(c => c.letter)) return; // nothing in the boxes: the game's own Circle
      e.preventDefault();
      e.stopPropagation(); // ours lays out the circle after taking the letters out
      circleFromBoxes().catch(err => console.error(LOG, 'circle:', err));
    }
  }, true);

  let boxesBtn = null;
  function placeBoxesButton() {
    if (boxesBtn?.isConnected) return;
    const shuffle = shuffleButton();
    if (!shuffle) return;
    boxesBtn = document.createElement('button');
    boxesBtn.type = 'button';
    boxesBtn.id = 'mcp-boxes-btn';
    boxesBtn.className = shuffle.className + ' mcp-btn';
    boxesBtn.textContent = '⤓';
    boxesBtn.title = 'Put the letters back in the boxes';
    boxesBtn.setAttribute('aria-label', 'Put the letters back in the boxes');
    boxesBtn.addEventListener('click', backToBoxes);
    shuffle.after(boxesBtn);
  }

  // The game draws these parts as you go (the puzzle opens in the page, the scribble space
  // opens and closes), so our buttons are put back whenever they're missing.
  let queued = false;
  const ensure = () => {
    queued = false;
    placeKeyboardButton();
    placeBoxesButton();
  };
  new MutationObserver(() => {
    if (!queued && !(kbdBtn?.isConnected && (boxesBtn?.isConnected || !document.querySelector('button[aria-label="Circle layout"]')))) {
      queued = true;
      requestAnimationFrame(ensure);
    }
  }).observe(document.body, { childList: true, subtree: true });
  showMode();
  ensure();

  if (window.__MCP_TEST__) window.__mcp = { shuffleBoxes, circleFromBoxes, backToBoxes, input };
})();
