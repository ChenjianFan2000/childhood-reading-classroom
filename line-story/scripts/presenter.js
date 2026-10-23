/* Independent presenter window. No transcript is inserted into the student DOM. */
(function(){
'use strict';
const PROTOCOL='childhood-line-story-presenter-v2';
const session=new URLSearchParams(location.search).get('session')||'';
if(session&&window.opener)window.name='line-story-presenter-'+session;
const targetOrigin=location.protocol==='file:'?'*':location.origin;
const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,lastSeen=0,renderedCue='',renderedNodes='',connected=false;
function time(n){const s=Math.max(0,Math.ceil(n||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function send(type,extra={}){if(!window.opener||window.opener.closed)return;try{window.opener.postMessage({protocol:PROTOCOL,session,view:'full',type,...extra},targetOrigin);}catch{}}
function command(name,extra={}){if(!connected)return;send('command',{command:name,...extra});}
function connection(on){connected=on;document.body.classList.toggle('connected',on);$('#connectionStatus').textContent=on?'学生画面已连接':'等待学生画面重新连接';$('#disconnected').hidden=on;$('#presenterMain').setAttribute('aria-busy',String(!on));for(const b of document.querySelectorAll('[data-command]'))b.disabled=!on;}
function nextPreview(s){
 const n=s.next;if(!n)return '<p class="preview-ending">已经到达结语。<br>留给画面与学生一段安静。</p>';
 if(s.nextPicture)return `<img alt="${E(s.nextPicture.alt)}" src="${E(s.nextPicture.file)}">${n.kind==='photo'?`<p>${E(n.heading)}</p>`:''}`;
 const source=s.nextPassage;
 if(source)return `<h3>${E(n.heading)}</h3><div class="preview-reading">${source.map(p=>`<p>${E(p)}</p>`).join('')}</div>`;
 if(n.focusQuote)return `<h3>${E(n.heading)}</h3><p class="preview-quote">${E(n.focusQuote)}</p>`;
 if(!n.heading&&!(n.body||[]).length)return '<p class="preview-silence">画面继续，教师保持安静。</p>';
 return `<h3>${E(n.heading)}</h3>${(n.body||[]).map(p=>`<p>${E(p)}</p>`).join('')}`;
}
function revealCurrentCue(){
 const cue=$('.current-cue'), bar=$('.transport');
 const top=cue.getBoundingClientRect().top, clearance=bar.getBoundingClientRect().height+14;
 // Return to the new spoken cue after navigation, without moving keyboard focus
 // or disturbing the scroll position on timer/motion updates within a cue.
 if(top<clearance || top>innerHeight*.42) {
  window.scrollTo({top:Math.max(0,window.scrollY+top-clearance),behavior:'instant'});
 }
}
function render(s){
 state=s;const c=s.cue,n=s.next,fullChange=c.id!==renderedCue;
 if(fullChange){
  renderedCue=c.id;$('#subtitleModeLink').href='subtitles.html?session='+encodeURIComponent(session)+'#'+c.id;$('#cuePosition').textContent=`节点 ${s.nodeIndex+1} / ${s.nodes.length} · 节拍 ${s.index+1} / ${s.count}`;
  $('#cueTiming').textContent=c.timing||'';$('#cueTitle').textContent=c.title;
  $('#teacherWords').textContent=c.teacher||'此刻不讲话。把时间留给阅读、讨论、书写或画面。';$('#teacherWords').classList.toggle('silence',!c.teacher);
  $('#cueAction').textContent=c.action||'';$('#cueHold').textContent=c.hold||'依现场语速和学生反应停留。';$('#cueNext').textContent=c.next||'';
  $('#cueReply').textContent=c.reply||'';$('#replySection').hidden=!c.reply;
  $('#nextTitle').textContent=n?n.title:'结束后保持静止';$('#nextPreview').innerHTML=nextPreview(s);$('#nextAction').textContent=n?.action||'';
 }
 const nodeSignature=s.nodes.map(n=>n.id).join('|');
 if(nodeSignature!==renderedNodes){
  renderedNodes=nodeSignature;
  $('#nodeList').innerHTML=s.nodes.map((n,i)=>{const at=window.LINE_LESSON.cues.findIndex(c=>c.id===(n.firstCue||n.startCue));return `<button data-command="jump" data-index="${at}" data-node="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${E(n.title)}</strong><small>${E(n.timing||'')}</small></button>`;}).join('');
  $('#cueList').innerHTML=window.LINE_LESSON.cues.map((c,i)=>`<button data-command="jump" data-index="${i}"><span>${String(i).padStart(2,'0')}</span>${E(c.title)}<small>${E(c.timing)}</small></button>`).join('');
 }
 for(const b of $('#nodeList').querySelectorAll('button')){const yes=Number(b.dataset.node)===s.nodeIndex;b.classList.toggle('current',yes);if(yes)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
 for(const b of $('#cueList').querySelectorAll('button'))b.classList.toggle('current',Number(b.dataset.index)===s.index);
 $('#activityClock').textContent=c.timer?time(s.clock):'—';$('#activityStatus').textContent=!c.timer?'教师自主把握停留':s.clock<=0?'已到时，等待教师':s.clockRunning?'计时进行中':'已暂停';
 $('#lessonClock').textContent=time(Math.floor(s.elapsed));$('#remainingClock').textContent=s.elapsed>s.duration?'+'+time(s.elapsed-s.duration):time(s.duration-s.elapsed);
 $('#motionStatus').textContent=s.moving?(s.animationPaused?'动作已暂停':'动作正在展开'):'画面已静止';
 $('#screenStatus').textContent=s.blackout?'学生画面已暂隐':s.panel?'学生正在回看／选择节点':'';
 const next=$('[data-command="next"]');next.textContent=s.blackout?'恢复学生画面':s.moving?'完成当前动作':s.index===s.count-1?'已到结语':'下一步 →';next.disabled=s.index===s.count-1&&!s.moving&&!s.blackout;
 $('[data-command="prev"]').disabled=s.index===0;
 $('#timerButton').textContent=s.clockRunning?'暂停计时':'继续计时';$('#timerButton').disabled=!c.timer||s.clock<=0||s.blackout;
 $('[data-command="reset-timer"]').disabled=!c.timer;
 $('#motionButton').textContent=s.animationPaused?'继续动作':'暂停动作';$('#motionButton').disabled=!s.moving||s.blackout;
 $('#blankButton').textContent=s.blackout?'恢复学生画面':'暂隐学生屏';$('#blankButton').setAttribute('aria-pressed',s.blackout);
 $('#reducedButton').setAttribute('aria-pressed',s.reduced);$('#reducedButton').textContent=s.reduced?'恢复完整动画':'简静动画';
 $('#contrastButton').setAttribute('aria-pressed',s.highContrast);$('#rightClickButton').setAttribute('aria-pressed',s.rightClick);$('#rightClickButton').textContent='右键推进：'+(s.rightClick?'开启':'关闭');
 if(fullChange)requestAnimationFrame(revealCurrentCue);
}
addEventListener('message',e=>{
 if(e.source!==window.opener || e.data?.protocol!==PROTOCOL || e.data?.session!==session || e.data.type!=='state')return;
 if(location.protocol==='file:'?e.origin!=='null':e.origin!==location.origin)return;
 lastSeen=Date.now();if(!connected)connection(true);render(e.data.state);
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-command]');if(!b||b.disabled)return;command(b.dataset.command,b.dataset.index!==undefined?{index:Number(b.dataset.index)}:{});});
$('#subtitleModeLink').addEventListener('click',e=>{if(connected&&state?.subtitleAvailable){e.preventDefault();command('focus-subtitles');}});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
 if((e.key===' '||e.key==='Enter')&&e.target.closest('button,summary,a'))return;
 const k=e.key.toLowerCase();const map={arrowright:'next',pagedown:'next',' ':'next',arrowleft:'prev',pageup:'prev',t:'timer',a:'motion',b:'blank','[':'previous-node',']':'next-node',r:e.shiftKey?'reset-timer':'replay'};
 if(k==='escape'&&state?.blackout){e.preventDefault();command('blank');return;}
 if(map[k]){e.preventDefault();command(map[k]);}
});
connection(false);send('ready');
setInterval(()=>{if(!lastSeen||Date.now()-lastSeen>1500)send('ready');if(lastSeen&&Date.now()-lastSeen>3500&&connected)connection(false);},750);
Object.defineProperty(window,'linePresenterState',{get:()=>({connected,cueId:state?.cue.id||null,index:state?.index??-1,session})});
})();
