import {SLOTS, TRIES, pad, score, dayNumber, dailyAnswer, validate} from './game.js';
const $ = id => document.getElementById(id);
let data, answer, guesses = [], typed = '', mode = 'daily', activeDay, ready = false;
let practiceAnswer = '', practiceGuesses = [], practiceTyped = '';
const help = $('help-dialog');
$('help').onclick = () => help.showModal();
help.querySelectorAll('.close').forEach(button => button.onclick = () => help.close());
help.addEventListener('click', e => { if (e.target === help) { const r = help.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) help.close(); }});
const rows = ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
for (const [i, row] of rows.entries()) {
  const container = document.createElement('div');
  container.className = `key-row ${i === 2 ? 'letters' : ''} ${i === 3 ? 'bottom' : ''}`;
  for (const ch of row) container.append(key(ch, ch));
  $('keyboard').append(container);
}
const actions = document.createElement('div'); actions.className = 'key-row';
actions.append(key('Blank □', ' ', 'action'), key('Delete ⌫', 'Backspace', 'action'), key('Enter ↵', 'Enter', 'action submit'));
$('keyboard').append(actions);
function key(label, value, extra = '') {
  const button = document.createElement('button'); button.className = `key ${extra}`;
  button.textContent = label; button.dataset.key = value;
  button.setAttribute('aria-label', value === ' ' ? 'Add blank character' : value === 'Backspace' ? 'Delete character' : value === 'Enter' ? 'Submit guess' : value);
  button.onclick = () => handleKey(value); return button;
}
const storageKey = () => `gene-six:v1:${activeDay}`;
const finished = () => guesses.includes(answer) || guesses.length >= TRIES;
function save() {
  if (mode !== 'daily') return;
  try { localStorage.setItem(storageKey(), JSON.stringify({guesses, typed})); } catch { /* Play continues without storage. */ }
}
function restore() {
  guesses = []; typed = '';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()));
    if (!saved || !Array.isArray(saved.guesses) || saved.guesses.length > TRIES) return;
    for (const g of saved.guesses) {
      if (typeof g !== 'string' || g.length !== SLOTS || validate(g, data.genes) || guesses.includes(g) || guesses.includes(answer)) break;
      guesses.push(g);
    }
    if (!finished() && typeof saved.typed === 'string' && /^[A-Z0-9 ]{0,6}$/.test(saved.typed)) typed = saved.typed;
  } catch { /* Ignore unavailable or stale local data. */ }
}
function say(message, error = false) { $('message').textContent = message; $('message').classList.toggle('error', error); }
function render() {
  $('board').replaceChildren();
  const keyStates = {}, rank = {absent:1, present:2, correct:3};
  for (let r = 0; r < TRIES; r++) {
    const row = document.createElement('div'); row.className = 'row';
    const submitted = guesses[r]; const word = submitted ?? (r === guesses.length ? typed : '');
    const scores = submitted ? score(submitted, answer) : null;
    row.setAttribute('aria-label', `Guess ${r + 1}${submitted ? ': ' + submitted.replaceAll(' ', ' blank ') : ''}`);
    for (let c = 0; c < SLOTS; c++) {
      const cell = document.createElement('div'); cell.className = 'tile';
      const ch = word[c];
      cell.textContent = ch === ' ' ? '□' : ch || '';
      if (ch !== undefined) cell.classList.add('filled');
      if (ch === ' ') cell.classList.add('blank');
      if (scores) {
        cell.classList.add(scores[c]);
        cell.setAttribute('aria-label', `${ch === ' ' ? 'Blank' : ch}: ${scores[c] === 'correct' ? 'right spot' : scores[c] === 'present' ? 'wrong spot' : 'not present'}`);
        if (!keyStates[ch] || rank[scores[c]] > rank[keyStates[ch]]) keyStates[ch] = scores[c];
      } else if (r === guesses.length && !finished() && c === typed.length) cell.classList.add('current');
      row.append(cell);
    }
    $('board').append(row);
  }
  document.querySelectorAll('.key').forEach(k => {
    k.classList.remove('absent','present','correct');
    if (keyStates[k.dataset.key]) k.classList.add(keyStates[k.dataset.key]);
    k.disabled = !ready || finished();
  });
  $('daily').setAttribute('aria-pressed', String(mode === 'daily'));
  $('practice').setAttribute('aria-pressed', String(mode === 'practice'));
  $('puzzle-label').textContent = mode === 'daily' ? `${new Date(activeDay * 86400000).toISOString().slice(0,10)} · UTC` : 'A fresh discovery';
  $('result').hidden = !finished();
  if (finished()) {
    const won = guesses.includes(answer), symbol = answer.trimEnd(), gene = data.genes[symbol];
    $('result-title').textContent = won ? `Gene found in ${guesses.length} / 6.` : 'A new gene to know.';
    $('gene-link').textContent = symbol; $('gene-link').href = `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${gene.id}`;
    $('gene-name').textContent = gene.name;
    say(mode === 'daily' ? 'Come back tomorrow, or keep discovering in practice.' : 'Another discovery is just a tap away.');
  }
}
async function rollover() {
  if (mode !== 'daily' || dayNumber() === activeDay) return false;
  ready = false; activeDay = dayNumber(); answer = pad(await dailyAnswer(data.answers, activeDay)); restore(); ready = true;
  render(); say('A new UTC day. Your next daily gene is ready.'); return true;
}
async function handleKey(value) {
  if (!ready || help.open) return;
  if (await rollover()) return;
  if (finished()) return;
  if (value === 'Backspace') typed = typed.slice(0,-1);
  else if (value === 'Enter') {
    const error = validate(typed, data.genes);
    if (error) {
      say(error, true);
      const row = $('board').children[guesses.length]; row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); return;
    }
    const guess = pad(typed);
    if (guesses.includes(guess)) { say('You already tried that gene.', true); return; }
    guesses.push(guess); typed = '';
  } else if (/^[A-Z0-9 ]$/.test(value) && typed.length < SLOTS) typed += value;
  else return;
  say('');
  save(); render();
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea') || (e.target.closest('button') && !e.target.closest('#keyboard')) || help.open) return;
  if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z0-9 ]$/.test(e.key)) { e.preventDefault(); handleKey(e.key.length === 1 ? e.key.toUpperCase() : e.key); }
});
async function switchMode(next, fresh = false) {
  if (!data || !ready) return;
  ready = false;
  if (mode === 'practice') { practiceAnswer = answer; practiceGuesses = guesses; practiceTyped = typed; }
  mode = next;
  if (mode === 'daily') { activeDay = dayNumber(); answer = pad(await dailyAnswer(data.answers, activeDay)); restore(); }
  else if (practiceAnswer && !fresh) { answer = practiceAnswer; guesses = practiceGuesses; typed = practiceTyped; }
  else {
    const candidates = data.answers.filter(s => pad(s) !== answer);
    answer = pad(candidates[crypto.getRandomValues(new Uint32Array(1))[0] % candidates.length]); guesses = []; typed = '';
  }
  ready = true; say('Guess an approved human gene symbol.'); render();
}
$('daily').onclick = () => switchMode('daily');
$('practice').onclick = () => switchMode('practice');
$('next').onclick = () => switchMode('practice', true);
$('share').onclick = async () => {
  const squares = {correct:'🟩', present:'🟨', absent:'⬜'};
  const heading = `Gene Six ${mode === 'daily' ? new Date(activeDay * 86400000).toISOString().slice(0,10) : 'Practice'} ${guesses.includes(answer) ? guesses.length : 'X'}/6`;
  const text = `${heading}\n${guesses.map(g => score(g,answer).map(s => squares[s]).join('')).join('\n')}\n${location.origin}${location.pathname}`;
  try {
    if (navigator.share) await navigator.share({text});
    else { await navigator.clipboard.writeText(text); say('Result copied to clipboard.'); }
  } catch(e) { if (e.name !== 'AbortError') { say('Copy your result below.'); const area = document.createElement('textarea'); area.value = text; area.setAttribute('aria-label','Result to copy'); area.style.width = '100%'; $('result').append(area); area.select(); } }
};
function searchGenes() {
  const q = $('gene-search').value.trim().toUpperCase();
  const matches = Object.entries(data.genes).filter(([s,g]) => !q || s.includes(q) || g.name.toUpperCase().includes(q));
  $('library-count').textContent = `${matches.length.toLocaleString()} symbols${matches.length > 40 ? ' · showing the first 40' : ''}`;
  $('gene-list').replaceChildren();
  for (const [symbol,gene] of matches.slice(0,40)) {
    const li = document.createElement('li'), a = document.createElement('a'), span = document.createElement('span');
    a.textContent = symbol; a.href = `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${gene.id}`; a.target = '_blank'; a.rel = 'noopener';
    span.textContent = gene.name; li.append(a,span); $('gene-list').append(li);
  }
}
$('gene-search').oninput = searchGenes;
async function init() {
  try {
    const response = await fetch('./genes.json'); if (!response.ok) throw new Error('Gene library unavailable');
    data = await response.json(); activeDay = dayNumber(); answer = pad(await dailyAnswer(data.answers, activeDay));
    restore(); ready = true; render(); searchGenes(); say(finished() ? $('message').textContent : 'Start with a gene you know. Try TP53 or BRCA1.');
    document.addEventListener('visibilitychange', () => { if (!document.hidden) rollover(); });
  } catch { say('Could not load the gene library. Please reload to try again.', true); }
}
init();
