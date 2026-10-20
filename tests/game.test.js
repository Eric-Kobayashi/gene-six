import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pad, score, validate, dayNumber, dailyAnswer} from '../game.js';
const data = JSON.parse(readFileSync(new URL('../genes.json', import.meta.url)));
test('short genes use literal trailing blank characters', () => {
  assert.equal(pad('TP53'), 'TP53  ');
  assert.deepEqual(score(pad('TP53'),pad('TP53')),Array(6).fill('correct'));
  assert.deepEqual(score(pad('BRCA1'),pad('TP53')),['absent','absent','absent','absent','absent','correct']);
});
test('duplicates and blanks are consumed only once', () => {
  assert.deepEqual(score('AAB   ','ABCD  '),['correct','absent','present','absent','correct','correct']);
  assert.deepEqual(score('BBAAAA','AACCDD'),['absent','absent','present','present','absent','absent']);
});
test('only current approved symbols and trailing blanks are accepted', () => {
  for (const s of ['TP53','TP53  ','BRCA1','SLC2A1']) assert.equal(validate(s,data.genes),'');
  for (const s of ['ZZZZZZ','      ','TP 53 ',' TP53','TP53!']) assert.ok(validate(s,data.genes));
});
test('all answer symbols are valid and fit six slots', () => {
  assert.ok(data.answers.length > 200);
  for (const s of data.answers) { assert.ok(s.length<=6); assert.equal(validate(s,data.genes),''); }
});
test('UTC dates hash deterministically across timezone offsets', async () => {
  const a = dayNumber(new Date('2026-10-20T01:00:00+01:00'));
  const b = dayNumber(new Date('2026-10-19T20:00:00-04:00'));
  assert.equal(a,b);
  assert.equal(await dailyAnswer(data.answers,a),await dailyAnswer(data.answers,b));
  const seen = new Set();
  for(let d=a;d<a+30;d++) seen.add(await dailyAnswer(data.answers,d));
  assert.ok(seen.size > 20);
});
