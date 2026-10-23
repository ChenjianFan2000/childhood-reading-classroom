#!/usr/bin/env python3
"""Build the printable teacher script from the exact classroom cue data.
Usage: python tools/build_script.py
Requires: python-docx (document build only; classroom has no dependencies).
"""
from __future__ import annotations
import hashlib, json, math, re, zipfile
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'scripts/lesson-data.js'
def load_lesson():
    text=DATA.read_text(encoding='utf-8')
    return json.loads(text.split('window.LINE_LESSON = ',1)[1].rstrip().removesuffix(';'))
L=load_lesson(); C=L['cues']; SHA=hashlib.sha256(DATA.read_bytes()).hexdigest()
DOC=ROOT/'teacher_script.docx'; MD=ROOT/'teacher_script.md'
doc=Document(); sec=doc.sections[0]
sec.page_width=Cm(21);sec.page_height=Cm(29.7)
sec.top_margin=Cm(1.8);sec.bottom_margin=Cm(1.7);sec.left_margin=Cm(2);sec.right_margin=Cm(2)
sec.header_distance=Cm(.65);sec.footer_distance=Cm(.7)
INK='283D3B'; GOLD='95652F'; MUTED='60716C'
def style_font(st,size,name='Noto Serif CJK SC',bold=False,color=INK):
    st.font.name=name;st.font.size=Pt(size);st.font.bold=bold;st.font.color.rgb=RGBColor.from_string(color)
    st.element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),name)
style_font(doc.styles['Normal'],10.5)
normal=doc.styles['Normal'].paragraph_format
normal.line_spacing=1.28;normal.space_after=Pt(5)
for name,size in [('Title',29),('Heading 1',19),('Heading 2',14),('Heading 3',11)]:
    style_font(doc.styles[name],size,'Noto Sans CJK SC',True)
    pf=doc.styles[name].paragraph_format;pf.space_before=Pt(10);pf.space_after=Pt(8);pf.keep_with_next=True
style_font(doc.styles['Caption'],9,'Noto Sans CJK SC',False,MUTED)
for name in ['Header','Footer']:
    style_font(doc.styles[name],8.5,'Noto Sans CJK SC',False,MUTED)
header=sec.header.paragraphs[0];header.text='《童年》整本书阅读  /  线条叙事版教师用稿'
p=sec.footer.paragraphs[0];p.alignment=2
p.add_run('线条叙事 · ')
fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');p._p.append(fld)
doc.core_properties.title='童年里，什么值得被留下——线条叙事版教师逐字稿'
doc.core_properties.subject='40分钟公开课；与54个网页节拍同步'
doc.core_properties.author='';doc.core_properties.last_modified_by=''
md=['# '+L['title'],'','## 线条叙事版 · 教师逐字稿','',f'课堂数据 SHA-256：`{SHA}`','']
def text(s,style=None):
    p=doc.add_paragraph(s,style);p.paragraph_format.widow_control=True;return p
def label(name,s):
    if not s:return
    p=doc.add_paragraph();r=p.add_run(name+'  ');r.bold=True;r.font.name='Noto Sans CJK SC';r.font.color.rgb=RGBColor.from_string(GOLD)
    p.add_run(s);p.paragraph_format.space_after=Pt(5);return p
def page():doc.add_page_break()
def table(headers,rows,widths=None):
    t=doc.add_table(rows=1,cols=len(headers));t.autofit=False
    for i,h in enumerate(headers):t.rows[0].cells[i].text=h
    for row in rows:
        cells=t.add_row().cells
        for i,v in enumerate(row):cells[i].text=str(v)
    for ri,row in enumerate(t.rows):
        pr=row._tr.get_or_add_trPr();nc=OxmlElement('w:cantSplit');pr.append(nc)
        if ri==0:pr.append(OxmlElement('w:tblHeader'))
        for ci,cell in enumerate(row.cells):
            if widths:cell.width=Cm(widths[ci])
            cp=cell._tc.get_or_add_tcPr();shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E9EEE8' if ri==0 else ('F7F8F3' if ri%2 else 'FFFFFF'));cp.append(shade)
            for p in cell.paragraphs:
                p.paragraph_format.space_before=Pt(4);p.paragraph_format.space_after=Pt(4);p.paragraph_format.line_spacing=1.2
                for r in p.runs:r.font.size=Pt(9);r.bold=ri==0
    return t
# Opening pages, intentionally separate from live spoken script.
text('六年级 · 整本书阅读', 'Caption')
text('童年里，\n什么值得被留下','Title')
text('线条叙事版  /  40分钟公开课教师逐字稿','Subtitle')
text('从“哪一种影响更大”，走向“什么样的生活值得被守住”。')
text('本稿与网页54个节拍逐一对应。教师话语、动画动作、学生停留及推进顺序均从同一份课堂数据生成；画面中的象征笔迹不代写学生答案。')
doc.add_heading('这节课要保留的三层认识',2)
label('看见影响','伤害的深度与支持的力量并非同一种作用。允许学生保留不同判断，但要求说明尺度、给出证据。')
label('检验理由','理解一个人的经历，不等于认可他伤害别人。概括要补回代价，推论要经原文检验，赞美要落到人的选择。')
label('守住日常','爱与帮助真实可贵，但不自动消除伤害和限制。幸福还需要安全、学习、稳定生活与被尊重等条件得到持续保障。')
doc.add_heading('课堂准备与边界',2)
text('学生准备同版《童年》、B5阅读本和笔；不需打印任务纸。活动依次为全班证据交流、三轮个人阅读游戏、一次小组讨论和退出卡。未通读的学生可从共同文本进入。')
text('不组织殴打表演，不用流血或灾难画面刺激学生；不要求公开家庭创伤。不以“谁更苦”比较孩子，也不把家庭暴力、纳粹迫害和战争造成的困境解释成同一原因。')
text('建议时间不是强制倒计时。教师依据课堂掌握推进节奏；超时先减少复述和展示人数，不削去两分钟并读、五分钟讨论与九十秒独立书写。')
text('版本 1.0 · 2026年10月23日','Caption')
page();doc.add_heading('授课路线与操作',1)
table(['时间','任务','学生主要行动'],[
('00:00—02:00','普通日常与初判','独立写暂时判断'),('02:00—09:00','并读与比较影响','2分钟并读；凭证据交流'),('09:00—12:00','外祖父：经历与解释','观察原画；辨认两类文字'),('12:00—22:00','三轮修复与保护之后','补词、断箭头、准确赞美'),('22:00—26:00','安妮：帮助与愿望','读处境与日记；准备讨论'),('26:00—34:00','唯一一次小组讨论','5分钟讨论；两组交流与修订'),('34:00—37:50','回望作者、现实与日常','修订初判；连接生活条件'),('37:50—39:20','退出卡','完整90秒独立书写'),('39:20—40:00','共同承担，回到普通日常','倾听结语；保持安静')],[3.6,6.3,7.1])
doc.add_heading('只用下一页，也能走完整课',2)
text('→、空格或PageDown都是“下一页”；←或PageUp返回。F切换全屏；M打开目录；N打开本节拍讲稿；T暂停／继续计时；R重播本节拍并重置计时。Esc关闭辅助面板。')
text('全屏时可在非按钮、非选中文字处单击，或右键推进。打开辅助面板后先关闭，再继续主线。目录中的跳转只是备课或临场支线，不是正常授课的必需操作。教师提示会显示在当前屏幕，投影时按N前须留意学生可见。')
text('三份真实材料在指定节拍展开，在后续节拍收回；“随旁白”由教师按键同步，不使用麦克风或语音识别。计时归零只提醒，不自动翻页。阅读材料留屏，学生发言与纸笔书写不被动画打断。')
text('两组交流的笔迹由后续推进留下；它们表示“已有表达”，不显示预设答案。需要回应同学时，可点原文词语标记、点箭头检验，或在讨论页放大证据。')
text('默认无背景音乐，不联网拉取资源，不收集学生信息。课前需在实际教室投影／翻页笔上做一次检查。','Caption')
# Greedy cue pagination, conservatively calculated for CJK body text.
def estimate(c):
    h=48
    for s in [c['teacher'] or '（保持安静，让学生独立读写或讨论。）',c['action'],c['hold'],c['reply'],c['next']]:
        if s:h+=sum(max(1,math.ceil(len(line)/42)) for line in s.split('\n'))*14.2+8
    return h+14
page();used=0;prevsection=None
for c in C:
    ht=estimate(c)
    if used and (used+ht>660 or c['section']!=prevsection):page();used=0
    if not used:
        text(c['section']+'  /  教师现场用稿','Caption');used+=28
    title=f"{c['number']:02d}　{c['title']}"
    doc.add_heading(title,2)
    text(f"{c['timing']}　｜　网页定位：{c['id']}",'Caption')
    label('教师说',c['teacher'] or '（保持安静，让学生独立读写或讨论。）')
    label('画面',c['action']);label('停留',c['hold']);label('按需承接',c['reply']);label('推进',c['next'])
    used+=ht;prevsection=c['section']
    md.extend([f'## {title}',f"**{c['timing']} · `{c['id']}`**",'', '**教师说**',c['teacher'] or '（保持安静，让学生独立读写或讨论。）','',f"**画面：** {c['action']}",f"**停留：** {c['hold'] or '完成本节拍后推进。'}"])
    if c['reply']:md.append('**按需承接：** '+c['reply'])
    md.extend(['**推进：** '+c['next'],''])
# Student reading evidence in printable appendix.
page();doc.add_heading('附录一　课堂阅读材料',1)
text('以下编号仅供教师备课定位，不投放到学生主画面。独立摘录之间留空行；出现省略处时，不将前后文字拼成连续全文。标点按课堂显示统一。')
refs=[('hurt','受伤之后','第2章；PDF第34页'),('warmth','外祖母的爱','第1章；PDF第18页'),('grandfather','外祖父的经历与解释','第2章；PDF第36页；各块为独立摘录'),('protect','小茨冈前半段','第2章；PDF第38页；不可提前揭示后半问答'),('again','保护之后的问答','第2章；PDF第38页'),('anne','安妮的愿望','1943年12月24日日记摘意；据安妮之家引文所作课堂工作译文'),('author','作者的回望','第12章；PDF第243—244页；各块为独立摘录'),('window','窗边：按需拓展','第2章；PDF第31页；同伴为米哈伊尔舅舅的儿子萨沙；两块独立摘录')]
for key,title,ref in refs:
    doc.add_heading(title,2);text(ref,'Caption')
    for q in L['passages'][key]:text(q)
md.extend(['## 附录：阅读证据',''])
for key,title,ref in refs:
    md.extend(['### '+title,ref,'']+L['passages'][key]+[''])
page();doc.add_heading('附录二　材料来源与使用说明',1)
text('本课使用历史作品与历史报道，不把报道中的年龄、环境表述为2026年的即时近况。照片保持原貌，不生成式改画儿童、不添加不存在的环境。出处留在教师资料中，学生投影保持阅读主体清楚。')
source_texts=[
('小说底本','高尔基著，刘辽逸译，《童年》，人民文学出版社。用户提供的281页PDF。这里页码均为文件页序，非纸本页码。'),
('原教案与旧逐字稿','仓库 main / b87b7d3：童年公开课完整教案.docx、teacher_script.docx；并参考 scripts/lesson-data.js 中的材料、旁白和来源。新版重排视觉节拍，不照搬旧40幕。'),
('列宾原画',f"伊利亚·列宾，《伏尔加河上的纤夫》，1870—1873年，布面油画，俄罗斯博物馆藏，Ж-4056。画作只是劳动处境的视觉参照，不是小说事件的照片。\n{L['sources']['haulers']['source_page']}"),
('安妮的日记',f"安妮之家（Anne Frank House），EXTRA Freedom，第1页所引1943年12月24日日记。网页中文为课堂工作译文，不冒充已出版中文译本，也不是完整日记段落。\n{L['sources']['anne']['source_url']}\n帮助者背景：{L['sources']['anne']['helpers_source']}"),
('亚门的历史报道',f"Jane Courtney / UNICEF：Hope amid the rubble – Restoring learning in the Gaza Strip，2024年9月10日。图为亚门与父亲；文字改述母亲在家教学、孩子的劳动负担与返校愿望。来源未给年龄，不补写。图片署名：UNICEF 2024。\n{L['sources']['yamen']['source_url']}"),
('瓦尔瓦拉的历史报道',f"UNICEF：As winter bites, needs intensify for families in Ukraine，2022年12月19日。报道时七岁；原图为母女阅读，烛光及停电寒冷的情境来自报道文字，不是给照片增添的事实。图片署名：UNICEF。\n{L['sources']['varvara']['source_url']}"),
('使用与维护','课堂展示不等同于取得素材的任意再分发许可。公开传播、商业使用等须另核对原权利人的条款。本包只保留用户指定的三张既有素材；引用范围和来源不扩大。更改任何节拍后，运行 tools/build_script.py 重新生成Word，并重新检查版式。')]
for title,body in source_texts:
    doc.add_heading(title,3);text(body)
    md.extend(['### '+title,body,''])
text('同步标识','Heading 3');text('课堂数据 SHA-256：\n'+SHA,'Caption')
# Narrow package: no embedded fonts, printer settings or thumbnails.
doc.save(DOC)
with zipfile.ZipFile(DOC) as z:
    entries={i.filename:z.read(i.filename) for i in z.infolist()}
# Remove optional stylesWithEffects copy and thumbnail to keep source-control binary compact.
for name in ['word/stylesWithEffects.xml','docProps/thumbnail.jpeg']:
    entries.pop(name,None)
for name in ['word/_rels/document.xml.rels','_rels/.rels','[Content_Types].xml']:
    if name in entries:
        from lxml import etree
        rt=etree.fromstring(entries[name])
        for e in list(rt):
            if any(v in (e.get('Target','')+e.get('PartName','')) for v in ['stylesWithEffects.xml','thumbnail.jpeg']):rt.remove(e)
        entries[name]=etree.tostring(rt,xml_declaration=True,encoding='UTF-8',standalone=True)
# Drop the many unused built-in style definitions, retaining actual used styles + their bases.
from lxml import etree
styles=etree.fromstring(entries['word/styles.xml']);ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
used_styles={'Normal','DefaultParagraphFont','TableNormal','NoList'}
for fn,raw in entries.items():
    if fn.startswith('word/') and fn.endswith('.xml') and fn!='word/styles.xml':
        rt=etree.fromstring(raw)
        for n in rt.xpath('//w:pStyle|//w:rStyle|//w:tblStyle',namespaces=ns):used_styles.add(n.get(qn('w:val')))
byid={x.get(qn('w:styleId')):x for x in styles.findall('w:style',ns)}
for _ in range(5):
    for sid in list(used_styles):
        e=byid.get(sid)
        if e is not None:
            for n in e.xpath('./w:basedOn|./w:next|./w:link',namespaces=ns):used_styles.add(n.get(qn('w:val')))
for sid,e in byid.items():
    if sid not in used_styles:styles.remove(e)
entries['word/styles.xml']=etree.tostring(styles,xml_declaration=True,encoding='UTF-8',standalone=True)
with zipfile.ZipFile(DOC,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name,data in entries.items():z.writestr(name,data)
MD.write_text('\n'.join(md)+'\n',encoding='utf-8')
print(DOC, DOC.stat().st_size, 'bytes;',len(C),'cues;',sum(c['seconds'] for c in C),'seconds')
# Exact text round-trip gate; conditional teacher responses remain separate from spoken script.
actual='\n'.join(p.text for p in Document(DOC).paragraphs)
assert all(c['teacher'] in actual for c in C)
assert all(c['id'] in actual for c in C)
assert not any(name.startswith('word/fonts/') for name in entries)
