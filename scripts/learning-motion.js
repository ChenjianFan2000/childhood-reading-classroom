/* Evidence stays in the same imagined book as the lesson moves forward. */
(function () {
  'use strict';

  const states = new WeakMap();
  const easing = 'cubic-bezier(.22,.7,.2,1)';
  const NS = 'http://www.w3.org/2000/svg';
  const roundNames = {r1: '一个词', r2: '一条解释', r3: '一个动作'};
  const anneScenes = new Set(['annecontext', 'annehelp', 'annewish', 'annetwist']);

  function svg(body, viewBox) {
    return '<svg viewBox="' + (viewBox || '0 0 120 120') + '" fill="none" xmlns="' + NS + '" aria-hidden="true">' + body + '</svg>';
  }

  function quiet(state) {
    return state.reducedMotion || document.body.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  }

  function motion(state, element, frames, options) {
    if (!element || quiet(state) || typeof element.animate !== 'function') return null;
    const animation = element.animate(frames, Object.assign({duration: 900, easing, fill: 'both'}, options));
    state.animations.add(animation);
    animation.finished.then(() => {
      state.animations.delete(animation);
      animation.cancel();
    }, () => { state.animations.delete(animation); });
    return animation;
  }

  function add(state, className, markup, parent) {
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = markup || '';
    (parent || state.shot.querySelector('.scene-ambience') || state.shot).appendChild(element);
    return element;
  }

  function ribbonMarkup(round) {
    return '<span class="lm-ribbon-fibre"></span><span class="lm-ribbon-label">' + (roundNames[round] || '一处证据') + '</span><span class="lm-ribbon-stitch"></span>';
  }

  function addBookmark(state) {
    const round = state.id.slice(0, 2);
    const recall = state.id.endsWith('recall');
    if (recall) {
      const line = state.scene.querySelector('.recall-line');
      if (!line) return;
      line.classList.add('lm-bookmark-anchor');
      const bookmark = add(state, 'lm-memory-ribbon lm-round-' + round, ribbonMarkup(round), line);
      state.bookmark = bookmark;
      return;
    }
    const page = state.scene.querySelector('.paper');
    if (!page) return;
    const bookmark = add(state, 'lm-page-tab lm-round-' + round, '<i></i><i></i><i></i>', page);
    state.bookmark = bookmark;
    if (state.id.endsWith('repair')) page.classList.add('lm-returned-page');
  }

  function drawPath(state, path, delay, duration) {
    if (!path || quiet(state)) return null;
    let length = 1;
    try { length = path.getTotalLength(); } catch (error) { return null; }
    return motion(state, path, [{strokeDasharray: length + ' ' + length, strokeDashoffset: length, opacity: .1}, {strokeDasharray: length + ' ' + length, strokeDashoffset: 0, opacity: 1}], {duration: duration || 950, delay: delay || 0});
  }

  function openEvidenceBook(state) {
    const book = state.scene.querySelector('.book-reading');
    const columns = Array.from(state.scene.querySelectorAll('.quote-column'));
    if (!book || columns.length < 2) return;
    book.classList.add('lm-open-book');
    const crease = add(state, 'lm-book-crease', '<span></span>', book);
    if (state.id === 'parallel') {
      motion(state, crease, [{transform: 'translateX(-50%) scaleY(.15)', opacity: 0}, {transform: 'translateX(-50%) scaleY(1)', opacity: 1}], {duration: 1050, delay: 180});
      columns.forEach((column, i) => motion(state, column,
        [{opacity: 0, transform: 'translateX(' + (i ? '-20px' : '20px') + ')', clipPath: i ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'},
         {opacity: 1, transform: 'translateX(0)', clipPath: 'inset(0 0 0 0)'}],
        {duration: 1100, delay: 100 + i * 90}));
      return;
    }
    const footer = state.scene.querySelector('.reading-footer');
    if (!footer) return;
    book.classList.add('lm-comparison-book');
    const bridge = add(state, 'lm-comparison-bridge', svg('<path class="lm-comparison-path" d="M10 4H135Q150 4 157 14L170 29M330 4H205Q190 4 183 14L170 29"/><circle cx="170" cy="29" r="3"/>', '0 0 340 38'), footer);
    drawPath(state, bridge.querySelector('path'), 200, 1100);
    const scales = state.scene.querySelectorAll('[data-scale]');
    scales.forEach((button, i) => motion(state, button, [{opacity: 0, transform: 'translateY(-7px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 650, delay: 620 + i * 80}));
  }

  function setupArrows(state) {
    const arrows = state.scene.querySelectorAll('[data-arrow]');
    arrows.forEach(arrow => {
      arrow.classList.add('lm-causal-link');
      arrow.innerHTML = svg('<g class="lm-arrow-left"><path d="M5 24H28"/></g><g class="lm-arrow-right"><path d="M33 24H57M47 15 57 24 47 33"/></g><g class="lm-cut-marks"><path d="m25 14-5-5m17 25 5 5m-15-5-3 5m13-25 3-5"/></g>', '0 0 64 48');
      state.cutStates.set(arrow, arrow.classList.contains('cut'));
    });
    const nodes = state.scene.querySelectorAll('.cause-node');
    nodes.forEach((node, i) => motion(state, node, [{opacity: .2, transform: 'translateY(-5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 720, delay: 420 + i * 170}));
    arrows.forEach((arrow, i) => motion(state, arrow, [{opacity: 0, transform: 'scaleX(.2)'}, {opacity: 1, transform: 'scaleX(1)'}], {duration: 700, delay: 650 + i * 170}));
  }

  function cutArrow(state, arrow, isCut) {
    if (quiet(state)) return;
    const left = arrow.querySelector('.lm-arrow-left');
    const right = arrow.querySelector('.lm-arrow-right');
    if (isCut) {
      motion(state, left, [{transform: 'translate(0,0) rotate(0deg)'}, {transform: 'translate(-4px,-2px) rotate(-7deg)'}, {transform: 'translate(-3px,-1px) rotate(-5deg)'}], {duration: 620});
      motion(state, right, [{transform: 'translate(0,0) rotate(0deg)', opacity: 1}, {transform: 'translate(5px,9px) rotate(12deg)', opacity: .36}, {transform: 'translate(4px,6px) rotate(8deg)', opacity: .55}], {duration: 820});
      motion(state, arrow.querySelector('.lm-cut-marks'), [{opacity: 0, transform: 'scale(.65)'}, {opacity: .9, transform: 'scale(1.12)', offset: .4}, {opacity: .55, transform: 'scale(1)'}], {duration: 700});
    } else {
      motion(state, left, [{transform: 'translate(-3px,-1px) rotate(-5deg)'}, {transform: 'none'}], {duration: 550});
      motion(state, right, [{transform: 'translate(4px,6px) rotate(8deg)', opacity: .55}, {transform: 'none', opacity: 1}], {duration: 650});
    }
  }

  function setupProtection(state) {
    const host = state.scene.querySelector('.protect-layout');
    if (!host) return;
    host.classList.add('lm-protection-host');
    const figure = host.querySelector('.protect-figure');
    if (figure) add(state, 'lm-protective-arc', svg('<path d="M19 114C18 71 37 32 84 18"/><path d="M24 114C22 76 41 39 82 25"/>', '0 0 110 140'), figure);
    state.protected = host.classList.contains('has-protection');
    state.loved = host.classList.contains('has-love');
  }

  function protectionChanges(state) {
    const host = state.scene.querySelector('.lm-protection-host');
    if (!host) return;
    const protectedNow = host.classList.contains('has-protection');
    const lovedNow = host.classList.contains('has-love');
    if (protectedNow && !state.protected) {
      motion(state, host.querySelector('.protect-figure'), [{opacity: .1, transform: 'translateX(20px)'}, {opacity: .82, transform: 'translateX(-3px)', offset: .68}, {opacity: .72, transform: 'translateX(0)'}], {duration: 1250});
      host.querySelectorAll('.lm-protective-arc path').forEach((path, i) => drawPath(state, path, 180 + i * 100, 950));
    }
    if (lovedNow && !state.loved) motion(state, host.querySelector('.warm-glow'), [{opacity: 0, transform: 'scale(.65)'}, {opacity: .8, transform: 'scale(1.08)', offset: .8}, {opacity: 1, transform: 'scale(1)'}], {duration: 1400});
    state.protected = protectedNow;
    state.loved = lovedNow;
  }

  function windowMarkup() {
    return svg('<path class="lm-window-sill" d="M13 424H147M20 414H140"/><path class="lm-window-outline" d="M25 411V86C25 14 135 14 135 86V411M80 34V409M27 150H133M27 280H133"/><path class="lm-window-light" d="M35 87C35 34 72 36 72 36V139H35ZM88 36S125 35 125 87V139H88ZM35 158H72V270H35ZM88 158H125V270H88Z"/><path class="lm-window-glint" d="m44 203 20-27m35 66 15-20M43 104l19-27"/><g class="lm-window-parcels"><path d="m42 386 23 2 4 20H43Z"/><path d="m72 388 17-3 12 8-18 4Z"/><path d="m81 398 25-4 4 10-26 5Z"/><path d="m106 383 16 2-1 24-18-2Z"/></g>', '0 0 160 450');
  }

  function setupAnneWindow(state) {
    const window = add(state, 'lm-anne-window lm-window-' + state.id, windowMarkup());
    state.window = window;
    if (state.id === 'annecontext') window.querySelectorAll('.lm-window-outline,.lm-window-sill').forEach((path, i) => drawPath(state, path, 150 + i * 90, 1150));
    if (state.id === 'annehelp') {
      const help = state.scene.querySelectorAll('.help-item');
      help.forEach((item, i) => {
        item.classList.add('lm-delivered-object');
        motion(state, item, [{opacity: 0, transform: 'translateX(-24px) translateY(5px)'}, {opacity: 1, transform: 'translateX(0) translateY(0)'}], {duration: 950, delay: 180 + i * 450});
      });
    }
    state.scene.querySelectorAll('.wish-picture').forEach(picture => {
      picture.classList.add('lm-window-reflection');
      state.wishStates.set(picture, picture.classList.contains('visible'));
    });
  }

  function setupEvidenceBoard(state) {
    const board = state.scene.querySelector('.evidence-board');
    if (!board) return;
    board.classList.add('lm-evidence-board');
    board.querySelectorAll('.evidence-stack').forEach((stack, i) => {
      stack.classList.add(i < 2 ? 'lm-evidence-novel' : 'lm-evidence-window');
      motion(state, stack, [{opacity: 0, transform: 'translateX(' + (i < 2 ? '-22px' : '22px') + ') translateY(8px)', clipPath: 'inset(0 0 100% 0)'}, {opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0)'}], {duration: 1150, delay: 200 + i * 110});
    });
    const prompt = state.scene.querySelector('.group-prompt');
    motion(state, prompt, [{opacity: 0, transform: 'translateY(5px)'}, {opacity: 1, transform: 'none'}], {duration: 700, delay: 700});
  }

  function inspectStates(state) {
    if (!state.shot.isConnected || state.shot.classList.contains('is-departing')) return;
    state.scene.querySelectorAll('[data-arrow]').forEach(arrow => {
      const cut = arrow.classList.contains('cut');
      if (state.cutStates.has(arrow) && cut !== state.cutStates.get(arrow)) cutArrow(state, arrow, cut);
      state.cutStates.set(arrow, cut);
    });
    protectionChanges(state);
    state.scene.querySelectorAll('.lm-window-reflection').forEach(picture => {
      const visible = picture.classList.contains('visible');
      if (visible && !state.wishStates.get(picture)) motion(state, picture, [{opacity: .14, transform: 'translateY(5px)'}, {opacity: .8, transform: 'translateY(0)'}], {duration: 1100});
      state.wishStates.set(picture, visible);
    });
  }

  function enter(options) {
    const {id, scene, shot, previousId, reducedMotion} = options;
    if (!id || !scene || !shot) return [];
    dispose(shot);
    const state = {id, scene, shot, previousId, reducedMotion: !!reducedMotion, animations: new Set(), cutStates: new WeakMap(), wishStates: new WeakMap(), observers: [], layers: new Set()};
    states.set(shot, state);
    shot.classList.add('lm-managed-shot');
    shot.classList.toggle('lm-quiet', quiet(state));
    if (id === 'parallel' || id === 'compare') openEvidenceBook(state);
    if (/^r[123](read|recall|repair)$/.test(id)) addBookmark(state);
    if (id === 'r2repair') setupArrows(state);
    if (id === 'r3repair') setupProtection(state);
    if (anneScenes.has(id)) setupAnneWindow(state);
    if (id === 'group') setupEvidenceBoard(state);
    if (id === 'r2repair' || id === 'r3repair' || id === 'annewish') {
      const observer = new MutationObserver(() => inspectStates(state));
      observer.observe(scene, {subtree: true, attributes: true, attributeFilter: ['class']});
      state.observers.push(observer);
    }
    return Array.from(state.animations);
  }

  function rectIn(element, parent) {
    if (!element) return null;
    const a = element.getBoundingClientRect(), b = parent.getBoundingClientRect();
    return {x: a.left - b.left, y: a.top - b.top, width: a.width, height: a.height, cx: a.left - b.left + a.width / 2, cy: a.top - b.top + a.height / 2};
  }

  function transitLayer(state) {
    const layer = document.createElement('div');
    layer.className = 'lm-transit-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    state.shot.parentElement.appendChild(layer);
    state.layers.add(layer);
    return layer;
  }

  function finishLayer(state, layer, animations) {
    Promise.all(animations.filter(Boolean).map(a => a.finished.catch(() => {}))).then(() => {
      layer.remove();
      state.layers.delete(layer);
    });
  }

  function bookmarkTravel(state, oldShot, mode) {
    const animations = [], parent = state.shot.parentElement;
    if (!state.bookmark || !parent) return animations;
    const round = state.id.slice(0, 2);
    const target = rectIn(state.bookmark, parent);
    const oldRibbon = oldShot.querySelector('.lm-memory-ribbon');
    const originElement = mode === 'remember' ? oldShot.querySelector('.fragment') : oldRibbon;
    const origin = rectIn(originElement, parent);
    if (!origin || !target) return animations;
    const layer = transitLayer(state);
    const flying = document.createElement('div');
    flying.className = 'lm-memory-ribbon lm-flying-ribbon lm-round-' + round;
    flying.innerHTML = ribbonMarkup(round);
    const width = mode === 'remember' ? target.width : origin.width;
    const height = mode === 'remember' ? target.height : origin.height;
    flying.style.width = Math.max(120, width) + 'px';
    flying.style.height = Math.max(28, height) + 'px';
    flying.style.left = (mode === 'remember' ? target.cx - width / 2 : origin.x) + 'px';
    flying.style.top = (mode === 'remember' ? target.cy - height / 2 : origin.y) + 'px';
    layer.appendChild(flying);
    if (mode === 'remember') {
      // The ink gathers into an unfilled bookmark, without supplying the student's word.
      const dy = Math.max(-85, Math.min(55, origin.cy - target.cy));
      animations.push(motion(state, flying, [{opacity: 0, transform: 'translateY(' + dy + 'px) scaleX(1.65) scaleY(.08)'}, {opacity: .55, transform: 'translateY(-18px) scaleX(1.2) scaleY(.12)', offset: .38}, {opacity: 1, transform: 'none'}], {duration: 1200}));
      animations.push(motion(state, flying.querySelector('.lm-ribbon-label'), [{opacity: 0}, {opacity: 0, offset: .48}, {opacity: 1}], {duration: 1200}));
      animations.push(motion(state, state.bookmark, [{opacity: 0}, {opacity: 0}], {duration: 1200}));
    } else {
      // Travel below the text, then up the outer margin into the source page.
      const bounds = parent.getBoundingClientRect();
      const dx = target.cx - origin.cx, dy = target.cy - origin.cy;
      const edgeX = bounds.width * .945 - origin.cx;
      const edgeY = bounds.height * .895 - origin.cy;
      animations.push(motion(state, flying, [
        {opacity: .85, transform: 'translate(0,0) scale(1)'},
        {opacity: .5, transform: 'translate(' + (edgeX * .62) + 'px,' + edgeY + 'px) scale(.32,.65)', offset: .38},
        {opacity: .65, transform: 'translate(' + edgeX + 'px,' + edgeY + 'px) scale(.12,.8)', offset: .62},
        {opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08,1.2)'}
      ], {duration: 1300}));
      animations.push(motion(state, flying.querySelector('.lm-ribbon-label'), [{opacity: 1}, {opacity: 0}], {duration: 200}));
      animations.push(motion(state, state.bookmark, [{opacity: 0, transform: 'translateY(7px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 500, delay: 900}));
      const source = state.scene.querySelector('.repair-source');
      if (source) animations.push(motion(state, source, [{opacity: .35}, {opacity: 1}], {duration: 650, delay: 420}));
    }
    finishLayer(state, layer, animations);
    return animations.filter(Boolean);
  }

  function windowTravel(state, oldShot, type) {
    const animations = [], parent = state.shot.parentElement;
    if (!state.window || !parent) return animations;
    const selector = type === 'help' ? '.sb-parcel' : '.wish-picture';
    const sources = Array.from(oldShot.querySelectorAll(selector)).filter(el => !el.closest('[hidden]')).slice(0, 3);
    if (!sources.length) return animations;
    const destination = rectIn(state.window, parent), bounds = parent.getBoundingClientRect();
    const layer = transitLayer(state);
    sources.forEach((source, i) => {
      const origin = rectIn(source, parent);
      if (!origin || !origin.width || !origin.height) return;
      const clone = document.createElement('div');
      clone.className = 'lm-flying-icon';
      const icon = source.querySelector('svg');
      if (!icon) return;
      clone.appendChild(icon.cloneNode(true));
      clone.style.cssText = 'left:' + origin.x + 'px;top:' + origin.y + 'px;width:' + origin.width + 'px;height:' + origin.height + 'px';
      layer.appendChild(clone);
      const dx = destination.cx - origin.cx;
      const dy = destination.y + destination.height * .86 - origin.cy;
      const lower = bounds.height * .84 - origin.cy;
      animations.push(motion(state, clone, [
        {opacity: .55, transform: 'translate(0,0) scale(.85)'},
        {opacity: .38, transform: 'translate(' + (dx * .5) + 'px,' + lower + 'px) scale(.38)', offset: .42},
        {opacity: .35, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.16)', offset: .88},
        {opacity: 0, transform: 'translate(' + (dx - 3) + 'px,' + dy + 'px) scale(.16)'}
      ], {duration: 1050, delay: i * 100}));
    });
    if (type === 'wish') {
      state.window.classList.add('lm-window-boundary');
      animations.push(motion(state, state.window.querySelector('.lm-window-outline'), [{opacity: .3}, {opacity: .9, offset: .7}, {opacity: .6}], {duration: 1200}));
    }
    finishLayer(state, layer, animations);
    return animations.filter(Boolean);
  }

  function groupConvergence(state) {
    const animations = [], board = state.scene.querySelector('.evidence-board');
    if (!board) return animations;
    const route = add(state, 'lm-evidence-confluence', svg('<path class="lm-novel-trace" d="M5 8H160Q180 8 190 24L210 51"/><path class="lm-window-trace" d="M415 8H260Q240 8 230 24L210 51"/><circle cx="210" cy="51" r="3"/>', '0 0 420 58'), board);
    route.querySelectorAll('path').forEach((path, i) => animations.push(drawPath(state, path, 350 + i * 150, 1000)));
    return animations.filter(Boolean);
  }

  function transition(options) {
    const {oldShot, newShot, previousId, id, direction, reducedMotion} = options;
    const state = states.get(newShot);
    const result = state ? Array.from(state.animations) : [];
    result.semantic = false;
    result.duration = 0;
    if (!state || !oldShot || reducedMotion || quiet(state) || direction < 0) return result;
    if (/^r[123]recall$/.test(id) && previousId === id.slice(0, 2) + 'read') {
      result.push(...bookmarkTravel(state, oldShot, 'remember'));
      result.semantic = true; result.duration = 1200;
    } else if (/^r[123]repair$/.test(id) && previousId === id.slice(0, 2) + 'recall') {
      result.push(...bookmarkTravel(state, oldShot, 'return'));
      result.semantic = true; result.duration = 1400;
    } else if (previousId === 'annehelp' && id === 'annewish') {
      result.push(...windowTravel(state, oldShot, 'help'));
      result.semantic = true; result.duration = 1250;
    } else if (previousId === 'annewish' && id === 'annetwist') {
      result.push(...windowTravel(state, oldShot, 'wish'));
      result.semantic = true; result.duration = 1250;
    } else if (id === 'group') {
      result.push(...groupConvergence(state));
      result.semantic = true; result.duration = 1500;
    } else if (id === 'parallel' || id === 'compare' || id === 'r2repair') {
      result.semantic = true; result.duration = 1300;
    }
    return result;
  }

  function dispose(shot) {
    const state = states.get(shot);
    if (!state) return;
    state.observers.forEach(observer => observer.disconnect());
    state.animations.forEach(animation => animation.cancel());
    state.layers.forEach(layer => layer.remove());
    states.delete(shot);
  }

  window.LearningMotion = {enter, transition, dispose};
})();
