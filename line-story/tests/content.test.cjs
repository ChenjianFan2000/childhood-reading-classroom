'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
const data=fs.readFileSync(path.join(root,'scripts/lesson-data.js'),'utf8');
vm.runInNewContext(data,ctx);
const L=ctx.window.LINE_LESSON,C=L.cues,by=id=>C.find(c=>c.id===id);
test('57 unique cues preserve an uninterrupted 40-minute schedule',()=>{
 assert.equal(C.length,57);assert.equal(new Set(C.map(c=>c.id)).size,C.length);
 assert.equal(C.reduce((s,c)=>s+c.seconds,0),2400);assert.equal(C[0].id,'cover');assert.equal(C.at(-1).id,'final-day');
 C.forEach((c,i)=>{assert.equal(c.number,i);assert.ok(c.action&&c.next);assert.equal(c.end-c.start,c.seconds);if(i)assert.equal(c.start,C[i-1].end);});
});
test('15 recognizable nodes cover every cue once and maintain chronological order',()=>{
 assert.equal(L.nodes.length,15);let last=-1;const covered=[];
 for(const n of L.nodes){const a=C.findIndex(c=>c.id===n.firstCue),b=C.findIndex(c=>c.id===n.lastCue);assert.equal(a,last+1);assert.ok(b>=a);assert.equal(n.seconds,C.slice(a,b+1).reduce((s,c)=>s+c.seconds,0));covered.push(...C.slice(a,b+1));last=b;}
 assert.equal(last,C.length-1);assert.equal(covered.length,C.length);
});
test('reading, discussion and independent writing retain their full protected times',()=>{
 for(const [id,seconds] of [['paired',120],['group',300],['exit',90]]){assert.equal(by(id).timer,seconds);assert.equal(by(id).seconds,seconds);}
 assert.ok(by('window-reading').seconds>=90);assert.ok(by('anne-reading').seconds>=55);
 for(const id of ['yamen','varvara'])assert.ok(by(id).seconds>=38);
});
test('literary evidence stays long and is part of the default teaching path',()=>{
 assert.ok(L.passages.warmth.join('').includes('用一根不断的线'));assert.ok(L.passages.window.join('').length>200);
 assert.equal(by('window-reading').passage,'window');assert.equal(L.passages.anne.length,3);assert.ok(L.passages.anne.join('').includes('一滴水'));
 assert.ok(L.passages.anne_wish.join('').includes('骑车'));assert.equal(L.sources.anne.excerpts.length,3);
});
test('students judge before the default inference breaks and before the later answer appears',()=>{
 assert.ok(by('g2-repair').number<by('g2-cut').number);assert.equal(by('g2-cut').passage,by('g2-repair').passage);
 assert.ok(by('g3-repair').number<by('protection').number);assert.ok(by('protection-cost').number<by('again-question').number);assert.ok(by('again-question').number<by('again-answer').number);
 for(const c of C.slice(0,by('again-question').number))assert.ok(!JSON.stringify({body:c.body,passage:c.passage,focusQuote:c.focusQuote}).includes('当然要打啦'),c.id);
});
test('final 45 seconds follow independent writing and leave the first two moments silent',()=>{
 const ending=C.slice(by('final-reveal').number);assert.equal(ending.reduce((n,c)=>n+c.seconds,0),45);
 assert.equal(by('final-reveal').teacher,'');assert.equal(by('final-support').teacher,'');assert.ok(by('final-day').teacher.includes('普通'));
 assert.ok(by('exit').number<by('final-reveal').number);
});
test('only the approved unaltered three local bitmap materials are included',()=>{
 assert.deepEqual([...new Set(C.map(c=>c.media).filter(Boolean))].sort(),['haulers','varvara','yamen']);
 const expected={'haulers.jpg':'79eef6a3dd08c417208a42184d10e1254fc05591a1ed244b29f23dd55b3f38b1','varvara.webp':'61d79f3da4017ff6ae2c33fd8724c0c547d5b9449d1cf3e5b38a898d49abb1e2','yamen.webp':'a565021db9840abb4707b4c591e710f2aeb2a9af37b5097312f0fe275c919dd1'};
 assert.equal(fs.readdirSync(path.join(root,'assets')).length,3);
 for(const [name,hash] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets',name))).digest('hex'),hash);
});
test('no teacher typing, external scripts, network fonts or runtime network dependency',()=>{
 const files=['index.html','presenter.html','scripts/app.js','scripts/presenter.js'];
 for(const f of files){const s=fs.readFileSync(path.join(root,f),'utf8');assert.doesNotMatch(s,/<(?:input|textarea)\b|contenteditable\s*=/i,f);assert.doesNotMatch(s,/(?:src|href)=["']https?:/i,f);assert.doesNotMatch(s,/\bfetch\s*\(|XMLHttpRequest|WebSocket/,f);}
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[e.name]);
 assert.ok(walk(root).every(f=>!(/\.(woff2?|ttf|otf)$/i.test(f))));
});
test('historical reporting dates and teacher source distinctions remain explicit',()=>{
 assert.equal(L.sources.yamen.published,'2024-09-10');assert.equal(L.sources.varvara.published,'2022-12-19');assert.equal(L.sources.anne.diary_entry_date,'1943-12-24');
 assert.ok(by('varvara').teacher.includes('不是烛光场景'));assert.ok(by('yamen').teacher.includes('父亲'));
});
test('teacher manuscript is generated from exactly this lesson source',()=>{
 const md=fs.readFileSync(path.join(root,'teacher_script.md'),'utf8'),sha=crypto.createHash('sha256').update(data).digest('hex');
 assert.ok(md.includes(sha),'manuscript data hash');for(const c of C){assert.ok(md.includes(c.id),c.id);if(c.teacher)assert.ok(md.includes(c.teacher),c.id+' speech');}
});
test('entry points refer only to available package files',()=>{
 for(const page of ['index.html','presenter.html']){const h=fs.readFileSync(path.join(root,page),'utf8');for(const m of h.matchAll(/(?:src|href)=["']([^"']+)["']/g)){if(m[1].startsWith('#'))continue;assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);}}
});
test('release manifest matches both bytes and SHA-256 of every listed file',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 for(const [name,meta] of Object.entries(m.files)){assert.ok(!name.startsWith('/')&&!name.includes('..'));const bytes=fs.readFileSync(path.join(root,name));assert.equal(bytes.length,meta.bytes,name);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256,name);}
});

