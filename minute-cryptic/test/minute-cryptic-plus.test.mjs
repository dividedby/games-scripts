// Behavior tests for minute-cryptic-plus.user.js, run against a simulated Minute Cryptic page
// in jsdom:  pnpm test
// The markup mirrors what the live site renders (answer boxes labeled "Letter N of M", the
// hints/check row, .react-simple-keyboard, the scribble space header with Shuffle and the
// Grid/Circle layout buttons). The scribble space's state is a stand-in with the same names as
// the site's React context (gridAdapter.getCells/writeLetter, dragLetterFromGrid, dropTileOnGrid,
// tiles, layoutMode, changeLayoutMode, shuffleTiles), reached the same way: through a React
// fiber on the Circle layout button. Keep both in step if the site changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../minute-cryptic-plus.user.js', import.meta.url), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The scribble space's state: `boxes` like 'ab_d' (_ empty, uppercase = revealed by a hint).
function fakeScribble(boxes, { tiles = [], mode = 'grid' } = {}) {
  const st = {
    cells: [...boxes].map((ch, index) => ({ index, letter: ch === '_' ? '' : ch.toLowerCase(), isRevealed: ch !== '_' && ch === ch.toUpperCase() })),
    tiles: tiles.map((t, i) => ({ id: 100 + i, ...t })),
    mode, nextId: 1, calls: [],
  };
  const layout = () => { // the game's circle: evenly round a center, starting at the top
    if (st.mode !== 'circle') { st.tiles.forEach((t, i) => Object.assign(t, { x: i * 54, y: 0 })); return; }
    st.tiles.forEach((t, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / st.tiles.length; Object.assign(t, { x: 100 + 50 * Math.cos(a), y: 100 + 50 * Math.sin(a) }); });
  };
  const s = {
    get tiles() { return st.tiles; },
    get layoutMode() { return st.mode; },
    gridAdapter: {
      getCells: () => st.cells.map(c => ({ ...c, isSolvedCrossClue: false, wordGroup: 0 })),
      writeLetter: (i, l) => { st.calls.push(['write', i, l]); st.cells[i].letter = l; },
      clearLetter: i => { st.cells[i].letter = ''; },
    },
    dragLetterFromGrid: (i, x, y) => {
      st.calls.push(['drag', i]);
      const c = st.cells[i];
      if (!c.letter || c.isRevealed) return null;
      st.tiles.push({ id: st.nextId, letter: c.letter.toUpperCase(), x, y });
      c.letter = '';
      return st.nextId++;
    },
    dropTileOnGrid: (id, i) => {
      st.calls.push(['drop', id, i]);
      const t = st.tiles.find(t => t.id === id);
      st.cells[i].letter = t.letter.toLowerCase();
      st.tiles = st.tiles.filter(x => x !== t);
    },
    changeLayoutMode: m => { st.calls.push(['layout', m]); st.mode = m; layout(); },
    shuffleTiles: () => { st.calls.push(['shuffleTiles']); layout(); },
  };
  return { s, st, boxes: () => st.cells.map(c => c.letter || '_').join('') };
}

// stored: localStorage seed; scribble: fakeScribble(...) or null (scribble space closed)
async function page({ stored = {}, scribble = null, letters = 6 } = {}) {
  const cellsHtml = Array.from({ length: letters }, (_, i) => `<button aria-label="Letter ${i + 1} of ${letters}, empty"></button>`).join('');
  const header = scribble ? `<div class="flex items-center justify-between p-4" data-sentry-component="ScribbleSpaceHeader">` +
    `<div class="flex gap-2 items-center"><div></div><div>Scribble Space</div></div>` +
    `<div class="flex flex-row items-center"><div class="flex flex-row gap-4 items-center">` +
    `<button class="rounded-full p-1" id="game-shuffle"><svg></svg></button>` +
    `<div class="toggle"><button aria-label="Grid layout"></button><button aria-label="Circle layout"></button></div>` +
    `</div><button class="ml-8">x</button></div></div><div data-scribble-container="true"></div>` : '';
  const dom = new JSDOM(`<!doctype html><head></head><body><div id="game">${header}<div class="cells">${cellsHtml}</div>` +
    `<div class="actions"><button aria-label="Toggle scribble space" class="size-12 round"></button><button>hints</button><button>check</button></div>` +
    `<div data-sentry-component="VirtualKeyboard"><div class="react-simple-keyboard"></div></div></div></body>`,
  { url: 'https://www.minutecryptic.com/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  for (const [k, v] of Object.entries(stored)) w.localStorage.setItem(k, v);
  const keys = [];
  d.addEventListener('keydown', e => keys.push(e.key)); // the game listens on the page
  const game = [];
  if (scribble) {
    d.getElementById('game-shuffle').addEventListener('click', () => game.push('shuffle'));
    const circle = d.querySelector('[aria-label="Circle layout"]');
    circle.addEventListener('click', () => game.push('circle'));
    circle.__reactFiber$test = { memoizedProps: {}, return: { memoizedProps: { children: [] }, return: { memoizedProps: { value: scribble.s } } } };
  }
  w.__MCP_TEST__ = true;
  w.eval(SRC);
  await sleep(40);
  return { w, d, keys, game, input: d.getElementById('mcp-input'), kbdBtn: () => d.getElementById('mcp-kbd-btn'), boxesBtn: () => d.getElementById('mcp-boxes-btn') };
}

const typeEvent = (p, inputType, data) => p.input.dispatchEvent(new p.w.InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true }));

test('the game\'s keyboard is hidden by default, with a ⌨ button after check to switch back', async () => {
  const p = await page();
  assert.equal(p.d.documentElement.getAttribute('data-mcp-kbd'), 'system');
  assert.match(p.d.getElementById('mcp-style').textContent, /data-mcp-kbd="system"\] \.react-simple-keyboard \{ display: none/);
  const check = [...p.d.querySelectorAll('button')].find(b => b.textContent === 'check');
  assert.equal(check.nextElementSibling, p.kbdBtn(), 'right after check');
  assert.match(p.kbdBtn().className, /size-12 round/, 'styled like the game\'s round button');
  assert.equal(p.kbdBtn().getAttribute('aria-pressed'), 'true');
  p.kbdBtn().click();
  assert.equal(p.d.documentElement.hasAttribute('data-mcp-kbd'), false, 'the game\'s keyboard is back');
  assert.equal(p.w.localStorage.getItem('mcp:keyboard'), 'site');
  assert.equal(p.kbdBtn().getAttribute('aria-pressed'), 'false');
  const again = await page({ stored: { 'mcp:keyboard': 'site' } });
  assert.equal(again.d.documentElement.hasAttribute('data-mcp-kbd'), false, 'the choice is remembered');
  const junk = await page({ stored: { 'mcp:keyboard': '{"x":1}' } });
  assert.equal(junk.d.documentElement.getAttribute('data-mcp-kbd'), 'system', 'anything unknown means the default');
});

test('tapping an answer box opens the keyboard (focuses the field), only in keyboard mode', async () => {
  const p = await page();
  p.d.querySelector('button[aria-label^="Letter 3"]').click();
  assert.equal(p.d.activeElement, p.input);
  p.input.blur();
  p.kbdBtn().click(); // the game's keyboard
  p.input.blur();
  p.d.querySelector('button[aria-label^="Letter 3"]').click();
  assert.notEqual(p.d.activeElement, p.input);
});

test('letters and Backspace typed into the field reach the game as keys', async () => {
  const p = await page();
  typeEvent(p, 'insertText', 'Ab');
  typeEvent(p, 'insertText', '1 ');
  typeEvent(p, 'deleteContentBackward', null);
  assert.deepEqual(p.keys, ['a', 'b', 'Backspace']);
  assert.equal(p.input.value, '  ', 'the field never fills up');
});

test('a key the keyboard reports goes to the game once, not again as text', async () => {
  const p = await page();
  const e = new p.w.KeyboardEvent('keydown', { key: 'C', bubbles: true, cancelable: true });
  p.input.dispatchEvent(e);
  assert.equal(e.defaultPrevented, true, 'no text in the field');
  typeEvent(p, 'insertText', 'c'); // a keyboard that inserts anyway
  assert.deepEqual(p.keys, ['C'], 'the game got the key event itself, once');
  const enter = new p.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  p.input.focus();
  p.input.dispatchEvent(enter);
  assert.notEqual(p.d.activeElement, p.input, 'Done closes the keyboard');
  assert.ok(!p.keys.includes('Enter'), 'and isn\'t sent to the game');
});

test('text that slips into the field anyway is typed and cleared', async () => {
  const p = await page();
  p.input.value = '  xy';
  p.input.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  assert.deepEqual(p.keys, ['x', 'y']);
  assert.equal(p.input.value, '  ');
  p.input.value = ' ';
  p.input.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  assert.deepEqual(p.keys, ['x', 'y', 'Backspace']);
});

test('Shuffle also shuffles the letters in the boxes, in place, keeping revealed letters', async () => {
  const sc = fakeScribble('abcDe_');
  const p = await page({ scribble: sc });
  p.d.getElementById('game-shuffle').click();
  assert.deepEqual(p.game, ['shuffle'], 'the game\'s own Shuffle still runs');
  const b = sc.boxes();
  assert.equal(b[3], 'd', 'revealed letter stays');
  assert.equal(b[5], '_', 'empty box stays empty');
  assert.deepEqual([...b.slice(0, 3) + b[4]].sort(), ['a', 'b', 'c', 'e']);
  assert.notEqual(b, 'abcde_', 'actually mixed up');
  assert.ok(sc.st.calls.every(c => c[0] !== 'write' || c[1] !== 3), 'never writes the revealed box');
});

test('Circle takes the letters out of the boxes into a shuffled circle in one tap', async () => {
  const sc = fakeScribble('abC_e_');
  const p = await page({ scribble: sc });
  p.d.querySelector('[aria-label="Circle layout"]').click();
  await sleep(120);
  assert.deepEqual(p.game, [], 'the game\'s own Circle is replaced this time');
  assert.equal(sc.boxes(), '__c___', 'all out but the revealed letter');
  assert.deepEqual(sc.st.calls.filter(c => c[0] === 'drag').map(c => c[1]), [0, 1, 4]);
  assert.deepEqual(sc.st.calls.filter(c => c[0] !== 'drag'), [['layout', 'circle'], ['shuffleTiles']]);
  assert.equal(sc.st.tiles.length, 3);
});

test('Circle with nothing in the boxes is just the game\'s Circle', async () => {
  const sc = fakeScribble('___', { tiles: [{ letter: 'A', x: 0, y: 0 }] });
  const p = await page({ scribble: sc, letters: 3 });
  p.d.querySelector('[aria-label="Circle layout"]').click();
  await sleep(60);
  assert.deepEqual(p.game, ['circle']);
  assert.deepEqual(sc.st.calls, []);
});

test('⤓ puts the loose letters back in the empty boxes, clockwise from the top of the circle', async () => {
  const sc = fakeScribble('_B__');
  sc.st.mode = 'circle';
  // a circle of three: top T, lower right R, lower left L (listed out of order)
  sc.st.tiles = [{ id: 1, letter: 'L', x: 50, y: 150 }, { id: 2, letter: 'T', x: 100, y: 50 }, { id: 3, letter: 'R', x: 150, y: 150 }];
  const p = await page({ scribble: sc, letters: 4 });
  const btn = p.boxesBtn();
  assert.equal(btn.previousElementSibling.id, 'game-shuffle', 'sits right after Shuffle');
  assert.equal(btn.title, 'Put the letters back in the boxes');
  btn.click();
  assert.equal(sc.boxes(), 'tbrl', 'the revealed B stays where it is');
  assert.equal(sc.st.tiles.length, 0);
});

test('⤓ in grid layout goes row by row, and extra letters stay loose', async () => {
  const sc = fakeScribble('a__');
  sc.st.tiles = [{ id: 1, letter: 'Z', x: 60, y: 60 }, { id: 2, letter: 'X', x: 0, y: 0 }, { id: 3, letter: 'Y', x: 60, y: 2 }];
  const p = await page({ scribble: sc, letters: 3 });
  p.boxesBtn().click();
  assert.equal(sc.boxes(), 'axy');
  assert.deepEqual(sc.st.tiles.map(t => t.letter), ['Z']);
});

test('the ⤓ button comes back when the game redraws the scribble space', async () => {
  const sc = fakeScribble('___');
  const p = await page({ scribble: sc, letters: 3 });
  const group = p.boxesBtn().parentElement;
  const html = group.innerHTML.replace(/<button[^>]*mcp-boxes-btn[\s\S]*?<\/button>/, '');
  group.innerHTML = html; // a re-render drops our button
  await sleep(60);
  assert.ok(p.boxesBtn(), 'put back');
  assert.equal(p.d.querySelectorAll('#mcp-boxes-btn').length, 1);
});

test('if the scribble space has changed beyond recognition, the extras stand aside', async () => {
  const p = await page({ scribble: fakeScribble('ab') , letters: 2 });
  delete p.d.querySelector('[aria-label="Circle layout"]').__reactFiber$test;
  const warn = [];
  p.w.console.warn = (...a) => warn.push(a.join(' '));
  p.d.getElementById('game-shuffle').click();
  p.d.querySelector('[aria-label="Circle layout"]').click();
  p.boxesBtn().click();
  await sleep(60);
  assert.deepEqual(p.game, ['shuffle', 'circle'], 'the game\'s buttons work as usual');
  assert.equal(warn.length, 1, 'said once');
});

test('a second copy does nothing', async () => {
  const p = await page();
  p.w.eval(SRC);
  await sleep(40);
  assert.equal(p.d.querySelectorAll('#mcp-input').length, 1);
  assert.equal(p.d.querySelectorAll('#mcp-kbd-btn').length, 1);
  assert.equal(p.d.querySelectorAll('#mcp-style').length, 1);
});
