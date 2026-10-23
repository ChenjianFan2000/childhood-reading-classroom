'use strict';
// Independent Chromium, actual file URLs, no user profile or remote service.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(option('--out','browser-report'));
fs.mkdirSync(OUT,{recursive:true});
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'scripts/lesson-data.js'),'utf8'),ctx);
const L=ctx.window.LINE_LESSON,C=L.cues,entry=pathToFileURL(path.join(ROOT,'index.html')).href;
const report={mode:'actual-file-offline',checks:[],layouts:[],motion:[],errors:[],externalRequests:[],passed:false};
const capture=args.includes('--screenshots');
const ok=s=>{report.checks.push(s);console.log('PASS '+s);};
const state=p=>p.evaluate(()=>window.lineStoryState);
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function key(p,k){await p.keyboard.press(k);await sleep(230);}
async function jump(p,id){await p.evaluate(id=>{location.hash=id;},id);await p.waitForFunction(id=>window.lineStoryState?.id===id,id);await sleep(40);}
async function load(p,id='cover'){await p.goto(entry+'#'+id,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>!!window.lineStoryState);}
function watch(p){p.on('pageerror',e=>report.errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});}
async function shot(p,name){if(capture)await p.screenshot({path:path.join(OUT,name+'.png')});}
async function bounds(p,id){
 const data=await p.evaluate(()=>{
  const a=document.querySelector('#content article'),s=document.querySelector('#stage'),r=a.getBoundingClientRect(),b=s.getBoundingClientRect(),timer=document.querySelector('#timer'),controls=document.querySelector('#controls');
  const rect=q=>({x:q.x,y:q.y,w:q.width,h:q.height,bottom:q.bottom,right:q.right});
  return {article:rect(r),stage:rect(b),timer:timer.hidden?null:rect(timer.getBoundingClientRect()),controls:rect(controls.getBoundingClientRect()),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,portrait:innerWidth<=620&&innerHeight>innerWidth};
 });
 assert.ok(!data.horizontalOverflow,id+' horizontal overflow');
 if(data.timer)assert.ok(data.timer.bottom<=data.controls.y-4||data.timer.right<=data.controls.x||data.timer.x>=data.controls.right,id+' timer obscured by controls '+JSON.stringify(data));
 if(!data.portrait&&C.find(c=>c.id===id).kind!=='art'){
  assert.ok(data.article.x>=data.stage.x-2&&data.article.right<=data.stage.right+2,id+' horizontal text clipping '+JSON.stringify(data));
  assert.ok(data.article.y>=data.stage.y+25&&data.article.bottom<=data.stage.bottom-35,id+' vertical text clipping '+JSON.stringify(data));
 }
 report.layouts.push({id,...data});
}
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(option('--browser')?{executablePath:option('--browser')}:{})});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'reduce',offline:true});
 const p=await context.newPage();watch(p);await load(p);
 for(const c of C){
  if(c.number)await key(p,'ArrowRight');assert.equal((await state(p)).id,c.id);
  await bounds(p,c.id);
  if(c.media){assert.ok(await p.locator('#media img').evaluate(e=>e.complete&&e.naturalWidth>0),c.id);assert.equal(await p.locator('#media img').evaluate(e=>getComputedStyle(e).objectFit),'contain');}
  if(c.closeMedia)assert.equal(await p.locator('#media img').count(),0,c.id+' closed');
  if(['paired','window-reading','window-stay','grandfather','g2-repair','g2-cut','protection','protection-cost','again-answer','anne-reading','anne-wishes','group','yamen','varvara','final-reveal','final-support','final-day'].includes(c.id))await shot(p,c.id);
 }
 for(let i=C.length-2;i>=0;i--){await key(p,'ArrowLeft');assert.equal((await state(p)).id,C[i].id);assert.ok(!(await state(p)).animating,C[i].id+' restore animates');}
 ok('All 57 cues advance and all 56 backward steps restore a settled state');
 const inferenceState=page=>page.evaluate(()=>({
  text:[...document.querySelectorAll('#content [data-arrow]')].map(e=>e.getAttribute('aria-pressed')==='true'),
  world:['.arrow-first','.arrow-second'].map(s=>document.querySelector('.zone-logic '+s).dataset.cut==='true')
 }));
 await jump(p,'g2-repair');
 await p.locator('[data-arrow="0"]').click();
 assert.deepEqual(await inferenceState(p),{text:[true,false],world:[true,false]});
 await p.evaluate(()=>{window.__quote=document.querySelector('#content [data-passage]');window.__arrow=document.querySelector('[data-arrow="1"]');});
 await key(p,'ArrowRight');assert.equal((await state(p)).id,'g2-cut');
 assert.ok(await p.evaluate(()=>window.__quote===document.querySelector('#content [data-passage]')&&window.__arrow===document.querySelector('[data-arrow="1"]')));
 assert.deepEqual(await inferenceState(p),{text:[true,true],world:[true,true]});
 assert.equal(await p.locator('[data-arrow]:disabled').count(),2);
 await key(p,'ArrowLeft');assert.deepEqual(await inferenceState(p),{text:[true,false],world:[true,false]});
 await p.reload();await p.waitForFunction(()=>!!window.lineStoryState);
 assert.deepEqual(await inferenceState(p),{text:[true,false],world:[true,false]});
 await p.locator('[data-arrow="0"]').click();assert.deepEqual(await inferenceState(p),{text:[false,false],world:[false,false]});
 ok('Both unsupported inferences close without changing the evidence; text and SVG choices stay synchronized through return and refresh');
 await jump(p,'sensitive');const word=p.locator('#content [data-word]').first();await word.click();const text=await word.getAttribute('data-word');
 await key(p,'ArrowRight');await key(p,'ArrowLeft');assert.ok(await p.locator('#content [data-word]').filter({hasText:text}).first().evaluate(e=>e.classList.contains('emph')));
 await p.reload();await p.waitForFunction(()=>!!window.lineStoryState);assert.equal((await state(p)).id,'sensitive');assert.ok(await p.locator('#content [data-word]').first().evaluate(e=>e.classList.contains('emph')));
 ok('Reader marks survive forward/backward navigation and page refresh');
 await jump(p,'g3-repair');assert.ok(!(await p.locator('#content').innerText()).includes('当然要打啦'));
 await jump(p,'again-question');assert.ok(!(await p.locator('#content').innerText()).includes('当然要打啦'));
 await jump(p,'group');await p.locator('[data-evidence="window"]').click();assert.ok(!(await p.locator('#panel').innerText()).includes('教师提示'));await key(p,'Escape');
 ok('The later answer is withheld during protection and its question; evidence review has no teacher notes');
 for(const size of [{width:1366,height:768},{width:1280,height:960},{width:1024,height:768},{width:390,height:844}]){
  await p.setViewportSize(size);
  for(const id of ['paired','window-reading','grandfather','g1-repair','g2-repair','g2-cut','g3-repair','anne-reading','group','author-read','yamen','varvara','conditions','exit','final-day']){
   await jump(p,id);await bounds(p,id);
   if(['paired','window-reading','g2-cut','anne-reading','group'].includes(id))await shot(p,id+'-'+size.width+'x'+size.height);
  }
  ok('Reading and material layouts fit '+size.width+'x'+size.height);
 }
 await p.setViewportSize({width:1600,height:900});await jump(p,'day-road');await p.locator('#stage').click({position:{x:1500,y:550}});assert.equal((await state(p)).id,'day-road');
 await key(p,'f');await p.locator('#stage').click({position:{x:1500,y:550},button:'right'});assert.equal((await state(p)).id,'day-road');
 if(await p.evaluate(()=>!!document.fullscreenElement))await key(p,'f');
 ok('Blank clicks and right clicks do not advance by default, including fullscreen');
 await p.clock.install();await jump(p,'paired');await p.clock.fastForward(11000);let before=(await state(p)).timer;await key(p,'r');assert.ok((await state(p)).timer<=before&&(await state(p)).timer>before-2);
 await key(p,'Shift+r');assert.ok((await state(p)).timer>118);await key(p,'t');before=(await state(p)).timer;await p.clock.fastForward(20000);assert.ok(Math.abs((await state(p)).timer-before)<.05);
 await key(p,'r');assert.equal((await state(p)).timerRunning,false);await key(p,'b');await p.clock.fastForward(10000);await key(p,'Escape');assert.equal((await state(p)).timerRunning,false);
 await key(p,'t');await key(p,'b');before=(await state(p)).timer;await p.clock.fastForward(15000);assert.ok(Math.abs((await state(p)).timer-before)<.05);await key(p,'Escape');assert.equal((await state(p)).timerRunning,true);
 for(const id of ['paired','group','exit']){await jump(p,id);await key(p,'Shift+r');await p.clock.fastForward((C.find(c=>c.id===id).timer+2)*1000);assert.equal((await state(p)).id,id);assert.equal((await state(p)).timer,0);}
 await jump(p,'group');await key(p,'Shift+r');await p.clock.fastForward(21000);await key(p,'t');before=(await state(p)).timer;await p.reload();await p.waitForFunction(()=>!!window.lineStoryState);assert.equal((await state(p)).id,'group');assert.equal((await state(p)).timerRunning,false);assert.ok(Math.abs((await state(p)).timer-before)<1);
 ok('R preserves time; Shift+R resets it; T, blanking, expiry and refresh preserve intentional clock state');
 const popupPromise=p.waitForEvent('popup');await key(p,'p');const teacher=await popupPromise;watch(teacher);
 await teacher.waitForFunction(()=>window.linePresenterState?.connected);assert.equal((await teacher.evaluate(()=>window.linePresenterState)).cueId,'group');
 assert.ok((await teacher.locator('#teacherWords').innerText()).length>0);assert.ok(!(await p.locator('#content').innerText()).includes('本节教师'));
 assert.equal(await teacher.locator('#nodeList button').count(),15);
 await teacher.locator('[data-command="next"]').click();await p.waitForFunction(()=>window.lineStoryState.id==='share-one');await teacher.waitForFunction(()=>window.linePresenterState.cueId==='share-one');
 const beforeIntrusion=(await state(p)).id;await p.evaluate(()=>window.postMessage({protocol:'childhood-line-story-presenter-v2',session:'wrong',type:'command',command:'next'},'*'));await sleep(300);assert.equal((await state(p)).id,beforeIntrusion);
 await p.reload();await p.waitForFunction(()=>!!window.lineStoryState);await teacher.waitForFunction(()=>window.linePresenterState.connected&&window.linePresenterState.cueId==='share-one');
 await teacher.locator('[data-command="next"]').click();await p.waitForFunction(()=>window.lineStoryState.id==='share-two');await shot(teacher,'presenter');
 await teacher.close();await p.waitForFunction(()=>!window.lineStoryState.presenterConnected);
 const reopen=p.waitForEvent('popup');await key(p,'p');const teacher2=await reopen;watch(teacher2);await teacher2.waitForFunction(()=>window.linePresenterState?.connected);assert.equal((await teacher2.evaluate(()=>window.linePresenterState)).cueId,'share-two');await teacher2.close();
 ok('Offline file:// teacher window controls and reconnects after student refresh, rejects unrelated messages, and reopens at current cue');
 const motionContext=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'no-preference',offline:true});
 const m=await motionContext.newPage();watch(m);await load(m);await m.evaluate(()=>{window.__thread=document.querySelector('#story-thread');});
 for(let i=1;i<C.length;i++){
  await key(m,'ArrowRight');assert.equal((await state(m)).id,C[i].id);
  if((await state(m)).animating){await key(m,'ArrowRight');assert.equal((await state(m)).id,C[i].id,'finish must not skip '+C[i].id);assert.equal((await state(m)).animating,false);}
  assert.ok(await m.evaluate(()=>window.__thread===document.querySelector('#story-thread')));
  if(C[i].closeMedia)assert.equal(await m.locator('#media img').count(),0,C[i].id);
  report.motion.push(C[i].id);
 }
 ok('All 56 full-motion transitions finish without skipping a cue and retain one narrative thread element');
 await jump(m,'g3-repair');await key(m,'ArrowRight');assert.equal((await state(m)).id,'protection');await key(m,'a');assert.equal((await state(m)).paused,true);
 const sample=()=>m.evaluate(()=>document.querySelector('#world .zone.current .focus-lens').getBoundingClientRect().width);
 const frozen=await sample();await sleep(350);assert.ok(Math.abs(await sample()-frozen)<.1);await key(m,'b');await key(m,'Escape');assert.equal((await state(m)).paused,true);await key(m,'a');assert.equal((await state(m)).paused,false);await key(m,'ArrowRight');assert.equal((await state(m)).id,'protection');
 ok('Motion pause freezes the local camera, blackout restores the prior paused state, and next finishes the gesture');
 // The question must follow the visible stop, and already received help must
 // survive it. Inspect actual intermediate frames, not just declared timings.
 await jump(m,'anne-wishes');await key(m,'ArrowRight');
 assert.equal((await state(m)).id,'anne-blocked');
 const at=async time=>m.evaluate(t=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=t;});},time);
 await at(1200);
 const wish=()=>m.locator('.zone-anne .wish-traveller').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41);
 const midway=await wish();assert.ok(midway>0&&midway<304);
 assert.ok(Number(await m.locator('#content h1').evaluate(e=>getComputedStyle(e).opacity))<.05);
 await at(3200);assert.ok(Math.abs(await wish()-304)<.05);
 assert.equal(Number(await m.locator('.zone-anne .help-objects').evaluate(e=>getComputedStyle(e).opacity)),1);
 assert.ok(Number(await m.locator('#content h1').evaluate(e=>getComputedStyle(e).opacity))>.95);
 await shot(m,'anne-blocked-settled');
 ok('The wish moves and stops before the question appears; the help stays visible');
 await jump(m,'final-reveal');await key(m,'ArrowRight');
 await at(3200);assert.equal(Number(await m.locator('.zone-finale .roof').evaluate(e=>getComputedStyle(e).opacity)),.38);
 await at(7300);assert.equal(Number(await m.locator('.zone-finale .roof').evaluate(e=>getComputedStyle(e).opacity)),.15);
 const hand=await m.locator('.zone-finale .support-hand-three').boundingBox();assert.ok(hand.y>100&&hand.y+hand.height<860);
 await shot(m,'final-support-settled');
 ok('Several supports connect before the boundary retreats, with the lower hand fully visible');
 // Inspect real timing for the long final reveal, including the intended silent delay.
 // The frame inspection above intentionally paused the active cue. Complete it
 // with the first advance, then enter the final day with the second advance.
 await key(m,'ArrowRight');assert.equal((await state(m)).id,'final-support');assert.equal((await state(m)).animating,false);
 await key(m,'ArrowRight');assert.equal((await state(m)).id,'final-day');
 assert.equal(await m.locator('#camera').evaluate(e=>e.getAnimations().length),0,'Ending must not fly across unrelated scenes');
 await sleep(1000);assert.ok(Number(await m.locator('#content article').evaluate(e=>getComputedStyle(e).opacity))<.05);
 await sleep(8500);assert.ok(Number(await m.locator('#content article').evaluate(e=>getComputedStyle(e).opacity))>.95);
 assert.ok(!(await state(m)).animating);await shot(m,'ending-settled');await sleep(600);assert.ok(!(await state(m)).animating);
 ok('Final sentence waits eight seconds, then settles without looping or automatic navigation');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);ok('No uncaught JavaScript errors and no HTTP(S) requests from either offline window');
 report.passed=true;
})().catch(e=>{report.failure=e.stack||String(e);console.error(report.failure);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,browser:report.browser,checks:report.checks.length,failure:report.failure},null,2));
});
