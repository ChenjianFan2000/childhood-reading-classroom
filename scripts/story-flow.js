(function (root) {
  'use strict';
  // A teacher advances a spoken beat first; only the next press changes scenes.
  // Written responses stay in students' notebooks. These records are visual marks.
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
  const api = Object.freeze({ stepsFor, clampStep, next, previous, resumeStep });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StoryFlow = api;
})(typeof window === 'object' ? window : this);
