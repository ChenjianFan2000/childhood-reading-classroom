'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const input = require('../scripts/input-policy.js');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('scripts/lesson-data.js'), sandbox);
const lesson = JSON.parse(JSON.stringify(sandbox.window));

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

test('the visual redesign preserves the original reading passages, teacher speech, and instructional timing', t => {
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
  assert.deepEqual(lesson.LESSON_SCENES, assignment('LESSON_SCENES'));
  assert.deepEqual(lesson.LESSON_TEXT, assignment('LESSON_TEXT'));
  const originalNarration = assignment('LESSON_NARRATION');
  const teaching = item => ({ id: item.id, teacher: item.teacher, hold: item.hold, optional: item.optional, timing: item.timing });
  assert.deepEqual(lesson.LESSON_NARRATION.map(teaching), originalNarration.map(teaching));
});
