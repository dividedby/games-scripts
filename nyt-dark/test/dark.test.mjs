// Behavior tests for nyt-games-dark.user.js in jsdom:  pnpm test
// The page markup mirrors NYT's shared site header (.pz-nav, #js-logo-nav); keep it in
// step if NYT changes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../nyt-games-dark.user.js', import.meta.url), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function page({ mode, systemDark = false, bodyClass = 'pz-page' } = {}) {
  const dom = new JSDOM(`<!doctype html><html class="pz-dont-touch"><head></head><body class="${bodyClass}">` +
    `<div class="pz-nav" id="js-global-nav"><a class="pz-nav__title" id="js-logo-nav">Games</a></div><main id="pz-game-root"></main></body></html>`,
  { url: 'https://www.nytimes.com/games/connections/2023-08-15', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const listeners = [];
  const mq = { matches: systemDark, addEventListener: (_, f) => listeners.push(f) };
  w.matchMedia = () => mq;
  if (mode) w.localStorage.setItem('nytd:mode', JSON.stringify(mode));
  w.__NYTD_TEST__ = true;
  w.eval(SRC);
  await sleep(50);
  const d = w.document;
  return {
    w, d,
    html: d.documentElement, body: d.body,
    toggle: () => d.getElementById('nytd-toggle'),
    lock: () => d.querySelector('meta[name="darkreader-lock"]'),
    scheme: () => d.querySelector('meta[name="color-scheme"]')?.content,
    async setSystem(dark) { mq.matches = dark; listeners.forEach(f => f()); await sleep(30); },
  };
}

test('dark: turns on NYT\'s own dark colors on <html> and <body>, and tells dark-mode extensions to stand back', async () => {
  const p = await page({ mode: 'dark' });
  for (const el of [p.html, p.body]) {
    assert.equal(el.dataset.mode, 'dark');
    assert.ok(el.classList.contains('display-settings-enabled'));
  }
  assert.ok(p.body.classList.contains('dark'), 'the older .dark rules (Wordle) too');
  assert.ok(p.html.classList.contains('nytd-dark'));
  assert.ok(p.lock(), 'Dark Reader lock');
  assert.equal(p.scheme(), 'dark', 'color-scheme for Noir and others');
});

test('auto follows the device, and switches live', async () => {
  const p = await page({ systemDark: false });
  assert.notEqual(p.body.dataset.mode, 'dark');
  assert.equal(p.lock(), null);
  await p.setSystem(true);
  assert.equal(p.body.dataset.mode, 'dark');
  await p.setSystem(false);
  assert.equal(p.body.dataset.mode, 'light');
  assert.ok(!p.body.classList.contains('display-settings-enabled'), 'our classes are removed again');
  assert.ok(!p.body.classList.contains('dark'));
});

test('the header toggle cycles Auto → Dark → Light and remembers it', async () => {
  const p = await page({ systemDark: false });
  assert.equal(p.toggle().textContent, '◐ Auto');
  assert.equal(p.toggle().previousElementSibling.id, 'js-logo-nav', 'sits next to the Games logo');
  p.toggle().click(); await sleep(30);
  assert.equal(p.toggle().textContent, '◐ Dark');
  assert.equal(p.body.dataset.mode, 'dark');
  assert.equal(p.w.localStorage.getItem('nytd:mode'), '"dark"');
  p.toggle().click(); await sleep(30);
  assert.equal(p.toggle().textContent, '◐ Light');
  assert.equal(p.body.dataset.mode, 'light');
  p.toggle().click(); await sleep(30);
  assert.equal(p.toggle().textContent, '◐ Auto');
});

test('keeps dark on when the game rewrites <body>, and never removes classes it didn\'t add', async () => {
  const p = await page({ mode: 'dark', bodyClass: 'pz-page dark' }); // Wordle's own dark theme already on
  p.body.className = 'pz-page dark'; // a re-render drops our classes
  p.body.removeAttribute('data-mode');
  await sleep(60);
  assert.equal(p.body.dataset.mode, 'dark');
  assert.ok(p.body.classList.contains('display-settings-enabled'));
  p.toggle().click(); await sleep(30); // → light
  assert.ok(p.body.classList.contains('dark'), 'Wordle\'s own dark class stays');
});

test('plain white or gray start and promo panels turn dark; colorful ones keep their color', async () => {
  const p = await page({ mode: 'dark' });
  const root = p.d.getElementById('pz-game-root');
  root.innerHTML = `<div class="Welcome-module_contentWelcome__x" style="background-color: rgb(227, 227, 225)">
      <div id="promo" style="background-color: rgb(255, 255, 255)">promo</div>
      <button class="_momentButton_x _primary_x" style="background-color: rgb(255, 255, 255)">Play</button>
    </div>
    <div class="Welcome-module_contentWelcome__y" id="purple" style="background-color: rgb(180, 168, 255)"></div>`;
  await sleep(300);
  assert.ok('nytdPanel' in root.querySelector('.Welcome-module_contentWelcome__x').dataset, 'Wordle\'s gray start screen');
  assert.ok('nytdPanel' in p.d.getElementById('promo').dataset, 'a white promo card');
  assert.ok(!('nytdPanel' in p.d.getElementById('purple').dataset), 'Connections\' purple start screen keeps its color');
  assert.ok(!('nytdPanel' in root.querySelector('button').dataset), 'the primary button is left for the light-button style');
  p.toggle().click(); await sleep(30); // → light
  assert.equal(p.d.querySelectorAll('[data-nytd-panel]').length, 0, 'light mode removes the marks');
});

test('pages around the games: white cards turn dark, and text is fixed by what it sits on', async () => {
  const p = await page({ mode: 'dark' });
  const hub = p.d.createElement('div');
  hub.id = 'hub-root';
  hub.innerHTML = `
    <a id="card" class="hub-game-card" style="background-color: rgb(255, 255, 255)">
      <div style="background-color: rgb(247, 218, 33)"><h3 id="onYellow" style="color: rgb(0, 0, 0)">Spelling Bee</h3></div>
      <p id="desc" style="color: rgb(0, 0, 0)">Make words</p>
      <div id="icon" style="background-image: url(puzzle-progress-0.svg)"></div>
    </a>
    <div style="background-color: rgb(253, 243, 195)"><h3 id="bonus" style="color: rgb(255, 255, 255)">Bonus Puzzles</h3></div>
    <button id="arrow" style="background-color: rgb(255, 255, 255); background-image: url(arrow.svg)"></button>
    <div id="fade" style="background-image: linear-gradient(rgb(255, 255, 255) 38px, rgba(255, 255, 255, 0))"></div>`;
  p.body.appendChild(hub);
  p.d.getElementById('pz-game-root').innerHTML = '<div id="board" style="background-color: rgb(255, 255, 255)">tile</div>';
  await sleep(600);
  const $ = id => p.d.getElementById(id).dataset;
  assert.ok('nytdPanel' in $('card'), 'the white card');
  assert.equal($('desc').nytdInk, 'light', 'black text on the darkened card turns light');
  assert.ok(!('nytdInk' in $('onYellow')), 'black text on a yellow cover stays');
  assert.equal($('bonus').nytdInk, 'dark', 'white text on a pale yellow card turns dark');
  assert.ok('nytdFlip' in $('icon'), 'a dark icon on the darkened card is flipped');
  assert.ok('nytdFlip' in $('arrow') && !('nytdPanel' in $('arrow')), 'a white button drawn with an arrow image is flipped whole');
  assert.ok(!('nytdPanel' in $('board')), 'game boards are left to NYT\'s own dark colors');
  const fade = p.d.getElementById('fade');
  assert.match(fade.style.backgroundImage, /rgb\(27, 27, 27\) 38px, rgba\(27, 27, 27, 0\)/, 'a white fade becomes a dark one');
  p.toggle().click(); await sleep(30); // → light
  assert.equal(p.d.querySelectorAll('[data-nytd-panel], [data-nytd-ink], [data-nytd-flip]').length, 0, 'light mode removes every mark');
  assert.match(fade.style.backgroundImage, /^linear-gradient\(rgb\(255, 255, 255\)/, 'and puts the white fade back');
});
