'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const flow = require('../scripts/story-flow.js');

const cueCounts = {
  haulers: 1,
  r1repair: 1,
  r2repair: 1,
  r3repair: 1,
  share: 3,
  annewish: 1,
  yamen: 1,
  varvara: 1,
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

test('material closing, wish gestures, pressure, and recording have distinct cue kinds', () => {
  const kinds = {
    haulers: 'art-close',
    r1repair: 'record', r2repair: 'record', r3repair: 'record', share: 'record',
    annewish: 'wishes',
    yamen: 'material-close', varvara: 'material-close',
    pressure: 'pressure'
  };
  for (const [id, kind] of Object.entries(kinds)) {
    assert.ok(flow.stepsFor(id).every(cue => cue.kind === kind), id + ' has its intended narration action');
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
  for (const id of ['haulers', 'annewish', 'yamen', 'varvara', 'pressure', 'parallel', 'unknown-scene']) {
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
