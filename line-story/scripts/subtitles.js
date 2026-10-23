/* One current cue, complete spoken words. No automatic scrolling or pagination. */
(function () {
'use strict';
const L = window.LINE_LESSON, C = L.cues, S = window.LINE_SUBTITLES;
const PROTOCOL = 'childhood-line-story-presenter-v2';
const POSITION_KEY = 'childhood-line-story-subtitle-position-v1';
const FONT_KEY = 'childhood-line-story-subtitle-font-v1';
const session = new URLSearchParams(location.search).get('session') || '';
const targetOrigin = location.protocol === 'file:' ? '*' : location.origin;
const $ = s => document.querySelector(s);
let index = 0, renderedId = '', connected = false, lastSeen = 0, state = null;
let linked = !!(session && window.opener && !window.opener.closed);
if (linked) window.name = 'line-story-subtitles-' + session;
let mode = linked ? 'connecting' : 'standalone', fontSize = 26;
const started = Date.now();

function hashIndex() {
 try { return C.findIndex(c => c.id === decodeURIComponent(location.hash.slice(1))); } catch { return -1; }
}
function savePosition() {
 try { sessionStorage.setItem(POSITION_KEY, JSON.stringify({version:L.version, id:C[index].id})); } catch {}
}
function updateHash() {
 try { history.replaceState(null, '', '#' + C[index].id); } catch {}
}
function setFont(n) {
 fontSize = Math.max(20, Math.min(40, n));
 document.documentElement.style.setProperty('--subtitle-font-size', fontSize + 'px');
 $('[data-font="smaller"]').disabled = fontSize <= 20;
 $('[data-font="larger"]').disabled = fontSize >= 40;
 try { localStorage.setItem(FONT_KEY, String(fontSize)); } catch {}
}
function send(type, extra = {}) {
 if (!linked || !window.opener || window.opener.closed) return;
 try { window.opener.postMessage({protocol:PROTOCOL, session, view:'subtitles', type, ...extra}, targetOrigin); } catch {}
}
function updateConnection() {
 $('#connectionStatus').textContent = mode === 'connected' ? '跟随学生画面' : mode === 'connecting' ? '正在连接' : mode === 'disconnected' ? '连接已断开' : '独立翻稿';
 $('#connectionNotice').hidden = mode !== 'disconnected';
 $('#navigationMode').textContent = linked
  ? '字幕跟随同一浏览器中的学生画面。这里的上一步、下一步和动作选择，也会控制学生画面。'
  : '手机与投影电脑分别打开时，请按课堂进度手动翻稿；两台设备不会自动同步。';
 $('#fullPresenterLink').hidden = !linked;
 $('#fullPresenterLink').href = 'presenter.html?session=' + encodeURIComponent(session);
 updateControls();
}
function updateControls() {
 const prev = $('[data-command="prev"]'), next = $('[data-command="next"]');
 const available = !linked || connected;
 prev.disabled = !available || index === 0;
 next.disabled = !available || (index === C.length - 1 && !(connected && (state?.moving || state?.blackout)));
 next.textContent = connected && state?.blackout ? '恢复画面 →' : connected && state?.moving ? '完成动作 →' : index === C.length - 1 ? '已到结语' : '下一步 →';
 $('#jumpCue').disabled = !available;
 const activity = connected && C[index].timer > 0;
 $('#activityControls').hidden = !activity;
 if (activity) {
  const left = Math.max(0, Math.ceil(state.clock || 0));
  $('#activityStatus').textContent = left > 0
   ? '当前活动剩余 ' + Math.floor(left / 60) + '分' + String(left % 60).padStart(2, '0') + '秒。朗读后可从头计时，留足学生读写时间。'
   : '活动已到时。读写尚未完成可以继续停留，或从头计时。';
  $('#subtitleTimerButton').textContent = state.clockRunning ? '暂停计时' : '继续计时';
  $('#subtitleTimerButton').disabled = left <= 0 || !!state.blackout;
  $('#activityControls [data-command="reset-timer"]').disabled = !!state.blackout;
 }
}
function paragraph(text, className) {
 const p = document.createElement('p'); p.textContent = text;
 if (className) p.className = className;
 return p;
}
function render() {
 const cue = C[index];
 if (cue.id !== renderedId) {
  renderedId = cue.id;
  const fragment = document.createDocumentFragment();
  const entry = S?.cues?.[cue.id];
  if (!entry?.blocks?.length) {
   fragment.append(paragraph('这一动作的字幕未能加载，请刷新页面后重试。'));
  } else for (const block of entry.blocks) {
   if (block.type === 'speech') fragment.append(paragraph(block.text, 'spoken-paragraph'));
   else if (block.type === 'responses') {
    const section = document.createElement('section'); section.className = 'response-options';
    section.setAttribute('aria-label', '按现场回答选择回应');
    const heading = document.createElement('h2'); heading.textContent = '按现场回答选择回应'; section.append(heading);
    for (const item of block.items) {
     const option = document.createElement('div'); option.className = 'response-option';
     option.append(paragraph(item.when, 'response-condition'), paragraph(item.say, 'response-words'));
     section.append(option);
    }
    fragment.append(section);
   }
  }
  $('#subtitleText').replaceChildren(fragment);
  $('#cuePosition').textContent = (index + 1) + ' / ' + C.length;
  $('#cueTitle').textContent = cue.title;
  $('#cuePicker').setAttribute('aria-label', '当前第' + (index + 1) + '步：' + cue.title + '。选择动作');
  // Preserve a teacher's pending directory choice during background heartbeats.
  if (!$('#cueDialog').open) $('#cueSelect').value = String(index);
  $('#studentLink').href = 'index.html#' + cue.id;
  $('#cueAnnouncement').textContent = '第' + (index + 1) + '步，' + cue.title;
  document.title = cue.title + ' · 字幕教师台';
  window.scrollTo({top:0, behavior:'instant'});
  updateHash(); savePosition();
 }
 updateControls();
}
function navigate(command, destination) {
 if (linked) {
  if (connected) send('command', {command, ...(command === 'jump' ? {index:destination} : {})});
  return;
 }
 const n = command === 'next' ? index + 1 : command === 'prev' ? index - 1 : destination;
 if (!Number.isInteger(n) || n < 0 || n >= C.length) return;
 index = n; render();
}
function disconnect() {
 if (!linked) return;
 connected = false; mode = 'disconnected'; updateConnection();
}

const options = document.createDocumentFragment();
C.forEach((c, i) => {
 const option = document.createElement('option'); option.value = String(i);
 option.textContent = String(i + 1).padStart(2, '0') + ' · ' + c.title;
 options.append(option);
});
$('#cueSelect').append(options);
try {
 const saved = JSON.parse(sessionStorage.getItem(POSITION_KEY) || 'null');
 const old = saved?.version === L.version ? C.findIndex(c => c.id === saved.id) : -1;
 if (!linked && old >= 0) index = old;
 const size = Number(localStorage.getItem(FONT_KEY));
 if (Number.isFinite(size) && size >= 20 && size <= 40) fontSize = size;
} catch {}
const initial = hashIndex(); if (initial >= 0) index = initial;
setFont(fontSize); render(); updateConnection();

addEventListener('message', e => {
 const d = e.data;
 if (!linked || e.source !== window.opener || d?.protocol !== PROTOCOL || d.session !== session || d.type !== 'state') return;
 if (location.protocol === 'file:' ? e.origin !== 'null' : e.origin !== location.origin) return;
 const s = d.state;
 if (!Number.isInteger(s?.index) || !C[s.index] || C[s.index].id !== s.cue?.id) return;
 state = s; index = s.index; lastSeen = Date.now(); connected = true; mode = 'connected';
 updateConnection(); render();
});
document.addEventListener('click', e => {
 const button = e.target.closest('button'); if (!button || button.disabled) return;
 if (button.dataset.command) navigate(button.dataset.command);
 if (button.dataset.font) setFont(fontSize + (button.dataset.font === 'larger' ? 2 : -2));
});
$('#cuePicker').addEventListener('click', () => {
 $('#cueSelect').value = String(index); $('#cueDialog').showModal(); $('#cueSelect').focus();
});
$('#closeCueDialog').addEventListener('click', () => $('#cueDialog').close());
$('#jumpCue').addEventListener('click', () => {
 const n = Number($('#cueSelect').value); $('#cueDialog').close(); navigate('jump', n);
});
$('#readIndependently').addEventListener('click', () => {
 send('detach');
 linked = false; connected = false; mode = 'standalone'; state = null;
 try { history.replaceState(null, '', location.pathname + '#' + C[index].id); } catch {}
 updateConnection(); savePosition();
});
$('#fullPresenterLink').addEventListener('click', e => {
 if (connected && state?.presenterAvailable) { e.preventDefault(); send('command', {command:'focus-presenter'}); }
});
document.addEventListener('keydown', e => {
 if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || $('#cueDialog').open) return;
 if (e.target.closest('select,input,textarea,[contenteditable="true"]')) return;
 if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button,a,summary')) return;
 const key = e.key.toLowerCase();
 if (['arrowright','pagedown',' '].includes(key)) { e.preventDefault(); navigate('next'); }
 else if (['arrowleft','pageup'].includes(key)) { e.preventDefault(); navigate('prev'); }
 else if (key === 'home' || key === 'end') { e.preventDefault(); navigate('jump', key === 'home' ? 0 : C.length - 1); }
 else if (linked && connected && key === 't') { e.preventDefault(); send('command', {command:'timer'}); }
 else if (linked && connected && key === 'r' && e.shiftKey) { e.preventDefault(); send('command', {command:'reset-timer'}); }
});
addEventListener('hashchange', () => {
 const n = hashIndex(); if (n < 0) return;
 // A connected subtitle window follows the student window; URL edits must not
 // silently jump the projected lesson or claim a different cue is on screen.
 if (linked) { updateHash(); return; }
 index = n; render();
});
addEventListener('pagehide', savePosition);
send('ready');
setInterval(() => {
 if (!linked) return;
 if (!window.opener || window.opener.closed) { disconnect(); return; }
 if (!lastSeen || Date.now() - lastSeen > 1200) send('ready');
 if (Date.now() - (lastSeen || started) > 3500) disconnect();
}, 750);
Object.defineProperty(window, 'lineSubtitleState', {get:() => ({connected, cueId:C[index].id, index, mode, fontSize})});
})();
