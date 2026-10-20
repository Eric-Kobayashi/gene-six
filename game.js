export const SLOTS = 6;
export const TRIES = 6;
export function pad(symbol) { return symbol.padEnd(SLOTS, ' '); }
export function score(guess, answer) {
  const result = Array(SLOTS).fill('absent');
  const remaining = {};
  for (let i = 0; i < SLOTS; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < SLOTS; i++) {
    if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
      result[i] = 'present'; remaining[guess[i]]--;
    }
  }
  return result;
}
export function dayNumber(date = new Date()) { return Math.floor(date.getTime() / 86400000); }
export async function dailyAnswer(answers, day) {
  const date = new Date(day * 86400000).toISOString().slice(0, 10);
  const bytes = new TextEncoder().encode(`gene-six:v1:fern-helix-47:${date}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const index = new DataView(hash.buffer).getUint32(0, false) % answers.length;
  return answers[index];
}
export function validate(typed, genes) {
  if (!typed.trim()) return 'Start with a human gene symbol.';
  if (!/^[A-Z0-9]+ *$/.test(typed)) return 'Blanks belong after the gene symbol.';
  if (!genes[typed.trimEnd()]) return 'Not in the library. Try an approved HGNC symbol.';
  return '';
}
