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
const BTN = { yellow: 0, green: 1, blue: 2, purple: 3, erase: 4, sort: 5, go: 6, gear: 7, toggle: 8 };
const RGB = { yellow: 'rgb(249, 223, 109)', blue: 'rgb(176, 196, 239)', purple: 'rgb(186, 129, 197)' };

// words: tiles on the board; solved: [{ level, words }]; stored: localStorage seed
async function board({ words = [], solved = [], date = '2023-07-01', marks = {}, stored = {} } = {}) {
  const tiles = words.map(w => `<label class="Card-module_label" data-testid="card-label" data-flip-id="${w}">${w}<span>${w}</span></label>`).join('');
  const secs = solved.map(s => `<section data-testid="solved-category-container" data-level="${s.level}"><ol>${s.words.map(w => `<li>${w}</li>`).join('')}</ol></section>`).join('');
  const dom = new JSDOM(`<!doctype html><body>${secs}<div id="board" style="display:grid">${tiles}</div>` +
    `<button data-testid="deselect-btn">Deselect All</button><button data-testid="submit-btn" disabled>Submit</button></body>`,
  { url: `https://www.nytimes.com/games/connections/${date}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.PointerEvent = w.PointerEvent || w.MouseEvent;
  w.localStorage.setItem(`ccm:${date}`, JSON.stringify(marks));
  for (const [k, v] of Object.entries(stored)) w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  w.eval(SRC);
  await sleep(60);
  const d = w.document;
  const panel = d.getElementById('ccm-panel');
  const b = {
    w, d, panel,
    btn: k => panel.querySelectorAll(':scope > button')[BTN[k]],
    box: k => d.querySelector(`#ccm-settings input[data-k="${k}"]`),
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
  const submit = b.d.querySelector('[data-testid=submit-btn]');
  submit.disabled = false;
  const toast = async text => { const t = b.d.createElement('div'); t.dataset.testid = 'connection-toast'; t.innerHTML = `<h2>${text}</h2>`; b.d.body.appendChild(t); await sleep(60); t.remove(); };
  b.select(['A', 'B', 'C', 'D']); submit.click(); await toast('One away...');
  b.select(['A', 'B', 'E', 'F']); submit.click(); await toast('One away...');
  b.select(['A', 'C', 'E', 'F']); submit.click(); await toast('Already guessed!');
  await sleep(60);
  assert.equal(b.tile('A').dataset.ccmAway, 'AB');
  assert.equal(b.tile('D').dataset.ccmAway, 'A');
  assert.equal(JSON.parse(b.w.localStorage.getItem('ccm:1away:2023-07-01')).length, 2);
  b.close();

  const s = await board({
    words: ['EMERALD', 'KELLY', 'LATTE', 'X1'],
    solved: [{ level: 3, words: ['BEAN', 'CLEAN', 'FOX', 'PEANUT'] }],
    stored: { 'ccm:settings': { oneAway: true }, 'ccm:1away:2023-07-01': [['BEAN', 'CLEAN', 'EMERALD', 'FOX'], ['EMERALD', 'KELLY', 'LATTE', 'X1']] },
  });
  assert.equal(s.tile('EMERALD').dataset.ccmAway, 'B', 'guess A is settled, B keeps its letter');
  s.close();
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
  assert.ok(b.d.getElementById('ccm-settings').hidden);
  await b.tap('gear');
  assert.ok(!b.d.getElementById('ccm-settings').hidden, '⚙ opens the panel');
  b.d.body.click(); await sleep(20);
  assert.ok(b.d.getElementById('ccm-settings').hidden, 'clicking outside closes it');

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

test('settings: "One away" off by default records nothing', async () => {
  const b = await board({ words: ['A', 'B', 'C', 'D'] });
  const submit = b.d.querySelector('[data-testid=submit-btn]');
  submit.disabled = false;
  b.select(['A', 'B', 'C', 'D']); submit.click();
  const t = b.d.createElement('div'); t.dataset.testid = 'connection-toast'; t.innerHTML = '<h2>One away...</h2>'; b.d.body.appendChild(t);
  await sleep(80);
  assert.equal(b.w.localStorage.getItem('ccm:1away:2023-07-01'), null);
  assert.equal(b.tile('A').dataset.ccmAway, undefined);
});
