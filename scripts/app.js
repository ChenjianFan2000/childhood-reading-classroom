(function(){
'use strict';
const A=window.LESSON_ASSETS,S=window.LESSON_SCENES,M=window.LESSON_TEXT,N=window.LESSON_NARRATION,SOURCES=window.LESSON_SOURCES;
const stage=document.getElementById('stage'),root=document.getElementById('sceneRoot'),panel=document.getElementById('panel'),panelBody=document.getElementById('panelBody'),panelTitle=document.getElementById('panelTitle'),controls=document.getElementById('controls');
let shot=null,scene=null,background=null,shade=null,ambience=null,transitioning=false;
let cameraAnimations=[],pointerStart=null,pointerDragged=false;
const fullscreenMedia=matchMedia('(display-mode: fullscreen)');
const mem={marks:{},edits:{},cuts:{},complete:{},scale:'',daily:'',index:0};
let index=0,hideControls=0,toastTimer=0,soundEnabled=false,audioContext=null,timerInterval=null,timerRemaining=0,timerDefault=0,timerRunning=false;
const timerValues={initial:35,parallel:120,grandfather:60,r1read:20,r1recall:20,r1repair:30,r2read:20,r2recall:8,r2repair:30,r3read:30,r3recall:10,r3repair:35,annewish:20,group:300,author:40,revise:30,exit:90};
const cinema=new Set(['cover','today','ordinary','window','arrival','bubbles','pressure','support','ending']);
const reading=new Set(['parallel','compare','grandfather','r1read','r2read','r3read','r1repair','r2repair','r3repair','group','author']);
const keys={A:['不安','撕掉','难以忍受','自己的或别人的','敏感'],B:['无私的爱','丰富了我','坚强的力量','应付困苦的生活'],C:['太过分了','受教训','欺辱','熬出头了'],D:['挡着你','少挨了几下','为了爱'],E:['连根儿拔掉','压扁','善良','光明的、人道的生活']};
const initialHash=location.hash.replace('#','');if(S.some(s=>s.id===initialHash))index=S.findIndex(s=>s.id===initialHash);
try{const saved=JSON.parse(localStorage.getItem('childhood-reading-state-v1')||'null');if(saved&&typeof saved==='object'){['marks','edits','cuts','complete'].forEach(k=>{if(saved[k]&&typeof saved[k]==='object')mem[k]=saved[k]});}}catch(e){}
const safe=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(name,cls,alt)=>'<img class="'+(cls||'')+'" src="'+A[name]+'" alt="'+safe(alt||'')+'" draggable="false">';
const hero=(pose,cls)=>'<div class="hero pose-'+pose+' '+(cls||'')+'" aria-hidden="true"></div>';
const p=t=>'<p class="fragment">'+t+'</p>';
function words(text,list){let re=new RegExp('('+list.slice().sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g');return text.split(re).map(t=>list.includes(t)?'<button class="word'+(marked(t)?' marked':'')+'" data-word="'+safe(t)+'" aria-pressed="'+marked(t)+'">'+safe(t)+'</button>':safe(t)).join('');}
function marked(t){return !!(mem.marks[S[index].id]||{})[t];}
function fragments(arr,list){return arr.map(t=>p(list?words(t,list):safe(t))).join('');}
function editable(id,placeholder){return '<div class="editable" contenteditable="true" role="textbox" spellcheck="false" data-edit="'+id+'" aria-label="'+safe(placeholder)+'" data-placeholder="'+safe(placeholder)+'">'+safe(mem.edits[id]||'')+'</div>';}
function center(title,body,cls){return '<div class="paper center-paper '+(cls||'')+'"><h1 class="big-question">'+title+'</h1>'+(body||'')+'</div>';}
function question(title,hint){return '<div class="quiet-question"><h1>'+title+'</h1>'+(hint?'<div class="divider"></div><p class="hint">'+hint+'</p>':'')+'</div>';}
function setBg(name){background.style.backgroundImage='url("'+A[name]+'")';shot.dataset.place=name.split('.')[0];}
function save(){try{localStorage.setItem('childhood-reading-state-v1',JSON.stringify(mem));}catch(e){}}
function notify(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2000);}
function showControls(){controls.classList.add('show');clearTimeout(hideControls);hideControls=setTimeout(()=>controls.classList.remove('show'),2800);}
function beep(type){if(!soundEnabled)return;try{if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const t=audioContext.currentTime;const g=audioContext.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(type==='page'?.018:.03,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.45);g.connect(audioContext.destination);const o=audioContext.createOscillator();o.type='sine';o.frequency.setValueAtTime(type==='page'?330:523.25,t);o.frequency.exponentialRampToValueAtTime(type==='page'?200:659.25,t+.4);o.connect(g);o.start(t);o.stop(t+.5);}catch(e){}}
function bookPair(compare){const a0='外祖父把我打得失去了知觉，接着我病了一场。';const a1=M.A.blocks[0];return '<div class="paper main-paper book-reading"><div class="quote-grid"><article class="quote-column"><h2>受伤之后</h2><p class="context-line">'+a0+'</p>'+fragments([a1,M.A.blocks[1]],compare?keys.A:null)+'</article><article class="quote-column"><h2>外祖母给予的力量</h2>'+fragments(M.B.blocks,compare?keys.B:null)+'</article></div>'+(compare?'<div class="reading-footer"><div class="scale-row"><button class="soft-button" data-scale="伤害有多深">伤害有多深</button><button class="soft-button" data-scale="怎样看待别人">怎样看待别人</button><button class="soft-button" data-scale="怎样面对生活">怎样面对生活</button></div></div>':'<div class="reading-footer">圈出变化与感受，也留意让你犹豫的词。</div>')+'</div>';}
function repair(title,source,card,field,placeholder,extra){const id=S[index].id;return '<div class="paper repair-layout '+(mem.complete[id]?'is-complete ':'')+(extra||'')+'"><span class="bookmark" aria-hidden="true"></span><h1>'+title+'</h1><div class="repair-source">'+source+'</div><div class="repair-target"><p class="card-sentence">'+card+'</p>'+editable(field,placeholder)+(extra?'<div class="warm-glow"></div><div class="protect-figure" aria-hidden="true"></div>':'')+'</div><div class="repair-bottom"><p class="hint">让修订回到具体的文字。</p><button class="done-button '+(mem.complete[id]?'completed':'')+'" data-complete="'+id+'">'+(mem.complete[id]?'已留下证据':'完成修复')+'</button></div></div>';}
function bike(){return '<svg viewBox="0 0 120 70"><g class="bike-wheel"><circle cx="25" cy="46" r="20"/><path d="M25 26v40M5 46h40"/></g><g class="bike-wheel"><circle cx="96" cy="46" r="20"/><path d="M96 26v40M76 46h40"/></g><path d="M25 46 47 17 64 46 25 46 43 11M64 46 86 17 47 17M82 10h12l4 36M38 10h14"/></svg>';}
function dance(){return '<svg viewBox="0 0 100 80"><circle cx="52" cy="13" r="7"/><path d="m48 22-9 20 20 8 9-13M43 29 23 20 15 9M46 28 70 23 84 11M51 49 31 65 18 64M57 49 69 69 86 71"/><path d="M9 46q-5-17 9-26M82 48q16-8 8-22" opacity=".4"/></svg>';}
function whistle(){return '<svg viewBox="0 0 120 75"><path d="M5 49q18-30 40-14t32-6 35-3M16 64q15-19 31-9t43-11M36 17q10-12 20-2t16-8"/></svg>';}
function evidenceButton(key,title,arr){return '<button class="evidence-bit" data-material="'+key+'"><h3>'+title+'</h3>'+arr.map(t=>'<p>'+safe(t)+'</p>').join('')+'</button>';}
function bubbleHTML(){return '<div class="bubble-room"><button class="bubble bubble-one" data-goto="yamen" aria-label="打开亚门的故事">'+img('yamen.webp','','亚门与父亲')+'<span>回到学校</span></button><button class="bubble bubble-two" data-goto="varvara" aria-label="打开瓦尔瓦拉的故事">'+img('varvara.webp','','瓦尔瓦拉与母亲')+'<span>灯亮着的夜晚</span></button><div class="bubble bubble-small"><span>普通的愿望</span></div>'+hero(4,'bubble-hero')+'</div>';}
function documentary(id){const b=M.bubbles.find(x=>x.id===id);return '<article class="paper documentary '+(id==='varvara'?'focus-right':'')+'"><div class="documentary-photo">'+img(id+'.webp','',id==='yamen'?'亚门和父亲':'瓦尔瓦拉和母亲')+'</div><div class="documentary-content"><h1>'+(id==='yamen'?'回到学校':'灯亮着的夜晚')+'</h1><p>'+safe(b.student_text)+'</p></div></article>';}
function pressureBubbles(){return '<div class="pressure-bubbles"><div class="bubble bubble-one">'+img('yamen.webp','','')+'</div><div class="bubble bubble-two">'+img('varvara.webp','','')+'</div></div>';}
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
case 'haulers':setBg('old-room.png','#162420a0');return '<div class="art-actions"><button data-art="whole">看全画</button><button data-art="shoulders">看肩背</button><button data-art="rope">看纤绳</button></div><div class="picture-crop">'+img('haulers.jpg','hauler-image','伏尔加河上的纤夫')+'</div><div class="art-caption">伏尔加河上的纤夫</div>';
case 'grandfather':setBg('old-room.png','#17302870');return '<div class="paper main-paper"><h1>另一个受过苦的人</h1><div class="grandfather-grid"><article><h2>他经历过什么？</h2>'+fragments([M.C.blocks[2],M.C.blocks[3],M.C.blocks[4]],keys.C)+'</article><article><h2>他怎样解释？</h2>'+fragments([M.C.blocks[0],M.C.blocks[1]],keys.C)+'<div class="divider"></div><p class="hint">他的经历，能证明他的解释吗？</p></article></div></div>';
case 'turnone':setBg('old-room.png','#0b22219c');return question('如果受过苦，<br>就<strong>一定</strong>更懂得善待别人，<br>为什么外祖父记得自己的痛，<br>却仍把同样的痛给了孩子？');
case 'rules':setBg('modern-room.png','#2e322961');return '<div class="paper main-paper"><h1>阅读卡修复挑战</h1><div class="rules-grid"><div class="rule-card"><span class="line-icon">补</span><h2>补回失踪的词</h2></div><div class="rule-card"><span class="line-icon">断</span><h2>检验一条箭头</h2></div><div class="rule-card"><span class="line-icon">赞</span><h2>把赞美写准确</h2></div></div><p class="rules-flow">读原文 → 暂时隐去 → 回看 → 修订</p><p class="hint" style="text-align:center">每人独立留下证据，全班共同完成。</p></div>';
case 'r1read':setBg('old-room.png','#182c265e');return '<div class="paper single-reading"><h1>补回失踪的词</h1>'+fragments([M.A.game_excerpt])+'</div>';
case 'r1recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下你最想保留的一个词。</h1><div class="recall-line"></div><p class="hint">稍后回到原文，还可以补充与修改。</p></div>';
case 'r1repair':setBg('old-room.png','#182c265e');return repair('让这句话更完整',fragments([M.A.game_excerpt],keys.A),'挨打后，阿廖沙变得更敏感了。','r1supplement','我补上……');
case 'r2read':setBg('old-room.png','#182c265e');return '<div class="paper main-paper"><h1>再读一读他的解释</h1>'+fragments(M.C.short_blocks)+'</div>';
case 'r2recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下他的一条解释。</h1><div class="recall-line"></div></div>';
case 'r2repair':setBg('old-room.png','#182c265e');return '<div class="paper repair-layout '+(mem.complete[id]?'is-complete':'')+'"><span class="bookmark"></span><h1>剪断不成立的箭头</h1><div class="repair-source r2-source-grid">'+fragments(M.C.short_blocks,keys.C)+'</div><div class="cause-line"><div class="cause-node">我受过欺辱</div><button class="cause-arrow '+(mem.cuts.one?'cut':'')+'" data-arrow="one" aria-label="检验第一条箭头" aria-pressed="'+!!mem.cuts.one+'">→</button><div class="cause-node">我后来<br>熬出了头</div><button class="cause-arrow '+(mem.cuts.two?'cut':'')+'" data-arrow="two" aria-label="检验第二条箭头" aria-pressed="'+!!mem.cuts.two+'">→</button><div class="cause-node">亲人打孩子<br>就是教育</div></div>'+editable('r2reason','这条联系不能成立，因为……')+'<div class="repair-bottom"><p class="hint">经历仍然在，联系需要检验。</p><button class="done-button '+(mem.complete[id]?'completed':'')+'" data-complete="'+id+'">'+(mem.complete[id]?'已留下证据':'完成修复')+'</button></div></div>';
case 'r3read':setBg('old-room.png','#182c265e');return '<div class="paper main-paper"><h1>读懂保护的动作</h1>'+fragments(M.D.blocks)+'<div class="reading-footer">他做了什么？为了谁？为了什么？</div></div>';
case 'r3recall':setBg('old-room.png','#182c265e');return '<div class="paper recall-paper"><h1>记下一个动作。</h1><div class="recall-line"></div></div>';
case 'r3repair':setBg('old-room.png','#182c265e');return repair('把赞美写准确',fragments(M.D.short_blocks,keys.D),'小茨冈受伤了。','r3praise','我赞美他……因为……','protect-layout');
case 'again':setBg('old-room.png','#102b2a72');return '<div class="continuing-protection" aria-hidden="true"></div><div class="continuing-glow" aria-hidden="true"></div><div class="paper dialogue-paper"><p class="fragment">“下次再打你，记住，你别抱紧身子缩作一团，你懂吗？”</p><div class="divider"></div><p class="dialogue"><small>阿廖沙问</small>“还会打我吗？”</p></div>';
case 'againanswer':setBg('old-room.png','#102b2a72');return '<div class="continuing-protection" aria-hidden="true"></div><div class="continuing-glow" aria-hidden="true"></div><div class="paper dialogue-paper"><p class="dialogue"><small>阿廖沙问</small>“还会打我吗？”</p><p class="dialogue"><small>小茨冈平平静静地说</small>“当然要打啦！”</p><div class="divider"></div><p class="hint">有人替他挡过一次，是否等于他以后就安全了？</p></div>';
case 'annecontext':setBg('anne-room.png','#1426384a');return '<div class="paper anne-context"><h1>安妮的藏身生活</h1><p>为了躲避纳粹对犹太人的迫害，<br>安妮和家人在阿姆斯特丹藏匿。</p><div class="divider"></div><p>窗外有街道，<br>走出去却意味着危险。</p></div>';
case 'annehelp':setBg('anne-room.png','#1426384a');return '<div class="paper anne-context"><h1>有人一直在帮助他们</h1><div class="help-items"><div class="help-item">'+window.StoryScenery.parcel('food')+'<span>食物</span></div><div class="help-item">'+window.StoryScenery.parcel('clothes')+'<span>衣物</span></div><div class="help-item">'+window.StoryScenery.parcel('books')+'<span>书报</span></div></div><p style="text-align:center">善意支持着生活，<br>她仍然无法自由走出去。</p></div>';
case 'annewish':setBg('anne-room.png','#1426384a');return '<div class="paper single-reading"><h1>她渴望的，是怎样的生活？</h1><p class="wish-text">'+words(M.anne.blocks[0],M.anne.wishes)+'</p><div class="wish-scenes"><div class="wish-picture" data-wish="骑车">'+bike()+'</div><div class="wish-picture" data-wish="跳舞">'+dance()+'</div><div class="wish-picture" data-wish="吹口哨">'+whistle()+'</div></div></div>';
case 'annetwist':setBg('anne-room.png','#0c243286');return question('有人爱她，也有人帮助她，<br>为什么她连骑车、吹口哨，<br>都只能写成愿望？','把已经得到的帮助，与仍然缺少的条件放在一起看。');
case 'group':setBg('modern-room.png','#23372c70');return '<div class="paper group-layout"><h1>幸福的童年，最不能缺少什么？</h1><div class="evidence-board"><div class="evidence-stack">'+evidenceButton('A','受伤之后',['“不安的心情”','“难以忍受的敏感”'])+evidenceButton('B','外祖母给予的力量',['“无私的爱丰富了我”','“坚强的力量以应付困苦的生活”'])+'</div><div class="evidence-stack">'+evidenceButton('C','外祖父的解释',['“我当时对你太过分了”','“挨自己亲人的打，这不算屈辱，是受教训”'])+evidenceButton('D','小茨冈的保护',['“少挨了几下”　“为了爱”','“还会打我吗？”“当然要打啦！”'])+'</div><div class="evidence-stack">'+evidenceButton('anne','安妮的愿望',['有人送来食物、衣物和书报，她仍无法自由出门。',M.anne.blocks[0]])+'</div></div><p class="group-prompt">我们认为最不能缺少________。<br>《童年》中________说明________；安妮的________说明________。<br>已有的善意值得珍惜，还需要________真正发生／不再发生。</p><p class="group-roles">两人分别查两份证据 · 一人质疑 · 一人记录并发言</p><div class="group-steps"><span>每人说一句</span><span>找两处证据</span><span>追问“足够了吗”</span><span>写约80字主张</span></div></div>';
case 'share':setBg('modern-room.png','#23372c70');return '<div class="paper main-paper"><h1>把一个条件，还原成孩子的一天</h1><div class="share-grid"><div class="share-card"><h2>这一组的主张</h2>'+editable('groupOne','最想守住的是……')+editable('evidenceOne','文字让我们看见……')+'</div><div class="share-card"><h2>另一组的发现</h2>'+editable('groupTwo','最想守住的是……')+editable('evidenceTwo','文字让我们看见……')+'</div></div><div class="daily-response" id="dailyResponse">'+editable('concreteLife','这个词，在孩子的生活里是……')+'</div></div>';
case 'author':setBg('old-room.png','#152b255f');return '<div class="paper main-paper"><h1>值得讲这些吗？</h1><div class="author-fragments"><article>'+fragments([M.E.blocks[1],M.E.blocks[2]],keys.E)+'</article><article>'+fragments([M.E.blocks[3]],keys.E)+'</article></div><p class="author-tail">'+words(M.E.blocks[4],keys.E)+'</p></div>';
case 'revise':setBg('old-room.png','#152b255f');return center('再看开头的判断','<div class="divider"></div><p>我保留________。<br>我补充或修改________。<br>依据是________。</p><p class="hint">可以改变立场，也可以把原来的理由说得更准确。</p>');
case 'bubbles':setBg('bubble-hall.png');return bubbleHTML();
case 'yamen':setBg('bubble-hall.png','#4d5e484b');return documentary('yamen');
case 'varvara':setBg('bubble-hall.png','#394e4f6b');return documentary('varvara');
case 'pressure':setBg('bubble-hall.png','#31444135');return '<div class="pressure-scene">'+pressureBubbles()+'<div class="pressure-shadow"></div><div class="beam descending-beam"></div><div class="pressure-words"><span>战争</span><span>课堂中断</span><span>恐惧</span></div>'+hero(5,'pressure-hero')+'<div class="pressure-question">什么正在压着孩子？</div></div>';
case 'daily':setBg('modern-room.png','#20393051');return center('把目光带回身边','<div class="divider"></div><p>被误解时，有人肯听他说完。<br>遇到困难时，能找到可信赖的大人。</p><p class="hint">你最想守住的条件，怎样成为一件日常的小事？</p>');
case 'exit':setBg('modern-room.png','#20393051');return '<div class="paper exit-paper"><h1>留下自己的三句话</h1><div class="exit-lines"><p class="exit-line">我认为，幸福童年最不能缺<span class="blank"></span>。</p><p class="exit-line">《童年》中<span class="blank"></span>，<br>让我看到<span class="blank"></span>。</p><p class="exit-line">在日常生活中，<br>它可以体现为<span class="blank"></span>。</p></div><p class="hint" style="text-align:center;margin-top:3vh">判断 · 原著证据 · 日常体现　　60—90字</p></div>';
case 'support':setBg('bubble-hall.png','#203b3b67');return '<div class="pressure-scene">'+pressureBubbles()+'<div class="pressure-shadow lifting-shadow"></div><div class="beam"></div>'+hands()+hero(7,'pressure-hero')+'<p class="support-caption">为孩子，撑开生活的空间。</p></div>';
case 'ending':setBg('modern-room.png','#14332623');return '<div class="ending-card"><h1>愿每个孩子的普通愿望，<br>都有机会成为普通的生活。</h1></div>'+hero(2,'ending-hero')+'<div class="pencil-sketch ending-pencil"></div>'+catchHand();
case 'homework':setBg('modern-room.png','#183d345a');return '<div class="paper homework-paper"><h1>把阅读继续下去</h1><p>再选一处支持或挑战今天判断的原文，<br>写一条100—150字的批注。</p><div class="divider"></div><p>这处文字使我保留／修改了________，<br>因为________。</p><p class="hint">未读完的同学，继续原来的阅读计划。</p></div>';
default:return '';
}}
function updateProtection(){if(S[index].id!=='r3repair')return;const el=scene.querySelector('.repair-layout');el.classList.toggle('has-protection',marked('挡着你')||marked('少挨了几下')||marked('为了爱'));el.classList.toggle('has-love',marked('为了爱'));}
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
 if(!old||reducedMotion()||replay){if(old)old.remove();transitioning=false;return;}
 transitioning=true;old.inert=true;old.setAttribute('aria-hidden','true');old.classList.add('is-departing');
 const samePlace=old.dataset.place===current.dataset.place;
 const isQuiet=!cinema.has(id)&&!cinema.has(previousId)&&samePlace;
 const focus=id==='yamen'||id==='varvara';
 const duration=isQuiet?600:focus?1200:1100;
 const dx=direction<0?-1:1;
 old.style.transformOrigin=focus?(id==='yamen'?'29% 40%':'74% 40%'):'50% 48%';
 const outgoing=isQuiet?[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-dx*20)+'px)'}]:[{opacity:1,transform:'scale(1) translateX(0)'},{opacity:0,transform:'scale('+(focus?1.23:1.065)+') translateX('+(-dx*4)+'%)'}];
 const incoming=isQuiet?[{opacity:0,transform:'translateX('+(dx*24)+'px)'},{opacity:1,transform:'translateX(0)'}]:[{opacity:0,transform:'translateX('+(dx*(focus?2.5:5))+'%) scale('+(focus?.97:1.055)+')'},{opacity:1,transform:'translateX(0) scale(1)'}];
 // Let the ink clear before the next text arrives; the painted world keeps moving.
 cameraAnimations=[
  old.animate(outgoing,{duration,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}),
  current.animate(incoming,{duration,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'}),
  old.querySelector('.scene-content').animate([{opacity:1},{opacity:0}],{duration:isQuiet?180:260,easing:'ease-out',fill:'both'}),
  current.querySelector('.scene-content').animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{delay:isQuiet?160:320,duration:isQuiet?420:620,easing:'cubic-bezier(.22,.61,.2,1)',fill:'both'})
 ];
 Promise.all(cameraAnimations.map(a=>a.finished.catch(()=>{}))).then(()=>{old.remove();cameraAnimations.forEach(a=>a.cancel());cameraAnimations=[];transitioning=false;});
}
function go(next,replay){
 if(next<0||next>=S.length||transitioning)return;
 captureEdits();if(panel.open)panel.close();
 const previousIndex=index,previousId=shot?S[index].id:null,old=shot;
 index=next;const id=S[index].id;mem.index=index;
 shot=makeShot(id);scene=shot.querySelector('.scene-content');background=shot.querySelector('.scenic-background');shade=shot.querySelector('.scene-wash');ambience=shot.querySelector('.scene-ambience');
 scene.innerHTML=render(id);
 if(window.StoryScenery)ambience.innerHTML=window.StoryScenery.render(id)+window.StoryScenery.decorate(id);
 root.appendChild(shot);stage.className='scene-'+id;stage.dataset.scene=id;
 stage.style.setProperty('--sprite','url("'+new URL(A['child-sprites.png'],document.baseURI).href+'")');stage.style.setProperty('--protectors','url("'+new URL(A['protectors.png'],document.baseURI).href+'")');stage.style.setProperty('--old-room','url("'+new URL(A['old-room.png'],document.baseURI).href+'")');
 document.getElementById('progress').firstElementChild.style.width=(index/(S.length-1)*100)+'%';
 document.querySelector('[data-command="previous"]').disabled=index===0;
 document.querySelector('[data-command="next"]').disabled=index===S.length-1;
 document.getElementById('chapterLabel').textContent=chapterFor(index);
 document.getElementById('sceneLabel').textContent=index===0?'一段关于成长、善意与愿望的旅程':S[index].title;
 document.getElementById('sceneNumber').textContent=String(index+1).padStart(2,'0')+' / '+S.length;
 try{history.replaceState(null,'','#'+id);}catch(e){}
 document.title='童年里，什么值得被留下 · '+S[index].title;
 setTimer(timerValues[id]||0);updateProtection();if(id==='annewish')updateWishes();
 placeCamera(old,shot,previousId,id,Math.sign(index-previousIndex)||1,replay);
 if(old&&!replay)beep('page');save();
}
function captureEdits(){if(!scene)return;scene.querySelectorAll('[data-edit]').forEach(e=>mem.edits[e.dataset.edit]=e.innerText.trim());}
function updateWishes(){scene.querySelectorAll('[data-wish]').forEach(el=>el.classList.toggle('visible',marked(el.dataset.wish)));}
function setTimer(n){clearInterval(timerInterval);timerRunning=false;timerDefault=n;timerRemaining=n;const el=document.getElementById('timer');el.hidden=!n;el.classList.remove('finished');paintTimer();}
function paintTimer(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;document.getElementById('timerValue').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');document.getElementById('timerRing').style.strokeDashoffset=timerDefault?144.513*(1-timerRemaining/timerDefault):0;document.getElementById('timerToggle').setAttribute('aria-label',timerRunning?'暂停计时':'开始计时');}
function toggleTimer(){if(!timerDefault){notify('这一幕由你掌握停留时间');return;}if(timerRunning){clearInterval(timerInterval);timerRunning=false;paintTimer();return;}if(timerRemaining<=0)timerRemaining=timerDefault;timerRunning=true;document.getElementById('timer').classList.remove('finished');let last=Date.now();timerInterval=setInterval(()=>{const now=Date.now();if(now-last>=950){const secs=Math.max(1,Math.floor((now-last)/1000));last+=secs*1000;timerRemaining=Math.max(0,timerRemaining-secs);paintTimer();if(!timerRemaining){clearInterval(timerInterval);timerRunning=false;document.getElementById('timer').classList.add('finished');paintTimer();}}},200);paintTimer();}
function openPanel(title,html){captureEdits();save();panelTitle.textContent=title;panelBody.innerHTML=html;panel.showModal();panelBody.scrollTop=0;}
function menu(){openPanel('课堂目录','<div class="menu-actions"><button data-command="help">操作说明</button><button data-command="contrast">投影增强</button><button data-command="motion">切换简静动画</button><button data-command="sources">教师资料来源</button><button data-command="reset">清空本次课堂记录</button></div><div class="menu-grid">'+S.map((s,i)=>'<button data-jump="'+i+'" class="'+(i===index?'current':'')+'"><small>'+safe(s.time)+'</small>'+safe(s.title)+'</button>').join('')+'</div>');}
function notes(){const n=N.find(n=>n.id===S[index].id)||{};openPanel('教师讲稿 · '+S[index].title,'<p class="notes-meta">'+safe(S[index].time)+'　'+safe(S[index].id)+'</p><h3>这一段怎么说</h3><p class="teacher-speech">'+safe(n.teacher||'教师静候，把完整时间交给学生。')+'</p><h3>画面与操作</h3><p>'+safe(n.action||'')+'</p><h3>停留与课堂安排</h3><p>'+safe(n.hold||'')+'</p>'+(n.optional?'<h3>按需承接</h3><p class="teacher-speech">'+safe(n.optional)+'</p>':''));}
function help(){openPanel('课前操作说明','<h3>使用方式</h3><p>按 →、空格或 PageDown 推进下一幕；按 ← 或 PageUp 返回上一幕。每一幕都可以停留，材料不会自动翻走。</p><p>进入全屏后（浏览器受限时自动进入专注模式），点击没有专用按钮的画面区域，或在同一区域单击鼠标右键，都会进入下一幕。按钮、划线词语、输入区、文字选取与弹窗保留各自的操作；拖动和滚动不换幕。非全屏时使用控制栏或键盘推进。</p><p>F：全屏　M：目录　N：教师讲稿　R：重播本幕　T：开始或暂停计时　Esc：关闭面板</p><p>移动鼠标到屏幕下方，可显示控制栏。计时归零只作提示；由教师决定何时推进。每次换幕，计时都会暂停并重置为该幕所需时间。</p><h3>课堂操作</h3><p>并读与修复时，点击学生指出的词语留下划线；再次点击可取消。断箭头关卡，两条箭头分别可断开和恢复。补语、理由、赞美句与小组主张可由教师填写，文字自动保存在本浏览器。</p><p>小组讨论时点击证据可放大，关闭后回到总览，计时继续。现实资料泡泡可以点击，也可以用翻页笔依次展开。</p><h3>投影与声音</h3><p>所有插画、照片、字体和讲稿均随课件保存在本地；下载并解压整个仓库后，打开 index.html 即可离线使用。声音默认关闭；控制栏 ♪ 可开启轻微换幕提示。投影较淡时，在目录中启用“投影增强”。“简静动画”会直接显示镜头结束状态。</p><p>教师讲稿、材料来源和本说明只用于备课查看，关闭面板即可回到学生画面。开始新班级前可在目录里清空课堂记录。</p>');}
function sourceHTML(obj){if(Array.isArray(obj))return '<ul class="note-list">'+obj.map(x=>'<li>'+sourceHTML(x)+'</li>').join('')+'</ul>';if(obj&&typeof obj==='object')return Object.entries(obj).map(([k,v])=>'<p><strong>'+safe(k)+'</strong></p>'+sourceHTML(v)).join('');const t=String(obj||'');return /^https?:\/\//.test(t)?'<p><a href="'+safe(t)+'" target="_blank" rel="noreferrer">'+safe(t)+'</a></p>':'<p>'+safe(t)+'</p>';}
function sourcePanel(){openPanel('教师资料来源与文本说明','<p>以下为教师备课资料，学生主画面不显示编号、删节标记与来源。原著的不连续选段采用独立段块呈现；游戏概括由教师拟写，须在规则讲解中说明。现实儿童材料来自有日期的历史报道。</p><div class="sources-list">'+sourceHTML(SOURCES)+'</div><h3>美术与字体</h3><p>场景、读者角色与保护者插画为本课原创生成的文学意象，并非历史现场照片。真实儿童照片保持其纪实身份。中文字体采用 Noto Sans CJK SC 与 Noto Serif CJK SC，依照 SIL Open Font License 嵌入子集。</p>');}
function material(key){const t=M[key];let content=t.blocks;if(key==='A')content=[t.context_excerpt,...t.blocks];if(key==='D')content=[...t.blocks,...t.next_time_blocks];openPanel(t.title,'<div class="evidence-modal">'+fragments(content)+'</div>');}
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
 try{Promise.resolve(request.call(document.documentElement)).then(()=>{syncFullscreenControl();notify('全屏中：空白处单击或右键进入下一幕');}).catch(focusFallback);}catch(e){focusFallback();}
}
function command(name){switch(name){case'next':go(index+1);break;case'previous':go(index-1);break;case'menu':menu();break;case'notes':notes();break;case'help':help();break;case'sources':sourcePanel();break;case'fullscreen':full();break;case'timer':toggleTimer();break;case'replay':go(index,true);break;case'sound':soundEnabled=!soundEnabled;document.querySelector('[data-command="sound"]').setAttribute('aria-pressed',soundEnabled);document.querySelector('[data-command="sound"]').setAttribute('aria-label',soundEnabled?'关闭音效':'开启音效');beep('done');notify(soundEnabled?'音效已开启':'音效已关闭');break;case'contrast':document.body.classList.toggle('high-contrast');notify(document.body.classList.contains('high-contrast')?'投影增强已开启':'已恢复柔和画面');break;case'motion':document.body.classList.toggle('reduce-motion');if(document.body.classList.contains('reduce-motion'))cameraAnimations.forEach(a=>{try{a.finish();}catch(e){}});notify(document.body.classList.contains('reduce-motion')?'已切换简静动画':'已恢复完整动画');break;case'reset':openPanel('清空课堂记录','<p>将清空本浏览器中的划线、补语、箭头与小组记录，并回到封面。</p><div class="menu-actions"><button data-command="confirm-reset">清空并回到封面</button><button data-command="cancel-reset">保留记录</button></div>');break;case'confirm-reset':mem.marks={};mem.edits={};mem.cuts={};mem.complete={};save();scene.querySelectorAll('[data-edit]').forEach(e=>e.innerText='');go(0);break;case'cancel-reset':panel.close();break;}}
function advanceFromCanvas(e){
 const selected=window.getSelection?window.getSelection().toString():'';
 const fullscreen=window.ClassroomInput.isFullscreen(document,fullscreenMedia);
 const allowed=window.ClassroomInput.canAdvance({fullscreen,panelOpen:panel.open,transitioning,target:e.target,selectedText:selected,dragged:pointerDragged,inStage:stage.contains(e.target)});
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
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b){advanceFromCanvas(e);return;}if(b.dataset.command){command(b.dataset.command);return;}if(b.dataset.jump!==undefined){go(Number(b.dataset.jump));return;}if(b.dataset.goto){go(S.findIndex(s=>s.id===b.dataset.goto));return;}if(b.dataset.word){const k=S[index].id;mem.marks[k]=mem.marks[k]||{};mem.marks[k][b.dataset.word]=!mem.marks[k][b.dataset.word];b.classList.toggle('marked');b.setAttribute('aria-pressed',b.classList.contains('marked'));updateProtection();updateWishes();save();return;}if(b.dataset.arrow){mem.cuts[b.dataset.arrow]=!mem.cuts[b.dataset.arrow];b.classList.toggle('cut',mem.cuts[b.dataset.arrow]);b.setAttribute('aria-pressed',!!mem.cuts[b.dataset.arrow]);save();return;}if(b.dataset.complete){mem.complete[b.dataset.complete]=!mem.complete[b.dataset.complete];b.closest('.repair-layout').classList.toggle('is-complete',mem.complete[b.dataset.complete]);b.classList.toggle('completed',mem.complete[b.dataset.complete]);b.textContent=mem.complete[b.dataset.complete]?'已留下证据':'完成修复';beep('done');save();return;}if(b.dataset.scale){scene.querySelectorAll('[data-scale]').forEach(x=>x.classList.toggle('active',x===b));return;}if(b.dataset.art){const el=scene.querySelector('.hauler-image');el.style.transformOrigin=b.dataset.art==='rope'?'64% 53%':'27% 42%';el.style.transform=b.dataset.art==='whole'?'scale(1)':'scale(1.65)';scene.querySelectorAll('[data-art]').forEach(x=>x.classList.toggle('active',x===b));return;}if(b.dataset.material){material(b.dataset.material);return;}if(b.dataset.daily){const responses={'安全':'不必担心下一次伤害，能安心睡下。','自由':'能正常出门，与伙伴相见。','尊重':'说话有人听，痛苦被认真对待。','学习':'有课堂、有同伴，也有继续学习的机会。'};scene.querySelectorAll('[data-daily]').forEach(x=>x.classList.toggle('active',x===b));const el=document.getElementById('dailyResponse');if(b.dataset.daily==='自填'){el.innerHTML=editable('otherCondition','这个条件在生活里是……');el.querySelector('[contenteditable]').focus();}else el.textContent=responses[b.dataset.daily];}});
document.addEventListener('input',e=>{if(e.target.matches('[data-edit]')){mem.edits[e.target.dataset.edit]=e.target.innerText.trim();save();}});
document.addEventListener('paste',e=>{if(e.target.isContentEditable){e.preventDefault();const text=(e.clipboardData||window.clipboardData).getData('text');document.execCommand('insertText',false,text);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.open)panel.close();else if(document.body.classList.contains('presentation-mode')){document.body.classList.remove('presentation-mode');syncFullscreenControl();}return;}if(e.key==='F11'&&!e.repeat){document.body.classList.toggle('presentation-mode',!fullscreenMedia.matches);syncFullscreenControl();return;}if(e.target.isContentEditable||e.target.matches('input,textarea,select'))return;if((e.key===' '||e.key==='Enter')&&e.target.closest('button,a,[role=button]'))return;if(e.repeat&&['ArrowRight','ArrowLeft','PageDown','PageUp',' '].includes(e.key))return;if(panel.open){if(e.key.toLowerCase()==='m'){e.preventDefault();menu();}return;}const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();command('next');}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();command('previous');}else if(k==='f'){e.preventDefault();full();}else if(k==='m')menu();else if(k==='n')notes();else if(k==='r')go(index,true);else if(k==='t')toggleTimer();});
document.addEventListener('pointermove',e=>{if(e.clientY>innerHeight-130||e.pointerType==='touch')showControls();});document.addEventListener('touchstart',showControls,{passive:true});
document.getElementById('closePanel').addEventListener('click',()=>panel.close());panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
document.getElementById('timerToggle').addEventListener('click',toggleTimer);document.getElementById('timerReset').addEventListener('click',()=>setTimer(timerDefault));
document.addEventListener('fullscreenchange',()=>{document.body.classList.remove('presentation-mode');syncFullscreenControl();});
window.addEventListener('beforeunload',()=>{captureEdits();save();});
if(matchMedia('(prefers-reduced-motion:reduce)').matches)document.body.classList.add('reduce-motion');
go(index);showControls();
// Warm up the next illustrations without putting the entire picture book on the critical path.
const warm=()=>{['modern-room.png','old-room.png','anne-room.png','bubble-hall.png'].forEach(name=>{const image=new Image();image.src=A[name];if(image.decode)image.decode().catch(()=>{});});};
if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2500});else setTimeout(warm,1800);
window.addEventListener('hashchange',()=>{const target=S.findIndex(s=>s.id===location.hash.slice(1));if(target>=0&&target!==index){if(transitioning){try{history.replaceState(null,'','#'+S[index].id);}catch(e){}}else go(target);}});

})();
