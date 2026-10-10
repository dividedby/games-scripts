// Refresh Wordle Shortlist's word lists from WordGamesBot (NYT WordleBot's answer and
// guess lists):  pnpm update-words
// Rewrites the word block in the script. When the lists changed, it also bumps the
// script's patch version and adds a changelog line. Prints what changed; in GitHub
// Actions it also sets the outputs `changed` and `summary`.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/WordGamesBot/wordgamesbot.github.io/main/WordLists/NYT/';
const SCRIPT = new URL('../wordle-shortlist.user.js', import.meta.url);
const CHANGELOG = new URL('../../CHANGELOG.md', import.meta.url);

async function list(file) {
  const res = await fetch(SOURCE + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const words = [...(await res.text()).matchAll(/"([A-Za-z]+)"/g)].map(m => m[1].toLowerCase());
  return [...new Set(words)].filter(w => /^[a-z]{5}$/.test(w));
}

const answers = await list('Answers.js');
const guesses = await list('Guesses.js');
// a broken download shouldn't empty the script
if (answers.length < 2000 || guesses.length < 3000) throw new Error(`lists look wrong: ${answers.length} answers, ${guesses.length} guesses`);

const isAnswer = new Set(answers);
const all = [...new Set([...guesses, ...answers])].sort(); // every answer must be guessable
const packed = all.map(w => (isAnswer.has(w) ? w.toUpperCase() : w)).join('');
const block = packed.match(/.{1,100}/g).join('\n');

let src = readFileSync(SCRIPT, 'utf8');
const start = src.indexOf('const WORDS = `\n') + 'const WORDS = `\n'.length;
const end = src.indexOf('\n`.replace(/\\s+/g', start);
if (start < 20 || end < 0) throw new Error('word block not found in the script');
const old = src.slice(start, end).replace(/\s+/g, '');
const words = s => new Set(s.match(/.{5}/g));
const oldAll = words(old.toLowerCase());
const oldAns = new Set([...words(old)].filter(w => w !== w.toLowerCase()).map(w => w.toLowerCase()));

const diff = (a, b) => [...a].filter(w => !b.has(w)).sort();
const ansAdded = diff(isAnswer, oldAns), ansRemoved = diff(oldAns, isAnswer);
const allSet = new Set(all);
const guessAdded = diff(allSet, oldAll), guessRemoved = diff(oldAll, allSet);
const changed = ansAdded.length + ansRemoved.length + guessAdded.length + guessRemoved.length > 0;

const show = ws => ws.length ? ws.map(w => w.toUpperCase()).join(', ') : 'none';
const lines = [
  `Likely answers: ${answers.length} (added: ${show(ansAdded)}; removed: ${show(ansRemoved)})`,
  `All words: ${all.length} (added: ${guessAdded.length}; removed: ${guessRemoved.length})`,
];

if (changed) {
  src = src.slice(0, start) + block + src.slice(end);
  let version;
  src = src.replace(/(\/\/ @version\s+)(\d+)\.(\d+)\.(\d+)/, (_, pre, a, b, c) => pre + (version = `${a}.${b}.${+c + 1}`));
  writeFileSync(SCRIPT, src);

  const parts = [];
  if (ansAdded.length) parts.push(`${ansAdded.length} likely answer${ansAdded.length > 1 ? 's' : ''} added (${show(ansAdded)})`);
  if (ansRemoved.length) parts.push(`${ansRemoved.length} removed (${show(ansRemoved)})`);
  if (!parts.length) parts.push('the wider guess list changed');
  const entry = `- Word lists updated from NYT WordleBot: ${parts.join(', ')}.`;
  let log = readFileSync(CHANGELOG, 'utf8');
  const head = log.indexOf('## Wordle Shortlist');
  const unrel = log.indexOf('### [Unreleased]', head);
  const next = log.indexOf('\n### ', unrel + 1);
  const section = log.slice(unrel, next < 0 ? undefined : next);
  const changedAt = section.indexOf('#### Changed\n');
  log = changedAt >= 0
    ? log.slice(0, unrel + changedAt + 13) + entry + '\n' + log.slice(unrel + changedAt + 13)
    : log.slice(0, unrel + 16) + '\n#### Changed\n' + entry + log.slice(unrel + 16);
  writeFileSync(CHANGELOG, log);
  lines.push(`Version ${version}.`);
}

console.log(changed ? 'Word lists changed.' : 'Word lists are up to date.');
lines.forEach(l => console.log(l));
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nsummary<<EOF\n${lines.map(l => '- ' + l).join('\n')}\nEOF\n`);
}
