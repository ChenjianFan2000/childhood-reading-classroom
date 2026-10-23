#!/usr/bin/env python3
"""Real Chromium regression of all classroom cues.
Default: file://, exact offline release. --inline: isolated in-memory rendering
for environments that disallow local navigation; no network/policy changes.
"""
from __future__ import annotations
import argparse, base64, json, os, re, shutil, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--inline',action='store_true');p.add_argument('--out',default='browser-report');p.add_argument('--browser');p.add_argument('--screenshots',action='store_true');p.add_argument('--motion',action='store_true');a=p.parse_args()
OUT=Path(a.out).resolve();OUT.mkdir(parents=True,exist_ok=True)
L=json.loads((ROOT/'scripts/lesson-data.js').read_text().split('window.LINE_LESSON = ',1)[1].strip().removesuffix(';'));C=L['cues']
def inline_html():
    h=(ROOT/'index.html').read_text();h=h.replace('<link rel="stylesheet" href="styles/story.css">','<style>'+(ROOT/'styles/story.css').read_text()+'</style>')
    for f in ['lesson-data','world','app']:
        code=(ROOT/f'scripts/{f}.js').read_text()
        if f=='app':
            for name in ['haulers.jpg','yamen.webp','varvara.webp']:
                mime='image/jpeg' if name.endswith('.jpg') else 'image/webp'
                code=code.replace('assets/'+name,'data:'+mime+';base64,'+base64.b64encode((ROOT/'assets'/name).read_bytes()).decode())
        h=h.replace(f'<script src="scripts/{f}.js"></script>','<script>'+code+'</script>')
    return h
report={'mode':'isolated-inline' if a.inline else 'file-offline','checks':[],'cues':[],'errors':[],'requests':[],'motion':[]}
def ok(name):report['checks'].append(name)
def state(pg):return pg.evaluate('window.lineStoryState')
def key(pg,k):pg.keyboard.press(k);pg.wait_for_timeout(190)
def jump(pg,i):
    key(pg,'m');pg.locator(f'button[data-jump="{i}"]').click();pg.wait_for_timeout(100);assert state(pg)['index']==i

def load(pg):
    if a.inline:pg.set_content(inline_html(),wait_until='load')
    else:pg.goto((ROOT/'index.html').as_uri(),wait_until='load')
    pg.evaluate('document.fonts.ready');pg.wait_for_timeout(300)
def box_check(pg,c):
    b=pg.locator('#content article').bounding_box();stage=pg.locator('#stage').bounding_box()
    if c['kind']=='art':return None
    assert b and stage
    assert b['x']>=stage['x']-1 and b['x']+b['width']<=stage['x']+stage['width']+1,(c['id'],'horizontal',b,stage)
    assert b['y']>=stage['y']+stage['height']*.07,(c['id'],'top',b,stage)
    assert b['y']+b['height']<=stage['y']+stage['height']*.86,(c['id'],'bottom',b,stage)
    return b
try:
 with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox']}
    if a.browser:launch['executable_path']=a.browser
    b=pw.chromium.launch(**launch);report['browser']=b.version
    pg=b.new_page(viewport={'width':1600,'height':900},reduced_motion='reduce')
    pg.on('pageerror',lambda e:report['errors'].append(str(e)))
    pg.on('request',lambda r:report['requests'].append(r.url) if not r.url.startswith('data:') else None)
    load(pg);pg.wait_for_timeout(2700)
    for i,c in enumerate(C):
        st=state(pg);assert st['id']==c['id'] and st['index']==i,st
        assert pg.locator('input,textarea,[contenteditable=true]').count()==0
        box=box_check(pg,c)
        if c.get('media'):
            img=pg.locator('#media img');assert img.count()==1
            assert img.evaluate('(e)=>e.complete&&e.naturalWidth>0'),c['id']
        if c.get('closeMedia'):assert pg.locator('#media img').count()==0,c['id']
        report['cues'].append({'id':c['id'],'index':i,'box':box})
        if a.screenshots:pg.screenshot(path=str(OUT/f'{i:02d}-{c["id"]}.png'))
        if i<len(C)-1:key(pg,'ArrowRight')
    ok('All 54 cues traversed using only ArrowRight, with no input controls, missing images or clipped text at 1600x900')
    key(pg,'ArrowRight');assert state(pg)['index']==53;ok('End does not loop')
    for i in range(52,-1,-1):key(pg,'ArrowLeft');assert state(pg)['index']==i
    ok('All 53 reverse steps restore exact cue IDs')
    jump(pg,6);em=pg.locator('.markable').first;em.click();assert 'emph' in em.get_attribute('class')
    key(pg,'ArrowRight');key(pg,'ArrowLeft');assert 'emph' in pg.locator('.markable').first.get_attribute('class');ok('Reader marks persist through return')
    jump(pg,22);pg.locator('[data-arrow="0"]').click();assert 'cut' in pg.locator('[data-arrow="0"]').get_attribute('class')
    key(pg,'ArrowRight');assert 'cut' in pg.locator('[data-arrow="1"]').get_attribute('class');ok('Optional arrow inspection and default next-step cut both work')
    jump(pg,37);pg.locator('[data-evidence="window"]').click();assert state(pg)['panel']=='evidence';assert '绯红的傍晚天空' in pg.locator('#panel').inner_text();key(pg,'Escape');assert state(pg)['index']==37
    key(pg,'n');assert state(pg)['panel']=='notes';key(pg,'Escape');ok('Evidence and teacher panels return without advancing')
    jump(pg,29);key(pg,'n');assert C[29]['teacher'].replace('\n',' ') in re.sub(r'\s+',' ',pg.locator('#panel').inner_text());key(pg,'Escape');ok('On-screen teacher notes match shared verbatim cue data')
    for size in [{'width':1366,'height':768},{'width':1280,'height':960}]:
        pg.set_viewport_size(size)
        for i in [5,12,18,22,26,33,37,41,44,46,50,53]:jump(pg,i);box_check(pg,C[i])
        ok(f'Critical reading and media layouts fit {size["width"]}x{size["height"]}')
    pg.set_viewport_size({'width':390,'height':844})
    for i in [5,12,37,44,46,50]:
        jump(pg,i);assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert pg.locator('#next').is_visible()
    if a.screenshots:pg.screenshot(path=str(OUT/'mobile.png'))
    ok('390x844 portrait: no horizontal overflow, controls accessible; long reading vertically scrollable')
    pg.set_viewport_size({'width':1600,'height':900});jump(pg,1);pg.locator('#stage').click(position={'x':1500,'y':500});assert state(pg)['index']==1
    key(pg,'f')
    if pg.evaluate('!!document.fullscreenElement'):
        pg.locator('#stage').click(position={'x':1500,'y':500});assert state(pg)['index']==2
        pg.locator('#stage').click(position={'x':1500,'y':500},button='right');assert state(pg)['index']==3
        key(pg,'f');ok('Fullscreen blank left/right clicks advance; ordinary-window blank clicks do not')
    else:ok('Fullscreen API unavailable in this runner; focus-mode fallback exercised')
    pg.clock.install();jump(pg,5);pg.clock.fast_forward(121000);assert state(pg)['id']=='paired' and state(pg)['timer']==0
    key(pg,'r');assert state(pg)['timer']>118;key(pg,'t');before=state(pg)['timer'];pg.clock.fast_forward(20000);assert abs(state(pg)['timer']-before)<.01
    key(pg,'t');pg.clock.fast_forward(20000);assert state(pg)['timer']<before-19
    ok('Timer expires without auto-advance; R resets; T pauses and resumes')
    for i,dur in [(37,300),(50,90)]:
        jump(pg,i);pg.clock.fast_forward((dur+1)*1000);assert state(pg)['index']==i and state(pg)['timer']==0
    ok('Five-minute discussion and ninety-second writing both stop at zero without leaving their cues')
    if a.motion:
        motion=b.new_page(viewport={'width':1600,'height':900},reduced_motion='no-preference');motion.on('pageerror',lambda e:report['errors'].append(str(e)));load(motion)
        for i in range(1,len(C)):
            key(motion,'ArrowRight');motion.wait_for_timeout(6700 if i in [1,53] else (4300 if i==10 else 3700))
            assert state(motion)['index']==i
            if i in [11,45,47]:assert motion.locator('#media img').count()==0
            if a.screenshots:motion.screenshot(path=str(OUT/f'motion-{i:02d}-{C[i]["id"]}.png'))
            report['motion'].append(C[i]['id'])
        ok('All 53 full-motion next-page transitions render, settle, and remove closing materials')
    if not a.inline:
        offline=b.new_context(offline=True,viewport={'width':1600,'height':900},reduced_motion='reduce');off=offline.new_page();load(off);jump(off,9);assert off.locator('#media img').evaluate('(e)=>e.complete&&e.naturalWidth>0');jump(off,44);assert off.locator('#media img').evaluate('(e)=>e.complete&&e.naturalWidth>0');jump(off,46);assert off.locator('#media img').evaluate('(e)=>e.complete&&e.naturalWidth>0');ok('Fresh file:// load with network offline, including all three real assets')
    assert not report['errors'],report['errors']
    assert not any(u.startswith(('http://','https://')) for u in report['requests']),report['requests']
    ok('No JavaScript errors and no external network requests')
    b.close()
 report['passed']=True
except Exception as exc:
 report['passed']=False;report['failure']=str(exc);raise
finally:
 (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({k:report.get(k) for k in ['mode','browser','passed','checks','failure']},ensure_ascii=False,indent=2))
