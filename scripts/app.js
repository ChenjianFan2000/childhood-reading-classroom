(function(){
'use strict';
const A=window.LESSON_ASSETS,S=window.LESSON_SCENES,M=window.LESSON_TEXT,N=window.LESSON_NARRATION,SOURCES=window.LESSON_SOURCES,FLOW=window.StoryFlow,READING=window.LESSON_READING;
const stage=document.getElementById('stage'),root=document.getElementById('sceneRoot'),panel=document.getElementById('panel'),panelBody=document.getElementById('panelBody'),panelTitle=document.getElementById('panelTitle'),controls=document.getElementById('controls');
let shot=null,scene=null,background=null,shade=null,ambience=null,transitioning=false;
let cameraAnimations=[],pointerStart=null,pointerDragged=false;
let cueStep=0,cueBusy=false,cueAnimations=[],cueToken=0,cueTimeout=null,cueResolve=null;
const fullscreenMedia=matchMedia('(display-mode: fullscreen)');
const mem={marks:{},records:{},cuts:{},index:0};
let index=0,hideControls=0,toastTimer=0,soundEnabled=false,audioContext=null,timerInterval=null,timerRemaining=0,timerDefault=0,timerRunning=false;
const timerValues={initial:35,parallel:120,grandfather:60,r1read:20,r1recall:20,r1repair:30,r2read:20,r2recall:8,r2repair:30,r3read:30,r3recall:10,r3repair:35,annecontext:50,annehelp:30,annewish:70,yamen:70,varvara:70,group:300,author:40,revise:30,exit:90};
const cinema=new Set(['cover','today','ordinary','window','arrival','bubbles','pressure','support','ending']);
const reading=new Set(['parallel','compare','grandfather','r1read','r2read','r3read','r1repair','r2repair','r3repair','group','author']);
const keys={A:['不安','撕掉','难以忍受','自己的或别人的','敏感'],B:['无私的爱','丰富了我','坚强的力量','应付困苦的生活'],C:['太过分了','受教训','欺辱','熬出头了'],D:['挡着你','少挨了几下','为了爱'],E:['连根儿拔掉','压扁','善良','光明的、人道的生活']};
const initialHash=location.hash.replace('#','');if(S.some(s=>s.id===initialHash))index=S.findIndex(s=>s.id===initialHash);
try{const saved=JSON.parse(localStorage.getItem('childhood-reading-state-v1')||'null');if(saved&&typeof saved==='object'){['marks','records','cuts'].forEach(k=>{if(saved[k]&&typeof saved[k]==='object')mem[k]=saved[k]});}}catch(e){}
const safe=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(name,cls,alt)=>'<img class="'+(cls||'')+'" src="'+A[name]+'" alt="'+safe(alt||'')+'" draggable="false">';
const hero=(pose,cls)=>'<div class="hero pose-'+pose+' '+(cls||'')+'" aria-hidden="true"></div>';
const p=t=>'<p class="fragment">'+t+'</p>';
function words(text,list){let re=new RegExp('('+list.slice().sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g');return text.split(re).map(t=>list.includes(t)?'<button class="word'+(marked(t)?' marked':'')+'" data-word="'+safe(t)+'" aria-pressed="'+marked(t)+'">'+safe(t)+'</button>':safe(t)).join('');}
function marked(t){return !!(mem.marks[S[index].id]||{})[t];}
function fragments(arr,list){return arr.map(t=>p(list?words(t,list):safe(t))).join('');}
function recordSlot(id,label){
 const done=mem.records[id]===true;
 return '<div class="record-slot'+(done?' is-recorded':'')+'" data-record="'+id+'" aria-label="'+safe(label)+(done?'，已留下笔迹':'，等待分享')+'"><span class="record-label">'+safe(label)+'</span><div class="record-writing" aria-hidden="true"><svg class="record-ink" viewBox="0 0 600 64" preserveAspectRatio="none"><path pathLength="1" d="M7 16q18-5 31 0l18-3 27 3 19-4 26 2 24-3 30 4 15-2 26 3 28-4 28 2 31-3 19 4 35-3 24 1 32-3 28 2 37-2 42 3 29-4 27 2"/><path pathLength="1" d="M9 35l25-2 25 4 34-3 30 1 19-3 32 4 33-2 29 2 24-4 20 3 35-2 31 2 24-4 28 3 30-1 25 2 19-3 35 1"/><path pathLength="1" d="M10 55q27-6 45-2l32-1 25 3 37-3 18 3 35-2 28 1 20-3 29 2 27-1 26 2"/></svg><span class="record-pencil">✎</span></div><span class="record-note">自己的表达已留下</span><svg class="record-seal" viewBox="0 0 48 48" aria-hidden="true"><path d="M40 14C31-2 7 4 5 23s19 28 32 15c7-7 8-15 3-24Z"/><path pathLength="1" d="m14 25 7 7 14-17"/></svg></div>';
}
function recordButton(step,label){return '<button class="cue-button" data-cue="'+step+'" data-label="'+safe(label)+'">'+safe(label)+' <span aria-hidden="true">↗</span></button>';}
function repairComplete(id){const cue=FLOW.stepsFor(id)[0];return !!cue&&cue.kind==='record'&&cue.recordIds.every(key=>mem.records[key]===true);}
function center(title,body,cls){return '<div class="paper center-paper '+(cls||'')+'"><h1 class="big-question">'+title+'</h1>'+(body||'')+'</div>';}
function question(title,hint){return '<div class="quiet-question"><h1>'+title+'</h1>'+(hint?'<div class="divider"></div><p class="hint">'+hint+'</p>':'')+'</div>';}
function setBg(name){background.style.backgroundImage='url("'+A[name]+'")';shot.dataset.place=name.split('.')[0];}
function save(){try{localStorage.setItem('childhood-reading-state-v1',JSON.stringify(mem));}catch(e){}}
function notify(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2000);}
function showControls(){controls.classList.add('show');clearTimeout(hideControls);hideControls=setTimeout(()=>controls.classList.remove('show'),2800);}
function beep(type){if(!soundEnabled)return;try{if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const t=audioContext.currentTime;const g=audioContext.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(type==='page'?.018:.03,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.45);g.connect(audioContext.destination);const o=audioContext.createOscillator();o.type='sine';o.frequency.setValueAtTime(type==='page'?330:523.25,t);o.frequency.exponentialRampToValueAtTime(type==='page'?200:659.25,t+.4);o.connect(g);o.start(t);o.stop(t+.5);}catch(e){}}
function bookPair(compare){const a0='外祖父把我打得失去了知觉，接着我病了一场。';const a1=M.A.blocks[0];return '<div class="paper main-paper book-reading"><div class="quote-grid"><article class="quote-column"><h2>受伤之后</h2><p class="context-line">'+a0+'</p>'+fragments([a1,M.A.blocks[1]],compare?keys.A:null)+'</article><article class="quote-column"><h2>外祖母给予的力量</h2>'+fragments(M.B.blocks,compare?keys.B:null)+'</article></div>'+(compare?'<div class="reading-footer"><div class="scale-row"><button class="soft-button" data-scale="伤害有多深">伤害有多深</button><button class="soft-button" data-scale="怎样看待别人">怎样看待别人</button><button class="soft-button" data-scale="怎样面对生活">怎样面对生活</button></div></div>':'<div class="reading-footer">圈出变化与感受，也留意让你犹豫的词。</div>')+'</div>';}
function repair(title,source,card,field,placeholder,extra){const id=S[index].id;return '<div class="paper repair-layout '+(repairComplete(id)?'is-complete ':'')+(extra||'')+'"><span class="bookmark" aria-hidden="true"></span><h1>'+title+'</h1><div class="repair-source">'+source+'</div><div class="repair-target"><p class="card-sentence">'+card+'</p>'+recordSlot(field,placeholder)+(extra?'<div class="warm-glow"></div><div class="protect-figure" aria-hidden="true"></div>':'')+'</div><div class="repair-bottom"><p class="hint">让修订回到具体的文字。</p>'+recordButton(1,'留下这次修订')+'</div></div>';}
function bike(){return '<svg viewBox="0 0 120 70"><g class="bike-wheel"><circle cx="25" cy="46" r="20"/><path d="M25 26v40M5 46h40"/></g><g class="bike-wheel"><circle cx="96" cy="46" r="20"/><path d="M96 26v40M76 46h40"/></g><path d="M25 46 47 17 64 46 25 46 43 11M64 46 86 17 47 17M82 10h12l4 36M38 10h14"/></svg>';}
function dance(){return '<svg viewBox="0 0 100 80"><circle cx="52" cy="13" r="7"/><path d="m48 22-9 20 20 8 9-13M43 29 23 20 15 9M46 28 70 23 84 11M51 49 31 65 18 64M57 49 69 69 86 71"/><path d="M9 46q-5-17 9-26M82 48q16-8 8-22" opacity=".4"/></svg>';}
function whistle(){return '<svg viewBox="0 0 120 75"><path d="M5 49q18-30 40-14t32-6 35-3M16 64q15-19 31-9t43-11M36 17q10-12 20-2t16-8"/></svg>';}
function evidenceButton(key,title,arr){return '<button class="evidence-bit" data-material="'+key+'"><h3>'+title+'</h3>'+arr.map(t=>'<p>'+safe(t)+'</p>').join('')+'</button>';}
function roomOrb(id,current){
 const first=id==='yamen',title=first?'回到学校':'灯亮着的夜晚';
 return '<button class="story-orb '+(first?'orb-one':'orb-two')+'" data-story-orb="'+id+'" '+(id===current?'data-cue="0"':'data-goto="'+id+'"')+' aria-label="打开'+(first?'亚门':'瓦尔瓦拉')+'的故事"><svg class="orb-symbol" viewBox="0 0 120 100" aria-hidden="true">'+(first?'<path d="M18 83V31l42-21 42 21v52M39 83V57h42v26M14 31h92M29 43h8m19 0h8m19 0h8M60 10V0"/>':'<path d="M39 84h42M47 84V43h26v41M60 43V30m0 0C39 13 58 4 60 0c2 10 21 22 0 30ZM22 15l6 7m69-6-7 8M7 51h13m81 0h12"/>')+'</svg><span>'+title+'</span><i aria-hidden="true"></i></button>';
}
function storyRoom(current){return '<div class="story-room">'+roomOrb('yamen',current)+roomOrb('varvara',current)+hero(4,'story-room-hero')+'<div class="room-window-glow" aria-hidden="true"></div></div>';}
function bubbleHTML(){return '<div class="story-exhibit is-introduction">'+storyRoom('')+'<p class="room-invitation">把这扇窗，再打开一点。</p></div>';}
function readingPages(id){
 const pages=READING.scenes[id].pages;
 return '<div class="reading-pages">'+pages.map((page,i)=>'<section class="reading-page" data-reading-page="'+i+'"'+(i?' hidden inert aria-hidden="true"':' aria-hidden="false"')+'><p class="reading-kind">'+safe(page.kind)+'</p><h1>'+safe(page.title)+'</h1><div class="reading-paragraphs">'+page.blocks.map(block=>{
  const text=block.interactive==='wishes'?words(block.text,M.anne.wishes):safe(block.text);
  return block.kind==='quote'?'<blockquote class="reading-quote'+(block.interactive?' wish-text':'')+'"><p>“'+text+'”</p>'+(block.speaker?'<span class="reading-speaker">'+safe(block.speaker)+'</span>':'')+'</blockquote>':'<p>'+text+'</p>';
 }).join('')+'</div>'+(page.illustration==='help'?'<div class="help-items reading-objects"><div class="help-item">'+window.StoryScenery.parcel('food')+'<span>食物</span></div><div class="help-item">'+window.StoryScenery.parcel('clothes')+'<span>衣物</span></div><div class="help-item">'+window.StoryScenery.parcel('books')+'<span>书报</span></div></div>':page.illustration==='wishes'?'<div class="wish-scenes"><div class="wish-picture" data-wish="骑车">'+bike()+'</div><div class="wish-picture" data-wish="跳舞">'+dance()+'</div><div class="wish-picture" data-wish="吹口哨">'+whistle()+'</div></div>':'')+(page.prompt?'<p class="reading-prompt">'+safe(page.prompt)+'</p>':'')+'</section>').join('')+'</div><nav class="reading-controls" aria-label="阅读段落"><button data-reading-previous aria-label="上一页阅读">← 上一页</button><span class="reading-position" aria-live="polite"></span><button data-reading-next>继续阅读 <span aria-hidden="true">→</span></button></nav>';
}
function anneReading(id){return '<article class="paper expanded-reading anne-reading">'+readingPages(id)+'</article>';}
function documentary(id){return '<div class="story-exhibit" data-story="'+id+'">'+storyRoom(id)+'<article class="material-sheet documentary reading-exhibit '+(id==='varvara'?'focus-right':'')+'"><div class="documentary-photo">'+img(id+'.webp','',id==='yamen'?'亚门和父亲':'瓦尔瓦拉和母亲')+'</div><div class="documentary-content">'+readingPages(id)+'</div></article><p class="material-return">这段讲述，留在了窗边。</p></div>';}
function pressureBubbles(){return '<div class="memory-constellation"><div class="memory-orb memory-novel"><svg viewBox="0 0 100 90" aria-hidden="true"><path d="M50 23Q29 9 10 18v58q20-8 40 5 20-13 40-5V18q-19-9-40 5ZM50 23v58M22 32l17 3m-17 10 17 3m22-13 17-3m-17 16 17-3"/></svg><span>阿廖沙的童年</span></div><div class="memory-orb memory-anne"><svg viewBox="0 0 100 90" aria-hidden="true"><path d="M20 77V15q30-17 60 0v62ZM50 6v71M20 39h60M12 78h76M30 65l12-14m15 12 12-8"/></svg><span>安妮的窗</span></div><div class="memory-orb memory-yamen">'+img('yamen.webp','','亚门与父亲')+'<span>回到学校</span></div><div class="memory-orb memory-varvara">'+img('varvara.webp','','瓦尔瓦拉与母亲')+'<span>灯亮着的夜晚</span></div><svg class="memory-thread" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M200 230Q170 420 450 530T800 695M1400 230q30 190-250 300T800 695M210 510q150 180 590 185M1390 510q-150 180-590 185"/></svg></div>';}
function hands(){return '<svg class="support-hands" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><g stroke="#765f47" stroke-width="3"><path fill="#405f57" d="M-40 810 130 355 194 374 90 900H-40Z"/><path fill="#d5aa7a" d="m130 355 10-58c3-23 17-26 22-10l2 24 10-49c3-16 17-13 15 3l-3 52 13-41c5-15 18-10 14 5l-10 44 14-29c7-14 19-7 12 7l-19 50-16 21Z"/><path fill="#796b91" d="m1640 840-172-480-63 15 108 525h127Z"/><path fill="#b18165" d="m1468 360-12-60c-4-21-18-22-22-7l-1 24-13-45c-5-15-18-10-15 5l7 48-16-35c-7-14-19-7-13 8l14 37-16-24c-9-12-20-3-10 10l22 37 12 17Z"/><path fill="#a68a52" d="m423 900 69-531 68 3 11 528Z"/><path fill="#e1bf94" d="m492 369-3-47c-2-18 11-23 17-7l8 21 1-64c0-17 15-18 17-1l5 59 6-56c2-18 16-15 16 2v58l8-36c4-16 18-13 15 4l-12 58-10 12Z"/><path fill="#658b80" d="m1020 900 35-514 71-9 81 523Z"/><path fill="#d7a680" d="m1055 386-9-50c-4-19 8-24 15-8l12 22-2-61c0-18 15-19 17-2l7 57 5-65c2-18 16-16 16 2v61l8-39c4-17 18-13 16 4l-8 57-6 13Z"/></g></svg>';}
function catchHand(){return '<svg class="catch-hand" viewBox="0 0 350 240" aria-hidden="true"><path fill="#577268" stroke="#344e43" stroke-width="3" d="M350 105 170 94l-12 83 192 63Z"/><path fill="#dfb98d" stroke="#9b7657" stroke-width="3" d="m173 97-47-22-58-2c-19 0-25 11-8 15l40 9-57 2c-19 1-21 14-2 17l56 4-54 5c-17 2-17 15 1 16l59 1-36 7c-16 4-10 16 4 15l66-3 23 16Z"/></svg>';}
function render(id){switch(id){
case 'cover':setBg('modern-lane.png','linear-gradient(90deg,#112f386e,#253b2310 80%)');return '<div class="intro-title"><p>高尔基《童年》阅读课</p><div class="thin-line"></div><h1>童年里，<br>什么值得被留下</h1><button class="enter-button" data-command="next">走进童年 <span>→</span></button></div>'+hero(2,'cover-hero');
case 'today':setBg('modern-lane.png');return '<div class="intro-word">我们的童年</div>';
case 'ordinary':setBg('modern-room.png');return '<div class="memory-note">快乐是真的，<br>烦恼也是真的。</div>'+hero(6,'ending-hero')+'<div class="pencil-sketch" aria-hidden="true"></div>';
case 'window':setBg('modern-room.png');return '<div class="window-sequence"><div class="portal-world"></div><div class="window-doors"><div class="window-pane left"></div><div class="window-pane right"></div></div>'+hero(3,'window-hero')+'</div>';
case 'arrival':setBg('old-room.png');return '<div class="arrival-caption">阿廖沙的世界</div><div class="book-object"><span>童年</span></div>';
case 'initial':setBg('old-room.png','#15211f50');return center('<span class="question-line">苦难和温暖，</span><span class="question-line">哪一个对阿廖沙的影响更大？</span>','<div class="divider"></div><p>如果看他________，<br>我暂时认为________。</p><p class="hint">暂时不能比较，也请留下理由。</p>');
case 'parallel':setBg('old-room.png','#17302858');return bookPair(false);
case 'compare':setBg('old-room.png','#17302858');return bookPair(true);
case 'haulers':setBg('old-room.png','#162420a0');return '<div class="art-sheet"><div class="art-actions"><button data-art="whole">看全画</button><button data-art="shoulders">看肩背</button><button data-art="rope">看纤绳</button>'+recordButton(1,'收起画作')+'</div><div class="picture-crop">'+img('haulers.jpg','hauler-image','伏尔加河上的纤夫')+'</div><div class="art-caption">伏尔加河上的纤夫</div></div><div class="art-return-note"><div class="folded-art" aria-hidden="true"></div><p>把目光接回他的讲述。</p><button class="cue-button" data-cue="0">再看这幅画 ↗</button></div>';
case 'grandfather':setBg('old-room.png','#17302870');return '<div class="paper main-paper"><h1>另一个受过苦的人</h1><div class="grandfather-grid"><article><h2>他经历过什么？</h2>'+fragments([M.C.blocks[2],M.C.blocks[3],M.C.blocks[4]],keys.C)+'</article><article><h2>他怎样解释？</h2>'+fragments([M.C.blocks[0],M.C.blocks[1]],keys.C)+'<div class="divider"></div><p class="hint">他的经历，能证明他的解释吗？</p></article></div></div>';
case 'turnone':setBg('old-room.png','#0b22219c');return question('如果受过苦，<br>就<strong>一定</strong>更懂得善待别人，<br>为什么外祖父记得自己的痛，<br>却仍把同样的痛给了孩子？');
case 'rules':setBg('modern-room.png','#2e322961');return '<div class="paper main-paper"><h1>阅读卡修复挑战</h1><div class="rules-grid"><div class="rule-card"><span class="line-icon">补</span><h2>补回失踪的词</h2></div><div class="rule-card"><span class="line-icon">断</span><h2>检验一条箭头</h2></div><div class="rule-card"><span class="line-icon">赞</span><h2>把赞美写准确</h2></div></div><p class="rules-flow">读原文 → 暂时隐去 → 回看 → 修订</p><p class="hint" style="text-align:center">每人独立留下证据，全班共同完成。</p></div>';
case 'r1read':setBg('old-room.png','#182c265e');return '<div class="paper single-reading"><h1>补回失踪的词</h1>'+fragments([M.A.game_excerpt])+'</div>';
case 'r1recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下你最想保留的一个词。</h1><div class="recall-line"></div><p class="hint">稍后回到原文，还可以补充与修改。</p></div>';
case 'r1repair':setBg('old-room.png','#182c265e');return repair('让这句话更完整',fragments([M.A.game_excerpt],keys.A),'挨打后，阿廖沙变得更敏感了。','r1supplement','我补上……');
case 'r2read':setBg('old-room.png','#182c265e');return '<div class="paper main-paper"><h1>再读一读他的解释</h1>'+fragments(M.C.short_blocks)+'</div>';
case 'r2recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下他的一条解释。</h1><div class="recall-line"></div></div>';
case 'r2repair':setBg('old-room.png','#182c265e');return '<div class="paper repair-layout '+(repairComplete(id)?'is-complete':'')+'"><span class="bookmark"></span><h1>剪断不成立的箭头</h1><div class="repair-source r2-source-grid">'+fragments(M.C.short_blocks,keys.C)+'</div><div class="cause-line"><div class="cause-node">我受过欺辱</div><button class="cause-arrow '+(mem.cuts.one?'cut':'')+'" data-arrow="one" aria-label="检验第一条箭头" aria-pressed="'+!!mem.cuts.one+'">→</button><div class="cause-node">我后来<br>熬出了头</div><button class="cause-arrow '+(mem.cuts.two?'cut':'')+'" data-arrow="two" aria-label="检验第二条箭头" aria-pressed="'+!!mem.cuts.two+'">→</button><div class="cause-node">亲人打孩子<br>就是教育</div></div>'+recordSlot('r2reason','这条联系不能成立，因为……')+'<div class="repair-bottom"><p class="hint">经历仍然在，联系需要检验。</p>'+recordButton(1,'留下检验的理由')+'</div></div>';
case 'r3read':setBg('old-room.png','#182c265e');return '<div class="paper main-paper"><h1>读懂保护的动作</h1>'+fragments(M.D.blocks)+'<div class="reading-footer">他做了什么？为了谁？为了什么？</div></div>';
case 'r3recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下一个动作。</h1><div class="recall-line"></div></div>';
case 'r3repair':setBg('old-room.png','#182c265e');return repair('把赞美写准确',fragments(M.D.short_blocks,keys.D),'小茨冈受伤了。','r3praise','我赞美他……因为……','protect-layout');
case 'again':setBg('old-room.png','#102b2a72');return '<div class="continuing-protection" aria-hidden="true"></div><div class="continuing-glow" aria-hidden="true"></div><div class="paper dialogue-paper"><p class="fragment">“下次再打你，记住，你别抱紧身子缩作一团，你懂吗？”</p><div class="divider"></div><p class="dialogue"><small>阿廖沙问</small>“还会打我吗？”</p></div>';
case 'againanswer':setBg('old-room.png','#102b2a72');return '<div class="continuing-protection" aria-hidden="true"></div><div class="continuing-glow" aria-hidden="true"></div><div class="paper dialogue-paper"><p class="dialogue"><small>阿廖沙问</small>“还会打我吗？”</p><p class="dialogue"><small>小茨冈平平静静地说</small>“当然要打啦！”</p><div class="divider"></div><p class="hint">有人替他挡过一次，是否等于他以后就安全了？</p></div>';
case 'annecontext':setBg('anne-room.png','#1426384a');return anneReading(id);
case 'annehelp':setBg('anne-room.png','#1426384a');return anneReading(id);
case 'annewish':setBg('anne-room.png','#1426384a');return anneReading(id);
case 'annetwist':setBg('anne-room.png','#0c243286');return question('有人爱她，也有人帮助她，<br>为什么她连骑车、吹口哨，<br>都只能写成愿望？','把已经得到的帮助，与仍然缺少的条件放在一起看。');
case 'group':setBg('modern-room.png','#23372c70');return '<div class="paper group-layout"><h1>幸福的童年，最不能缺少什么？</h1><div class="evidence-board"><div class="evidence-stack">'+evidenceButton('A','受伤之后',['“不安的心情”','“难以忍受的敏感”'])+evidenceButton('B','外祖母给予的力量',['“无私的爱丰富了我”','“坚强的力量以应付困苦的生活”'])+'</div><div class="evidence-stack">'+evidenceButton('C','外祖父的解释',['“我当时对你太过分了”','“挨自己亲人的打，这不算屈辱，是受教训”'])+evidenceButton('D','小茨冈的保护',['“少挨了几下”　“为了爱”','“还会打我吗？”“当然要打啦！”'])+'</div><div class="evidence-stack">'+evidenceButton('anne','安妮的愿望',['有人送来食物、衣物和书报，她仍无法自由出门。',M.anne.blocks[0]])+'</div></div><p class="group-prompt">我们认为最不能缺少________。<br>《童年》中________说明________；安妮的________说明________。<br>已有的善意值得珍惜，还需要________真正发生／不再发生。</p><p class="group-roles">两人分别查两份证据 · 一人质疑 · 一人记录并发言</p><div class="group-steps"><span>每人说一句</span><span>找两处证据</span><span>追问“足够了吗”</span><span>写约80字主张</span></div></div>';
case 'share':setBg('modern-room.png','#23372c70');return '<div class="paper main-paper sharing-paper"><h1>把一个条件，还原成孩子的一天</h1><div class="share-grid"><div class="share-card"><h2>这一组的主张</h2>'+recordSlot('groupOne','最想守住的是……')+recordSlot('evidenceOne','文字让我们看见……')+recordButton(1,'留下第一组发言')+'</div><div class="share-card"><h2>另一组的发现</h2>'+recordSlot('groupTwo','最想守住的是……')+recordSlot('evidenceTwo','文字让我们看见……')+recordButton(2,'留下第二组发现')+'</div></div><div class="daily-response" id="dailyResponse">'+recordSlot('concreteLife','这个词，在孩子的生活里是……')+recordButton(3,'把条件放进生活')+'</div></div>';
case 'author':setBg('old-room.png','#152b255f');return '<div class="paper main-paper"><h1>值得讲这些吗？</h1><div class="author-fragments"><article>'+fragments([M.E.blocks[1],M.E.blocks[2]],keys.E)+'</article><article>'+fragments([M.E.blocks[3]],keys.E)+'</article></div><p class="author-tail">'+words(M.E.blocks[4],keys.E)+'</p></div>';
case 'revise':setBg('old-room.png','#152b255f');return center('再看开头的判断','<div class="divider"></div><p>我保留________。<br>我补充或修改________。<br>依据是________。</p><p class="hint">可以改变立场，也可以把原来的理由说得更准确。</p>');
case 'bubbles':setBg('bubble-hall.png');return bubbleHTML();
case 'yamen':setBg('bubble-hall.png','#4d5e484b');return documentary('yamen');
case 'varvara':setBg('bubble-hall.png','#394e4f6b');return documentary('varvara');
case 'pressure':setBg('bubble-hall.png','#31444135');return '<div class="pressure-scene cue-pressure">'+pressureBubbles()+'<div class="pressure-shadow"></div><div class="beam descending-beam"></div><div class="pressure-words"><span>战争</span><span>课堂中断</span><span>恐惧</span></div>'+hero(5,'pressure-hero')+'<p class="gather-caption">不同的童年，来到同一个房间。</p><div class="pressure-question">什么正在压着孩子？</div></div>';
case 'daily':setBg('modern-room.png','#20393051');return center('把目光带回身边','<div class="divider"></div><p>被误解时，有人肯听他说完。<br>遇到困难时，能找到可信赖的大人。</p><p class="hint">你最想守住的条件，怎样成为一件日常的小事？</p>');
case 'exit':setBg('modern-room.png','#20393051');return '<div class="paper exit-paper"><h1>留下自己的三句话</h1><div class="exit-lines"><p class="exit-line">我认为，幸福童年最不能缺<span class="blank"></span>。</p><p class="exit-line">《童年》中<span class="blank"></span>，<br>让我看到<span class="blank"></span>。</p><p class="exit-line">在日常生活中，<br>它可以体现为<span class="blank"></span>。</p></div><p class="hint" style="text-align:center;margin-top:3vh">判断 · 原著证据 · 日常体现　　60—90字</p></div>';
case 'support':setBg('bubble-hall.png','#203b3b67');return '<div class="pressure-scene is-supported">'+pressureBubbles()+'<div class="pressure-shadow lifting-shadow"></div><div class="beam"></div>'+hands()+hero(7,'pressure-hero')+'<p class="support-caption">为孩子，撑开生活的空间。</p></div>';
case 'ending':setBg('modern-room.png','#14332623');return '<div class="ending-card"><h1>愿每个孩子的普通愿望，<br>都有机会成为普通的生活。</h1></div>'+hero(2,'ending-hero')+'<div class="pencil-sketch ending-pencil"></div>'+catchHand();
case 'homework':setBg('modern-room.png','#183d345a');return '<div class="paper homework-paper"><h1>把阅读继续下去</h1><p>再选一处支持或挑战今天判断的原文，<br>写一条100—150字的批注。</p><div class="divider"></div><p>这处文字使我保留／修改了________，<br>因为________。</p><p class="hint">未读完的同学，继续原来的阅读计划。</p></div>';
default:return '';
}}
function updateProtection(){if(S[index].id!=='r3repair')return;const el=scene.querySelector('.repair-layout');el.classList.toggle('has-protection',repairComplete('r3repair')||marked('挡着你')||marked('少挨了几下')||marked('为了爱'));el.classList.toggle('has-love',repairComplete('r3repair')||marked('为了爱'));}
function chapterFor(i){
 if(i<6)return '序章 · 走进童年';
 if(i<11)return '第一章 · 苦难与温暖';
 if(i<23)return '第二章 · 把文字读深';
 if(i<27)return '第三章 · 窗外的愿望';
 if(i<31)return '第四章 · 留下自己的判断';
 if(i<36)return '第五章 · 看见更多孩子';
 return '尾声 · 把光带回生活';
}
function reducedMotion(){return document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches;}
function makeShot(id){
 const el=document.createElement('div');el.className='shot';el.dataset.scene=id;
 el.dataset.layout=cinema.has(id)?'cinema':reading.has(id)?'reading':'page';
 el.innerHTML='<div class="scenic-background" aria-hidden="true"></div><div class="scene-wash" aria-hidden="true"></div><div class="scene-ambience" aria-hidden="true"></div><section class="scene-content" aria-label="课堂画面"></section>';
 return el;
}
function placeCamera(old, current, previousId, id, direction, replay){
 if(!old||reducedMotion()||replay){if(old){if(window.LearningMotion)window.LearningMotion.dispose(old);old.remove();}transitioning=false;return;}
 transitioning=true;old.inert=true;old.setAttribute('aria-hidden','true');old.classList.add('is-departing');
 const learning=window.LearningMotion?window.LearningMotion.transition({oldShot:old,newShot:current,previousId,id,direction,reducedMotion:reducedMotion()}):[];
 const samePlace=old.dataset.place===current.dataset.place;
 const isQuiet=!cinema.has(id)&&!cinema.has(previousId)&&samePlace;
 const focus=id==='yamen'||id==='varvara';
 const duration=Math.max(isQuiet?600:focus?1200:1100,learning.duration||0);
 const dx=direction<0?-1:1;
 old.style.transformOrigin=focus?(id==='yamen'?'29% 40%':'74% 40%'):'50% 48%';
 const outgoing=isQuiet?[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-dx*20)+'px)'}]:[{opacity:1,transform:'scale(1) translateX(0)'},{opacity:0,transform:'scale('+(focus?1.23:1.065)+') translateX('+(-dx*4)+'%)'}];
 const incoming=isQuiet?[{opacity:0,transform:'translateX('+(dx*24)+'px)'},{opacity:1,transform:'translateX(0)'}]:[{opacity:0,transform:'translateX('+(dx*(focus?2.5:5))+'%) scale('+(focus?.97:1.055)+')'},{opacity:1,transform:'translateX(0) scale(1)'}];
 // Let the ink clear before the next text arrives; the painted world keeps moving.
 cameraAnimations=[
  old.animate(outgoing,{duration,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}),
  current.animate(incoming,{duration,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}),
  old.querySelector('.scene-content').animate([{opacity:1},{opacity:0}],{duration:learning.semantic?300:isQuiet?180:260,easing:'ease-out',fill:'both'}),
  current.querySelector('.scene-content').animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{delay:learning.semantic?280:isQuiet?160:320,duration:isQuiet?420:620,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}),
  ...learning
 ];
 const active=cameraAnimations;
 Promise.all(active.map(a=>a.finished.catch(()=>{}))).then(()=>{if(window.LearningMotion)window.LearningMotion.dispose(old);old.remove();active.forEach(a=>a.cancel());if(cameraAnimations===active){cameraAnimations=[];transitioning=false;}});
}
function go(next,replay){
 if(next<0||next>=S.length||transitioning)return;
 clearCueMotion();if(panel.open)panel.close();
 const previousIndex=index,previousId=shot?S[index].id:null,old=shot;
 index=next;const id=S[index].id;mem.index=index;
 if(replay)FLOW.stepsFor(id).forEach(cue=>{(cue.recordIds||[]).forEach(key=>delete mem.records[key]);});
 cueStep=FLOW.resumeStep(id,mem.records);
 shot=makeShot(id);scene=shot.querySelector('.scene-content');background=shot.querySelector('.scenic-background');shade=shot.querySelector('.scene-wash');ambience=shot.querySelector('.scene-ambience');
 scene.innerHTML=render(id);
 if(window.StoryScenery)ambience.innerHTML=window.StoryScenery.render(id)+window.StoryScenery.decorate(id);
 root.appendChild(shot);stage.className='scene-'+id;stage.dataset.scene=id;
 stage.style.setProperty('--sprite','url("'+new URL(A['child-sprites.png'],document.baseURI).href+'")');stage.style.setProperty('--protectors','url("'+new URL(A['protectors.png'],document.baseURI).href+'")');stage.style.setProperty('--old-room','url("'+new URL(A['old-room.png'],document.baseURI).href+'")');
 document.getElementById('progress').firstElementChild.style.width=(index/(S.length-1)*100)+'%';
 document.getElementById('chapterLabel').textContent=chapterFor(index);
 document.getElementById('sceneLabel').textContent=index===0?'一段关于成长、善意与愿望的旅程':S[index].title;
 document.getElementById('sceneNumber').textContent=String(index+1).padStart(2,'0')+' / '+S.length;
 try{history.replaceState(null,'','#'+id);}catch(e){}
 document.title='童年里，什么值得被留下 · '+S[index].title;
 setTimer(timerValues[id]||0);applyCueState();
 if(window.LearningMotion)window.LearningMotion.enter({id,scene,shot,previousId,reducedMotion:reducedMotion()});
 placeCamera(old,shot,previousId,id,Math.sign(index-previousIndex)||1,replay);
 if(old&&!replay)beep('page');save();
}
function clearCueMotion(){
 cueToken++;clearTimeout(cueTimeout);cueTimeout=null;
 if(cueResolve){cueResolve();cueResolve=null;}
 cueAnimations.forEach(a=>a.cancel());cueAnimations=[];cueBusy=false;
}
function syncCueControls(){
 const id=S[index].id,next=FLOW.next(id,cueStep),hint=document.getElementById('cueHint');
 const label=next.type==='cue'?next.cue.label:index<S.length-1?'进入'+S[index+1].title:'阅读继续在书里';
 const nextButton=document.querySelector('[data-command="next"]');
 nextButton.disabled=index===S.length-1&&next.type==='scene';
 nextButton.title='下一步：'+label+' · → / 空格';nextButton.setAttribute('aria-label','下一步：'+label);
 document.querySelector('[data-command="previous"]').disabled=index===0&&cueStep===0;
 if(hint)hint.textContent='下一步 · '+label;
 shot.dataset.cueStep=String(cueStep);
 scene.querySelectorAll('[data-cue]').forEach(button=>{
  const target=Number(button.dataset.cue);
  button.disabled=target>0&&(target<=cueStep||target>cueStep+1);
  if(button.disabled&&document.activeElement===button)stage.focus({preventScroll:true});
  if(button.dataset.label)button.innerHTML=target<=cueStep?'已留下 <span aria-hidden="true">✓</span>':safe(button.dataset.label)+' <span aria-hidden="true">↗</span>';
 });
 const reading=READING.scenes[id];
 if(reading){
  const state=FLOW.readingState(id,cueStep),previous=scene.querySelector('[data-reading-previous]');
  previous.disabled=state.pageIndex===0&&!state.wishes;
  if(previous.disabled&&document.activeElement===previous)stage.focus({preventScroll:true});
  scene.querySelector('.reading-position').textContent=(state.pageIndex+1)+' / '+state.pageCount;
  const label=next.type!=='cue'?'读完，继续':next.cue.kind==='read-page'?'继续阅读':next.cue.kind==='wishes'?'让愿望映在窗上':'收起这段讲述';
  scene.querySelector('[data-reading-next]').innerHTML=safe(label)+' <span aria-hidden="true">→</span>';
 }
}
function applyCueState(){
 const id=S[index].id;
 const readingState=FLOW.readingState(id,cueStep);
 if(READING.scenes[id]){
  scene.querySelectorAll('[data-reading-page]').forEach(page=>{
   const visible=Number(page.dataset.readingPage)===readingState.pageIndex;
   if(!visible&&page.contains(document.activeElement))stage.focus({preventScroll:true});
   page.hidden=!visible;page.inert=!visible;page.setAttribute('aria-hidden',String(!visible));
  });
  shot.dataset.readingPage=String(readingState.pageIndex);
 }
 scene.querySelectorAll('[data-record]').forEach(el=>{
  const done=mem.records[el.dataset.record]===true;
  const was=el.classList.contains('is-recorded');
  if(done&&!was)el.classList.add('is-writing');else if(!done)el.classList.remove('is-writing');
  el.classList.toggle('is-recorded',done);
  el.querySelector('.record-note').setAttribute('aria-hidden',String(!done));
  el.setAttribute('aria-label',el.querySelector('.record-label').textContent+(done?'，已留下笔迹':'，等待分享'));
 });
 const repair=scene.querySelector('.repair-layout');if(repair)repair.classList.toggle('is-complete',repairComplete(id));
 updateProtection();if(id==='annewish')updateWishes();
 if(id==='haulers'){
  const art=scene.querySelector('.art-sheet'),returned=scene.querySelector('.art-return-note');
  if((cueStep>0?art:returned).contains(document.activeElement))stage.focus({preventScroll:true});
  shot.classList.toggle('art-folded',cueStep>0);art.inert=cueStep>0;art.setAttribute('aria-hidden',String(cueStep>0));
  returned.inert=cueStep===0;returned.setAttribute('aria-hidden',String(cueStep===0));
 }
 if(id==='yamen'||id==='varvara'){
  const exhibit=scene.querySelector('.story-exhibit'),sheet=scene.querySelector('.material-sheet'),room=scene.querySelector('.story-room');
  const closed=readingState.closed;
  if((closed?sheet:room).contains(document.activeElement))stage.focus({preventScroll:true});
  exhibit.classList.toggle('is-closed',closed);sheet.inert=closed;sheet.setAttribute('aria-hidden',String(closed));
  room.inert=!closed;
  scene.querySelector('.material-return').setAttribute('aria-hidden',String(!closed));
 }
 if(id==='pressure'){
  scene.querySelector('.pressure-scene').classList.toggle('is-weighing',cueStep>0);
  scene.querySelectorAll('.memory-constellation,.pressure-words,.pressure-question').forEach(el=>el.setAttribute('aria-hidden',String(cueStep===0)));
  scene.querySelector('.gather-caption').setAttribute('aria-hidden',String(cueStep>0));
 }
 syncCueControls();
}
function sheetMotion(element,target,closing,duration){
 if(!element||reducedMotion())return null;
 const box=element.getBoundingClientRect(),anchor=target&&target.getBoundingClientRect();
 const dx=anchor?anchor.left+anchor.width/2-box.left-box.width/2:box.width*.32;
 const dy=anchor?anchor.top+anchor.height/2-box.top-box.height/2:box.height*.34;
 const compact={opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(.12) rotate('+(dx<0?-5:5)+'deg)',filter:'blur(1px)'};
 const open={opacity:1,transform:'translate(0,0) scale(1) rotate(0deg)',filter:'blur(0)'};
 return element.animate(closing?[open,compact]:[compact,open],{duration,easing:'cubic-bezier(.32,.02,.18,1)',fill:'both'});
}
function runCue(target){
 if(transitioning||cueBusy||panel.open)return;
 const id=S[index].id,nextStep=FLOW.clampStep(id,target);
 if(nextStep===cueStep)return;
 const before=cueStep,forward=nextStep>before,cue=FLOW.stepsFor(id)[forward?nextStep-1:before-1];
 const token=++cueToken,owner=shot;cueBusy=true;cueStep=nextStep;
 FLOW.stepsFor(id).forEach((step,i)=>{if(step.kind==='record')step.recordIds.forEach(key=>{if(i<cueStep)mem.records[key]=true;else delete mem.records[key];});});
 if(cue.kind==='material-close')scene.querySelector('.story-exhibit').classList.add('was-cued');
 applyCueState();save();
 const duration=reducedMotion()?0:forward?cue.duration:cue.kind==='read-page'?480:850;
 if(cue.kind==='material-close'){
  const animation=sheetMotion(scene.querySelector('.material-sheet'),scene.querySelector('[data-story-orb="'+id+'"]'),FLOW.readingState(id,cueStep).closed,duration);
  if(animation)cueAnimations.push(animation);
 }else if(cue.kind==='art-close'){
  const animation=sheetMotion(scene.querySelector('.art-sheet'),scene.querySelector('.folded-art'),cueStep>0,duration);
  if(animation)cueAnimations.push(animation);
 }else if(cue.kind==='read-page'){
  const page=scene.querySelector('[data-reading-page]:not([hidden])');
  scene.scrollTop=0;const sheet=scene.querySelector('.material-sheet');if(sheet)sheet.scrollTop=0;
  if(page&&!reducedMotion())cueAnimations.push(page.animate([{opacity:0,transform:'translateY('+(forward?12:-10)+'px)'},{opacity:1,transform:'translateY(0)'}],{duration,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}));
 }
 if(forward&&cue.kind==='record')beep('done');
 const delay=duration?new Promise(resolve=>{cueResolve=resolve;cueTimeout=setTimeout(()=>{cueTimeout=null;cueResolve=null;resolve();},duration);}):Promise.resolve();
 const active=cueAnimations;
 Promise.all([delay,...active.map(a=>a.finished.catch(()=>{}))]).then(()=>{
  if(token!==cueToken||owner!==shot)return;
  active.forEach(a=>a.cancel());cueAnimations=[];cueBusy=false;scene.querySelectorAll('.is-writing').forEach(el=>el.classList.remove('is-writing'));syncCueControls();
 });
}
function advance(){
 if(transitioning||cueBusy||panel.open)return;
 const next=FLOW.next(S[index].id,cueStep);
 if(next.type==='cue')runCue(next.step);else go(index+next.delta);
}
function retreat(){
 if(transitioning||cueBusy||panel.open)return;
 const previous=FLOW.previous(S[index].id,cueStep);
 if(previous.type==='cue')runCue(previous.step);else go(index+previous.delta);
}
function updateWishes(){const state=FLOW.readingState('annewish',cueStep);scene.querySelectorAll('[data-wish]').forEach(el=>el.classList.toggle('visible',state.pageIndex===state.pageCount-1&&(state.wishes||marked(el.dataset.wish))));}
function setTimer(n){clearInterval(timerInterval);timerRunning=false;timerDefault=n;timerRemaining=n;const el=document.getElementById('timer');el.hidden=!n;el.classList.remove('finished');paintTimer();}
function paintTimer(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;document.getElementById('timerValue').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');document.getElementById('timerRing').style.strokeDashoffset=timerDefault?144.513*(1-timerRemaining/timerDefault):0;document.getElementById('timerToggle').setAttribute('aria-label',timerRunning?'暂停计时':'开始计时');}
function toggleTimer(){if(!timerDefault){notify('这一幕由你掌握停留时间');return;}if(timerRunning){clearInterval(timerInterval);timerRunning=false;paintTimer();return;}if(timerRemaining<=0)timerRemaining=timerDefault;timerRunning=true;document.getElementById('timer').classList.remove('finished');let last=Date.now();timerInterval=setInterval(()=>{const now=Date.now();if(now-last>=950){const secs=Math.max(1,Math.floor((now-last)/1000));last+=secs*1000;timerRemaining=Math.max(0,timerRemaining-secs);paintTimer();if(!timerRemaining){clearInterval(timerInterval);timerRunning=false;document.getElementById('timer').classList.add('finished');paintTimer();}}},200);paintTimer();}
function openPanel(title,html){save();panelTitle.textContent=title;panelBody.innerHTML=html;panel.showModal();panelBody.scrollTop=0;}
function menu(){openPanel('课堂目录','<div class="menu-actions"><button data-command="help">操作说明</button><button data-command="contrast">投影增强</button><button data-command="motion">切换简静动画</button><button data-command="sources">教师资料来源</button><button data-command="reset">清空本次课堂记录</button></div><div class="menu-grid">'+S.map((s,i)=>'<button data-jump="'+i+'" class="'+(i===index?'current':'')+'"><small>'+safe(s.time)+'</small>'+safe(s.title)+'</button>').join('')+'</div>');}
function notes(){const n=N.find(n=>n.id===S[index].id)||{};openPanel('教师讲稿 · '+S[index].title,'<p class="notes-meta">'+safe(S[index].time)+'　'+safe(S[index].id)+'</p><h3>这一段怎么说</h3><p class="teacher-speech">'+safe(n.teacher||'教师静候，把完整时间交给学生。')+'</p><h3>画面与操作</h3><p>'+safe(n.action||'')+'</p><h3>停留与课堂安排</h3><p>'+safe(n.hold||'')+'</p>'+(n.optional?'<h3>按需承接</h3><p class="teacher-speech">'+safe(n.optional)+'</p>':''));}
function help(){openPanel('课前操作说明','<h3>跟着讲述推进</h3><p>按 →、空格或 PageDown 执行下一步：先完成当前幕的动作，再进入下一幕。按 ← 或 PageUp 先倒回本幕步骤，回到起点后才返回上一幕。所有开合和记录由教师掌握，不按固定时间自动切走。</p><p>进入全屏后（浏览器受限时自动进入专注模式），在没有专用按钮的画面区域单击左键或右键，也执行同一个下一步。关键词、按钮、文字选取与教师面板保留各自的操作；拖动和滚动不推进。</p><h3>全程不用打字</h3><p>学生在自己的阅读本和卡片上作答。三关修订讲完后，按下一步或点击“留下这次修订”，纸面画出笔迹并留下印记，再按才换幕。笔迹只表示完成表达，不生成预设答案。分享环节依次留下第一组、第二组和日常生活的补充。</p><p>仍可点击学生指出的原文词语划线，两条因果箭头也可分别断开与恢复。回访会保留已完成的笔迹；上一操作可撤回本幕笔迹；R重新演示本幕，保留已点选的词与箭头。</p><h3>资料随旁白打开与收回</h3><p>进入画作或人物资料时，材料展开。讲完按下一步，材料收回书页或泡泡；再按才进入后一段。安妮与两份现实故事按阅读页推进，先逐页读完，最后一次推进才展开愿望或收回资料。可用页脚按钮返回上一页，或用全局上一步回退。每页停留时长由教师掌握，正文不会自动滚动或自动收起。两份现实资料起初不同时亮相，最后回到房间时按下一步，几段童年才一起汇聚，灰影与木梁随后压下。</p><p>小组证据可单独点击放大；安妮证据展开完整的背景与短引文，关闭后回到总览，计时继续。同幕动作不重置计时，倒计时归零也不换幕。</p><h3>控制与投影</h3><p>F：全屏　M：目录　N：教师讲稿　R：重演本幕　T：开始或暂停计时　Esc：关闭面板</p><p>移动鼠标到屏幕下方显示控制栏，其中会提示下一步要发生什么。目录中的“简静动画”直接显示动作结束状态，“投影增强”提高文字对比。声音默认关闭。下载并完整解压仓库后，打开 index.html 即可离线使用。</p>');}
function sourceHTML(obj){if(Array.isArray(obj))return '<ul class="note-list">'+obj.map(x=>'<li>'+sourceHTML(x)+'</li>').join('')+'</ul>';if(obj&&typeof obj==='object')return Object.entries(obj).map(([k,v])=>'<p><strong>'+safe(k)+'</strong></p>'+sourceHTML(v)).join('');const t=String(obj||'');return /^https?:\/\//.test(t)?'<p><a href="'+safe(t)+'" target="_blank" rel="noreferrer">'+safe(t)+'</a></p>':'<p>'+safe(t)+'</p>';}
function sourcePanel(){openPanel('教师资料来源与文本说明','<p>以下为教师备课资料，学生主画面不显示编号、删节标记与来源。原著的不连续选段采用独立段块呈现；游戏概括由教师拟写，须在规则讲解中说明。现实儿童材料来自有日期的历史报道。</p><div class="sources-list">'+sourceHTML(SOURCES)+'</div><h3>扩展阅读：短引文与内容整理</h3><p>阅读页以引号标出采访或安妮文字的短引，其余为背景与报道内容整理。短引采用课堂工作译文，不冒充指定中文出版译本。每页都有“背景阅读”“日记短引”或“报道内容整理”等提示。</p><div class="sources-list">'+sourceHTML(READING.sources)+'</div><h3>美术与字体</h3><p>场景、读者角色与保护者插画为本课原创生成的文学意象，并非历史现场照片。真实儿童照片保持其纪实身份。中文字体采用 Noto Sans CJK SC 与 Noto Serif CJK SC，依照 SIL Open Font License 嵌入子集。</p>');}
function material(key){if(key==='anne'){openPanel('安妮的处境与愿望',['annecontext','annehelp','annewish'].map(id=>READING.scenes[id].pages.map(page=>'<section class="reading-evidence-page"><p class="hint">'+safe(page.kind)+'</p><h3>'+safe(page.title)+'</h3>'+page.blocks.map(b=>'<p class="fragment">'+(b.kind==='quote'?'“':'')+safe(b.text)+(b.kind==='quote'?'”':'')+'</p>').join('')+'</section>').join('')).join(''));return;}const t=M[key];let content=t.blocks;if(key==='A')content=[t.context_excerpt,...t.blocks];if(key==='D')content=[...t.blocks,...t.next_time_blocks];openPanel(t.title,'<div class="evidence-modal">'+fragments(content)+'</div>');}
function syncFullscreenControl(){
 const native=!!document.fullscreenElement;
 const fallback=document.body.classList.contains('presentation-mode');
 const button=document.querySelector('[data-command="fullscreen"]');
 button.setAttribute('aria-label',native?'退出全屏':fallback?'退出专注模式':'进入全屏');
 button.setAttribute('aria-pressed',native||fallback);
 button.title=native?'退出全屏 F':fallback?'退出专注模式 F / Esc':'全屏 F';
}
function focusFallback(){
 document.body.classList.add('presentation-mode');syncFullscreenControl();
 notify('已进入专注模式；空白处单击或右键可推进，F11 可隐藏浏览器边框');
}
function full(){
 if(document.fullscreenElement){if(document.exitFullscreen)Promise.resolve(document.exitFullscreen()).catch(()=>{});return;}
 if(document.body.classList.contains('presentation-mode')){document.body.classList.remove('presentation-mode');syncFullscreenControl();return;}
 const request=document.documentElement.requestFullscreen;
 if(typeof request!=='function'){focusFallback();return;}
 try{Promise.resolve(request.call(document.documentElement)).then(()=>{syncFullscreenControl();notify('全屏中：空白处单击或右键执行下一步');}).catch(focusFallback);}catch(e){focusFallback();}
}
function command(name){
 switch(name){
 case'next':advance();break;
 case'previous':retreat();break;
 case'menu':menu();break;
 case'notes':notes();break;
 case'help':help();break;
 case'sources':sourcePanel();break;
 case'fullscreen':full();break;
 case'timer':toggleTimer();break;
 case'replay':go(index,true);break;
 case'sound':soundEnabled=!soundEnabled;document.querySelector('[data-command="sound"]').setAttribute('aria-pressed',soundEnabled);document.querySelector('[data-command="sound"]').setAttribute('aria-label',soundEnabled?'关闭音效':'开启音效');beep('done');notify(soundEnabled?'音效已开启':'音效已关闭');break;
 case'contrast':document.body.classList.toggle('high-contrast');notify(document.body.classList.contains('high-contrast')?'投影增强已开启':'已恢复柔和画面');break;
 case'motion':
  document.body.classList.toggle('reduce-motion');
  if(document.body.classList.contains('reduce-motion')){
   root.getAnimations({subtree:true}).forEach(a=>{try{a.finish();}catch(e){}});
   clearCueMotion();applyCueState();
  }
  notify(document.body.classList.contains('reduce-motion')?'已切换简静动画':'已恢复完整动画');break;
 case'reset':openPanel('清空课堂记录','<p>将清空本浏览器中的划线、箭头和象征笔迹，并回到封面。</p><div class="menu-actions"><button data-command="confirm-reset">清空并回到封面</button><button data-command="cancel-reset">保留记录</button></div>');break;
 case'confirm-reset':mem.marks={};mem.records={};mem.cuts={};save();go(0);break;
 case'cancel-reset':panel.close();break;
 }
}
function advanceFromCanvas(e){
 const selected=window.getSelection?window.getSelection().toString():'';
 const fullscreen=window.ClassroomInput.isFullscreen(document,fullscreenMedia);
 const allowed=window.ClassroomInput.canAdvance({fullscreen,panelOpen:panel.open,transitioning:transitioning||cueBusy,target:e.target,selectedText:selected,dragged:pointerDragged,inStage:stage.contains(e.target)});
 if(!allowed)return false;
 e.preventDefault();command('next');return true;
}
document.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};pointerDragged=false;});
document.addEventListener('pointermove',e=>{if(pointerStart&&(Math.abs(e.clientX-pointerStart.x)>7||Math.abs(e.clientY-pointerStart.y)>7))pointerDragged=true;},{passive:true});
document.addEventListener('pointerup',()=>{pointerStart=null;});
document.addEventListener('pointercancel',()=>{pointerStart=null;pointerDragged=true;});
document.addEventListener('contextmenu',e=>{
 if(window.ClassroomInput.isFullscreen(document,fullscreenMedia)&&!panel.open&&stage.contains(e.target)&&!window.ClassroomInput.isInteractive(e.target)&&!(window.getSelection&&window.getSelection().toString().trim())){
  e.preventDefault();advanceFromCanvas(e);
 }
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(!b){advanceFromCanvas(e);return;}
 if(b.dataset.command){command(b.dataset.command);return;}
 if(b.hasAttribute('data-reading-next')){advance();return;}
 if(b.hasAttribute('data-reading-previous')){retreat();return;}
 if(b.dataset.cue!==undefined){runCue(Number(b.dataset.cue));return;}
 if(b.dataset.jump!==undefined){go(Number(b.dataset.jump));return;}
 if(b.dataset.goto){go(S.findIndex(s=>s.id===b.dataset.goto));return;}
 if(b.dataset.word){const k=S[index].id;mem.marks[k]=mem.marks[k]||{};mem.marks[k][b.dataset.word]=!mem.marks[k][b.dataset.word];b.classList.toggle('marked');b.setAttribute('aria-pressed',b.classList.contains('marked'));updateProtection();updateWishes();save();return;}
 if(b.dataset.arrow){mem.cuts[b.dataset.arrow]=!mem.cuts[b.dataset.arrow];b.classList.toggle('cut',mem.cuts[b.dataset.arrow]);b.setAttribute('aria-pressed',!!mem.cuts[b.dataset.arrow]);save();return;}
 if(b.dataset.scale){scene.querySelectorAll('[data-scale]').forEach(x=>x.classList.toggle('active',x===b));return;}
 if(b.dataset.art){const el=scene.querySelector('.hauler-image');el.style.transformOrigin=b.dataset.art==='rope'?'64% 53%':'27% 42%';el.style.transform=b.dataset.art==='whole'?'scale(1)':'scale(1.65)';scene.querySelectorAll('[data-art]').forEach(x=>x.classList.toggle('active',x===b));return;}
 if(b.dataset.material){material(b.dataset.material);return;}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.open)panel.close();else if(document.body.classList.contains('presentation-mode')){document.body.classList.remove('presentation-mode');syncFullscreenControl();}return;}if(e.key==='F11'&&!e.repeat){document.body.classList.toggle('presentation-mode',!fullscreenMedia.matches);syncFullscreenControl();return;}if(e.target.isContentEditable||e.target.matches('input,textarea,select'))return;if((e.key===' '||e.key==='Enter')&&e.target.closest('button,a,[role=button]'))return;if(e.repeat&&['ArrowRight','ArrowLeft','PageDown','PageUp',' '].includes(e.key))return;if(panel.open){if(e.key.toLowerCase()==='m'){e.preventDefault();menu();}return;}const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();command('next');}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();command('previous');}else if(k==='f'){e.preventDefault();full();}else if(k==='m')menu();else if(k==='n')notes();else if(k==='r')go(index,true);else if(k==='t')toggleTimer();});
document.addEventListener('pointermove',e=>{if(e.clientY>innerHeight-130||e.pointerType==='touch')showControls();});document.addEventListener('touchstart',showControls,{passive:true});
document.getElementById('closePanel').addEventListener('click',()=>panel.close());panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
document.getElementById('timerToggle').addEventListener('click',toggleTimer);document.getElementById('timerReset').addEventListener('click',()=>setTimer(timerDefault));
document.addEventListener('fullscreenchange',()=>{document.body.classList.remove('presentation-mode');syncFullscreenControl();});
window.addEventListener('beforeunload',save);
if(matchMedia('(prefers-reduced-motion:reduce)').matches)document.body.classList.add('reduce-motion');
go(index);showControls();
// Warm up the next illustrations without putting the entire picture book on the critical path.
const warm=()=>{['modern-room.png','old-room.png','anne-room.png','bubble-hall.png'].forEach(name=>{const image=new Image();image.src=A[name];if(image.decode)image.decode().catch(()=>{});});};
if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2500});else setTimeout(warm,1800);
window.addEventListener('hashchange',()=>{const target=S.findIndex(s=>s.id===location.hash.slice(1));if(target>=0&&target!==index){if(transitioning){try{history.replaceState(null,'','#'+S[index].id);}catch(e){}}else go(target);}});

})();
