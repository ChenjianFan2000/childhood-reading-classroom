'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const input = require('../scripts/input-policy.js');
const reading = require('../scripts/reading-data.js');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('scripts/lesson-data.js'), sandbox);
const lesson = JSON.parse(JSON.stringify(sandbox.window));

function timeRange(time) {
  const match = time.match(/^(\d+):([0-5]\d)—(\d+):([0-5]\d)$/);
  assert.ok(match, 'A classroom interval has valid minute:second endpoints: ' + time);
  return { start: Number(match[1]) * 60 + Number(match[2]), end: Number(match[3]) * 60 + Number(match[4]) };
}

// A small DOM adapter for the policy's sole DOM dependency: Element.closest().
// These tests exercise the navigation policy; browser QA covers native events.
function element(tag = 'p', attributes = {}, parent = null) {
  const node = { tag, attributes, parent };
  node.closest = function (selectorList) {
    const selectors = selectorList.split(',');
    for (let current = this; current; current = current.parent) {
      for (const selector of selectors) {
        if (selector === current.tag) return current;
        if (selector === '[contenteditable]:not([contenteditable="false"])') {
          if ('contenteditable' in current.attributes && current.attributes.contenteditable !== 'false') return current;
          continue;
        }
        const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
        if (attribute && attribute[1] in current.attributes &&
            (attribute[2] === undefined || current.attributes[attribute[1]] === attribute[2])) return current;
      }
    }
    return null;
  };
  return node;
}

function canAdvance(overrides = {}) {
  return input.canAdvance({
    fullscreen: true,
    panelOpen: false,
    transitioning: false,
    target: element(),
    selectedText: '',
    dragged: false,
    inStage: true,
    ...overrides
  });
}

test('fullscreen canvas clicks use the same advance eligibility for left and right buttons', () => {
  assert.equal(canAdvance({ button: 0 }), true);
  assert.equal(canAdvance({ button: 2 }), true);
  assert.equal(canAdvance({ target: element('span', {}, element('p')) }), true);
});

test('ordinary page clicks, open dialogs, movement, selection, and transitions cannot advance', () => {
  for (const override of [
    { fullscreen: false },
    { panelOpen: true },
    { transitioning: true },
    { inStage: false },
    { selectedText: '不安的心情' },
    { dragged: true }
  ]) {
    assert.equal(canAdvance(override), false, JSON.stringify(override));
  }
});

test('buttons, highlighted words, links, form controls, editable text, and modal descendants keep their own actions', () => {
  const protectedNodes = [
    element('button'),
    element('button', { 'data-word': '敏感' }),
    element('a', { href: '#' }),
    element('input'), element('textarea'), element('select'),
    element('summary'), element('details'),
    element('div', { contenteditable: 'true' }),
    element('div', { contenteditable: '' }),
    element('div', { role: 'button' }),
    element('div', { role: 'textbox' }),
    element('div', { 'data-no-advance': '' }),
    element('nav'), element('dialog')
  ];
  for (const target of protectedNodes) {
    assert.equal(canAdvance({ target }), false, target.tag + JSON.stringify(target.attributes));
    assert.equal(canAdvance({ target: element('span', {}, target) }), false, 'Nested content stays protected');
  }
  assert.equal(input.isInteractive(element('div', { contenteditable: 'false' })), false);
  assert.equal(input.isInteractive(null), false);
});

test('fullscreen recognition supports the standard API, WebKit, and fullscreen display mode', () => {
  assert.equal(input.isFullscreen({}, { matches: false }), false);
  assert.equal(input.isFullscreen({ fullscreenElement: {} }, { matches: false }), true);
  assert.equal(input.isFullscreen({ webkitFullscreenElement: {} }, null), true);
  assert.equal(input.isFullscreen({}, { matches: true }), true);
});

test('focus fallback enables the same protected canvas navigation and disabling it restores ordinary clicks', () => {
  const classes = new Set();
  const doc = { body: { classList: { contains: name => classes.has(name) } } };
  const fullscreen = () => input.isFullscreen(doc, { matches: false });
  assert.equal(fullscreen(), false);
  assert.equal(canAdvance({ fullscreen: fullscreen() }), false);
  classes.add('presentation-mode');
  assert.equal(fullscreen(), true);
  assert.equal(canAdvance({ fullscreen: fullscreen() }), true);
  assert.equal(canAdvance({ fullscreen: fullscreen(), target: element('button') }), false);
  assert.equal(canAdvance({ fullscreen: fullscreen(), panelOpen: true }), false);
  classes.delete('presentation-mode');
  assert.equal(fullscreen(), false);
  assert.equal(canAdvance({ fullscreen: fullscreen() }), false);
});

test('all 40 scenes have unique routes and matching teacher narration', () => {
  const scenes = lesson.LESSON_SCENES;
  const narration = lesson.LESSON_NARRATION;
  assert.equal(scenes.length, 40);
  assert.equal(narration.length, 40);
  assert.equal(new Set(scenes.map(s => s.id)).size, 40);
  assert.deepEqual(narration.map(n => n.id), scenes.map(s => s.id));
  scenes.forEach((scene, index) => {
    assert.equal(scene.index, index);
    assert.ok(scene.title && scene.time, scene.id + ' has title and timing');
    assert.equal(narration[index].timing, scene.time, scene.id + ' timing matches');
    assert.ok(narration[index].action, scene.id + ' has a matching visual direction');
    assert.ok(narration[index].hold, scene.id + ' has a classroom hold instruction');
  });
});

test('the expanded lesson has a continuous 42:30 timeline with ninety seconds for each real-world story', () => {
  assert.equal(lesson.LESSON_SCENES[0].time, '课前');
  const intervals = new Map();
  let end = 0;
  for (const scene of lesson.LESSON_SCENES.slice(1)) {
    const interval = timeRange(scene.time);
    assert.equal(interval.start, end, scene.id + ' follows the previous scene without a gap or overlap');
    assert.ok(interval.end > interval.start, scene.id + ' has positive reading time');
    intervals.set(scene.id, interval);
    end = interval.end;
  }
  assert.equal(end, 42 * 60 + 30);
  assert.equal(intervals.get('annecontext').start, 23 * 60);
  assert.equal(intervals.get('annetwist').end, 27 * 60);
  for (const id of ['yamen', 'varvara']) {
    const interval = intervals.get(id);
    assert.equal(interval.end - interval.start, 90, id + ' has time for the expanded reading');
  }
});

test('expanded reading pages keep paragraphs and short quotations linked to their teacher sources', () => {
  for (const id of ['annecontext', 'annehelp', 'annewish', 'yamen', 'varvara']) {
    const material = reading.scenes[id];
    assert.ok(material && material.pages.length > 0, id + ' has readable pages');
    for (const page of material.pages) {
      assert.ok(page.title && page.kind, id + ' identifies the reading page');
      assert.ok(page.blocks.length > 0, id + ' page is not empty');
      for (const block of page.blocks) {
        assert.ok(['prose', 'quote'].includes(block.kind), id + ' distinguishes source quotations from reading notes');
        assert.ok(typeof block.text === 'string' && block.text.trim(), id + ' preserves a complete text block');
        const source = reading.sources[block.source];
        assert.ok(source && source.title && source.status, id + ' block has a source and text identity');
        assert.match(source.url, /^https:\/\//, id + ' source can be consulted by the teacher');
      }
    }
  }
  const wishBlocks = reading.scenes.annewish.pages.flatMap(page => page.blocks);
  assert.ok(wishBlocks.some(block => block.text === lesson.LESSON_TEXT.anne.blocks[0] && block.interactive === 'wishes'),
    'The original diary sentence remains present with its wish interactions');
});

test('every lesson route has a renderer, and documentary photos have local assets', () => {
  const app = read('scripts/app.js');
  const renderer = app.slice(app.indexOf('function render(id)'), app.indexOf('function updateProtection()'));
  const renderedIds = [...renderer.matchAll(/case\s+'([^']+)':/g)].map(match => match[1]);
  assert.deepEqual(renderedIds, lesson.LESSON_SCENES.map(scene => scene.id));
  for (const filename of ['yamen.webp', 'varvara.webp']) {
    assert.ok(lesson.LESSON_ASSETS[filename]);
    assert.ok(fs.existsSync(path.join(root, lesson.LESSON_ASSETS[filename])));
  }
});

test('the downloaded project contains every local runtime script, stylesheet, image, and font reference', () => {
  const html = read('index.html');
  const refs = [
    ...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)
  ].map(match => match[1]);
  assert.ok(refs.includes('scripts/input-policy.js'));
  assert.ok(refs.includes('scripts/reading-data.js'));
  assert.ok(refs.indexOf('scripts/reading-data.js') < refs.indexOf('scripts/story-flow.js'),
    'Reading pages are available before the browser builds its cue plans');
  for (const ref of refs) {
    assert.doesNotMatch(ref, /^https?:\/\//, 'Runtime resources must work offline');
    assert.ok(fs.existsSync(path.join(root, ref)), ref + ' exists');
  }
  for (const [name, ref] of Object.entries(lesson.LESSON_ASSETS)) {
    assert.doesNotMatch(ref, /^(?:https?:|data:)/, name + ' is an extracted local asset');
    assert.ok(fs.existsSync(path.join(root, ref)), name + ' exists');
  }
  for (const filename of fs.readdirSync(path.join(root, 'styles')).filter(name => name.endsWith('.css'))) {
    const css = read('styles/' + filename);
    for (const match of css.matchAll(/url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/g)) {
      const ref = (match[1] || match[2] || match[3]).trim();
      if (ref.startsWith('data:') || ref.startsWith('#')) continue;
      assert.doesNotMatch(ref, /^https?:\/\//, filename + ' has no external runtime asset');
      assert.ok(fs.existsSync(path.resolve(root, 'styles', ref)), filename + ': ' + ref + ' exists');
    }
  }
});

test('the expansion preserves the original novel, core diary sentence, games, and unaffected teaching', t => {
  // The original upload is kept in Git history. ZIP users can run every other
  // check without Git; this comparison is available to repository maintainers.
  let original;
  try {
    original = execFileSync('git', ['show', '0456f72c6bb1d2700c56174f2ff6ada763f899d1:index.html'], {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch {
    t.skip('The original Git revision is unavailable in this download.');
    return;
  }
  function assignment(name) {
    const marker = 'window.' + name + '=';
    const start = original.indexOf(marker);
    assert.notEqual(start, -1, name + ' exists in original');
    const rest = original.slice(start + marker.length);
    return JSON.parse(rest.slice(0, rest.indexOf(';window.')));
  }
  const originalScenes = assignment('LESSON_SCENES');
  const routes = scenes => scenes.map(scene => ({ id: scene.id, index: scene.index }));
  assert.deepEqual(routes(lesson.LESSON_SCENES), routes(originalScenes));
  const anneStart = originalScenes.findIndex(scene => scene.id === 'annecontext');
  lesson.LESSON_SCENES.slice(0, anneStart).forEach((scene, index) => {
    assert.equal(scene.time, originalScenes[index].time, scene.id + ' keeps its original pre-Anne timing');
    assert.equal(scene.phase, originalScenes[index].phase, scene.id + ' keeps its original pre-Anne phase');
  });
  const originalText = assignment('LESSON_TEXT');
  for (const key of ['A', 'B', 'C', 'D', 'E', 'games']) {
    assert.deepEqual(lesson.LESSON_TEXT[key], originalText[key], key + ' stays unchanged');
  }
  for (const block of originalText.anne.blocks) {
    assert.ok(lesson.LESSON_TEXT.anne.blocks.includes(block), 'The core Anne sentence is preserved');
  }
  const originalNarration = assignment('LESSON_NARRATION');
  const expanded = new Set(['annecontext', 'annehelp', 'annewish', 'annetwist', 'yamen', 'varvara', 'bubbles', 'haulers']);
  const unchanged = item => !expanded.has(item.id);
  const holdTimeChanges = {
    cover: ['课前准备，不占40分钟。', '课前准备，不占42分30秒。'],
    exit: ['38:00—39:30完整90秒独立书写。', '40:30—42:00完整90秒独立书写。']
  };
  for (const [id, [before, after]] of Object.entries(holdTimeChanges)) {
    const originalHold = originalNarration.find(item => item.id === id).hold;
    const currentHold = lesson.LESSON_NARRATION.find(item => item.id === id).hold;
    assert.ok(originalHold.startsWith(before), id + ' has the expected original time wording');
    assert.equal(currentHold, after + originalHold.slice(before.length),
      id + ' changes only the explicitly authorized time wording');
  }
  const teaching = item => ({
    id: item.id, teacher: item.teacher, optional: item.optional,
    hold: holdTimeChanges[item.id]
      ? item.hold.replace(holdTimeChanges[item.id][1], holdTimeChanges[item.id][0])
      : item.hold
  });
  assert.deepEqual(lesson.LESSON_NARRATION.filter(unchanged).map(teaching), originalNarration.filter(unchanged).map(teaching));
});
