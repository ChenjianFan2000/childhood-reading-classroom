(function (root) {
  'use strict';
  // A teacher advances a spoken beat first; only the next press changes scenes.
  // Written responses stay in students' notebooks. These records are visual marks.
  const commonJS = typeof module === 'object' && module.exports;
  const reading = commonJS ? require('./reading-data.js') : root.LESSON_READING;
  const pageCounts = Object.create(null);
  const record = (recordIds, label) => ({ kind: 'record', recordIds, label, duration: 1250 });
  const plans = {
    haulers: [{ kind: 'art-close', label: '收起画作，回到他的讲述', duration: 1050 }],
    r1repair: [record(['r1supplement'], '留下这次补充')],
    r2repair: [record(['r2reason'], '留下检验的理由')],
    r3repair: [record(['r3praise'], '留下有证据的赞美')],
    annewish: [{ kind: 'wishes', label: '让普通愿望在窗边展开', duration: 1100 }],
    share: [
      record(['groupOne', 'evidenceOne'], '留下第一组的发言'),
      record(['groupTwo', 'evidenceTwo'], '留下第二组的发现'),
      record(['concreteLife'], '让这个条件落在日常生活里')
    ],
    yamen: [{ kind: 'material-close', label: '收回亚门的故事', duration: 1150 }],
    varvara: [{ kind: 'material-close', label: '收回瓦尔瓦拉的故事', duration: 1150 }],
    pressure: [{ kind: 'pressure', label: '让几段童年汇聚，看看共同的重压', duration: 1000 }]
  };
  // The first page is already open on entry. Later pages precede the closing
  // or illustration cue, and each page waits for the teacher's next action.
  Object.entries(reading.scenes).forEach(([id, material]) => {
    pageCounts[id] = material.pages.length;
    const turns = material.pages.slice(1).map((page, index) => ({
      kind: 'read-page', pageIndex: index + 1,
      label: '继续阅读：' + page.title, duration: 520
    }));
    plans[id] = turns.concat(plans[id] || []);
  });
  Object.freeze(pageCounts);
  const empty = Object.freeze([]);
  Object.values(plans).forEach(steps => {
    steps.forEach(step => { if (step.recordIds) Object.freeze(step.recordIds); Object.freeze(step); });
    Object.freeze(steps);
  });
  Object.freeze(plans);
  function stepsFor(id) { return Object.prototype.hasOwnProperty.call(plans, id) ? plans[id] : empty; }
  function clampStep(id, step) {
    const value = Number.isFinite(step) ? Math.trunc(step) : 0;
    return Math.max(0, Math.min(stepsFor(id).length, value));
  }
  function next(id, step) {
    const current = clampStep(id, step), steps = stepsFor(id);
    return current < steps.length ? { type: 'cue', step: current + 1, cue: steps[current] } : { type: 'scene', delta: 1 };
  }
  function previous(id, step) {
    const current = clampStep(id, step);
    return current > 0 ? { type: 'cue', step: current - 1, cue: null } : { type: 'scene', delta: -1 };
  }
  function resumeStep(id, records) {
    const steps = stepsFor(id);
    let current = 0;
    while (current < steps.length && steps[current].kind === 'record' &&
      steps[current].recordIds.every(key => records && records[key] === true)) current++;
    return current;
  }
  function readingState(id, step) {
    const state = { pageIndex: 0, pageCount: pageCounts[id] || 0, closed: false, wishes: false };
    const steps = stepsFor(id), current = clampStep(id, step);
    for (let index = 0; index < current; index++) {
      const cue = steps[index];
      if (cue.kind === 'read-page') state.pageIndex = cue.pageIndex;
      else if (cue.kind === 'material-close') state.closed = true;
      else if (cue.kind === 'wishes') state.wishes = true;
    }
    return state;
  }
  const api = Object.freeze({ stepsFor, clampStep, next, previous, resumeStep, readingState });
  if (commonJS) module.exports = api;
  else root.StoryFlow = api;
})(typeof window === 'object' ? window : this);
