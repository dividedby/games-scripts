// Behavior tests for wordle-guess-picks.user.js, run against a simulated Wordle board in
// jsdom:  pnpm test
// The markup mirrors what the live game renders (data-testid="tile" with data-state,
// keyboard buttons with data-key, ↵ and ←); keep it in step if NYT changes the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../wordle-guess-picks.user.js', import.meta.url), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const STATES = ['absent', 'present', 'correct'];

// The game's coloring, written independently of the script's: greens first, then yellows
// left to right while the answer has unmatched copies of the letter.
function colors(guess, answer) {
  const out = Array(5).fill('absent'), spare = {};
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) out[i] = 'correct'; else spare[answer[i]] = (spare[answer[i]] || 0) + 1;
  for (let i = 0; i < 5; i++) if (out[i] !== 'correct' && spare[guess[i]] > 0) { out[i] = 'present'; spare[guess[i]]--; }
  return out;
}

// answer: the puzzle's word; played: guesses already on the board; stored: localStorage seed
async function game({ answer = 'pouch', played = [], date = '2023-07-11', hard = false, stored = {} } = {}) {
  const rows = Array.from({ length: 6 }, (_, r) =>
    `<div class="Row-module_row" role="group" aria-label="Row ${r + 1}">` +
    Array.from({ length: 5 }, () => '<div class="Tile-module_tile" data-testid="tile" data-state="empty" data-animation="idle"></div>').join('') +
    '</div>').join('');
  const keys = ['qwertyuiop', 'asdfghjkl', '↵zxcvbnm←'].map(r =>
    `<div class="Keyboard-module_row">${[...r].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>`).join('');
  const dom = new JSDOM(`<!doctype html><body><main id="wordle-app-game"><div class="Board-module_boardContainer"><div class="Board-module_board">${rows}</div></div>` +
    `<div class="Keyboard-module_keyboard">${keys}</div></main></body>`,
  { url: `https://www.nytimes.com/games/wordle${date ? '/' + date : ''}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  const tiles = () => [...d.querySelectorAll('[data-testid=tile]')];
  const g = { w, d, answer, typed: '', row: 0, submitted: [] };
  // the game: keys type into the current row, ↵ colors it
  d.querySelector('.Keyboard-module_keyboard').addEventListener('click', e => {
    const k = e.target.closest('button')?.dataset.key;
    if (!k || g.row >= 6) return;
    const row = tiles().slice(g.row * 5, g.row * 5 + 5);
    if (k === '←') { if (g.typed) { g.typed = g.typed.slice(0, -1); row[g.typed.length].textContent = ''; row[g.typed.length].dataset.state = 'empty'; } }
    else if (k === '↵') { if (g.typed.length === 5) g.enter(g.typed); }
    else if (g.typed.length < 5) { row[g.typed.length].textContent = k; row[g.typed.length].dataset.state = 'tbd'; g.typed += k; }
  });
  g.enter = word => {
    const row = tiles().slice(g.row * 5, g.row * 5 + 5);
    colors(word, g.answer).forEach((s, i) => { row[i].textContent = word[i]; row[i].dataset.state = s; });
    g.submitted.push(word); g.row++; g.typed = '';
  };
  played.forEach(x => g.enter(x));
  g.submitted = [];
  w.localStorage.setItem('games-settings-wordleV2/1', JSON.stringify({ states: [{ puzzleId: 'settings', data: { hardMode: hard } }] }));
  for (const [k, v] of Object.entries(stored)) w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  w.__WGP_TEST__ = true;
  w.eval(SRC);
  await sleep(20);
  g.root = w.__wgpRoot;
  g.E = w.__wgp;
  g.panel = () => g.root.getElementById('wgp');
  g.picks = () => [...g.panel().querySelectorAll('.pick')].map(b => b.dataset.w);
  g.pick = word => g.panel().querySelector(`.pick[data-w="${word}"]`);
  g.saved = () => JSON.parse(w.localStorage.getItem('wgp:' + date));
  g.type = async word => { for (const c of word) d.querySelector(`[data-key="${c}"]`).click(); await sleep(200); };
  g.guess = async word => { await g.type(word); d.querySelector('[data-key="↵"]').click(); await sleep(250); };
  return g;
}

test('the game coloring matches the script, repeated letters included', async () => {
  const g = await game();
  const pairs = [['speed', 'abide'], ['eerie', 'there'], ['llama', 'hello'], ['allee', 'level'], ['crane', 'crane'], ['mamma', 'jazzy']];
  for (const [x, y] of pairs) {
    const p = g.E.pattern(g.E.codes(x), g.E.codes(y));
    const s = Array.from({ length: 5 }, (_, i) => STATES[Math.floor(p / 3 ** i) % 3]);
    assert.deepEqual(s, colors(x, y), `${x} against ${y}`);
  }
});

test('before the first guess: one random starting word from the likely answers, kept on reload', async () => {
  const g = await game();
  const picks = g.picks();
  assert.equal(picks.length, 1);
  assert.match(g.panel().textContent, /Start with/);
  assert.ok(g.E.ANSWERS.some(i => g.E.ALL[i] === picks[0]), 'the starting word is a likely answer');
  const again = await game({ stored: { ['wgp:2023-07-11']: g.saved() } });
  assert.deepEqual(again.picks(), picks, 'reloading the page shows the same word');
});

test('after a guess: five picks from the best 30, each with a hint, the ones that could be the answer marked', async () => {
  const g = await game({ played: ['crane'] });
  const picks = g.picks();
  assert.equal(picks.length, 5);
  assert.equal(new Set(picks).size, 5);
  const rows = [{ word: 'crane', states: colors('crane', 'pouch') }];
  const cands = g.E.candidates(rows, g.E.ANSWERS);
  const ranked = g.E.ALL.map((x, i) => ({ x, e: g.E.expectedLeft(g.E.codes(x), cands) })).filter(r => r.x !== 'crane').sort((a, b) => a.e - b.e);
  const cutoff = ranked[29].e;
  for (const p of picks) {
    const b = g.pick(p);
    assert.ok(g.E.expectedLeft(g.E.codes(p), cands) <= cutoff + 1e-9, `${p} is among the best 30`);
    assert.match(b.querySelector('small').textContent, /^~\d+ left$/);
    assert.equal(b.classList.contains('ans'), cands.some(i => g.E.ALL[i] === p), `${p} answer mark`);
  }
  assert.ok(!picks.includes('crane'), 'never offers a word already played');
});

test('the picks follow the hints in hard mode', async () => {
  const g = await game({ played: ['crane', 'pilot'], hard: true });
  const rows = ['crane', 'pilot'].map(x => ({ word: x, states: colors(x, 'pouch') }));
  for (const p of g.picks()) {
    for (const r of rows) {
      r.states.forEach((s, i) => { if (s === 'correct') assert.equal(p[i], r.word[i], `${p} keeps the green ${r.word[i]}`); });
      r.states.forEach((s, i) => { if (s === 'present') assert.ok(p.includes(r.word[i]), `${p} uses the yellow ${r.word[i]}`); });
    }
  }
});

test('tapping a pick clears what you typed, types the pick and submits it', async () => {
  const g = await game({ played: ['crane'] });
  await g.type('xy');
  const p = g.picks()[0];
  g.pick(p).click();
  await sleep(600);
  assert.deepEqual(g.submitted, [p]);
  assert.equal(g.picks().length > 0, true, 'new picks for the next turn');
  assert.ok(!g.picks().includes(p));
});

test('with two or fewer answers left, those are the only picks', async () => {
  const g = await game({ answer: 'pouch', played: ['crane', 'pilot', 'shtum'] });
  const rows = ['crane', 'pilot', 'shtum'].map(x => ({ word: x, states: colors(x, 'pouch') }));
  const cands = Array.from(g.E.candidates(rows, g.E.ANSWERS), i => g.E.ALL[i]);
  assert.ok(cands.length <= 2, 'sanity: three guesses narrow it to two or fewer');
  assert.deepEqual(g.picks().sort(), cands.sort());
  const g2 = await game({ answer: 'pouch', played: ['couch'] });
  const left = g2.E.candidates([{ word: 'couch', states: colors('couch', 'pouch') }], g2.E.ANSWERS).length;
  assert.ok(left > 2, 'sanity: couch leaves several');
  assert.equal(g2.picks().length, 5);
});

test('a solved or lost puzzle hides the picks', async () => {
  const g = await game({ played: ['crane'] });
  await g.guess('pouch');
  assert.ok(g.panel().hidden);
  const lost = await game({ answer: 'pouch', played: ['crane', 'pilot', 'shtum', 'dodgy', 'jazzy', 'fifty'] });
  assert.ok(lost.panel().hidden);
});

test('🎲 deals new picks and ▾ tucks them away until 🎲 Picks is tapped', async () => {
  const g = await game({ played: ['crane'] });
  const first = g.picks().join();
  let changed = false;
  for (let i = 0; i < 5 && !changed; i++) { g.root.getElementById('roll').click(); await sleep(20); changed = g.picks().join() !== first; }
  assert.ok(changed);
  assert.equal(g.saved().picks.map(p => p.word).join(), g.picks().join(), 'the new picks are saved');
  g.root.getElementById('hide').click(); await sleep(20);
  assert.ok(g.panel().hidden);
  const show = g.root.getElementById('show');
  assert.ok(!show.hidden);
  const g2 = await game({ played: ['crane'], stored: { 'wgp:collapsed': true } });
  assert.ok(g2.panel().hidden, 'stays tucked away on reload');
  g2.root.getElementById('show').click(); await sleep(20);
  assert.ok(!g2.panel().hidden);
});

test('an answer missing from the list still gets picks from the wider guess list', async () => {
  const g = await game();
  const notAnswer = g.E.ALL.find((x, i) => !g.E.ANSWERS.includes(i) && !/(.).*\1/.test(x));
  const g2 = await game({ answer: notAnswer, played: ['crane', 'pilot'] });
  const rows = ['crane', 'pilot'].map(x => ({ word: x, states: colors(x, notAnswer) }));
  assert.ok(g2.picks().length > 0);
  assert.ok(g2.E.candidates(rows, g2.E.ALL.map((_, i) => i)).some(i => g2.E.ALL[i] === notAnswer));
});

test('the picks sit just above the game keyboard, and saved picks expire after 60 days', async () => {
  const old = Date.now() - 61 * 864e5;
  const g = await game({ stored: { 'wgp:2023-01-01': { sig: '', picks: [], at: old }, 'wgp:2023-07-10': { sig: '', picks: [], at: Date.now() } } });
  assert.equal(g.d.getElementById('wgp-root').nextElementSibling.className, 'Keyboard-module_keyboard');
  assert.equal(g.w.localStorage.getItem('wgp:2023-01-01'), null);
  assert.notEqual(g.w.localStorage.getItem('wgp:2023-07-10'), null);
});
