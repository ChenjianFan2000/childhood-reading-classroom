'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const flow = require('../scripts/story-flow.js');
const reading = require('../scripts/reading-data.js');

const cueCounts = {
  haulers: 1,
  r1repair: 1,
  r2repair: 1,
  r3repair: 1,
  share: 3,
  annecontext: 1,
  annehelp: 0,
  annewish: 2,
  yamen: 2,
  varvara: 2,
  pressure: 1
};

test('only scenes with narration cues consume additional steps before changing scene', () => {
  for (const [id, count] of Object.entries(cueCounts)) {
    assert.equal(flow.stepsFor(id).length, count, id);
  }
  for (const id of ['cover', 'parallel', 'group', 'exit', 'homework', 'unknown-scene']) {
    assert.deepEqual(flow.stepsFor(id), [], id + ' has no incidental cue');
    assert.deepEqual(flow.next(id, 0), { type: 'scene', delta: 1 }, id);
    assert.deepEqual(flow.previous(id, 0), { type: 'scene', delta: -1 }, id);
  }
});

test('reading pages precede material closing and wish gestures, while other cues retain their roles', () => {
  const kinds = {
    haulers: ['art-close'],
    r1repair: ['record'], r2repair: ['record'], r3repair: ['record'],
    share: ['record', 'record', 'record'],
    annecontext: ['read-page'], annehelp: [],
    annewish: ['read-page', 'wishes'],
    yamen: ['read-page', 'material-close'], varvara: ['read-page', 'material-close'],
    pressure: ['pressure']
  };
  for (const [id, expected] of Object.entries(kinds)) {
    assert.deepEqual(flow.stepsFor(id).map(cue => cue.kind), expected, id + ' has its intended narration sequence');
  }
});

test('forward navigation consumes each cue once, in order, then changes scene', () => {
  for (const [id, count] of Object.entries(cueCounts)) {
    const cues = flow.stepsFor(id);
    let step = 0;
    for (let position = 0; position < count; position++) {
      const result = flow.next(id, step);
      assert.deepEqual(result, { type: 'cue', step: position + 1, cue: cues[position] }, id + ' cue ' + position);
      step = result.step;
    }
    assert.deepEqual(flow.next(id, step), { type: 'scene', delta: 1 }, id + ' finishes after its final cue');
  }
});

test('previous navigation reverses the current cue position before leaving the scene', () => {
  for (const [id, count] of Object.entries(cueCounts)) {
    for (let step = count; step > 0; step--) {
      assert.deepEqual(flow.previous(id, step), { type: 'cue', step: step - 1, cue: null }, id + ' back from ' + step);
    }
    assert.deepEqual(flow.previous(id, 0), { type: 'scene', delta: -1 }, id + ' back from entry');
  }
});

test('cue positions are clamped to the valid range for the selected scene', () => {
  for (const [id, count] of Object.entries(cueCounts)) {
    assert.equal(flow.clampStep(id, -5), 0, id + ' lower bound');
    assert.equal(flow.clampStep(id, 0), 0, id + ' entry');
    assert.equal(flow.clampStep(id, count), count, id + ' final cue');
    assert.equal(flow.clampStep(id, count + 12), count, id + ' upper bound');
    for (let step = 1; step < count; step++) assert.equal(flow.clampStep(id, step), step, id);
  }
  assert.equal(flow.clampStep('parallel', 12), 0);
  assert.equal(flow.clampStep('unknown-scene', 12), 0);
});

test('group sharing records the two groups and their daily-life reflection separately', () => {
  const share = flow.stepsFor('share');
  assert.deepEqual(share.map(cue => cue.recordIds), [
    ['groupOne', 'evidenceOne'],
    ['groupTwo', 'evidenceTwo'],
    ['concreteLife']
  ]);
  const allIds = share.flatMap(cue => cue.recordIds);
  assert.equal(new Set(allIds).size, 5, 'A record is not assigned to more than one sharing step');
});

test('revisiting a recording scene resumes only the consecutive fully completed record steps', () => {
  const records = {};
  assert.equal(flow.resumeStep('share', records), 0);
  records.groupOne = true;
  assert.equal(flow.resumeStep('share', records), 0, 'Both fields in the first group must be recorded');
  records.evidenceOne = true;
  assert.equal(flow.resumeStep('share', records), 1);
  records.concreteLife = true;
  assert.equal(flow.resumeStep('share', records), 1, 'A later completed record cannot skip the missing second group');
  records.groupTwo = true;
  assert.equal(flow.resumeStep('share', records), 1);
  records.evidenceTwo = true;
  assert.equal(flow.resumeStep('share', records), 3);
  assert.deepEqual(flow.next('share', flow.resumeStep('share', records)), { type: 'scene', delta: 1 }, 'Completed visible records do not replay on the next action');
  records.evidenceOne = false;
  assert.equal(flow.resumeStep('share', records), 0, 'An incomplete first cue blocks all later completion state');
});

test('resume ignores unrelated or legacy state, preserves records, and never skips non-record narration', () => {
  const records = {
    r1supplement: true, r2reason: false, r3praise: true,
    groupOne: true, evidenceOne: true,
    edits: { r2reason: 'A previously typed answer' },
    complete: { r2repair: true }
  };
  const before = JSON.stringify(records);
  assert.equal(flow.resumeStep('r1repair', records), 1);
  assert.equal(flow.resumeStep('r2repair', records), 0);
  assert.equal(flow.resumeStep('r3repair', records), 1);
  assert.equal(flow.resumeStep('share', records), 1);
  for (const id of ['haulers', 'annecontext', 'annehelp', 'annewish', 'yamen', 'varvara', 'pressure', 'parallel', 'unknown-scene']) {
    assert.equal(flow.resumeStep(id, records), 0, id + ' begins with its narration');
  }
  assert.equal(JSON.stringify(records), before, 'Resume inspection does not change classroom records');
});

test('the flow is stateless so keyboard, canvas clicks, and record buttons can share a single position', () => {
  const before = JSON.stringify(flow.stepsFor('share'));
  const first = flow.next('share', 0);
  const samePosition = flow.next('share', 0);
  assert.deepEqual(samePosition, first, 'Input source does not advance internal hidden state');
  assert.deepEqual(flow.next('share', 1), { type: 'cue', step: 2, cue: flow.stepsFor('share')[1] });
  assert.equal(JSON.stringify(flow.stepsFor('share')), before, 'Navigation does not mutate the cue definitions');
  assert.deepEqual(flow.next('haulers', 0), { type: 'cue', step: 1, cue: flow.stepsFor('haulers')[0] });
});

test('each reading page remains open until another action and all data pages are reachable in order', () => {
  for (const [id, material] of Object.entries(reading.scenes)) {
    const pageCount = material.pages.length;
    assert.equal(flow.stepsFor(id).filter(cue => cue.kind === 'read-page').length, pageCount - 1, id);
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const expected = { pageIndex, pageCount, closed: false, wishes: false };
      assert.deepEqual(flow.readingState(id, pageIndex), expected, id + ' page ' + pageIndex);
      assert.deepEqual(flow.readingState(id, pageIndex), expected, 'Reading state does not advance itself');
      if (pageIndex < pageCount - 1) {
        const next = flow.next(id, pageIndex);
        assert.equal(next.type, 'cue');
        assert.equal(next.cue.kind, 'read-page');
        assert.equal(next.cue.pageIndex, pageIndex + 1);
        assert.equal(next.cue.duration, 520);
      }
    }
    assert.equal(flow.resumeStep(id, { groupOne: true, evidenceOne: true, yamen: true, annewish: true }), 0,
      'Saved classroom records never skip a reading page');
  }
});

test('a story closes only after its final page and reversing the close reopens that last page', () => {
  for (const id of ['yamen', 'varvara']) {
    const pageCount = reading.scenes[id].pages.length;
    const close = flow.next(id, pageCount - 1);
    assert.equal(close.cue.kind, 'material-close');
    assert.deepEqual(flow.readingState(id, close.step), {
      pageIndex: pageCount - 1, pageCount, closed: true, wishes: false
    });
    assert.deepEqual(flow.next(id, close.step), { type: 'scene', delta: 1 });
    const reopen = flow.previous(id, close.step);
    assert.deepEqual(flow.readingState(id, reopen.step), {
      pageIndex: pageCount - 1, pageCount, closed: false, wishes: false
    });
    const firstPage = flow.previous(id, reopen.step);
    assert.equal(flow.readingState(id, firstPage.step).pageIndex, 0);
    assert.equal(flow.readingState(id, -1).closed, false);
    assert.equal(flow.readingState(id, 999).closed, true);
    assert.equal(flow.readingState(id, NaN).pageIndex, 0);
  }
  assert.deepEqual(flow.readingState('unknown-scene', 99), {
    pageIndex: 0, pageCount: 0, closed: false, wishes: false
  });
});

test('Anne reads the final diary page before wishes appear, and reversing wishes keeps the diary open', () => {
  const pageCount = reading.scenes.annewish.pages.length;
  const wishes = flow.next('annewish', pageCount - 1);
  assert.equal(wishes.cue.kind, 'wishes');
  assert.deepEqual(flow.readingState('annewish', wishes.step), {
    pageIndex: pageCount - 1, pageCount, closed: false, wishes: true
  });
  const back = flow.previous('annewish', wishes.step);
  assert.deepEqual(flow.readingState('annewish', back.step), {
    pageIndex: pageCount - 1, pageCount, closed: false, wishes: false
  });
  assert.deepEqual(flow.next('annewish', wishes.step), { type: 'scene', delta: 1 });
  assert.equal(flow.stepsFor('pressure')[0].kind, 'pressure', 'Final gathering remains a separate scene action');
});

test('browser flow derives longer reading sequences from the supplied pages instead of fixed page counts', () => {
  const pages = Array.from({ length: 4 }, (_, index) => ({ title: 'Page ' + (index + 1) }));
  const browser = { window: { LESSON_READING: { scenes: { yamen: { pages } } } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../scripts/story-flow.js'), 'utf8'), browser);
  const browserFlow = browser.window.StoryFlow;
  for (let page = 0; page < pages.length - 1; page++) {
    assert.equal(browserFlow.next('yamen', page).cue.kind, 'read-page');
    assert.equal(browserFlow.readingState('yamen', page + 1).pageIndex, page + 1);
    assert.equal(browserFlow.readingState('yamen', page + 1).closed, false);
  }
  assert.equal(browserFlow.next('yamen', 3).cue.kind, 'material-close');
  assert.equal(browserFlow.readingState('yamen', 4).closed, true);
  for (let step = 4; step > 0; step--) {
    const back = browserFlow.previous('yamen', step);
    assert.equal(browserFlow.readingState('yamen', back.step).pageIndex, step - 1);
    assert.equal(browserFlow.readingState('yamen', back.step).closed, false);
  }
});
