/* Teacher-driven, deterministic cue engine. No server, dependencies or text input. */
(function(){
'use strict';
const L=window.LINE_LESSON, C=L.cues;
const $=s=>document.querySelector(s), E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let index=0, panelKind='', focusBefore=null, uiTimeout=0, toastTimeout=0, lastKey=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, pending=[], timerInterval=null;
const clocks=new Map(), marks=new Map(), choices=new Map();
const picture={haulers:{file:'assets/haulers.jpg',alt:'列宾《伏尔加河上的纤夫》原画'},yamen:{file:'assets/yamen.webp',alt:'报道中的亚门与父亲'},varvara:{file:'assets/varvara.webp',alt:'报道中的瓦尔瓦拉与母亲'}};
const passageNames={hurt:'受伤之后',warmth:'外祖母的爱',protect:'伸出来的胳膊',again:'保护以后的问答',anne:'安妮的愿望',window:'与表哥一起坐在窗前',grandfather:'外祖父的经历与解释',author:'作者的回望'};
function paragraphs(a,cls=''){return `<div class="${cls}">${a.map(t=>`<p>${E(t)}</p>`).join('')}</div>`;}
function quotation(key,emphasis=[],canMark=true){
 const markSet=marks.get(key)||new Set();
 return `<div class="quote" data-passage="${E(key)}">${L.passages[key].map(p=>{
  let s=E(p);
  for(const w of emphasis){ const esc=E(w);s=s.split(esc).join(`<em class="markable ${markSet.has(w)?'emph':''}" data-word="${esc}" tabindex="0" role="button" aria-label="标记${esc}">${esc}</em>`); }
  return `<p>${s}</p>`;
 }).join('')}</div>`;
}
function lines(c){return paragraphs(c.body,'body-lines');}
function renderContent(c){
 const title=`<h1>${E(c.heading)}</h1>`;
 if(c.kind==='art')return '<article aria-label="原画观察"></article>';
 if(c.kind==='cover')return `<article class="cover-layout"><div class="eyebrow">六年级 · 阅读与思考</div>${title}${lines(c)}<p class="start-hint">按 → 或空格开始 · F 全屏 · M 目录</p></article>`;
 if(c.kind==='pair')return `<article><h2>${E(c.heading)}</h2><div class="pair"><div><h3>${E(c.leftTitle)}</h3>${quotation(c.left)}</div><div><h3>${E(c.rightTitle)}</h3>${quotation(c.right)}</div></div></article>`;
 if(c.kind==='reading')return `<article class="reading-layout ${c.density||''} ${c.id==='anne-reading'?'anne-reading':''}"><h2>${E(c.heading)}</h2>${quotation(c.passage,c.emphasis||[])}</article>`;
 if(c.kind==='repair')return `<article class="repair-layout"><h2>${E(c.heading)}</h2><div class="repair-grid">${quotation(c.passage,c.passage==='hurt_game'?['不安','撕掉','难以忍受']:['挡着你','少挨了几下','为了爱'])}<div class="repair-card"><p class="card-text">${E(c.body[0])}</p><p class="card-prompt">${E(c.body[1])}</p></div></div></article>`;
 if(c.kind==='contrast')return `<article class="contrast-layout"><h2>${E(c.heading)}</h2>${paragraphs(c.body,'quote')}</article>`;
 if(c.kind==='rules')return `<article class="rules-layout">${title}<div class="rule-words">${c.body.map((t,i)=>`<div><small>0${i+1}</small><p>${E(t)}</p></div>`).join('')}</div></article>`;
 if(c.kind==='logic'){
  const cut=c.state==='cut';const first=choices.get(c.id)||false;
  const row=c.body.map((t,i)=>`<p class="node-label">${E(t)}</p>${i<2?`<button class="arrow-button ${i===1&&cut||i===0&&first?'cut':''}" data-arrow="${i}" aria-label="检验第${i+1}条箭头">→</button>`:''}`).join('');
  return `<article class="logic-layout">${title}<div class="logic-row">${row}</div>${c.passage?quotation(c.passage):''}</article>`;
 }
 if(c.kind==='group')return `<article class="group-layout"><h2>${E(c.heading)}</h2><div class="evidence-grid"><div class="evidence"><h3>《童年》</h3><p>“可是你总算少挨了几下”</p><p>“当然要打啦！说不定要常常收拾你的……”</p><button data-evidence="protect">展开保护的原文</button>　<button data-evidence="warmth">外祖母</button>　<button data-evidence="window">窗边</button></div><div class="evidence"><h3>安妮的愿望</h3><p>${E(L.passages.anne[0])}</p><p>帮助者送来生活必需品；迫害仍使出门危险。</p><button data-evidence="anne">展开愿望</button></div></div>${lines(c)}<p class="group-steps">人人表达 → 两份证据 → 提出质疑 → 写成主张</p></article>`;
 return `<article class="${c.kind}-layout">${title}${lines(c)}</article>`;
}
function animate(el,frames,opts){if(reduced){return null;}const a=el.animate(frames,opts);pending.push(a);return a;}
function showMedia(c,instant){
 const host=$('#media'),type=c.media,old=host.firstElementChild;
 if(type){
  if(old&&old.dataset.key===type){old.classList.toggle('detail',!!c.detail);return;}
  host.innerHTML='';const f=document.createElement('div');f.className='media-frame '+(type==='haulers'?'art':'photo');f.dataset.key=type;
  const img=new Image();img.alt=picture[type].alt;img.src=picture[type].file;img.draggable=false;
  img.addEventListener('error',()=>{f.innerHTML=`<div class="media-fallback">图片暂未读取<br>请保留 assets 文件夹后重新打开。<br>${E(picture[type].alt)}</div>`;},{once:true});f.append(img);host.append(f);
  if(c.detail)f.classList.add('detail');
  if(!instant)animate(f,[{opacity:0,transform:'translate(0,140px) scale(.8)'},{opacity:1,transform:'none'}],{duration:1000,easing:'cubic-bezier(.2,.8,.2,1)'});
  host.setAttribute('aria-hidden','false');
 }else if(c.closeMedia){
  if(!old){host.innerHTML='';return;}
  old.classList.add('closing');host.setAttribute('aria-hidden','true');
  if(instant||reduced){host.innerHTML='';return;}
  const a=animate(old,[{opacity:1,transform:'none'},{opacity:0,transform:'translate(0,320px) scale(.07)'}],{duration:1100,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'});
  if(a)a.onfinish=()=>{if(old.isConnected)old.remove();};
 }else{host.innerHTML='';host.setAttribute('aria-hidden','true');}
}
function timerNow(){const s=clocks.get(C[index].id);if(!s)return 0;return Math.max(0,s.left-(s.running?(performance.now()-s.since)/1000:0));}
function pauseClock(){const c=C[index],s=clocks.get(c.id);if(s&&s.running){s.left=timerNow();s.running=false;}clearInterval(timerInterval);timerInterval=null;}
function displayTimer(){const c=C[index];if(!c.timer){$('#timer').hidden=true;return;}const s=clocks.get(c.id),left=timerNow(),v=Math.ceil(left);$('#timer').hidden=false;$('#timer').innerHTML=`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}<small>${left<=0?'可以继续 · 等待教师':s&&!s.running?'已暂停':'安静读写'}</small>`;if(s&&left<=0){s.left=0;s.running=false;clearInterval(timerInterval);timerInterval=null;}}
function startClock(c){if(!c.timer){$('#timer').hidden=true;return;}let s=clocks.get(c.id);if(!s){s={left:c.timer,running:true,since:performance.now()};clocks.set(c.id,s);}else if(s.left>0){s.running=true;s.since=performance.now();}displayTimer();clearInterval(timerInterval);timerInterval=setInterval(displayTimer,200);}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('on');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('on'),2200);}
function controls(){document.body.classList.add('show-controls');clearTimeout(uiTimeout);uiTimeout=setTimeout(()=>document.body.classList.remove('show-controls'),2600);}
function cueHash(){try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}}
function go(n,{instant=false,fromHash=false}={}){
 if(n<0||n>=C.length)return;
 pauseClock();pending.forEach(a=>a.cancel());pending=[];const old=C[index];index=n;const c=C[index];
 document.body.classList.toggle('art-state',c.kind==='art');document.body.classList.toggle('reading-state',['reading','pair','repair','group'].includes(c.kind));document.body.classList.toggle('photo-state',c.kind==='photo');document.body.dataset.cue=c.id;
 window.LineWorld.set(c,old,reduced,instant);
 const content=$('#content');content.innerHTML=renderContent(c);$('#chapter').textContent=c.section;
 if(!instant&&c.kind!=='art')animate(content,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:650,delay:c.id==='final-day'?4000:(old.zone===c.zone?100:400),fill:'backwards',easing:'ease-out'});
 showMedia(c,instant);$('#meter span').style.width=`${index/(C.length-1)*100}%`;$('#position').textContent=`${String(index+1).padStart(2,'0')} / ${C.length}`;
 $('#prev').disabled=index===0;$('#next').disabled=index===C.length-1;$('#next').innerHTML=index===C.length-1?'已到结语':'下一页 <span>→</span>';
 document.title=c.title+' · 童年线条叙事';$('#stage').scrollTop=0;
 if(!fromHash){try{history.replaceState(null,'','#'+c.id);}catch{}}
 startClock(c);if(panelKind==='notes')fillNotes();
}
function next(){if(panelKind){closePanel();return;}go(index+1);}
function prev(){if(panelKind){closePanel();return;}go(index-1);}
function replay(){pauseClock();clocks.delete(C[index].id);window.LineWorld.reset(C[index]);go(index);toast('本节拍已重播；计时重新开始');}
function size(){const w=innerWidth,h=innerHeight;document.documentElement.style.setProperty('--scale',Math.min(w/1600,h/900));}
function openPanel(kind){focusBefore=document.activeElement;panelKind=kind;$('#panel').hidden=false;$('#panelBackdrop').hidden=false;$('#closePanel').focus();controls();}
function closePanel(){panelKind='';$('#panel').hidden=true;$('#panelBackdrop').hidden=true;focusBefore?.focus?.();}
function fillNotes(){const c=C[index];$('#panelBody').innerHTML=`<p class="cue-label">节拍 ${String(c.number).padStart(2,'0')} · ${E(c.timing)} · ${E(c.id)}</p><h2>${E(c.title)}</h2><h3>教师说</h3><p>${E(c.teacher||'保持安静，让学生独立读写或讨论。')}</p><h3>画面与推进</h3><p>${E(c.action)}</p><h3>停留安排</h3><p>${E(c.hold||'旁白与动画同步；完成后推进。')}</p>${c.reply?`<h3>按需承接</h3><p>${E(c.reply)}</p>`:''}<h3>下一步</h3><p>${E(c.next)}</p>`;}
function notes(){if(panelKind==='notes'){closePanel();return;}openPanel('notes');fillNotes();}
function menu(){if(panelKind==='menu'){closePanel();return;}openPanel('menu');let last='';let html=`<h2>课堂目录</h2><p class="cue-label">→ / 空格 / PageDown 推进 · ← / PageUp 返回<br>F 全屏 · T 计时暂停 · R 重演本节拍 · Esc 关闭</p><div class="options"><button data-option="motion">${reduced?'恢复完整动画':'简静动画'}</button><button data-option="contrast">投影增强</button><button data-option="restart">从头开始</button></div>`;
 C.forEach((c,i)=>{if(c.section!==last){if(last)html+='</div>';html+=`<div class="menu-section"><h3>${E(c.section)}</h3>`;last=c.section;}html+=`<button class="${i===index?'current':''}" data-jump="${i}">${String(i).padStart(2,'0')}　${E(c.title)}　<small>${E(c.timing)}</small></button>`;});html+='</div>';
 $('#panelBody').innerHTML=html;
}
function evidence(key){openPanel('evidence');$('#panelBody').innerHTML=`<p class="cue-label">回读 · 按 Esc 返回，计时继续</p><h2>${E(passageNames[key]||'回到原文')}</h2>${quotation(key)}${key==='protect'?`<h3>后半问答</h3>${quotation('again')}`:''}${key==='window'?'<h3>教师提示</h3><p>这里的同伴是米哈伊尔舅舅的儿子萨沙。两块文字为独立摘录，中间有省略。第2章，用户所供PDF第31页。</p>':''}`;}
async function full(){try{if(document.fullscreenElement){await document.exitFullscreen();}else{await document.documentElement.requestFullscreen();}}catch{document.body.classList.toggle('focus-mode');toast('浏览器未开放页面全屏；可用 F11 进入浏览器全屏。');}controls();}
function toggleTimer(){const c=C[index];if(!c.timer){toast('当前节拍没有独立计时');return;}const s=clocks.get(c.id);if(s.running){pauseClock();displayTimer();}else if(s.left>0){startClock(c);}else toast('计时已结束；R 可以重置本节拍');}
$('#next').addEventListener('click',()=>{next();controls();});$('#prev').addEventListener('click',()=>{prev();controls();});$('#fullBtn').addEventListener('click',full);$('#notesBtn').addEventListener('click',notes);$('#menuBtn').addEventListener('click',menu);$('#closePanel').addEventListener('click',closePanel);$('#panelBackdrop').addEventListener('click',closePanel);
$('#content').addEventListener('click',e=>{
 const t=e.target.closest('[data-evidence],[data-word],[data-arrow]');if(!t)return;
 if(t.dataset.evidence){evidence(t.dataset.evidence);return;}
 if(t.dataset.word){const key=t.closest('[data-passage]').dataset.passage;const s=marks.get(key)||new Set();s.has(t.dataset.word)?s.delete(t.dataset.word):s.add(t.dataset.word);marks.set(key,s);t.classList.toggle('emph',s.has(t.dataset.word));return;}
 if(t.dataset.arrow){t.classList.toggle('cut');if(t.dataset.arrow==='0')choices.set(C[index].id,t.classList.contains('cut'));}
});
$('#panelBody').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.jump!==undefined){closePanel();go(Number(t.dataset.jump),{instant:true});return;}if(t.dataset.option==='motion'){reduced=!reduced;document.body.classList.toggle('reduced',reduced);closePanel();go(index,{instant:true});return;}if(t.dataset.option==='contrast'){document.body.classList.toggle('high-contrast');return;}if(t.dataset.option==='restart'){closePanel();pauseClock();clocks.clear();marks.clear();choices.clear();go(0,{instant:true});}});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Tab'&&panelKind){const els=[...$('#panel').querySelectorAll('button,[tabindex="0"]')].filter(x=>!x.disabled);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}return;}
 if(e.key==='Escape'){if(panelKind){closePanel();e.preventDefault();}return;}
 // Buttons keep normal keyboard activation; navigation keys are global only outside panels.
 if((e.key==='Enter'||e.key===' ')&&e.target.closest('button,[data-word]')){
  if(e.target.matches('[data-word]')){e.preventDefault();e.target.click();}return;
 }
 const k=e.key.toLowerCase();if(e.repeat)return;
 if(['arrowright','pagedown',' ','arrowleft','pageup','f','m','n','t','r','home','end'].includes(k))e.preventDefault();else return;
 if(['arrowright','pagedown',' ','arrowleft','pageup'].includes(k)){if(performance.now()-lastKey<160)return;lastKey=performance.now();}
 if(k==='f')return void full();if(k==='m')return menu();if(k==='n')return notes();if(panelKind)return;
 if(['arrowright','pagedown',' '].includes(k))next();else if(['arrowleft','pageup'].includes(k))prev();else if(k==='t')toggleTimer();else if(k==='r')replay();else if(k==='home')go(0,{instant:true});else if(k==='end')go(C.length-1,{instant:true});
});
$('#viewport').addEventListener('pointermove',e=>{if(e.clientY>innerHeight-100)controls();});
$('#stage').addEventListener('click',e=>{if(!document.fullscreenElement&&!document.body.classList.contains('focus-mode'))return;if(e.target.closest('button,[data-word],#panel')||panelKind||String(getSelection()).length)return;next();});
document.addEventListener('contextmenu',e=>{if((document.fullscreenElement||document.body.classList.contains('focus-mode'))&&!panelKind){e.preventDefault();next();}});
addEventListener('resize',size);addEventListener('hashchange',()=>{const n=C.findIndex(c=>c.id===cueHash());if(n>=0)go(n,{instant:true,fromHash:true});});
// Preload only the three approved originals; no network requests leave the package.
Object.values(picture).forEach(p=>{const img=new Image();img.src=p.file;});
window.LineWorld.setup($('#world'));size();document.body.classList.toggle('reduced',reduced);const initial=C.findIndex(c=>c.id===cueHash());go(initial>=0?initial:0,{instant:true});controls();
// Read-only inspection surface for reproducible tests and cue/Word synchronization.
Object.defineProperty(window,'lineStoryState',{get:()=>({index,id:C[index].id,count:C.length,timer:timerNow(),panel:panelKind,reduced})});
})();
