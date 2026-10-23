/* Teacher-driven cues. Stable evidence nodes, finite motion and a separate presenter. */
(function () {
'use strict';
const L = window.LINE_LESSON, C = L.cues;
const $ = s => document.querySelector(s);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE = 'childhood-line-story-session-v2';
const PROTOCOL = 'childhood-line-story-presenter-v2';
const origin = location.protocol === 'file:' ? '*' : location.origin;
const picture = {
 haulers: {file:'assets/haulers.jpg',alt:'列宾《伏尔加河上的纤夫》原画'},
 yamen: {file:'assets/yamen.webp',alt:'报道中的亚门与父亲'},
 varvara: {file:'assets/varvara.webp',alt:'报道中的瓦尔瓦拉与母亲'}
};
const passageNames = {hurt:'受伤之后',hurt_game:'受伤之后',warmth:'外祖母的爱',protect:'伸出来的胳膊',again:'保护以后的问答',anne:'安妮的愿望',window:'与表哥一起坐在窗前',grandfather:'外祖父的经历与解释',grandfather_game:'经历与解释',author:'作者的回望'};
let index = 0, panelKind = '', focusBefore = null, uiTimeout = 0, toastTimeout = 0, lastAdvance = -1000;
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let highContrast = false, rightClick = false, animationPaused = false, blackout = false, blankResume = null;
let presenter = null, timerInterval = null, lastPersist = 0;
let session = '', lessonElapsed = 0, lessonSince = 0, lessonRunning = false;
const pending = new Set(), clocks = new Map(), marks = new Map(), choices = new Map(), nodeCache = new Map();
const fallbackNodes = [];
C.forEach(c => { if (!fallbackNodes.some(n => n.title === c.section)) fallbackNodes.push({id:'section-'+fallbackNodes.length,title:c.section,firstCue:c.id}); });
const nodes = Array.isArray(L.nodes) && L.nodes.length ? L.nodes : fallbackNodes;
const nodeFirst = n => C.findIndex(c => c.id === (n.firstCue || n.startCue));
const currentNodeIndex = () => { let result = 0; nodes.forEach((n,i) => {if(nodeFirst(n) <= index) result = i;}); return result; };
function newSession() { const b = new Uint32Array(4); if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(b); else b.forEach((_,i) => b[i] = Math.floor(Math.random()*4294967296)); return [...b].map(n=>n.toString(16)).join('-'); }
function cueHash() { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } }
function timerNow() { const s = clocks.get(C[index].id); return s ? Math.max(0,s.left-(s.running?(performance.now()-s.since)/1000:0)) : 0; }
function elapsedNow() { return lessonElapsed + (lessonRunning ? (performance.now()-lessonSince)/1000 : 0); }
function pauseLesson() { if(lessonRunning) { lessonElapsed=elapsedNow(); lessonRunning=false; } }
function startLesson() { if(index>0 && !lessonRunning && !blackout) {lessonRunning=true;lessonSince=performance.now();} }
function snapshotStorage() {
 return {version:L.version,session,id:C[index].id,reduced,highContrast,rightClick,
  marks:[...marks].map(([k,v])=>[k,[...v]]), choices:[...choices], elapsed:elapsedNow(),
  clocks:[...clocks].map(([id,s])=>[id,{left:id===C[index].id?timerNow():s.left,resume:s.resume}])};
}
function persist() { try { sessionStorage.setItem(STORAGE,JSON.stringify(snapshotStorage())); } catch {} lastPersist=performance.now(); }
function restore() {
 let saved; try {saved=JSON.parse(sessionStorage.getItem(STORAGE)||'null');} catch {}
 if(saved && saved.version===L.version) {
  session=typeof saved.session==='string'?saved.session:'';
  reduced=typeof saved.reduced==='boolean'?saved.reduced:reduced; highContrast=!!saved.highContrast; rightClick=!!saved.rightClick;
  lessonElapsed=Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0;
  for(const [k,v] of saved.marks||[]) if(L.passages[k] && Array.isArray(v)) marks.set(k,new Set(v.filter(w=>typeof w==='string')));
  for(const [k,v] of saved.choices||[]) if(typeof k==='string'&&Array.isArray(v)) choices.set(k,v.map(Boolean));
  for(const [id,s] of saved.clocks||[]) { const c=C.find(c=>c.id===id); if(c?.timer && Number.isFinite(s?.left)) clocks.set(id,{left:Math.max(0,Math.min(c.timer,s.left)),resume:s.resume!==false,running:false,since:0}); }
  const i=C.findIndex(c=>c.id===saved.id); if(i>=0)index=i;
 }
 if(!session)session=newSession();
 const hash=cueHash(), hashIndex=C.findIndex(c=>c.id===hash); if(hashIndex>=0)index=hashIndex;
}
function paragraphs(list=[],cls='body-lines',prefix='body') { return `<div class="${cls}" data-key="${prefix}">${list.map((t,i)=>`<p data-key="${prefix}:${i}">${E(t)}</p>`).join('')}</div>`; }
function quotation(key,emphasis=[],prefix='') {
 const markSet=marks.get(key)||new Set(), words=[...new Set(emphasis)].filter(Boolean).sort((a,b)=>b.length-a.length);
 return `<div class="quote" data-key="${prefix}quote:${E(key)}" data-passage="${E(key)}">${(L.passages[key]||[]).map((p,i)=>{
  // Build tokens from original text; never replace inside generated markup.
  const escaped=words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const expression=escaped.length?new RegExp('('+escaped.join('|')+')','g'):null;
  const parts=expression?p.split(expression):[p];
  const html=parts.map(t=>words.includes(t)?`<em class="markable${markSet.has(t)?' emph':''}" data-word="${E(t)}" tabindex="0" role="button" aria-pressed="${markSet.has(t)}" aria-label="标记${E(t)}">${E(t)}</em>`:E(t)).join('');
  return `<p data-key="${prefix}${E(key)}:paragraph:${i}">${html}</p>`;
 }).join('')}</div>`;
}
function logicChoices(c) { const picked=choices.get('grandfather-reasoning')||[false,false]; return [picked[0],c.state==='cut'||picked[1]]; }
function renderContent(c) {
 const title=`<h1 data-key="title">${E(c.heading)}</h1>`, h2=`<h2 data-key="reading-title">${E(c.heading)}</h2>`;
 const body=paragraphs(c.body||[]), article=(cls,html)=>`<article data-key="article" class="${cls}" data-reading-mode="${E(c.readingMode||(c.focusQuote?'detail':['reading','pair'].includes(c.kind)?'immersive':['repair','logic','group'].includes(c.kind)?'recall':'none'))}">${html}</article>`;
 if(c.kind==='art') return article('art-layout','');
 if(c.kind==='cover') return article('cover-layout',`<div class="eyebrow" data-key="eyebrow">六年级 · 阅读与思考</div>${title}${body}<p class="start-hint" data-key="start-hint">按 → 或空格开始 · F 全屏 · P 教师台</p>`);
 if(c.focusQuote) return article('focus-layout',`${h2}<blockquote class="focus-quote" data-key="focus-quote">${E(c.focusQuote)}</blockquote>${(c.body||[]).length?body:''}`);
 if(c.kind==='pair') return article('pair-layout',`${h2}<div class="pair" data-key="pair"><div data-key="pair-left"><h3 data-key="left-title">${E(c.leftTitle)}</h3>${quotation(c.left)}</div><div data-key="pair-right"><h3 data-key="right-title">${E(c.rightTitle)}</h3>${quotation(c.right)}</div></div>`);
 if(c.kind==='reading') return article(`reading-layout ${c.density||''} ${c.id==='anne-reading'?'anne-reading':''} ${c.id==='anne-context'?'context-reading':''} ${c.passage==='window'?'window-reading':''}`,`${h2}${quotation(c.passage,c.emphasis||[])}`);
 if(c.kind==='repair') return article('repair-layout',`${h2}<div class="repair-grid" data-key="repair-grid">${quotation(c.passage,c.passage==='hurt_game'?['不安','撕掉','难以忍受']:['挡着你','少挨了几下','为了爱'])}<div class="repair-card" data-key="repair-card"><p class="card-text" data-key="repair-summary">${E(c.body[0])}</p><p class="card-prompt" data-key="repair-prompt">${E(c.body[1])}</p></div></div>`);
 if(c.kind==='contrast') return article('contrast-layout',`${h2}${paragraphs(c.body,'quote','contrast')}`);
 if(c.kind==='rules') return article('rules-layout',`${title}<div class="rule-words" data-key="rule-words">${c.body.map((t,i)=>`<div data-key="rule:${i}"><small>0${i+1}</small><p>${E(t)}</p></div>`).join('')}</div>`);
 if(c.kind==='logic') {
  const cut=logicChoices(c);
  const row=c.body.map((t,i)=>`<p class="node-label" data-key="logic-node:${i}">${E(t)}</p>${i<2?`<button class="arrow-button${cut[i]?' cut':''}" data-key="logic-arrow:${i}" data-arrow="${i}" aria-pressed="${cut[i]}" aria-label="检验第${i+1}条箭头">→</button>`:''}`).join('');
  return article('logic-layout',`${title}<div class="logic-row" data-key="logic-row">${row}</div>${quotation(c.passage||'grandfather_game')}`);
 }
 if(c.kind==='group') return article('group-layout',`${h2}<div class="evidence-grid" data-key="group-evidence"><div class="evidence" data-key="book-evidence"><h3>《童年》</h3><p>“可是你总算少挨了几下”</p><p>“当然要打啦！说不定要常常收拾你的……”</p><div class="evidence-actions"><button data-evidence="protect">回读保护</button><button data-evidence="warmth">外祖母</button><button data-evidence="window">窗边</button></div></div><div class="evidence" data-key="anne-evidence"><h3>安妮的愿望</h3><p>${E((L.passages.anne_wish||L.passages.anne)[0])}</p><p>帮助者送来生活必需品；迫害仍使出门危险。</p><button data-evidence="anne">回读愿望</button></div></div>${body}<p class="group-steps" data-key="group-steps">人人表达 → 两份证据 → 提出质疑 → 写成主张</p>`);
 if(c.id==='compare') return article('question-layout recall-layout',`${title}${body}<div class="recall-links" data-key="recall-links"><button data-evidence="hurt">回看受伤之后</button><button data-evidence="warmth">回看外祖母的爱</button><button data-evidence="pair">两段并读</button></div>`);
 return article(`${c.kind}-layout${!c.heading && !(c.body||[]).length?' silent-layout':''}`,`${c.heading?title:''}${(c.body||[]).length?body:''}`);
}
/* Keyed reconciliation also keeps detached quotations for later evidence return. */
function patchNode(current,desired) {
 if(desired.nodeType===Node.TEXT_NODE) { if(current.nodeValue!==desired.nodeValue)current.nodeValue=desired.nodeValue; return; }
 if(desired.nodeType!==Node.ELEMENT_NODE)return;
 for(const a of [...current.attributes]) if(!desired.hasAttribute(a.name))current.removeAttribute(a.name);
 for(const a of [...desired.attributes]) if(current.getAttribute(a.name)!==a.value)current.setAttribute(a.name,a.value);
 let cursor=current.firstChild;
 for(const wanted of [...desired.childNodes]) {
  let chosen=null;
  if(wanted.nodeType===Node.ELEMENT_NODE && wanted.dataset.key) {
   const key=wanted.dataset.key, cached=nodeCache.get(key);
   if(cached && cached.tagName===wanted.tagName) chosen=cached;
   else { chosen=wanted.cloneNode(false); nodeCache.set(key,chosen); }
  } else if(cursor && cursor.nodeType===wanted.nodeType && (wanted.nodeType!==Node.ELEMENT_NODE || (!cursor.dataset.key && cursor.tagName===wanted.tagName))) chosen=cursor;
  else chosen=wanted.cloneNode(false);
  if(chosen!==cursor)current.insertBefore(chosen,cursor);
  patchNode(chosen,wanted); cursor=chosen.nextSibling;
 }
 while(cursor) {const next=cursor.nextSibling; current.removeChild(cursor);cursor=next;}
}
function contentUpdate(c,old,instant) {
 const host=$('#content'), previous=host.querySelector('article');
 const oldHeading=previous?.querySelector('h1,h2')?.textContent;
 const before=new Set(host.querySelectorAll('[data-key]'));
 const t=document.createElement('template'); t.innerHTML=renderContent(c);
 const desired=document.createElement('section');desired.append(t.content);
 patchNode(host,desired); host.id='content';host.setAttribute('aria-label','当前阅读内容');
 const article=host.firstElementChild;
 if(instant||reduced||c.kind==='art')return;
 const isNew = !previous || old.zone!==c.zone;
 if(c.id==='final-day') { animate(article,[{opacity:0},{opacity:1}],{duration:1300,delay:8000,fill:'backwards',easing:'ease-out'});return; }
 if(isNew)animate(article,[{opacity:0},{opacity:1}],{duration:650,delay:old.zone===c.zone?0:350,fill:'backwards',easing:'ease-out'});
 else {
  const heading=article.querySelector('h1,h2');
  if(heading && oldHeading!==heading.textContent)animate(heading,[{opacity:.35},{opacity:1}],{duration:500,easing:'ease-out'});
  // Animate only newly introduced evidence blocks, never the entire shared layer.
  for(const el of article.querySelectorAll('.quote,.focus-quote,.logic-row,.body-lines,.pair,.repair-grid,.evidence-grid')) {
   if(!before.has(el) && ![...el.parentElement.closest('article').querySelectorAll('.quote,.pair,.repair-grid,.evidence-grid')].some(parent=>parent!==el&&parent.contains(el)&&!before.has(parent))) animate(el,[{opacity:0},{opacity:1}],{duration:650,easing:'ease-out'});
  }
 }
}
function animate(el,frames,opts) {
 if(reduced||!el)return null;
 const a=el.animate(frames,opts); pending.add(a);
 a.addEventListener('finish',()=>{pending.delete(a);sendState();},{once:true});
 a.addEventListener('cancel',()=>pending.delete(a),{once:true});
 return a;
}
function ownMotion() { return [...pending].some(a=>a.playState==='running'||a.playState==='paused'||a.pending); }
function hasMotion() { return ownMotion() || !!window.LineWorld.isAnimating?.(); }
function finishMotion() { window.LineWorld.finish?.(); for(const a of [...pending])try{a.finish();}catch{} animationPaused=false;sendState(); }
function cancelMotion() { pending.forEach(a=>a.cancel());pending.clear();window.LineWorld.stop();animationPaused=false; }
function pauseMotion() { window.LineWorld.pause?.();pending.forEach(a=>{if(a.playState==='running')a.pause();});animationPaused=true; }
function resumeMotion() { window.LineWorld.resume?.();pending.forEach(a=>{if(a.playState==='paused')a.play();});animationPaused=false; }
function toggleMotion() { if(blackout)return; if(!hasMotion()){toast('当前画面已经静止');return;} if(animationPaused)resumeMotion();else pauseMotion();sendState(); }
function showMedia(c,instant) {
 const host=$('#media'), type=c.media, old=host.firstElementChild;
 if(type) {
  if(old?.dataset.key===type) {old.classList.remove('closing','detail');host.setAttribute('aria-hidden','false');return;}
  host.replaceChildren(); const f=document.createElement('div'); f.className='media-frame '+(type==='haulers'?'art':'photo');f.dataset.key=type;
  const img=new Image();img.alt=picture[type].alt;img.src=picture[type].file;img.draggable=false;
  img.addEventListener('error',()=>{f.innerHTML=`<div class="media-fallback">图片暂未读取<br>请保留 assets 文件夹后重新打开。<br>${E(picture[type].alt)}</div>`;},{once:true});
  f.append(img);host.append(f);host.setAttribute('aria-hidden','false');
  if(!instant)animate(f,[{opacity:0,transform:'translateY(70px) scale(.94)'},{opacity:1,transform:'none'}],{duration:1150,easing:'cubic-bezier(.2,.8,.2,1)'});
 } else if(c.closeMedia && old) {
  host.setAttribute('aria-hidden','true');old.classList.add('closing');
  if(instant||reduced){host.replaceChildren();return;}
  const destination=c.id==='yamen-close'?'translate(-330px,300px) scale(.09)':c.id==='varvara-close'?'translate(690px,300px) scale(.09)':'translate(-240px,380px) scale(.06)';
  const a=animate(old,[{opacity:1,transform:'none'},{opacity:0,transform:destination}],{duration:1400,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
  a?.addEventListener('finish',()=>old.remove(),{once:true});
 } else {host.replaceChildren();host.setAttribute('aria-hidden','true');}
}
function pauseClock({remember=true}={}) {
 const s=clocks.get(C[index].id);
 if(s?.running){s.left=timerNow();s.running=false;if(remember)s.resume=true;}
 clearInterval(timerInterval);timerInterval=null;
}
function displayTimer() {
 const c=C[index],s=clocks.get(c.id); if(!c.timer){$('#timer').hidden=true;return;}
 const left=timerNow(),v=Math.ceil(left);$('#timer').hidden=false;
 $('#timer').innerHTML=`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}<small>${left<=0?'可以继续 · 等待教师':!s?.running?'已暂停':'安静读写'}</small>`;
 if(s && left<=0){s.left=0;s.running=false;s.resume=false;clearInterval(timerInterval);timerInterval=null;persist();}
}
function enterClock(c) {
 clearInterval(timerInterval);timerInterval=null;
 if(!c.timer){$('#timer').hidden=true;return;}
 let s=clocks.get(c.id);if(!s){s={left:c.timer,running:false,resume:true,since:0};clocks.set(c.id,s);}
 s.running=!!(s.resume && s.left>0 && !blackout);s.since=performance.now();
 displayTimer();if(s.running)timerInterval=setInterval(displayTimer,200);
}
function toggleTimer() {
 const c=C[index];if(!c.timer){toast('当前节拍没有独立活动计时');return;}
 if(blackout)return;
 const s=clocks.get(c.id);if(s.running){pauseClock();s.resume=false;displayTimer();}
 else if(s.left>0){s.resume=true;enterClock(c);}else toast('活动计时已结束；Shift + R 可重新计时');
 persist();sendState();
}
function resetTimer() {
 const c=C[index];if(!c.timer){toast('当前节拍没有独立活动计时');return;}
 pauseClock();clocks.set(c.id,{left:c.timer,running:false,resume:true,since:0});enterClock(c);persist();sendState();toast('本次活动重新计时');
}
function toast(text) {$('#toast').textContent=text;$('#toast').classList.add('on');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('on'),2400);}
function controls() {document.body.classList.add('show-controls');clearTimeout(uiTimeout);uiTimeout=setTimeout(()=>document.body.classList.remove('show-controls'),2600);}
function applyOptions() {document.body.classList.toggle('reduced',reduced);document.body.classList.toggle('high-contrast',highContrast);}
function go(n,{instant=false,fromHash=false,mode='forward'}={}) {
 if(n<0||n>=C.length)return;
 if(blackout)toggleBlackout();
 pauseClock();cancelMotion();const old=C[index];index=n;const c=C[index];
 document.body.classList.toggle('art-state',c.kind==='art');document.body.classList.toggle('reading-state',['reading','pair','repair','group'].includes(c.kind));
 document.body.classList.toggle('photo-state',c.kind==='photo');document.body.dataset.cue=c.id;
 document.body.dataset.readingMode=c.readingMode||(c.focusQuote?'detail':c.kind==='reading'||c.kind==='pair'?'immersive':'none');
 window.LineWorld.set(c,old,reduced,instant,mode);
 contentUpdate(c,old,instant);showMedia(c,instant);
 $('#chapter').textContent=nodes[currentNodeIndex()]?.title||c.section;
 $('#meter span').style.width=`${index/(C.length-1)*100}%`;
 $('#position').textContent=`${String(currentNodeIndex()+1).padStart(2,'0')} / ${nodes.length}`;
 $('#position').title=`内部节拍 ${index+1} / ${C.length}`;
 $('#prev').disabled=index===0;$('#next').disabled=index===C.length-1;
 $('#next').innerHTML=index===C.length-1?'已到结语':'下一步 <span>→</span>';
 document.title=c.title+' · 童年线条叙事';$('#stage').scrollTop=0;
 if(!fromHash)try{history.replaceState(null,'','#'+c.id);}catch{}
 enterClock(c);startLesson();persist();sendState();
}
function navigationGate() {const now=performance.now();if(now-lastAdvance<200)return false;lastAdvance=now;return true;}
function next() {if(!navigationGate())return;if(blackout){toggleBlackout();return;}if(panelKind){closePanel();return;}if(hasMotion()){finishMotion();return;}go(index+1);}
function prev() {if(!navigationGate())return;if(blackout){toggleBlackout();return;}if(panelKind){closePanel();return;}go(index-1,{instant:true,mode:'restore'});}
function jump(n) {if(!Number.isInteger(n)||n<0||n>=C.length)return;closePanel();go(n,{instant:true,mode:'restore'});}
function nodeJump(offset) {const n=nodes[Math.max(0,Math.min(nodes.length-1,currentNodeIndex()+offset))];jump(nodeFirst(n));}
function replay() {
 if(blackout)toggleBlackout();const clock=clocks.get(C[index].id),resume=clock?.resume;
 pauseClock();window.LineWorld.reset(C[index]);go(index,{mode:'replay'});
 if(clock && resume===false){clock.resume=false;pauseClock();displayTimer();}persist();sendState();toast('只重播当前动作，活动计时保留');
}
function toggleBlackout() {
 if(!blackout) {
  blankResume={clock:!!clocks.get(C[index].id)?.running,lesson:lessonRunning,motionPaused:animationPaused};
  pauseClock();pauseLesson();pauseMotion();blackout=true;document.body.classList.add('is-blackout');$('#blackout').hidden=false;
 } else {
  blackout=false;document.body.classList.remove('is-blackout');$('#blackout').hidden=true;
  if(!blankResume?.motionPaused)resumeMotion();
  if(blankResume?.clock)enterClock(C[index]);
  if(blankResume?.lesson)startLesson();blankResume=null;displayTimer();
 }
 persist();sendState();
}
function restart() {closePanel();if(blackout)toggleBlackout();pauseClock();pauseLesson();clocks.clear();marks.clear();choices.clear();nodeCache.clear();lessonElapsed=0;go(0,{instant:true,mode:'restore'});pauseLesson();persist();sendState();}
function size() {document.documentElement.style.setProperty('--scale',Math.min(innerWidth/1600,innerHeight/900));}
function openPanel(kind) {focusBefore=document.activeElement;panelKind=kind;$('#panel').hidden=false;$('#panelBackdrop').hidden=false;$('#panel').classList.toggle('evidence-panel',kind==='evidence');$('#closePanel').focus();controls();sendState();}
function closePanel() {if(!panelKind)return;panelKind='';$('#panel').hidden=true;$('#panelBackdrop').hidden=true;focusBefore?.focus?.();sendState();}
function menu() {
 if(panelKind==='menu'){closePanel();return;}
 openPanel('menu');
 $('#panelBody').innerHTML=`<h2>十五个授课节点</h2><p class="cue-label">→ 下一步 · ← 返回 · P 教师台 · F 全屏<br>R 重播动作 · Shift + R 重新计时 · T 计时 · A 动作 · B 暂隐</p><div class="options"><button data-option="motion">${reduced?'恢复完整动画':'简静动画'}</button><button data-option="contrast" aria-pressed="${highContrast}">投影增强</button><button data-option="restart">重新开始</button></div><div class="node-menu">${nodes.map((n,i)=>`<button class="${i===currentNodeIndex()?'current':''}" data-jump="${nodeFirst(n)}"><span>${String(i+1).padStart(2,'0')}</span><strong>${E(n.title)}</strong><small>${E(n.timing||'')}</small></button>`).join('')}</div><details class="cue-directory"><summary>查看 ${C.length} 个精细节拍</summary>${C.map((c,i)=>`<button class="${i===index?'current':''}" data-jump="${i}">${String(i).padStart(2,'0')}　${E(c.title)}<small>${E(c.timing)}</small></button>`).join('')}</details>`;
}
function evidence(key) {
 if(key==='pair'){
  openPanel('evidence');$('#panel').classList.add('evidence-pair-panel');
  $('#panelBody').innerHTML=`<p class="cue-label">回到两段文字 · Esc 返回</p><h2>两段文字，分别说了什么？</h2><div class="pair"><div><h3>受伤之后</h3>${quotation('hurt',[],'panel-')}</div><div><h3>外祖母的爱</h3>${quotation('warmth',[],'panel-')}</div></div>`;return;
 }
 if(!L.passages[key])return;
 openPanel('evidence');$('#panel').classList.remove('evidence-pair-panel');
 const answerKnown=index>=C.findIndex(c=>c.id==='again-answer');
 $('#panelBody').innerHTML=`<p class="cue-label">回读 · Esc 返回，活动计时继续</p><h2>${E(passageNames[key]||'回到原文')}</h2>${quotation(key,[],'panel-')}${key==='protect'&&answerKnown?`<h3>保护以后的问答</h3>${quotation('again',[],'panel-')}`:''}`;
}
async function full() {try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.body.classList.toggle('focus-mode');toast('浏览器未开放页面全屏；可用 F11 进入浏览器全屏。');}controls();}
function presenterState() {
 const c=C[index],n=C[index+1],s=clocks.get(c.id),ni=currentNodeIndex();
 return {index,count:C.length,cue:c,next:n||null,nodeIndex:ni,nodes,clock:timerNow(),clockRunning:!!s?.running,elapsed:elapsedNow(),duration:L.duration,
  reduced,highContrast,rightClick,animationPaused,moving:hasMotion(),blackout,panel:panelKind,version:L.version,
  nextPassage:n?.passage?L.passages[n.passage]:null,nextPicture:n?.media?picture[n.media]:null};
}
function sendState() {if(!presenter||presenter.closed)return;try{presenter.postMessage({protocol:PROTOCOL,session,type:'state',state:presenterState()},origin);}catch{}}
function openPresenter() {
 const name='line-story-presenter-'+session;
 if(presenter&&!presenter.closed){presenter.focus();sendState();return;}
 const url=new URL('presenter.html',location.href);url.hash='';url.search='?session='+encodeURIComponent(session);
 presenter=window.open(url.href,name,'popup,width=1180,height=840,resizable=yes,scrollbars=yes');
 if(!presenter){toast('请允许本页弹出教师台窗口，然后再按 P');return;}
 presenter.focus();sendState();
}
function validMessage(e) {
 if(e.data?.protocol!==PROTOCOL || e.data?.session!==session)return false;
 if(location.protocol==='file:'?e.origin!=='null':e.origin!==location.origin)return false;
 if(e.source===presenter)return true;
 // A student-page reload drops the WindowProxy reference while the teacher's
 // window and session survive. Rebind its first authenticated command too;
 // requiring a later heartbeat would silently discard an immediate click.
 if((e.data.type==='ready'||e.data.type==='command') && (!presenter||presenter.closed)) {
  try { if(e.source && e.source.opener===window){presenter=e.source;return true;} } catch {}
 }
 return false;
}
addEventListener('message',e=>{
 if(!validMessage(e))return;const d=e.data;if(d.type==='ready'){sendState();return;}if(d.type!=='command')return;
 const cmd=d.command;
 if(cmd==='next')next();else if(cmd==='prev')prev();else if(cmd==='jump')jump(d.index);
 else if(cmd==='previous-node')nodeJump(-1);else if(cmd==='next-node')nodeJump(1);
 else if(cmd==='replay')replay();else if(cmd==='reset-timer')resetTimer();else if(cmd==='timer')toggleTimer();
 else if(cmd==='motion')toggleMotion();else if(cmd==='blank')toggleBlackout();else if(cmd==='finish')finishMotion();
 else if(cmd==='reduced'){reduced=!reduced;applyOptions();go(index,{instant:true,mode:'restore'});}
 else if(cmd==='contrast'){highContrast=!highContrast;applyOptions();persist();}
 else if(cmd==='right-click'){rightClick=!rightClick;persist();}
 else if(cmd==='restart')restart();sendState();
});
$('#next').addEventListener('click',()=>{next();controls();});$('#prev').addEventListener('click',()=>{prev();controls();});
$('#fullBtn').addEventListener('click',full);$('#notesBtn').addEventListener('click',openPresenter);$('#menuBtn').addEventListener('click',menu);
$('#closePanel').addEventListener('click',closePanel);$('#panelBackdrop').addEventListener('click',closePanel);
$('#content').addEventListener('click',e=>{
 const t=e.target.closest('[data-evidence],[data-word],[data-arrow]');if(!t)return;
 if(t.dataset.evidence){evidence(t.dataset.evidence);return;}
 if(t.dataset.word){const key=t.closest('[data-passage]').dataset.passage,s=marks.get(key)||new Set();s.has(t.dataset.word)?s.delete(t.dataset.word):s.add(t.dataset.word);marks.set(key,s);t.classList.toggle('emph',s.has(t.dataset.word));t.setAttribute('aria-pressed',s.has(t.dataset.word));persist();return;}
 if(t.dataset.arrow!==undefined){const pick=logicChoices(C[index]);pick[Number(t.dataset.arrow)]=!pick[Number(t.dataset.arrow)];choices.set('grandfather-reasoning',pick);t.classList.toggle('cut',pick[Number(t.dataset.arrow)]);t.setAttribute('aria-pressed',pick[Number(t.dataset.arrow)]);persist();}
});
$('#panelBody').addEventListener('click',e=>{
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.jump!==undefined){jump(Number(t.dataset.jump));return;}
 if(t.dataset.option==='motion'){reduced=!reduced;applyOptions();closePanel();go(index,{instant:true,mode:'restore'});}
 if(t.dataset.option==='contrast'){highContrast=!highContrast;applyOptions();t.setAttribute('aria-pressed',highContrast);persist();sendState();}
 if(t.dataset.option==='restart')restart();
});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Tab' && panelKind){const els=[...$('#panel').querySelectorAll('button,summary,[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){last?.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first?.focus();e.preventDefault();}return;}
 if(e.key==='Escape'){if(blackout){e.preventDefault();toggleBlackout();}else if(panelKind){e.preventDefault();closePanel();}return;}
 if((e.key==='Enter'||e.key===' ') && e.target.closest('button,summary,[data-word]')){if(e.target.matches('[data-word]')){e.preventDefault();e.target.click();}return;}
 const k=e.key.toLowerCase();if(e.repeat)return;
 if(!['arrowright','pagedown',' ','arrowleft','pageup','f','m','n','p','t','r','a','b','[',']','home','end'].includes(k))return;e.preventDefault();
 if(k==='p'||k==='n'){openPresenter();return;}if(k==='b'){toggleBlackout();return;}if(blackout)return;
 if(k==='f'){full();return;}if(k==='m'){menu();return;}if(panelKind)return;
 if(['arrowright','pagedown',' '].includes(k))next();else if(['arrowleft','pageup'].includes(k))prev();
 else if(k==='t')toggleTimer();else if(k==='r')e.shiftKey?resetTimer():replay();else if(k==='a')toggleMotion();
 else if(k==='[')nodeJump(-1);else if(k===']')nodeJump(1);else if(k==='home')jump(0);else if(k==='end')jump(C.length-1);
});
$('#viewport').addEventListener('pointermove',e=>{if(e.clientY>innerHeight-100)controls();});
// Blank clicks deliberately do nothing. Right-click navigation is an explicit presenter setting.
document.addEventListener('contextmenu',e=>{if(rightClick&&!panelKind&&!blackout&&(document.fullscreenElement||document.body.classList.contains('focus-mode'))){e.preventDefault();next();}});
addEventListener('resize',size);addEventListener('hashchange',()=>{const n=C.findIndex(c=>c.id===cueHash());if(n>=0)go(n,{instant:true,fromHash:true,mode:'restore'});});
addEventListener('pagehide',()=>{persist();pauseClock();pauseLesson();});
restore();window.LineWorld.setup($('#world'));size();applyOptions();go(index,{instant:true,mode:'restore'});controls();
Object.values(picture).forEach(p=>{const img=new Image();img.src=p.file;});
setInterval(()=>{if(performance.now()-lastPersist>1500)persist();sendState();},250);
Object.defineProperty(window,'lineStoryState',{get:()=>({index,id:C[index].id,count:C.length,timer:timerNow(),timerRunning:!!clocks.get(C[index].id)?.running,panel:panelKind,reduced,rightClick,highContrast,moving:hasMotion(),animating:hasMotion(),animationPaused,paused:animationPaused,blackout,nodeIndex:currentNodeIndex(),nodeId:nodes[currentNodeIndex()]?.id,presenterConnected:!!presenter&&!presenter.closed})});
})();
