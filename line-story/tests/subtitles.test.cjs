'use strict';
// Subtitle-specific regression checks. Use --content-only without a browser.
// Browser checks run against the real offline file:// classroom, never a user profile.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const args = process.argv.slice(2);
const option = (name, fallback) => {const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1];};
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(option('--out', 'subtitle-report'));
const report = {checks: [], layouts: [], errors: [], externalRequests: [], passed: false};
const ok = text => {report.checks.push(text); console.log('PASS ' + text);};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const ctx = {window: {}};
for (const file of ['lesson-data.js', 'subtitle-data.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'scripts', file), 'utf8'), ctx, {filename: file});
}
const L = ctx.window.LINE_LESSON, S = ctx.window.LINE_SUBTITLES, C = L.cues;
const script = id => S.cues[id].blocks;
const spoken = id => script(id).filter(b => b.type === 'speech').map(b => b.text).join('\n');
const allWords = C.map(c => spoken(c.id)).join('\n');
const state = page => page.evaluate(() => window.lineSubtitleState);

function contentChecks() {
  assert.equal(S.lessonVersion, L.version, 'subtitle edition matches classroom data');
  assert.deepEqual(Object.keys(S.cues).sort(), Array.from(C, c => c.id).sort(), 'one script per real action, with no stale actions');
  for (const c of C) {
    const blocks = script(c.id);
    assert.ok(Array.isArray(blocks) && blocks.length, c.id + ' has readable content');
    for (const b of blocks) {
      assert.ok(['speech', 'responses'].includes(b.type), c.id + ' has a supported reading format');
      if (b.type === 'speech') assert.ok(typeof b.text === 'string' && b.text.trim(), c.id + ' has spoken words');
      else {
        assert.ok(Array.isArray(b.items) && b.items.length > 1, c.id + ' offers genuinely different responses');
        for (const item of b.items) {
          assert.ok(typeof item.when === 'string' && item.when.trim(), c.id + ' names the response condition');
          assert.ok(typeof item.say === 'string' && item.say.trim(), c.id + ' gives usable teacher language');
        }
      }
    }
  }
  ok('All 57 current actions have complete subtitle blocks; conditional responses have both conditions and usable wording');
  for (const key of ['hurt', 'warmth', 'window', 'grandfather_experience', 'protect', 'anne', 'author']) {
    for (const paragraph of L.passages[key]) assert.ok(allWords.includes(paragraph), key + ' source paragraph is actually present in the read-aloud script');
  }
  assert.ok(allWords.includes('还会打我吗') && allWords.includes('当然要打啦'), 'the pivotal question and answer are both spoken');
  for (const word of ['列宾', '伏尔加河上的纤夫', '纤夫', '1942', '1944', '2024', '2022', '父亲', '母亲']) {
    assert.ok(allWords.includes(word), 'spoken background includes ' + word);
  }
  ok('The script includes full first readings and essential painting, Anne Frank and historical photo context');
  for (const page of ['subtitles.html', 'index.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (/^(?:#|https?:|data:)/.test(match[1])) continue;
      assert.ok(fs.existsSync(path.join(ROOT, match[1].split(/[?#]/)[0])), page + ' has a valid local asset: ' + match[1]);
    }
  }
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /subtitle-data\.js|subtitles\.js/, 'private script is absent from student page');
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'subtitles.html'), 'utf8'), /<iframe|<canvas|<video|nextPreview/i, 'subtitle page has no competing scene or next-page preview');
  ok('Subtitle assets are local and private; the student page never loads the new teacher transcript');
}

function watch(page) {
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('request', request => {if (/^https?:/.test(request.url())) report.externalRequests.push(request.url());});
}
async function awaitCue(page, id) {
  await page.waitForFunction(id => window.lineSubtitleState?.cueId === id, id);
}
async function jump(page, id) {
  await page.evaluate(id => {location.hash = id;}, id);
  await awaitCue(page, id);
}
async function shot(page, name) {
  if (args.includes('--screenshots')) await page.screenshot({path: path.join(OUT, name + '.png'), fullPage: true});
}
async function inspectLayout(page, id) {
  const layout = await page.evaluate(() => {
    const body = document.querySelector('#subtitleText');
    const next = document.querySelector('[data-command="next"]');
    const previous = document.querySelector('[data-command="prev"]');
    const r = body.getBoundingClientRect();
    const rect = el => {const b = el.getBoundingClientRect(); return {x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom};};
    return {width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth + 1,
      body: {x: r.x, right: r.right, width: r.width}, next: rect(next), previous: rect(previous),
      font: parseFloat(getComputedStyle(body.querySelector('p') || body).fontSize)};
  });
  assert.ok(!layout.overflow, id + ': no sideways scrolling at ' + layout.width);
  assert.ok(layout.body.x >= 0 && layout.body.right <= layout.width + 1, id + ': all lines stay inside the phone');
  assert.ok(layout.font >= 20, id + ': the transcript remains the readable primary content');
  for (const button of [layout.next, layout.previous]) {
    assert.ok(button.width >= 40 && button.height >= 40, id + ': navigation has comfortable touch targets');
    assert.ok(button.x >= 0 && button.right <= layout.width + 1, id + ': navigation fits horizontally');
    assert.ok(button.y >= 0 && button.bottom <= layout.height + 1, id + ': navigation remains visible');
  }
  report.layouts.push({id, ...layout});
}

let browser;
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  contentChecks();
  if (args.includes('--content-only')) {report.passed = true; return;}
  const {chromium} = require('playwright');
  browser = await chromium.launch({headless: true, ...(option('--browser') ? {executablePath: option('--browser')} : {})});
  report.browser = browser.version();
  const entry = pathToFileURL(path.join(ROOT, 'subtitles.html')).href;
  const classroom = pathToFileURL(path.join(ROOT, 'index.html')).href;
  const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce', offline: true});
  const phone = await context.newPage(); watch(phone);
  if (!args.includes('--connection-only') && !args.includes('--timer-only')) {
  await phone.goto(entry + '#cover'); await awaitCue(phone, 'cover');
  assert.equal((await state(phone)).mode, 'standalone');
  assert.ok(await phone.locator('[data-command="prev"]').isDisabled());
  for (let i = 0; i < C.length; i++) {
    if (i) {await phone.locator('[data-command="next"]').click(); await awaitCue(phone, C[i].id);}
    const text = await phone.locator('#subtitleText').innerText();
    for (const b of script(C[i].id)) {
      if (b.type === 'speech') assert.ok(text.includes(b.text), C[i].id + ': entire current speech renders');
      else for (const item of b.items) {
        assert.ok(text.includes(item.when) && text.includes(item.say), C[i].id + ': response guidance is complete');
      }
    }
  }
  assert.ok(await phone.locator('[data-command="next"]').isDisabled());
  await phone.locator('[data-command="prev"]').click(); await awaitCue(phone, C.at(-2).id);
  ok('A standalone offline phone can read every action, reach both boundaries and return without a projector connection');

  await jump(phone, 'window-reading');
  await phone.reload(); await awaitCue(phone, 'window-reading');
  await phone.evaluate(() => {history.replaceState(null, '', location.pathname + location.search);});
  await phone.reload(); await awaitCue(phone, 'window-reading');
  await phone.locator('#cuePicker').click();
  assert.ok(await phone.locator('#cueDialog').isVisible());
  const targetValue = await phone.locator('#cueSelect').evaluate(select => [...select.options].find(o => /画|纤夫|列宾/.test(o.textContent))?.value);
  assert.ok(targetValue != null, 'picker exposes the painting cue');
  await phone.locator('#cueSelect').selectOption(targetValue);
  await phone.locator('#jumpCue').click();
  await phone.waitForFunction(() => !document.querySelector('#cueDialog').open);
  assert.ok(['haulers', 'haulers-detail', 'haulers-close'].includes((await state(phone)).cueId));
  ok('Direct cue links, saved progress, reload and the compact jump dialog preserve the place in the lesson');

  const beforeFont = await phone.locator('#subtitleText').evaluate(el => parseFloat(getComputedStyle(el.querySelector('p') || el).fontSize));
  await phone.locator('[data-font="larger"]').click();
  const afterFont = await phone.locator('#subtitleText').evaluate(el => parseFloat(getComputedStyle(el.querySelector('p') || el).fontSize));
  assert.ok(afterFont > beforeFont, 'larger type visibly changes the reading text');
  await phone.reload(); await phone.waitForFunction(() => !!window.lineSubtitleState);
  assert.equal(await phone.locator('#subtitleText').evaluate(el => parseFloat(getComputedStyle(el.querySelector('p') || el).fontSize)), afterFont, 'type choice survives reload');
  for (let i = 0; i < 12; i++) if (!await phone.locator('[data-font="larger"]').isDisabled()) await phone.locator('[data-font="larger"]').click();
  for (const size of [{width: 320, height: 568}, {width: 390, height: 844}, {width: 844, height: 390}, {width: 1366, height: 768}]) {
    await phone.setViewportSize(size);
    for (const id of ['paired', 'window-reading', 'haulers', 'g2-repair', 'group', 'author-read']) {
      await jump(phone, id); await inspectLayout(phone, id);
    }
    await shot(phone, 'subtitles-' + size.width + 'x' + size.height);
  }
  ok('Long readings and response lists remain readable at maximum type size across small phones, landscape and desktop');

  await phone.setViewportSize({width: 390, height: 844});
  await jump(phone, 'paired');
  await phone.evaluate(() => window.scrollTo(0, 300));
  const scrollBefore = await phone.evaluate(() => scrollY);
  await sleep(1800);
  assert.equal(await phone.evaluate(() => scrollY), scrollBefore, 'standalone reading stays put');
  await phone.keyboard.press('ArrowRight'); await awaitCue(phone, 'sensitive');
  assert.ok(await phone.evaluate(() => scrollY < 100), 'a new cue returns to its beginning');
  ok('Reading stays still until navigation; a new action begins at the top of its own transcript');

  }
  const projector = await context.newPage(); watch(projector);
  await projector.setViewportSize({width: 1366, height: 768});
  await projector.goto(classroom + '#paired');
  await projector.waitForFunction(() => window.lineStoryState?.id === 'paired');
  const fullPromise = projector.waitForEvent('popup'); await projector.keyboard.press('p');
  const full = await fullPromise; watch(full); await full.waitForFunction(() => window.linePresenterState?.connected);
  const subtitlePromise = projector.waitForEvent('popup'); await projector.keyboard.press('s');
  const connected = await subtitlePromise; watch(connected); await connected.waitForFunction(() => window.lineSubtitleState?.connected);
  assert.equal((await state(connected)).cueId, 'paired');
  await connected.setViewportSize({width: 390, height: 844});
  await phone.goto(entry + '#paired'); await awaitCue(phone, 'paired');
  await phone.locator('#cuePicker').click();
  assert.ok(await phone.locator('#activityControls').isHidden(), 'standalone phone has no projector timer controls');
  await phone.locator('#closeCueDialog').click();
  assert.ok(await connected.locator('#activityControls').isHidden(), 'timer controls do not compete with the current transcript');
  await connected.locator('#cuePicker').click();
  assert.ok(await connected.locator('#activityControls').isVisible(), 'connected reading activity exposes optional timing controls');
  await connected.locator('#subtitleTimerButton').click();
  await projector.waitForFunction(() => !window.lineStoryState.timerRunning);
  const pausedTime = await projector.evaluate(() => window.lineStoryState.timer);
  await sleep(300);
  assert.ok(Math.abs(await projector.evaluate(() => window.lineStoryState.timer) - pausedTime) < .2);
  await connected.locator('[data-command="reset-timer"]').click();
  await projector.waitForFunction(() => window.lineStoryState.timerRunning && window.lineStoryState.timer > 118);
  await connected.locator('#closeCueDialog').click();
  await connected.keyboard.press('t');
  await projector.waitForFunction(() => !window.lineStoryState.timerRunning);
  await connected.keyboard.press('Shift+r');
  await projector.waitForFunction(() => window.lineStoryState.timerRunning && window.lineStoryState.timer > 118);
  if (args.includes('--timer-only')) {
    await projector.evaluate(() => {location.hash = 'sensitive';});
    await awaitCue(connected, 'sensitive');
    await connected.locator('#cuePicker').click();
    assert.ok(await connected.locator('#activityControls').isHidden(), 'untimed cue hides the activity controls');
    assert.deepEqual(report.errors, []); assert.deepEqual(report.externalRequests, []);
    ok('Optional activity controls and T/Shift+R pause and restart the real student timer; untimed cues and standalone phones hide them');
    report.passed = true; return;
  }
  ok('Optional activity controls and T/Shift+R preserve student reading time without filling the subtitle screen');
  assert.equal(await projector.evaluate(() => typeof window.LINE_SUBTITLES), 'undefined');
  assert.equal(await projector.locator('#subtitleText').count(), 0);
  await connected.evaluate(() => window.scrollTo(0, 240));
  const connectedScroll = await connected.evaluate(() => scrollY);
  assert.ok(connectedScroll > 0, 'long synchronized cue is scrollable');
  await sleep(1400);
  assert.equal(await connected.evaluate(() => scrollY), connectedScroll, 'state heartbeat does not reset the reading position');
  await connected.locator('[data-command="next"]').click();
  await projector.waitForFunction(() => window.lineStoryState.id === 'sensitive');
  await awaitCue(connected, 'sensitive');
  await full.waitForFunction(() => window.linePresenterState.cueId === 'sensitive');
  await connected.locator('#cuePicker').click();
  assert.ok(await connected.locator('#activityControls').isHidden(), 'untimed cue hides the activity controls');
  await connected.locator('#closeCueDialog').click();
  await sleep(240); // The classroom intentionally rejects duplicate advances within 180 ms.
  await full.locator('[data-command="next"]').click();
  await awaitCue(connected, 'connection');
  ok('Both teacher windows can coexist and control the same action, while projector content stays free of teacher subtitles');

  const current = (await state(connected)).cueId;
  await connected.evaluate(() => window.postMessage({protocol: 'childhood-line-story-presenter-v2', session: 'wrong', type: 'state', state: {index: 56, cue: {id: 'final-day'}}}, '*'));
  await projector.evaluate(() => window.postMessage({protocol: 'childhood-line-story-presenter-v2', session: 'wrong', view: 'subtitles', type: 'command', command: 'next'}, '*'));
  await sleep(300);
  assert.equal((await state(connected)).cueId, current);
  assert.equal(await projector.evaluate(() => window.lineStoryState.id), current);
  await projector.reload();
  await projector.waitForFunction(() => !!window.lineStoryState);
  await connected.waitForFunction(() => window.lineSubtitleState?.connected);
  await full.waitForFunction(() => window.linePresenterState?.connected);
  await connected.locator('[data-command="next"]').click();
  await projector.waitForFunction(() => window.lineStoryState.id === 'window-reading');
  await awaitCue(connected, 'window-reading');
  await full.waitForFunction(() => window.linePresenterState.cueId === 'window-reading');
  ok('Unrelated state/command messages are ignored and both presenters reconnect after the student page reloads');

  await connected.close();
  await projector.waitForFunction(() => !window.lineStoryState.subtitleConnected);
  const reopenedPromise = projector.waitForEvent('popup'); await projector.keyboard.press('s');
  const reopened = await reopenedPromise; watch(reopened);
  await reopened.waitForFunction(() => window.lineSubtitleState?.connected);
  assert.equal((await state(reopened)).cueId, 'window-reading');
  const openWindows = context.pages().length;
  const fullURL = full.url(), subtitleURL = reopened.url();
  await full.locator('#subtitleModeLink').click();
  await sleep(300);
  assert.equal(full.url(), fullURL, 'existing subtitle window is focused without replacing the full presenter');
  await reopened.locator('#cuePicker').click();
  await reopened.locator('#fullPresenterLink').click();
  await sleep(300);
  assert.equal(reopened.url(), subtitleURL, 'existing full presenter is focused without replacing the subtitles');
  assert.equal(context.pages().length, openWindows, 'mode links do not duplicate already open teacher windows');
  await reopened.locator('#closeCueDialog').click();
  await full.close();
  await projector.waitForFunction(() => !window.lineStoryState.presenterConnected);
  await sleep(300); // Allow the remaining subtitle window to receive slot availability.
  await reopened.locator('#cuePicker').click();
  await reopened.locator('#fullPresenterLink').click();
  await reopened.waitForFunction(() => window.linePresenterState?.connected);
  assert.equal(await reopened.evaluate(() => window.linePresenterState.cueId), 'window-reading');
  await reopened.locator('#subtitleModeLink').click();
  await reopened.waitForFunction(() => window.lineSubtitleState?.connected);
  assert.equal((await state(reopened)).cueId, 'window-reading');
  assert.equal(context.pages().length, openWindows - 1);
  const freshFullPromise = projector.waitForEvent('popup');
  await projector.keyboard.press('p');
  const freshFull = await freshFullPromise; watch(freshFull);
  await freshFull.waitForFunction(() => window.linePresenterState?.connected);
  assert.ok(reopened.url().includes('subtitles.html'), 'opening P after a mode switch cannot replace the subtitle window');
  assert.ok(freshFull.url().includes('presenter.html'));
  assert.equal((await state(reopened)).cueId, 'window-reading');
  assert.equal(await freshFull.evaluate(() => window.linePresenterState.cueId), 'window-reading');
  await freshFull.close();
  ok('Mode links focus existing windows or switch a lone presenter in place; reopening P preserves both window identities');
  await projector.close();
  await reopened.waitForFunction(() => window.lineSubtitleState?.mode === 'disconnected');
  const disconnectedCue = (await state(reopened)).cueId;
  await sleep(900);
  assert.equal((await state(reopened)).cueId, disconnectedCue, 'loss of projector never discards readable words');
  assert.ok((await reopened.locator('#subtitleText').innerText()).includes(L.passages.window[0]));
  ok('Closing and reopening keeps the current cue; losing the projector leaves the current transcript available');

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  ok('All checks run without uncaught browser errors or network requests');
  report.passed = true;
})().catch(error => {
  report.failure = error.stack || String(error); console.error(report.failure); process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  fs.mkdirSync(OUT, {recursive: true});
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({passed: report.passed, checks: report.checks.length, layouts: report.layouts.length, browser: report.browser, failure: report.failure}, null, 2));
});
