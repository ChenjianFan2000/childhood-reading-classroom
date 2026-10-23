/* An original SVG line world. Artwork and documentary images live outside it. */
(function(){
'use strict';
const P=(d,c='',extra='')=>`<path d="${d}" class="${c}" ${extra}/>`;
const L=(x1,y1,x2,y2,c='')=>`<path d="M${x1} ${y1} L${x2} ${y2}" class="${c}"/>`;
const circ=(x,y,r,c='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const group=(x,y,s,html,c='')=>`<g transform="translate(${x} ${y}) scale(${s})" class="${c}">${html}</g>`;
function person(x,y,s=1,kind='child',pose='stand',extra=''){
 const hair=kind==='grandma'?P('M-25 -140 C-49 -166 42 -180 31 -136 M-25 -159 Q-34 -186 -11 -186 Q5 -180 -6 -165'):
 kind==='anne'?P('M-26 -138 Q-36 -181 2 -177 Q37 -171 31 -136 L37 -103 M-26 -143 L-37 -106 M-24 -159 Q8 -144 27 -160'):
 kind==='grandfather'?P('M-23 -160 Q-2 -180 25 -155 M-18 -128 L-8 -110 L11 -113 L24 -135'):
 kind==='protector'?P('M-27 -150 Q-36 -166 -24 -170 Q-15 -185 -2 -174 Q11 -187 19 -171 Q36 -172 28 -145'):
 P('M-24 -155 Q-16 -176 -5 -168 L4 -174 L12 -164 L22 -165 L27 -148');
 const head=circ(0,-144,27,'head')+hair+circ(10,-145,1.8,'eye')+P(kind==='grandma'?'M5 -135 Q11 -128 16 -135':'M6 -132 L14 -133','detail mouth');
 const body=kind==='grandma'?P('M-22 -112 Q-48 -78 -57 -11 Q0 0 48 -11 Q42 -77 20 -112 M-12 -112 L0 -94 L14 -113 M-20 -5 L-23 12 M27 -5 L27 12'):
 P('M-19 -112 Q-30 -90 -27 -64 L-22 -43 L25 -43 L29 -71 Q28 -97 18 -112 M-18 -107 L0 -95 L17 -108 M-21 -43 L-20 5 L-32 14 L-14 14 L0 -35 L10 12 L30 12 L24 5 L23 -43');
 let arms=pose==='read'?P('M-26 -95 Q-45 -66 -16 -59 L12 -76 M25 -94 L45 -70 L19 -55'):
 pose==='support'?`<g class="support-arms">${P('M-24 -100 L-60 -140 L-71 -197 M25 -100 L58 -145 L69 -199','warm thick')}</g>`:
 pose==='listen'?P('M-25 -100 Q-37 -62 -8 -59 M26 -99 Q39 -77 66 -93'):
 pose==='protect'?P('M-27 -100 L-51 -71 L-25 -59')+`<g class="arm-moving">${P('M23 -102 Q55 -112 80 -94 L132 -83 M122 -84 L131 -91 M132 -83 L143 -84','warm thick')}</g>`:
 pose==='walk'?P('M-25 -99 L-46 -75 L-55 -84 M25 -99 L45 -75 L57 -81'):
 P('M-25 -100 L-36 -65 L-31 -50 M26 -99 L37 -63 L31 -50');
 return group(x,y,s,`<g class="person-body">${head}${body}${arms}</g>`, `person ${kind} ${pose} ${extra}`);
}
function book(x,y,s=1,c='') {return group(x,y,s,P('M0 6 Q-46 -17 -88 -6 L-88 78 Q-43 66 0 88 Q46 66 88 78 L88 -6 Q42 -18 0 6 Z M0 6 L0 88')+P('M-74 12 Q-43 5 -15 19 M-74 27 Q-43 20 -15 34 M-74 42 Q-43 35 -15 49 M15 19 Q43 5 74 12 M15 34 Q43 20 74 27 M15 49 Q43 35 74 42','detail'),c);}
function bicycle(x,y,s=1,c=''){return group(x,y,s,`<g class="bike-parts"><g class="wheel left-wheel">${circ(-62,0,38)}${L(-100,0,-24,0,'detail')}${L(-62,-38,-62,38,'detail')}</g><g class="wheel right-wheel">${circ(64,0,38)}${L(26,0,102,0,'detail')}${L(64,-38,64,38,'detail')}</g>`+P('M-62 0 L-20 -65 L20 0 L-62 0 L19 -49 L64 0 L39 -83 L62 -87 M-20 -65 L-26 -77 M-42 -78 L-12 -78')+circ(20,0,7,'warm')+P('M20 0 L35 9 L46 9')+circ(9,-136,20,'head')+P('M-8 -147 Q5 -165 26 -145 M0 -116 L-22 -83 L14 -74 L30 -32 L14 -9 M-19 -83 L-35 -42 L-4 -21 M10 -110 L35 -91 L53 -84','rider')+'</g>',`bike ${c}`);}
function lamp(x,y,s=1,c=''){return group(x,y,s,P('M-40 0 L40 0 M0 0 L0 -15 L38 -76 L10 -112 M-10 -126 L-42 -102 L28 -74 L44 -112 Z')+P('M-14 -89 L-56 -29 M20 -74 L39 -27','warm detail')+P('M-60 -24 Q-12 -4 47 -24','warm detail'),c);}
function windowFrame(x,y,s=1,c=''){return group(x,y,s,P('M-90 -120 L90 -120 L90 90 L-90 90 Z M-103 98 L103 98 M0 -120 L0 90 M-90 -23 L90 -23')+P('M-78 -108 L-78 80 M78 -108 L78 80','detail'),c);}
function tree(x,y,s=1){return group(x,y,s,P('M0 0 Q12 -81 0 -164 M3 -71 L-28 -106 M5 -111 L30 -139')+P('M-9 -167 C-35 -182 -56 -157 -48 -139 C-83 -134 -67 -98 -45 -94 C-57 -66 -15 -53 0 -71 C24 -57 61 -82 41 -103 C71 -122 45 -154 30 -150 C36 -177 3 -189 -9 -167','soft')+P('M-35 2 Q0 -9 35 2','detail'));}
function school(x,y,s=1,c=''){return group(x,y,s,P('M-110 0 L110 0 M-100 0 L-100 -105 L0 -165 L100 -105 L100 0 M-120 -105 L0 -177 L120 -105 M-22 0 L-22 -65 L22 -65 L22 0 M-75 -84 L-44 -84 L-44 -50 L-75 -50 Z M44 -84 L75 -84 L75 -50 L44 -50 Z')+circ(0,-112,14,'detail')+P('M0 -123 L0 -112 L8 -108','detail'),c);}
function desk(x,y,s=1,c=''){return group(x,y,s,P('M-130 -36 L150 -36 L150 -20 L-130 -20 Z M-107 -20 L-110 90 M125 -20 L126 90 M-67 -36 L-67 75 L-117 75 M-55 75 L-57 106')+book(13,-86,.52)+lamp(111,-38,.64)+P('M-45 -54 L-15 -72','warm'),c);}
function hand(x,y,s=1,mirror=1){return group(x,y,s,`<g transform="scale(${mirror} 1)">${P('M-118 34 Q-79 29 -51 7 L-33 -11 Q-21 -20 -13 -16 L19 -8 Q32 -4 32 4 Q29 10 15 8 L-8 3 L13 16 L50 9 Q67 6 70 14 Q72 22 57 28 L4 47 Q-25 56 -58 54 L-110 74','warm thick')}</g>`);}
function strokes(x,y,s=1,c=''){return group(x,y,s,P('M-45 0 Q-18 -6 10 -1 L43 -3 M-43 15 Q-9 10 29 16 M-42 30 L1 28','warm'),`record-lines ${c}`);}
function day(){return `
 <g class="day-scenery">${tree(170,738,1.4)}${tree(1410,719,1.1)}${P('M-70 786 C216 726 362 772 589 775 C869 778 1185 721 1670 780','soft ground')}</g>
 <g class="road-set">${person(495,733,1.05,'child','walk','walker')}${person(700,732,.94,'child','listen','friend')}${bicycle(964,740,.95,'traveller')}${P('M270 762 Q510 723 731 760 T1220 754','warm route')}</g>
 <g class="desk-set">${windowFrame(1120,499,1.04)}${desk(1050,700,1.35)}${person(862,709,.94,'child','read','seated')}${P('M787 745 L880 745 L882 817 M802 743 L800 815','detail')}</g>
 <g class="listen-set">${person(620,766,1.25,'adult','listen')}${person(840,765,.84,'child','stand')}${P('M690 637 Q747 606 791 649','warm')}${circ(740,620,13,'warm detail')}</g>
 <g class="cover-art">${person(1160,747,1.23,'child','stand')}${book(1000,658,.66)}${P('M976 751 C1005 702 1058 760 1093 705 C1114 678 1158 691 1193 651 C1237 604 1327 642 1325 556','warm flourish')}${circ(1326,552,6,'warm filled')}${P('M1220 782 L1360 782 M1289 770 L1396 770','detail')}</g>`;}
function bookScene(){return `${book(800,682,1.95,'main-book')}${person(1078,778,.75,'child','stand')}${P('M486 803 C566 788 595 690 670 684 C732 679 767 740 819 745 S958 683 1112 697','warm book-thread')}${strokes(810,698,1,'initial-mark')}${strokes(858,718,.7,'revision-mark')}`;}
function effects(){return `${person(820,786,1,'child','stand','effect-child')}
 <g class="hurt-lines">${P('M490 692 L573 682 L605 697 L645 670 L682 690 L738 680','cold')}${P('M865 646 L905 628 L926 648 L967 621 L1020 636','cold')}${P('M803 658 Q785 679 802 696 Q823 711 804 737','cold detail')}${circ(821,650,56,'cold ripple')}${circ(821,650,72,'cold ripple2')}</g>
 <g class="warm-lines">${person(517,777,1.03,'grandma','listen')}${P('M584 668 C657 623 705 743 798 720 C884 697 941 772 1023 724 C1090 685 1173 724 1247 677','warm connection')}${book(1141,716,.48)}${P('M480 794 L1245 794','warm detail')}</g>
 <g class="quiet-lines">${P('M260 753 C407 730 575 774 708 754 M907 755 C1110 730 1240 779 1390 750','soft')}</g>`;}
function labor(){return `${P('M150 800 Q480 762 730 789 T1470 792','soft')}
 <g class="labor-memory">${group(594,768,1.05,`<g transform="rotate(22)">${person(0,0,1,'grandfather','walk')}</g>`)}${P('M567 650 Q900 618 1235 644','cold rope')}${P('M1110 763 L1287 763 L1324 709 L1104 709 Z M1210 709 L1210 651 M1210 660 L1277 699 L1210 699','soft')}${P('M388 794 l20 -10 l26 9 m39 0 l14 -12 l19 9 m50 4 l18 -10 l19 12','detail')}</g>
 <g class="grandfather-present">${person(802,790,1.2,'grandfather','stand')}${P('M580 684 C628 677 666 673 710 691 M895 691 C938 675 983 679 1031 688','cold')}${P('M719 691 L754 691 M857 691 L885 691','dashed')}</g>`;}
function logic(){return `${P('M216 748 C488 772 577 706 800 750 C1015 794 1175 722 1393 752','soft')}
 <g class="tools">${P('M390 720 L441 691 L477 728 M440 691 L439 770','warm')}${P('M776 708 L802 750 L839 701 M782 773 L819 746','cold')}${P('M1160 758 Q1205 694 1250 759','warm')}</g>
 <g class="repair-trace">${P('M390 774 L634 774','warm')}${P('M634 774 Q680 693 726 774','cold missing')}${P('M726 774 L1208 774','warm')}${strokes(900,685,1.25)}</g>
 <g class="logic-nodes">${circ(335,701,24,'node')}${circ(800,701,24,'node')}${circ(1265,701,24,'node')}${P('M365 701 L753 701 M740 693 L755 701 L740 709','dashed arrow-one')}
 <g class="arrow-second"><g class="cut-left">${P('M831 701 L1003 701','dashed')}</g><g class="cut-right">${P('M1048 701 L1224 701 M1208 693 L1224 701 L1208 709','dashed')}</g><g class="uncut-mid">${L(1003,701,1048,701,'dashed')}</g></g>${P('M1004 674 L1046 725 M1047 675 L1004 725','cut-mark warm')}</g>`;}
function protect(){return `<g class="protect-frame">${P('M182 808 L182 327 L1420 327 L1420 808','cold boundary')}${P('M132 810 L1473 810','soft')}${P('M240 368 L1365 368','cold detail')}${P('M240 370 L240 795 M1365 370 L1365 795','cold detail')}</g>
 <g class="protect-pair">${person(721,788,1.38,'protector','protect')}${person(928,788,.89,'child','stand')}${P('M725 702 Q794 668 878 701 Q928 719 967 697','warm bond')}${P('M666 811 Q843 834 1010 809','warm detail')}</g>
 <g class="protection-limits">${P('M313 780 L313 428 L1281 428 L1281 780 M367 779 L367 475 L1216 475 L1216 779','cold soft')}${L(400,812,1230,812,'cold')}</g>`;}
function anne(){return `<g class="anne-room">${P('M410 808 L410 327 L500 260 L1110 260 L1200 327 L1200 808','cold room-outline')}${P('M451 808 L451 360 L1160 360 L1160 808','detail')}${windowFrame(1018,509,.84)}${P('M510 789 L510 472 L621 472 L621 790 M606 633 L607 645','cold door')}${P('M480 812 L1145 812','soft')}${person(785,780,.88,'anne','read')}${book(851,721,.54)}</g>
 <g class="help-objects">${group(549,735,.65,P('M-40 5 L35 5 L29 63 L-34 63 Z M-40 5 Q-20 -39 -5 -23 Q6 -46 35 5 M-11 -20 L-10 3'))}${group(640,760,.68,P('M-15 -70 L-55 -49 L-38 -17 L-22 -24 L-22 50 L30 50 L30 -24 L47 -17 L62 -49 L19 -70 Q3 -45 -15 -70'))}${book(1038,726,.47)}${P('M450 795 C511 737 621 812 716 765','warm incoming')}</g>
 <g class="wishes">${bicycle(1268,691,.68,'wish-bike')}${person(1346,481,.63,'child','walk','wish-dancer')}${P('M1155 550 Q1190 534 1214 549 M1160 568 Q1190 552 1226 562 M1164 585 Q1200 573 1245 582','warm whistle')}${P('M856 717 C932 687 1050 649 1160 657','warm dashed wish-route')}</g>
 <g class="outer-danger">${P('M1173 263 L1173 788','cold thick danger-line')}${P('M1203 280 L1230 315 M1203 327 L1230 362 M1203 375 L1230 410 M1203 424 L1230 459 M1203 472 L1230 507 M1203 520 L1230 555 M1203 568 L1230 603 M1203 616 L1230 651 M1203 664 L1230 699 M1203 712 L1230 747','cold detail')}${circ(1173,657,8,'cold filled')}</g>`;}
function discussion(){return `<g class="evidence-lines">${book(422,744,.65)}${book(1178,744,.65)}${P('M486 774 C619 774 620 659 768 659 M1114 774 C981 774 980 659 832 659','warm')}${circ(800,659,32,'warm')}${P('M800 692 L800 801','warm')}${P('M658 807 Q800 834 942 807','detail')}</g>
 <g class="first-record">${strokes(710,716,.7)}</g><g class="second-record">${strokes(888,716,.7)}</g>
 <g class="check-record">${P('M857 656 C938 569 1064 642 977 712 Q931 746 866 736','warm')}${P('M876 727 L865 736 L877 742','warm')}${strokes(800,771,.63)}</g>`;}
function author(){return `<g class="author-book">${book(800,700,1.08)}</g>
 <g class="roots">${P('M590 693 Q543 749 483 788 L448 830 M483 788 L389 823 M1017 690 Q1068 754 1125 789 L1162 834 M1125 789 L1222 819','cold')}${P('M485 787 L540 824 M1125 789 L1078 834','cold detail')}</g>
 <g class="new-growth">${P('M799 810 Q778 784 796 762 M790 789 Q755 765 758 745 Q783 742 791 767 M796 770 Q819 740 842 751 Q833 776 796 781','warm')}${P('M623 817 C693 796 721 830 779 821 M819 821 C887 799 937 831 994 815','warm detail')}</g>`;}
function reality(){return `<g class="reality-line">${P('M260 792 C465 738 567 818 801 787 S1141 745 1358 791','warm')}${person(805,770,.72,'child','stand')}</g>
 <g class="school-memory">${school(428,756,.85)}${person(569,775,.45,'child','walk')}${P('M540 794 Q628 748 725 794','warm')}</g>
 <g class="lamp-memory">${lamp(1170,759,1.2)}${book(1046,743,.53)}${P('M1030 800 L1236 800','detail')}</g>`;}
function finale(){return `<g class="final-world">
 <g class="roof">${P('M352 778 L352 310 L1248 310 L1248 778','cold thick')}${P('M318 284 L1282 284','cold detail')}</g>
 <g class="final-child">${person(801,774,.94,'child','stand')}${P('M708 792 Q802 812 895 792','warm')}</g>
 <g class="memory-arm">${hand(540,585,.8)}${P('M512 647 Q663 637 763 709','warm')}</g>
 <g class="memory-window">${windowFrame(1069,560,.55)}${P('M1020 621 Q968 665 841 711','warm')}</g>
 <g class="memory-school">${school(510,792,.56)}${P('M574 789 L726 789','warm')}</g>
 <g class="memory-lamp">${lamp(1128,791,.73)}${book(1036,755,.37)}${P('M882 788 L1004 788','warm')}</g>
 <g class="adults">${person(260,774,1.55,'adult','support')}${person(1340,774,1.55,'adult','support')}${P('M153 470 L351 470 M1249 470 L1447 470','warm thick support-beam')}${P('M367 465 L296 249 M1230 465 L1304 249','warm support-join')}</g>
 </g>${P('M118 826 C457 809 576 842 800 827 S1193 808 1480 828','soft')}`;}
const zones=[['day',day],['book',bookScene],['effects',effects],['labor',labor],['logic',logic],['protect',protect],['anne',anne],['discussion',discussion],['author',author],['reality',reality],['finale',finale]];
const positions=Object.fromEntries(zones.map(([n],i)=>[n,i*1760]));
const ns='http://www.w3.org/2000/svg';
let active=null, previously=new Set(), animations=[];
function setup(svg){
 svg.innerHTML=`<defs><filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer></filter></defs><g id="camera"><path class="world-spine" d="M-200 821 ${zones.map(([n])=>'C'+(positions[n]+200)+' 808 '+(positions[n]+1200)+' 837 '+(positions[n]+1760)+' 821').join(' ')}"/>${zones.map(([n,fn])=>`<g class="zone zone-${n}" id="zone-${n}" transform="translate(${positions[n]} 0)"><g class="scene-art">${fn()}</g></g>`).join('')}</g>`;
}
function stop(){animations.forEach(a=>a.cancel());animations=[];}
function set(cue,old,reduced,immediate=false){
 stop(); const zone=document.getElementById('zone-'+cue.zone),cam=document.getElementById('camera');
 document.querySelectorAll('.zone').forEach(z=>z.classList.remove('current'));
 zone.classList.add('current'); zone.dataset.state=cue.state;
 // All scene groups are persistent: page changes move the camera through the same line world.
 const x=positions[cue.zone]; cam.style.transition=(immediate||reduced)?'none':'transform 1250ms cubic-bezier(.4,0,.15,1)';

 const distance=old?Math.abs(positions[old.zone]-x):0;
 if(distance>1760&&!immediate&&!reduced){
  cam.style.transition='none';
  animations.push(cam.animate([{opacity:0},{opacity:1}],{duration:1000,easing:'ease-out'}));
 }
 cam.style.transform=`translate(${-x}px,0px)`;
 if(!immediate&&!reduced&&!previously.has(cue.zone)){
  zone.querySelectorAll('path').forEach((el,i)=>{
   if(el.closest('.record-lines'))return;
   let length;try{length=el.getTotalLength();}catch{return;}
   const a=el.animate([{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:1300+Math.min(i*35,600),delay:old&&old.zone!==cue.zone?600:0,easing:'cubic-bezier(.2,.7,.2,1)'});animations.push(a);
  });
 }
 previously.add(cue.zone);active=cue.zone;
 const traces={connection:'.connection','g1-record':'.missing',protection:'.bond','anne-help':'.incoming','anne-wishes':'.wish-route','share-two':'.first-record path','share-check':'.second-record path,.check-record path','author-change':'.new-growth path','final-support':'.support-join'};
 if(!reduced&&!immediate&&traces[cue.id]){
  zone.querySelectorAll(traces[cue.id]).forEach(el=>{const len=el.getTotalLength();animations.push(el.animate([{strokeDasharray:`${len} ${len}`,strokeDashoffset:len},{strokeDasharray:`${len} ${len}`,strokeDashoffset:0}],{duration:2800,delay:300,easing:'ease-in-out'}));});
 }


 if(!reduced&&!immediate&&cue.id==='anne-help'){
  zone.querySelectorAll('.help-objects>g').forEach((el,i)=>{const base=getComputedStyle(el).transform;animations.push(el.animate([{opacity:0,transform:base+' translate(-38px,0)'},{opacity:1,transform:base}],{duration:1300,delay:500+i*750,fill:'backwards',easing:'ease-out'}));});
 }
 if(!reduced&&!immediate&&cue.id==='anne-wishes'){
  const bike=zone.querySelector('.wish-bike .bike-parts'),dance=zone.querySelector('.wish-dancer .person-body');
  animations.push(bike.animate([{transform:'translate(-30px,0)',opacity:0},{transform:'translate(0,0)',opacity:1}],{duration:2600,easing:'ease-out'}));
  animations.push(dance.animate([{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0deg)'}],{duration:3400,easing:'ease-in-out'}));
 }
 if(!reduced&&!immediate&&cue.id==='final-support'){
  zone.querySelectorAll('.support-arms').forEach(el=>animations.push(el.animate([{transform:'translateY(40px)'},{transform:'translateY(0)'}],{duration:2800,easing:'ease-out'})));
 }
 if(!reduced&&!immediate&&cue.id==='final-day'){
  ['.road-set','.desk-set'].forEach((sel,i)=>{const el=zone.querySelector(sel);animations.push(el.animate([{opacity:0},{opacity:1}],{duration:2200,delay:i*2200,fill:'backwards',easing:'ease-out'}));});
 }
 if(!reduced&&!immediate&&cue.id==='day-road'){
  const el=zone.querySelector('.walker .person-body');animations.push(el.animate([{transform:'translate(-96px,0)'},{transform:'translate(0,0)'}],{duration:6500,easing:'ease-in-out'}));
  const bike=zone.querySelector('.traveller .bike-parts');animations.push(bike.animate([{transform:'translate(60px,0)'},{transform:'translate(0,0)'}],{duration:6500,easing:'ease-in-out'}));
  bike.querySelectorAll('.wheel').forEach(el=>{el.style.transformBox='fill-box';el.style.transformOrigin='center';animations.push(el.animate([{transform:'rotate(70deg)'},{transform:'rotate(0deg)'}],{duration:6500,easing:'ease-in-out'}));});
 }
}
function reset(cue){stop();previously.delete(cue.zone);const z=document.getElementById('zone-'+cue.zone);z.classList.add('instant-reset');z.dataset.state='reset';z.querySelectorAll('g').forEach(el=>el.getBoundingClientRect());z.classList.remove('instant-reset');}
window.LineWorld={setup,set,stop,reset,positions};
})();
