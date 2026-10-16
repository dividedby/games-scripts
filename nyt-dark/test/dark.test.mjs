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

test('hint, forum and bot pages: NYT\'s own dark colors for news pages, and black icons flipped', async () => {
  const dom = new JSDOM(`<!doctype html><html class="story tpl-always-light"><head></head><body>
    <header style="background-color: rgb(255, 255, 255)"><span id="acct" style="color: rgb(0, 0, 0)">Account</span>
      <svg id="logo"><path d="M0 0" style="fill: rgb(0, 0, 0)"></path></svg>
      <svg id="game"><path d="M0 0" style="fill: rgb(106, 170, 100)"></path></svg></header></body></html>`,
  { url: 'https://www.nytimes.com/2026/10/10/crosswords/connections-companion-1218.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.localStorage.setItem('nytd:mode', '"dark"');
  w.eval(SRC);
  await sleep(400);
  const d = w.document, html = d.documentElement;
  assert.ok(html.classList.contains('tpl-always-dark') && !html.classList.contains('tpl-always-light'), 'swaps NYT\'s light class for its dark one');
  assert.ok('nytdPanel' in d.querySelector('header').dataset, 'the white masthead turns dark');
  assert.equal(d.getElementById('acct').dataset.nytdInk, 'light');
  assert.ok('nytdFlip' in d.getElementById('logo').dataset, 'the black logo is flipped');
  assert.ok(!('nytdFlip' in d.getElementById('game').dataset), 'a colorful icon is left alone');
});

test('rescans look again at what changed: a card turned white later, and text that arrives late', async () => {
  const p = await page({ mode: 'dark' });
  p.body.insertAdjacentHTML('beforeend', '<div id="hub-root"><div id="card"><span id="late" style="color: rgb(0, 0, 0)"></span></div></div>');
  await sleep(300);
  const card = p.d.getElementById('card'), late = p.d.getElementById('late');
  assert.ok(!('nytdPanel' in card.dataset), 'not white yet');
  card.setAttribute('style', 'background-color: rgb(255, 255, 255)');
  late.textContent = 'Play';
  p.w.__nytd.markPanels();
  assert.ok('nytdPanel' in card.dataset, 'the card is darkened once it turns white');
  assert.equal(late.dataset.nytdInk, 'light', 'its late text is fixed too');
});

test('a mode from another tab is checked before use: anything unknown means Auto', async () => {
  const p = await page({ mode: 'dark' });
  assert.equal(p.w.__nytd.mode, 'dark');
  for (const bad of ['"constructor"', '42', 'null', 'not json']) {
    p.w.localStorage.setItem('nytd:mode', bad);
    p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: 'nytd:mode' }));
    await sleep(20);
    assert.equal(p.w.__nytd.mode, 'auto', bad);
    assert.equal(p.toggle().textContent, '◐ Auto');
  }
  p.w.localStorage.setItem('nytd:mode', '"light"');
  p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: 'nytd:mode' }));
  await sleep(20);
  assert.equal(p.w.__nytd.mode, 'light');
});

test('news-style pages: what the page adds later is looked at too (just the new parts)', async () => {
  const dom = new JSDOM(`<!doctype html><html class="story tpl-always-light"><head></head><body><main id="story"></main></body></html>`,
  { url: 'https://www.nytimes.com/2026/10/10/crosswords/connections-companion-1218.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.localStorage.setItem('nytd:mode', '"dark"');
  w.__NYTD_TEST__ = true;
  w.eval(SRC);
  await sleep(300);
  const d = w.document;
  // already looked at, then quietly turned white without any element being added: left for a full look
  const quiet = d.createElement('div');
  quiet.id = 'quiet';
  d.getElementById('story').appendChild(quiet);
  await sleep(300);
  quiet.setAttribute('style', 'background-color: rgb(255, 255, 255)');
  d.getElementById('story').insertAdjacentHTML('beforeend', `<aside id="late" style="background-color: rgb(255, 255, 255)">
    <span id="txt" style="color: rgb(0, 0, 0)">More hints</span>
    <svg id="ico"><path d="M0 0" style="fill: rgb(0, 0, 0)"></path></svg></aside>`);
  await sleep(300);
  assert.ok('nytdPanel' in d.getElementById('late').dataset, 'the added white box turns dark');
  assert.equal(d.getElementById('txt').dataset.nytdInk, 'light', 'its text turns light');
  assert.ok('nytdFlip' in d.getElementById('ico').dataset, 'its black icon is flipped');
  assert.ok(!('nytdPanel' in quiet.dataset), 'the rest of the page isn\'t rescanned for it');
  w.__nytd.markPanels();
  assert.ok('nytdPanel' in quiet.dataset, 'a full look still finds it');
});

test('a second copy of the script does nothing', async () => {
  const p = await page({ mode: 'dark' });
  p.w.eval(SRC); await sleep(50);
  assert.equal(p.d.querySelectorAll('#nytd-style').length, 1);
  assert.equal(p.d.querySelectorAll('#nytd-toggle').length, 1);
});

test('Wordle, which has its own toolbar instead of the site header, gets the toggle after ⚙ once the toolbar appears', async () => {
  const dom = new JSDOM(`<!doctype html><html><head></head><body class="pz-page"><div id="wordle-app-game"></div></body></html>`,
  { url: 'https://www.nytimes.com/games/wordle/2023-08-01', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.__NYTD_TEST__ = true;
  w.eval(SRC);
  await sleep(50);
  const d = w.document;
  assert.equal(d.getElementById('nytd-toggle'), null, 'the start screen has no toolbar yet');
  // past the start screen: the game draws its toolbar
  d.getElementById('wordle-app-game').innerHTML = `<header class="Toolbar-module_header__x"><menu class="AppHeader-module_toolbar__menu__y">
    <button id="help-button"></button><button id="settings-button" aria-label="Settings"></button><span>Create a Puzzle</span></menu></header>`;
  await sleep(100);
  const t = d.getElementById('nytd-toggle');
  assert.ok(t, 'a toggle in the toolbar');
  assert.equal(t.previousElementSibling.id, 'settings-button');
  assert.ok(t.classList.contains('nytd-in-toolbar'), 'styled to fit the toolbar');
  assert.equal(t.textContent, '◐ Auto');
  assert.equal(t.querySelector('.nytd-word').textContent, ' Auto', 'the word can be hidden on phones');
  t.click(); await sleep(30);
  assert.equal(d.documentElement.dataset.mode, 'dark');
  assert.equal(t.getAttribute('aria-label'), 'Dark mode: Dark');
});

test('links in the dark header bar get light text and outline (Upgrade subscription), NYT\'s filled buttons and the menu are left alone', async () => {
  const p = await page({ mode: 'dark' });
  p.d.querySelector('.pz-nav').insertAdjacentHTML('beforeend',
    '<a id="up" class="css-1o52ud2">Upgrade subscription</a><a id="sub" class="pz-nav__button default">Subscribe</a>' +
    '<div class="pz-nav-drawer"><a id="menu">Wordle</a></div>');
  // (jsdom's cascade doesn't weigh !important against the page's own classes, so check the rule matches)
  const rule = [...p.d.getElementById('nytd-style').sheet.cssRules].find(r => r.selectorText?.includes(':not(.pz-nav__button)'));
  assert.ok(rule, 'a header-link rule');
  assert.equal(rule.style.getPropertyPriority('color'), 'important');
  assert.ok(p.d.getElementById('up').matches(rule.selectorText));
  assert.ok(!p.d.getElementById('sub').matches(rule.selectorText));
  assert.ok(!p.d.getElementById('menu').matches(rule.selectorText));
});
