// Behavior tests for connections-color-marker.user.js, run against a simulated
// Connections board in jsdom:  pnpm test
// The board markup mirrors what the live game renders (data-testid, data-flip-id,
// data-level, Card-module_selected); keep it in step if NYT changes the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../connections-color-marker.user.js', import.meta.url), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BTN = { yellow: 0, green: 1, blue: 2, purple: 3, erase: 4, undo: 5, sort: 6, go: 7, maybe: 8, hist: 9, gear: 10, toggle: 11, more: 12 };
const RGB = { yellow: 'rgb(249, 223, 109)', blue: 'rgb(176, 196, 239)', purple: 'rgb(186, 129, 197)' };

// words: tiles on the board; solved: [{ level, words }]; stored: localStorage seed
async function board({ words = [], solved = [], date = '2023-07-01', marks = {}, stored = {} } = {}) {
  const tiles = words.map(w => `<label class="Card-module_label" data-testid="card-label" data-flip-id="${w}">${w}<span>${w}</span></label>`).join('');
  const secs = solved.map(s => `<section data-testid="solved-category-container" data-level="${s.level}"><ol>${s.words.map(w => `<li>${w}</li>`).join('')}</ol></section>`).join('');
  const dom = new JSDOM(`<!doctype html><body>${secs}<div id="board" style="display:grid">${tiles}</div>` +
    `<span data-testid="mistake-count">4 mistakes remaining out of 4</span>` +
    `<button data-testid="deselect-btn">Deselect All</button><button data-testid="submit-btn" disabled>Submit</button></body>`,
  { url: `https://www.nytimes.com/games/connections${date ? '/' + date : ''}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.PointerEvent = w.PointerEvent || w.MouseEvent;
  w.__CCM_TEST__ = true;
  w.localStorage.setItem(`ccm:${date}`, JSON.stringify(marks));
  for (const [k, v] of Object.entries(stored)) w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  w.eval(SRC);
  await sleep(60);
  const d = w.document;
  const root = w.__ccmRoot; // the palette's (closed) shadow root, exposed for tests
  const panel = root.getElementById('ccm-panel');
  const b = {
    w, d, panel,
    btn: k => panel.querySelectorAll(':scope > button')[BTN[k]],
    root,
    sheet: () => root.getElementById('ccm-settings'),
    box: k => root.querySelector(`#ccm-settings input[data-k="${k}"]`),
    async setOpt(k, on) { const x = b.box(k); x.checked = on; x.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(40); },
    tile: x => d.querySelector(`[data-flip-id="${x}"]`),
    select(ws) {
      for (const t of d.querySelectorAll('[data-testid=card-label]')) t.classList.remove('Card-module_selected');
      ws.forEach(x => b.tile(x).classList.add('Card-module_selected'));
    },
    store: () => JSON.parse(w.localStorage.getItem(`ccm:${date}`)),
    shook: () => panel.classList.contains('shake'),
    unshake: () => panel.classList.remove('shake'),
    async tap(k) { b.unshake(); b.btn(k).click(); await sleep(40); },
    // play a guess the way the game would answer it: 'right' | 'wrong' | 'away' | 'repeat'
    async guess(ws, result) {
      b.select(ws);
      const submit = d.querySelector('[data-testid=submit-btn]');
      submit.disabled = false;
      submit.click();
      const mc = d.querySelector('[data-testid=mistake-count]');
      if (result === 'wrong' || result === 'away') mc.textContent = `${parseInt(mc.textContent, 10) - 1} mistakes remaining out of 4`;
      if (result === 'away' || result === 'repeat') {
        const t = d.createElement('div'); t.dataset.testid = 'connection-toast';
        t.innerHTML = `<h2>${result === 'away' ? 'One away...' : 'Already guessed!'}</h2>`;
        d.body.appendChild(t); await sleep(200); t.remove();
      }
      await sleep(200);
    },
    guesses: () => JSON.parse(w.localStorage.getItem(`ccm:${date}`.replace('ccm:', 'ccm:guesses:')) || '[]'),
    close: () => {}, // closing mid-mutation makes jsdom throw from the observer; let it be collected
  };
  return b;
}
const four = (p, n = 4) => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);

test('a solved group corrects your colors: marked blue, solved purple, so blue and purple swap', async () => {
  const b = await board({
    words: four('X'),
    solved: [{ level: 3, words: four('A') }],
    marks: { ...Object.fromEntries(four('A').map(x => [x, 'blue'])), ...Object.fromEntries(four('X').map(x => [x, 'purple'])) },
  });
  const s = b.store();
  assert.ok(four('A').every(x => s[x] === 'purple'));
  assert.ok(four('X').every(x => s[x] === 'blue'), 'tiles you had as purple take your old guess, blue');
  b.close();
});

test('one stray tile never triggers a swap, and leftovers of a solved color are cleared', async () => {
  const b = await board({
    words: ['BAT', 'IRON', 'SPIDER', 'SUPER', 'CATS'],
    solved: [{ level: 2, words: ['DUST', 'MOP', 'SWEEP', 'VACUUM'] }, { level: 0, words: ['ADIDAS', 'NIKE', 'PUMA', 'REEBOK'] }],
    marks: { BAT: 'purple', IRON: 'purple', SPIDER: 'purple', ADIDAS: 'purple', DUST: 'blue', MOP: 'blue', SWEEP: 'blue', SUPER: 'blue' },
  });
  const s = b.store();
  assert.equal(s.SUPER, undefined);
  assert.equal(s.VACUUM, 'blue');
  assert.equal(s.ADIDAS, 'yellow');
  assert.deepEqual([s.BAT, s.IRON, s.SPIDER], ['purple', 'purple', 'purple']);
  b.close();
});

test('max 4 per color, and exchange when the color is full', async () => {
  const b = await board({
    words: ['TENOR', 'PEKE', 'LAB', 'KING', 'AMIGO', 'STOOGE', 'X1', 'X2'],
    marks: { TENOR: 'blue', PEKE: 'blue', LAB: 'purple', KING: 'purple', AMIGO: 'purple', STOOGE: 'purple' },
  });
  b.select(['TENOR']); await b.tap('purple');
  assert.ok(b.shook(), 'a 5th purple is refused');
  b.select(['TENOR', 'LAB']); await b.tap('purple');
  assert.ok(!b.shook());
  assert.equal(b.store().TENOR, 'purple');
  assert.equal(b.store().LAB, 'blue');
  b.select(['X1', 'KING']); await b.tap('purple');
  assert.equal(b.store().X1, 'purple');
  assert.equal(b.store().KING, undefined, 'exchanging with an unmarked tile unmarks the one kicked out');
  b.select(['PEKE', 'X2', 'AMIGO']); await b.tap('purple');
  assert.ok(b.shook(), 'uneven exchange is refused');
  b.close();
});

test('solved colors show ✓ and cannot be armed, swapped or assigned', async () => {
  const b = await board({ words: ['A', 'B', 'C'], solved: [{ level: 3, words: four('P') }], marks: { A: 'blue', B: 'blue', C: 'green' } });
  assert.equal(b.btn('purple').textContent, '✓');
  await b.tap('blue'); await b.tap('purple');
  assert.ok(b.shook());
  assert.equal(b.store().A, 'blue');
  b.select(['C']); await b.tap('purple');
  assert.ok(b.shook());
  assert.equal(b.store().C, 'green');
  b.close();
});

test('Go: tinted with the next color, dims when not ready, asks "Sure?" out of order', async () => {
  const b = await board({ words: [...four('P'), ...four('G'), 'B1'], marks: { ...Object.fromEntries(four('P').map(x => [x, 'purple'])), ...Object.fromEntries(four('G').map(x => [x, 'green'])), B1: 'blue' } });
  assert.equal(b.btn('go').style.background, RGB.purple);
  await b.tap('green');
  await b.tap('go');
  assert.equal(b.btn('go').textContent, 'Sure?');
  await sleep(3200);
  assert.equal(b.btn('go').textContent, 'Go ▶', '"Sure?" expires');
  assert.ok(!b.btn('green').classList.contains('active'), 'and lets go of the color');
  await b.tap('blue');
  assert.ok(b.btn('go').classList.contains('notready'), 'blue has 1 tile');
  await b.tap('go');
  assert.ok(b.shook());
  assert.ok(!b.btn('blue').classList.contains('active'), 'refusal clears the armed color');
  b.close();
});

test('"One away" guesses get letter badges; settled guesses drop theirs', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D', 'E', 'F'], marks: {}, stored: { 'ccm:settings': { oneAway: true } } });
  await b.guess(['A', 'B', 'C', 'D'], 'away');
  await b.guess(['A', 'B', 'E', 'F'], 'away');
  await b.guess(['A', 'C', 'E', 'F'], 'repeat'); // game says already guessed: no mistake, nothing new
  assert.equal(b.tile('A').dataset.ccmAway, 'AB');
  assert.equal(b.tile('D').dataset.ccmAway, 'A');
  assert.equal(b.guesses().length, 2);

  // pre-0.5 one-away records are migrated; a settled guess (3 words solved) drops its badge
  const s = await board({
    words: ['EMERALD', 'KELLY', 'LATTE', 'X1'],
    solved: [{ level: 3, words: ['BEAN', 'CLEAN', 'FOX', 'PEANUT'] }],
    stored: { 'ccm:settings': { oneAway: true }, 'ccm:1away:2023-07-01': [['BEAN', 'CLEAN', 'EMERALD', 'FOX'], ['EMERALD', 'KELLY', 'LATTE', 'X1']] },
  });
  assert.equal(s.tile('EMERALD').dataset.ccmAway, 'B', 'guess A is settled, B keeps its letter');
});

test('guess history: records wrong guesses (one-aways flagged), ignores right ones, reminds on repeats', async () => {
  const b = await board({
    words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    stored: { 'ccm:settings': { history: true } },
  });
  assert.ok(!b.panel.classList.contains('nohist'), '📜 shown when the setting is on');
  await b.guess(['A', 'B', 'C', 'E'], 'wrong');
  await b.guess(['A', 'B', 'C', 'F'], 'away');
  assert.deepEqual(b.guesses(), [{ w: ['A', 'B', 'C', 'E'], away: false }, { w: ['A', 'B', 'C', 'F'], away: true }]);
  assert.equal(b.btn('hist').textContent, '📜2');
  await b.tap('hist');
  const list = b.root.getElementById('ccm-history');
  assert.ok(!list.hidden);
  assert.equal(list.querySelectorAll('li').length, 2);
  assert.match(list.querySelectorAll('li')[1].textContent, /A · B · C · F.*one away/);
  // repeat: the game says "Already guessed"; we add that it was one away
  await b.guess(['A', 'B', 'C', 'F'], 'repeat');
  const note = b.root.getElementById('ccm-note');
  assert.ok(!note.hidden);
  assert.match(note.textContent, /one away/);
  assert.equal(b.guesses().length, 2, 'repeats are not recorded twice');
});

test('guess history: off by default, but still recorded quietly', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D', 'E'] });
  assert.ok(b.panel.classList.contains('nohist'));
  await b.guess(['A', 'B', 'C', 'E'], 'wrong');
  assert.equal(b.guesses().length, 1);
});

test('sort modes cycle reverse rainbow → rainbow → off and remember the choice', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], marks: { A: 'yellow', B: 'purple', C: 'green', D: 'blue' }, stored: { 'ccm:sort': '1' } });
  const seq = () => [...b.d.querySelectorAll('[data-testid=card-label]')].filter(t => t.style.order !== '')
    .sort((x, y) => x.style.order - y.style.order).map(t => t.dataset.ccm?.[0] || '-').join('');
  assert.equal(b.btn('sort').textContent, 'P→Y');
  assert.match(seq(), /^p---b/);
  await b.tap('sort');
  assert.equal(b.btn('sort').textContent, 'Y→P');
  assert.match(seq(), /^y---g/);
  await b.tap('sort');
  assert.equal(b.btn('sort').textContent, 'Off');
  assert.equal(seq(), '');
  assert.equal(b.w.localStorage.getItem('ccm:sort'), 'off');
  b.close();
});

test('palette is tucked away until the board appears, then follows your choice', async () => {
  const b = await board({ words: [] });
  assert.ok(b.panel.classList.contains('collapsed'));
  for (const x of ['A', 'B']) { const l = b.d.createElement('label'); l.dataset.testid = 'card-label'; l.dataset.flipId = x; b.d.getElementById('board').appendChild(l); }
  await sleep(100);
  assert.ok(!b.panel.classList.contains('collapsed'));
  await b.tap('toggle');
  assert.ok(b.panel.classList.contains('collapsed'));
  assert.equal(b.w.localStorage.getItem('ccm:collapsed'), 'true');
  b.close();
});

test('stale saved keys: old doubled keys migrate, other puzzles\' words are ignored', async () => {
  const W = ['LITTLE', 'REAL ESTATE', 'COMMON', 'RING', 'INDEX', 'FUND', 'BANKROLL', 'RIB', 'STANDARD', 'MIDDLE', 'STOCK', 'SUPPORT', 'BACK', 'NUMBER', 'ROUTINE', 'TIME'];
  const b = await board({ words: W, marks: { LITTLELITTLE: 'green', COMMONCOMMON: 'yellow', FOO: 'yellow', BAR: 'yellow', BAZ: 'yellow' } });
  assert.deepEqual(b.store(), { LITTLE: 'green', COMMON: 'yellow' });
  b.select(['STANDARD', 'STOCK', 'ROUTINE']); await b.tap('yellow');
  assert.ok(!b.shook());
  assert.equal(b.store().STOCK, 'yellow');
  b.close();
});

test('words that look doubled (TARTAR) keep their full name', async () => {
  const b = await board({ words: ['TARTAR', 'TUTU', 'TAR'], marks: { TARTAR: 'green', TUTU: 'blue', TAR: 'yellow' } });
  assert.equal(b.tile('TARTAR').dataset.ccm, 'green');
  assert.equal(b.tile('TAR').dataset.ccm, 'yellow');
  b.close();
});

test('old puzzles are cleaned up by last use, not puzzle date', async () => {
  const b = await board({
    words: ['A'],
    stored: { 'ccm:2025-01-01': {}, 'ccm:2023-06-12': { A: 'blue' }, 'ccm:used': { '2025-01-01': Date.now() - 90 * 864e5 } },
  });
  assert.equal(b.w.localStorage.getItem('ccm:2025-01-01'), null);
  assert.notEqual(b.w.localStorage.getItem('ccm:2023-06-12'), null);
  b.close();
});

test('idle page: no redraw loop', async () => {
  const b = await board({ words: ['A', 'B'], marks: { A: 'blue' } });
  let frames = 0;
  const raf = b.w.requestAnimationFrame.bind(b.w);
  b.w.requestAnimationFrame = cb => { frames++; return raf(cb); };
  await sleep(400);
  assert.equal(frames, 0);
  b.close();
});

test('settings: defaults, saved choices, and each toggle takes effect', async () => {
  const b = await board({ words: [...four('P'), ...four('B'), ...four('G'), ...four('Y')] });
  // defaults: one-away off, everything else on, palette on the right
  assert.equal(b.box('oneAway').checked, false);
  for (const k of ['autoFill', 'reconcile', 'goButton', 'orderWarn', 'keys']) assert.equal(b.box(k).checked, true, k);
  assert.ok(b.sheet().hidden);
  await b.tap('gear');
  assert.ok(!b.sheet().hidden, '⚙ opens the panel');
  b.d.body.click(); await sleep(20);
  assert.ok(b.sheet().hidden, 'clicking outside closes it');

  // auto-fill off: three full colors leave the last 4 unmarked
  await b.setOpt('autoFill', false);
  for (const [c, p] of [['purple', 'P'], ['blue', 'B'], ['green', 'G']]) { b.select(four(p)); await b.tap(c); }
  assert.equal(b.store().Y1, undefined);
  assert.deepEqual(JSON.parse(b.w.localStorage.getItem('ccm:settings')).autoFill, false);

  // Go off: hidden and inert; order warning off: no "Sure?"
  await b.setOpt('goButton', false);
  assert.ok(b.panel.classList.contains('nogo'));
  await b.setOpt('goButton', true);
  await b.setOpt('orderWarn', false);
  await b.tap('green'); await b.tap('go');
  assert.notEqual(b.btn('go').textContent, 'Sure?');

  // keys off: number keys do nothing
  await b.setOpt('keys', false);
  b.w.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: '1' }));
  await sleep(20);
  assert.ok(!b.btn('yellow').classList.contains('active'));

  // palette side
  await b.setOpt('left', true);
  assert.ok(b.panel.classList.contains('left'));
});

test('settings: "Fix my colors" off only corrects the solved tiles', async () => {
  const b = await board({
    words: four('X'),
    solved: [{ level: 3, words: four('A') }],
    marks: { ...Object.fromEntries(four('A').map(x => [x, 'blue'])), ...Object.fromEntries(four('X').map(x => [x, 'purple'])) },
    stored: { 'ccm:settings': { reconcile: false } },
  });
  const s = b.store();
  assert.ok(four('A').every(x => s[x] === 'purple'), 'solved tiles take the real color');
  assert.ok(four('X').every(x => s[x] === 'purple'), 'your other marks are left alone');
});

test('settings: "One away" marks off by default shows no badges', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D', 'E'] });
  await b.guess(['A', 'B', 'C', 'E'], 'away');
  assert.equal(b.tile('A').dataset.ccmAway, undefined);
});

test('marks are drawn in a sealed overlay inside each tile, and follow the mark', async () => {
  const b = await board({ words: ['A', 'B'], marks: { A: 'blue' } });
  const m = b.tile('A').querySelector('ccm-mark');
  assert.ok(m, 'overlay present');
  assert.equal(m.shadowRoot, null, 'closed shadow root: page extensions cannot restyle it');
  assert.equal(b.tile('B').querySelector('ccm-mark'), null);
  b.select(['A']); await b.tap('erase');
  assert.equal(b.tile('A').querySelector('ccm-mark'), null, 'erasing removes the overlay');
});

test('undo reverses assign, swap and exchange, and dims when there is nothing to undo', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D', 'E'], marks: { A: 'blue', B: 'purple' } });
  assert.ok(b.btn('undo').classList.contains('off'));
  b.select(['C']); await b.tap('green');
  assert.equal(b.store().C, 'green');
  assert.ok(!b.btn('undo').classList.contains('off'));
  b.select([]); // jsdom has no game to deselect for us
  await b.tap('blue'); await b.tap('purple'); // swap
  assert.equal(b.store().A, 'purple');
  await b.tap('undo');
  assert.equal(b.store().A, 'blue', 'swap undone');
  await b.tap('undo');
  assert.equal(b.store().C, undefined, 'assign undone');
  assert.ok(b.btn('undo').classList.contains('off'));
  await b.tap('undo');
  assert.ok(b.shook(), 'nothing left to undo');
  b.select(['D']);
  b.w.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: '2' })); await sleep(40);
  b.w.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: 'z' })); await sleep(40);
  assert.equal(b.store().D, undefined, 'Z undoes');
});

test('color letters: swatches and dots show Y/G/B/P when turned on', async () => {
  const b = await board({ words: ['A', 'B'], marks: { A: 'purple' }, stored: { 'ccm:settings': { letters: true } } });
  assert.equal(b.btn('purple').textContent, 'P1');
  assert.equal(b.btn('yellow').textContent, 'Y0');
  await b.setOpt('letters', false);
  assert.equal(b.btn('purple').textContent, '1');
});

test('dark theme follows NYT dark mode or Dark Reader', async () => {
  const b = await board({ words: ['A'] });
  const host = b.d.getElementById('ccm-root');
  assert.equal(host.dataset.theme, 'light');
  b.d.body.dataset.mode = 'dark'; await sleep(80);
  assert.equal(host.dataset.theme, 'dark');
  delete b.d.body.dataset.mode; await sleep(80);
  assert.equal(host.dataset.theme, 'light');
  b.d.documentElement.dataset.darkreaderScheme = 'dark'; await sleep(80);
  assert.equal(host.dataset.theme, 'dark');
});

test('another tab changing the same puzzle is picked up', async () => {
  const b = await board({ words: ['A', 'B'], marks: { A: 'blue' } });
  b.w.localStorage.setItem('ccm:2023-07-01', JSON.stringify({ A: 'green' }));
  b.w.dispatchEvent(new b.w.StorageEvent('storage', { key: 'ccm:2023-07-01' }));
  await sleep(40);
  assert.equal(b.tile('A').dataset.ccm, 'green');
});

test('today\'s puzzle (no date in the URL) is filed under the day the page opened', async () => {
  const b = await board({ words: ['A'], date: '' });
  b.select(['A']); await b.tap('blue');
  const today = new Date().toLocaleDateString('en-CA');
  assert.equal(JSON.parse(b.w.localStorage.getItem(`ccm:${today}`)).A, 'blue');
});

test('tiles show just the outline; the corner letter dot appears only with color letters on', async () => {
  // the overlay's shadow root is closed, so check what it renders through its cache key
  const b = await board({ words: ['A'], marks: { A: 'blue' } });
  assert.equal(b.tile('A').querySelector('ccm-mark').dataset.k, 'blue||0|');
  await b.setOpt('letters', true);
  assert.equal(b.tile('A').querySelector('ccm-mark').dataset.k, 'blue||1|');
});

const maybesOf = (b, date = '2023-07-01') => JSON.parse(b.w.localStorage.getItem(`ccm:maybe:${date}`) || '{}');
const markKey = (b, x) => b.tile(x).querySelector('ccm-mark')?.dataset.k;

test('maybe colors: off by default; ? mode turns tiles into splits of their candidate colors', async () => {
  const off = await board({ words: ['A'] });
  assert.ok(off.panel.classList.contains('nomaybe'));

  const b = await board({ words: ['A', 'B', 'C', 'D', 'E'], marks: { A: 'blue' }, stored: { 'ccm:settings': { maybes: true } } });
  assert.ok(!b.panel.classList.contains('nomaybe'));
  await b.tap('maybe');
  assert.ok(b.panel.classList.contains('maybemode'));
  // a decided tile gains a second option: it becomes undecided (no longer counts as blue)
  b.select(['A']); await b.tap('purple');
  assert.deepEqual(maybesOf(b), { A: ['blue', 'purple'] }, 'kept in rainbow order');
  assert.equal(b.store().A, undefined, 'a split tile is not decided');
  assert.equal(markKey(b, 'A'), '||0|blue,purple');
  assert.equal(b.tile('A').dataset.ccmSplit, 'blue,purple', 'split tiles are positioned so the outline stays on the tile');
  // one option on an unmarked tile is just a plain mark
  b.select(['B']); await b.tap('green');
  assert.equal(b.store().B, 'green');
  assert.deepEqual(maybesOf(b), { A: ['blue', 'purple'] });
  // removing options down to one decides the tile again
  b.select(['A']); await b.tap('purple');
  assert.equal(b.store().A, 'blue');
  assert.deepEqual(maybesOf(b), {});
  // ⌫ clears everything on the tile
  b.select(['A']); await b.tap('yellow');
  b.select(['A']); await b.tap('erase');
  assert.equal(b.store().A, undefined);
  assert.deepEqual(maybesOf(b), {});
});

test('maybe colors: split tiles never count toward the 4-per-color limit, Go or auto-fill', async () => {
  const b = await board({
    words: ['A', 'B', 'C', 'D', 'E'], marks: { A: 'blue', B: 'blue', C: 'blue', D: 'blue' },
    stored: { 'ccm:settings': { maybes: true } },
  });
  await b.tap('maybe');
  b.select(['E']); await b.tap('green');
  b.select(['E']); await b.tap('blue'); // E: green, then green-or-blue
  assert.ok(!b.shook(), 'blue is full, but a split option is fine');
  assert.deepEqual(maybesOf(b), { E: ['green', 'blue'] });
  assert.equal(b.btn('blue').textContent, '4');
  // dropping green leaves only blue, which is full: E stays a lone (dashed) candidate
  b.select(['E']); await b.tap('green');
  assert.deepEqual(maybesOf(b), { E: ['blue'] });
  assert.equal(b.store().E, undefined);
});

test('maybe colors: undo, swaps and solves carry them along', async () => {
  const b = await board({ words: ['A', 'B', 'C'], stored: { 'ccm:settings': { maybes: true } } });
  await b.tap('maybe');
  b.select(['A']); await b.tap('blue');
  b.select(['A']); await b.tap('green');
  assert.deepEqual(maybesOf(b), { A: ['green', 'blue'] });
  await b.tap('undo');
  assert.deepEqual(maybesOf(b), {}, 'undo takes back the second option');
  assert.equal(b.store().A, 'blue');
  b.select(['A']); await b.tap('green');
  await b.tap('maybe');
  b.select([]);
  await b.tap('blue'); await b.tap('yellow'); // swap blue <-> yellow
  assert.deepEqual(maybesOf(b), { A: ['yellow', 'green'] }, 'swaps carry options');

  // a solved color drops out; a tile left with one option becomes that color
  const s = await board({
    words: ['X', 'Y', 'Z'],
    solved: [{ level: 0, words: ['P1', 'P2', 'P3', 'P4'] }],
    stored: { 'ccm:settings': { maybes: true }, 'ccm:maybe:2023-07-01': { X: ['yellow', 'green'], Y: ['yellow', 'blue', 'purple'], P1: ['green', 'blue'] } },
  });
  assert.deepEqual(maybesOf(s), { Y: ['blue', 'purple'] }, 'yellow dropped, solved tiles cleared');
  assert.equal(s.store().X, 'green', 'yellow-or-green became green once yellow was solved');
});

test('maybe colors: 0.6 data (a mark plus maybe dots) becomes a split', async () => {
  const b = await board({
    words: ['A', 'B'], marks: { A: 'blue' },
    stored: { 'ccm:settings': { maybes: true }, 'ccm:maybe:2023-07-01': { A: ['purple'], B: ['green'] } },
  });
  assert.deepEqual(maybesOf(b), { A: ['blue', 'purple'] });
  assert.equal(b.store().A, undefined);
  assert.equal(b.store().B, 'green', 'a single maybe on an unmarked tile becomes its mark');
});

test('maybe colors: Shift+number toggles an option without maybe mode, M toggles the mode', async () => {
  const b = await board({ words: ['A', 'B'], marks: { A: 'green' }, stored: { 'ccm:settings': { maybes: true } } });
  b.select(['A']);
  b.w.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: '#', code: 'Digit3', shiftKey: true })); await sleep(40);
  assert.deepEqual(maybesOf(b), { A: ['green', 'blue'] });
  assert.ok(!b.panel.classList.contains('maybemode'));
  b.w.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: 'm' })); await sleep(20);
  assert.ok(b.panel.classList.contains('maybemode'));
});

test('palette: ⋯ is phone-only and toggles the second row', async () => {
  const b = await board({ words: ['A'] });
  const more = b.btn('more');
  assert.equal(more.textContent, '⋯');
  more.click(); await sleep(20);
  assert.ok(b.panel.classList.contains('more'));
  more.click(); await sleep(20);
  assert.ok(!b.panel.classList.contains('more'));
});

test('sorting keeps split tiles together after the decided rows, padding rows with blank tiles first', async () => {
  const b = await board({
    words: ['S1', 'N1', 'Y1', 'S2', 'Y2', 'N2', 'Y3', 'N3'],
    marks: { Y1: 'yellow', Y2: 'yellow', Y3: 'yellow' },
    stored: { 'ccm:sort': '1', 'ccm:settings': { maybes: true }, 'ccm:maybe:2023-07-01': { S1: ['green', 'blue'], S2: ['yellow', 'purple'] } },
  });
  const order = [...b.d.querySelectorAll('[data-testid=card-label]')].sort((x, y) => x.style.order - y.style.order).map(t => t.dataset.flipId);
  assert.deepEqual(order, ['Y1', 'Y2', 'Y3', 'N1', 'S2', 'S1', 'N2', 'N3']);
  b.close();
});

test('maybe mode holds tiles still; they re-sort when it goes off', async () => {
  const b = await board({
    words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], marks: { H: 'purple' },
    stored: { 'ccm:sort': '1', 'ccm:settings': { maybes: true } },
  });
  const order = () => [...b.d.querySelectorAll('[data-testid=card-label]')].sort((x, y) => x.style.order - y.style.order).map(t => t.dataset.flipId).join('');
  assert.equal(order(), 'HABCDEFG');
  await b.tap('maybe');
  b.select(['G']); await b.tap('blue');
  b.select(['G']); await b.tap('green');
  assert.equal(order(), 'HABCDEFG', 'G stays put while maybe mode is on');
  await b.tap('maybe');
  assert.equal(order(), 'HABCGDEF', 'G joins the split tiles once maybe mode is off');
  b.close();
});
