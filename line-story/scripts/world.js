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
 const body=pose==='sit'?P('M-19 -112 Q-30 -90 -27 -64 L-22 -43 L25 -43 L29 -71 Q28 -97 18 -112 M-18 -107 L0 -95 L17 -108 M-22 -43 Q-28 -16 -8 -10 L26 -10 L24 17 L40 17 L49 -27 L25 -43 M-8 -10 L0 13 L16 13 L9 -26'):
 kind==='grandma'?P('M-22 -112 Q-48 -78 -57 -11 Q0 0 48 -11 Q42 -77 20 -112 M-12 -112 L0 -94 L14 -113 M-20 -5 L-23 12 M27 -5 L27 12'):
 P('M-19 -112 Q-30 -90 -27 -64 L-22 -43 L25 -43 L29 -71 Q28 -97 18 -112 M-18 -107 L0 -95 L17 -108 M-21 -43 L-20 5 L-32 14 L-14 14 L0 -35 L10 12 L30 12 L24 5 L23 -43');
 let arms=pose==='sit'?P('M-25 -99 Q-38 -69 -8 -59 M25 -99 Q40 -69 11 -58'):
 pose==='read'?P('M-26 -95 Q-45 -66 -16 -59 L12 -76 M25 -94 L45 -70 L19 -55'):
 pose==='support'?`<g class="support-arms">${P('M-24 -100 L-60 -140 L-71 -197 M25 -100 L58 -145 L69 -199','warm thick')}</g>`:
 pose==='listen'?P('M-25 -100 Q-37 -62 -8 -59 M26 -99 Q39 -77 66 -93'):
 pose==='protect'?P('M-27 -100 L-51 -71 L-25 -59')+`<g class="arm-moving">${P('M23 -102 Q55 -112 80 -94 L132 -83 M122 -84 L131 -91 M132 -83 L143 -84','warm thick')}</g>`:
 pose==='walk'?P('M-25 -99 L-46 -75 L-55 -84 M25 -99 L45 -75 L57 -81'):
 P('M-25 -100 L-36 -65 L-31 -50 M26 -99 L37 -63 L31 -50');
 return group(x,y,s,`<g class="person-body">${head}${body}${arms}</g>`, `person ${kind} ${pose} ${extra}`);
}
function book(x,y,s=1,c='') {return group(x,y,s,P('M0 6 Q-46 -17 -88 -6 L-88 78 Q-43 66 0 88 Q46 66 88 78 L88 -6 Q42 -18 0 6 Z M0 6 L0 88')+P('M-74 12 Q-43 5 -15 19 M-74 27 Q-43 20 -15 34 M-74 42 Q-43 35 -15 49 M15 19 Q43 5 74 12 M15 34 Q43 20 74 27 M15 49 Q43 35 74 42','detail'),c);}
function bicycle(x,y,s=1,c=''){return group(x,y,s,`<g class="bike-parts"><g class="wheel left-wheel">${circ(-62,0,38)}${L(-100,0,-24,0,'detail')}${L(-62,-38,-62,38,'detail')}</g><g class="wheel right-wheel">${circ(64,0,38)}${L(26,0,102,0,'detail')}${L(64,-38,64,38,'detail')}</g>`+P('M-62 0 L-20 -65 L20 0 L-62 0 L19 -49 L64 0 L39 -83 L62 -87 M-20 -65 L-26 -77 M-42 -78 L-12 -78')+circ(20,0,7,'warm')+P('M20 0 L35 9 L46 9')+circ(9,-136,20,'head')+P('M-8 -147 Q5 -165 26 -145 M0 -116 L-22 -83 L14 -74 L30 -32 L14 -9 M-19 -83 L-35 -42 L-4 -21 M10 -110 L35 -91 L53 -84','rider')+'</g>',`bike ${c}`);}
const windowShape=P('M-90 -120 L90 -120 L90 90 L-90 90 Z M-103 98 L103 98 M0 -120 L0 90 M-90 -23 L90 -23')+P('M-78 -108 L-78 80 M78 -108 L78 80','detail');
const lampShape=P('M-40 0 L40 0 M0 0 L0 -15 L38 -76 L10 -112 M-10 -126 L-42 -102 L28 -74 L44 -112 Z')+P('M-14 -89 L-56 -29 M20 -74 L39 -27','warm detail')+P('M-60 -24 Q-12 -4 47 -24','warm detail');
function lamp(x,y,s=1,c=''){return group(x,y,s,'<use href="#shared-lamp-shape"/>',`motif-lamp ${c}`);}
function windowFrame(x,y,s=1,c=''){return group(x,y,s,'<use href="#shared-window-shape"/>',`motif-window ${c}`);}
function tree(x,y,s=1){return group(x,y,s,P('M0 0 Q12 -81 0 -164 M3 -71 L-28 -106 M5 -111 L30 -139')+P('M-9 -167 C-35 -182 -56 -157 -48 -139 C-83 -134 -67 -98 -45 -94 C-57 -66 -15 -53 0 -71 C24 -57 61 -82 41 -103 C71 -122 45 -154 30 -150 C36 -177 3 -189 -9 -167','soft')+P('M-35 2 Q0 -9 35 2','detail'));}
function school(x,y,s=1,c=''){return group(x,y,s,P('M-110 0 L110 0 M-100 0 L-100 -105 L0 -165 L100 -105 L100 0 M-120 -105 L0 -177 L120 -105 M-22 0 L-22 -65 L22 -65 L22 0 M-75 -84 L-44 -84 L-44 -50 L-75 -50 Z M44 -84 L75 -84 L75 -50 L44 -50 Z')+circ(0,-112,14,'detail')+P('M0 -123 L0 -112 L8 -108','detail'),c);}
function desk(x,y,s=1,c=''){return group(x,y,s,P('M-130 -36 L150 -36 L150 -20 L-130 -20 Z M-107 -20 L-110 90 M125 -20 L126 90 M-67 -36 L-67 75 L-117 75 M-55 75 L-57 106')+book(13,-86,.52)+lamp(111,-38,.64,'daily-lamp')+P('M-45 -54 L-15 -72','warm'),c);}
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
 <g class="warm-lines">${person(517,777,1.03,'grandma','listen')}${P('M584 668 C657 623 705 743 798 720 C884 697 941 772 1023 724 C1090 685 1173 724 1247 677','warm connection')}${book(1141,716,.48,'connection-book')}${P('M480 794 L1245 794','warm detail')}</g>
 <g class="quiet-lines">${P('M260 753 C407 730 575 774 708 754 M907 755 C1110 730 1240 779 1390 750','soft')}</g>
 <g class="window-memory">
  ${windowFrame(830,608,1.13,'shared-window')}${P('M686 728 L984 728 M700 735 L963 735','soft sill')}
  <g class="window-children">${P('M702 778 L892 778 M712 783 L710 815 M883 783 L885 815','soft window-seat')}${person(745,803,.79,'child','sit','window-alyosha')}${person(827,803,.84,'child','sit','window-sasha')}${P('M718 812 Q799 825 899 812','warm companionship')}</g>
  <g class="distant-city">${P('M704 617 L746 617 L746 577 L759 565 L772 577 L772 617 L792 617 M785 567 Q808 531 831 567 L829 617 M807 546 L807 531 M802 535 L812 535 M842 617 L875 617 L875 584 L898 584 L898 617 L938 617','soft')}${P('M711 633 Q810 650 942 630','soft')}</g>
  <g class="window-birds">${P('M865 529 q8 -8 17 0 q8 -9 16 -2 M891 549 q6 -7 13 0 q8 -9 15 -3 M861 564 q5 -7 12 -1 q6 -8 14 -2','soft')}</g>
  ${P('M684 747 C652 761 628 794 581 810','warm window-thread')}
 </g>`;}
function labor(){return `${P('M150 800 Q480 762 730 789 T1470 792','soft')}
 <g class="labor-memory">${group(594,768,1.05,`<g transform="rotate(22)">${person(0,0,1,'grandfather','walk')}</g>`)}${P('M567 650 Q900 618 1235 644','cold rope')}${P('M1110 763 L1287 763 L1324 709 L1104 709 Z M1210 709 L1210 651 M1210 660 L1277 699 L1210 699','soft')}${P('M388 794 l20 -10 l26 9 m39 0 l14 -12 l19 9 m50 4 l18 -10 l19 12','detail')}</g>
 <g class="grandfather-present">${person(802,790,1.2,'grandfather','stand')}${P('M580 684 C628 677 666 673 710 691 M895 691 C938 675 983 679 1031 688','cold')}${P('M719 691 L754 691 M857 691 L885 691','dashed')}</g>`;}
function inferenceArrow(start,end,index){
 const mid=(start+end)/2;
 return `<g class="inference-arrow ${index===0?'arrow-first':'arrow-second'}" data-inference="${index}" data-cut="false">
  <g class="cut-left">${P(`M${start} 701 L${mid-22} 701`,'dashed')}</g>
  <g class="cut-right">${P(`M${mid+22} 701 L${end} 701 M${end-15} 693 L${end} 701 L${end-15} 709`,'dashed')}</g>
  <g class="uncut-mid">${L(mid-22,701,mid+22,701,'dashed')}</g>
  ${P(`M${mid-16} 681 L${mid+16} 721 M${mid+16} 681 L${mid-16} 721`,'cut-mark warm')}
 </g>`;
}
function logic(){return `${P('M216 748 C488 772 577 706 800 750 C1015 794 1175 722 1393 752','soft')}
 <g class="tools">${P('M390 720 L441 691 L477 728 M440 691 L439 770','warm')}${P('M776 708 L802 750 L839 701 M782 773 L819 746','cold')}${P('M1160 758 Q1205 694 1250 759','warm')}</g>
 <g class="repair-trace">${P('M390 774 L634 774','soft')}${P('M634 774 Q680 693 726 774','cold missing')}${P('M726 774 L1208 774','soft')}${strokes(900,685,1.25)}</g>
 <g class="logic-nodes">${circ(335,701,24,'node')}${circ(800,701,24,'node')}${circ(1265,701,24,'node')}${inferenceArrow(365,755,0)}${inferenceArrow(831,1224,1)}</g>`;}
function protect(){return `<g class="protect-frame">${P('M182 808 L182 327 L1420 327 L1420 808','cold boundary')}${P('M132 810 L1473 810','soft')}${P('M240 368 L1365 368','cold detail')}${P('M240 370 L240 795 M1365 370 L1365 795','cold detail')}</g>
 <g class="protect-pair">${person(721,788,1.38,'protector','protect')}${person(928,788,.89,'child','stand')}${P('M725 702 Q794 668 878 701 Q928 719 967 697','warm bond')}${P('M666 811 Q843 834 1010 809','warm detail')}
  <g class="protection-cost">${P('M836 668 l4 8 M866 675 l4 8','cold cost-marks')}${P('M838 673 l5 2 M868 680 l5 2','paper-gap')}</g>
 </g>
 <g class="protection-limits">${P('M313 780 L313 428 L1281 428 L1281 780 M367 779 L367 475 L1216 475 L1216 779','cold soft')}${L(400,812,1230,812,'cold')}</g>`;}
function anne(){return `<g class="anne-room">${P('M410 808 L410 327 L500 260 L1110 260 L1200 327 L1200 808','cold room-outline')}${P('M451 808 L451 360 L1160 360 L1160 808','detail')}${windowFrame(1018,509,.84,'shared-window')}${P('M510 789 L510 472 L621 472 L621 790 M606 633 L607 645','cold door')}${P('M480 812 L1145 812','soft')}${person(785,780,.88,'anne','read')}${book(851,721,.54)}</g>
 <g class="help-hand">${hand(409,742,.58)}</g><g class="help-objects">${group(549,735,.65,P('M-40 5 L35 5 L29 63 L-34 63 Z M-40 5 Q-20 -39 -5 -23 Q6 -46 35 5 M-11 -20 L-10 3'))}${group(640,760,.68,P('M-15 -70 L-55 -49 L-38 -17 L-22 -24 L-22 50 L30 50 L30 -24 L47 -17 L62 -49 L19 -70 Q3 -45 -15 -70'))}${book(1038,726,.47)}${P('M355 794 C423 766 437 673 496 687 C566 703 629 804 716 765','warm incoming')}</g>
 <g class="wishes">${bicycle(1268,691,.68,'wish-bike')}${person(1346,481,.63,'child','walk','wish-dancer')}${P('M1155 550 Q1190 534 1214 549 M1160 568 Q1190 552 1226 562 M1164 585 Q1200 573 1245 582','warm whistle')}${P('M856 717 C932 687 1050 649 1160 657','warm dashed wish-route')}<g class="wish-traveller">${circ(856,717,6,'warm filled')}</g>${P('M1173 641 L1173 674','cold wish-stop')}</g>
 <g class="outer-danger">${P('M1173 263 L1173 788','cold thick danger-line')}${P('M1203 280 L1230 315 M1203 327 L1230 362 M1203 375 L1230 410 M1203 424 L1230 459 M1203 472 L1230 507 M1203 520 L1230 555 M1203 568 L1230 603 M1203 616 L1230 651 M1203 664 L1230 699 M1203 712 L1230 747','cold detail')}${circ(1173,657,8,'cold filled')}</g>`;}
function discussion(){return `<g class="evidence-lines">${book(422,744,.65)}${book(1178,744,.65)}${P('M486 774 C619 774 620 659 768 659 M1114 774 C981 774 980 659 832 659','warm')}${circ(800,659,32,'warm')}${P('M800 692 L800 801','warm')}${P('M658 807 Q800 834 942 807','detail')}</g>
 <g class="first-record">${strokes(710,716,.7)}</g><g class="second-record">${strokes(888,716,.7)}</g>
 <g class="check-record">${P('M857 656 C938 569 1064 642 977 712 Q931 746 866 736','warm')}${P('M876 727 L865 736 L877 742','warm')}${strokes(800,771,.63)}</g>`;}
function author(){return `<g class="author-book">${book(800,700,1.08)}</g>
 <g class="roots"><g class="harm-root root-left">${P('M590 693 Q543 749 483 788 L448 830 M483 788 L389 823 M485 787 L540 824','cold')}</g><g class="harm-root root-right">${P('M1017 690 Q1068 754 1125 789 L1162 834 M1125 789 L1222 819 M1125 789 L1078 834','cold')}</g></g>
 <g class="new-growth">${P('M897 778 C962 779 1003 742 1061 758 S1180 790 1270 754','warm author-open-route')}${person(1190,779,.48,'child','walk')}${P('M1072 806 L1288 806','warm detail')}</g>`;}
function reality(){return `<g class="reality-line">${P('M260 792 C465 738 567 818 801 787 S1141 745 1358 791','warm')}${person(805,770,.72,'child','stand')}</g>
 <g class="school-memory">${school(428,756,.85)}${person(569,775,.45,'child','walk')}${P('M540 794 Q628 748 725 794','warm')}</g>
 <g class="lamp-memory">${lamp(1170,759,1.2)}${book(1046,743,.53)}${P('M1030 800 L1236 800','detail')}</g>`;}
function finale(){return `<g class="final-world">
 <g class="roof">${P('M300 797 L300 342 L1300 342 L1300 797','cold thick')}${P('M264 315 L1336 315','cold detail')}</g>
 <g class="final-child">${person(801,774,.94,'child','stand')}${P('M708 792 Q802 812 895 792','warm')}</g>
 <g class="memory-arm">${hand(509,606,.78)}${P('M512 661 Q663 637 763 709','warm memory-link')}</g>
 <g class="memory-window">${windowFrame(1073,560,.64,'shared-window')}${P('M1020 632 Q968 665 841 711','warm memory-link')}</g>
 <g class="memory-school">${school(493,798,.66)}${P('M574 789 L726 789','warm memory-link')}</g>
 <g class="memory-lamp">${lamp(1132,790,.9,'shared-lamp')}${book(1027,758,.42)}${P('M882 788 L1004 788','warm memory-link')}</g>
 <g class="adults">
  <g class="support-hand support-hand-one">${hand(224,647,.94)}${P('M289 673 C357 689 395 738 433 772','warm thick support-join')}</g>
  <g class="support-hand support-hand-two">${hand(1372,644,.94,-1)}${P('M1306 670 Q1236 680 1177 751','warm thick support-join')}</g>
  <g class="support-hand support-hand-three">${hand(805,850,.76)}${P('M803 850 L802 805','warm thick support-join')}</g>
 </g>
 </g>${P('M118 826 C457 809 576 842 800 827 S1193 808 1480 828','soft')}`;}
const zones=[['day',day],['book',bookScene],['effects',effects],['labor',labor],['logic',logic],['protect',protect],['anne',anne],['discussion',discussion],['author',author],['reality',reality],['finale',finale]];
const positions=Object.fromEntries(zones.map(([n],i)=>[n,i*1760]));
/* Every cue commits its terminal state before finite WAAPI motions run.
   Restoring, returning and reduced-motion therefore share exactly one terminal
   state; replay never redraws an entire scene or erases prior evidence. */
let svgRoot=null, activeCue=null, animationSet=new Set(), pathLengths=new WeakMap();
let cameraTransform='translate(0px,0px)', threadD='', paused=false, logicSelection=[false,false];
const visited=new Set(), terminalSnapshots=new WeakMap();
const EASE='cubic-bezier(.22,.68,.18,1)';
const READ_KINDS=new Set(['reading','pair','repair','group','writing']);
const motionSelector='.scene-art,.focus-lens,[data-motion],.arm-moving,.support-arms,.cut-left,.cut-right,.uncut-mid,.cut-mark,.effect-child .person-body,.protector .person-body,.wish-traveller,.harm-root';
const threadPoints={
 road:[[120,818],[470,781],[800,810],[1110,780],[1480,817]],
 book:[[130,820],[516,805],[671,721],[842,746],[1470,819]],
 quiet:[[130,823],[465,813],[800,825],[1140,814],[1470,823]],
 relation:[[130,818],[517,780],[805,740],[1141,775],[1470,820]],
 window:[[130,822],[562,817],[742,799],[877,802],[1470,822]],
 logic:[[130,820],[390,804],[800,816],[1210,804],[1470,820]],
 protect:[[130,820],[605,807],[795,714],[953,704],[1450,818]],
 help:[[160,817],[355,794],[495,687],[716,765],[1105,811]],
 group:[[130,819],[422,790],[800,735],[1178,790],[1470,819]],
 support:[[130,822],[493,797],[800,808],[1132,791],[1470,822]],
 finale:[[96.5,737.1],[477.65,710.85],[800,722.4],[1148.6,704.55],[1503.5,737.1]]
};
function smoothPath(points){
 let d=`M${points[0][0]} ${points[0][1]}`;
 for(let i=1;i<points.length;i++){
  const p=points[i-1],q=points[i],a=points[Math.max(0,i-2)],b=points[Math.min(points.length-1,i+1)];
  d+=` C${p[0]+(q[0]-a[0])*.17} ${p[1]+(q[1]-a[1])*.17} ${q[0]-(b[0]-p[0])*.17} ${q[1]-(b[1]-p[1])*.17} ${q[0]} ${q[1]}`;
 }
 return d;
}
function threadFor(cue){
 if(READ_KINDS.has(cue.kind))return {shape:'quiet',kind:'quiet',opacity:.24};
 if(cue.id==='cover')return {shape:'road',kind:'route',opacity:.32};
 if(cue.id==='final-day')return {shape:'road',kind:'relation',opacity:.66};
 if(cue.id==='book-entry'||cue.id==='initial'||cue.id==='revision')return {shape:'book',kind:'route',opacity:.75};
 if(cue.id.startsWith('window-'))return {shape:'window',kind:'relation',opacity:.7};
 if(cue.id==='connection'||cue.id==='compare')return {shape:'relation',kind:'relation',opacity:.72};
 if(cue.zone==='logic'||cue.zone==='labor')return {shape:'logic',kind:'reasoning',opacity:.52};
 if(cue.zone==='protect')return {shape:'protect',kind:'relation',opacity:.68};
 if(cue.zone==='anne')return {shape:'help',kind:'relation',opacity:cue.state==='room'?.28:.62};
 if(cue.zone==='discussion')return {shape:'group',kind:'relation',opacity:.6};
 if(cue.zone==='finale')return {shape:'finale',kind:'relation',opacity:.66};
 if(cue.zone==='reality')return {shape:'support',kind:'relation',opacity:.66};
 return {shape:cue.zone==='day'?'road':'quiet',kind:cue.zone==='day'?'route':'quiet',opacity:.55};
}
function lensFor(cue){
 // Close-ups only affect vector figures below the central reading field.
 if(READ_KINDS.has(cue.kind))return 'translate(0px,0px) scale(1)';
 const f={
  'protection':[1.5,845,688], 'protection-cost':[1.6,851,687],
  'again-question':[1.23,845,710], 'again-answer':[1.1,845,710],
  'window-stay':[1.16,810,735], 'anne-help':[1.08,745,720],
  'anne-wishes':[1.035,870,725], 'final-reveal':[1.05,800,720,-90],
  'final-support':[1.05,800,720,-90]
 }[cue.id];
 if(!f)return 'translate(0px,0px) scale(1)';
 const [s,x,y,dy=0]=f;return `translate(${x*(1-s)}px,${y*(1-s)+dy}px) scale(${s})`;
}
function setup(svg){
 stop();svgRoot=svg;visited.clear();activeCue=null;pathLengths=new WeakMap();logicSelection=[false,false];
 svg.innerHTML=`<defs><g id="shared-window-shape">${windowShape}</g><g id="shared-lamp-shape">${lampShape}</g></defs>
 <g id="camera"><path class="world-spine" d="M-200 839 ${zones.map(([n])=>'C'+(positions[n]+200)+' 832 '+(positions[n]+1200)+' 846 '+(positions[n]+1760)+' 839').join(' ')}"/>${zones.map(([n,fn])=>`<g class="zone zone-${n}" id="zone-${n}" transform="translate(${positions[n]} 0)"><g class="scene-art"><g class="focus-lens">${fn()}</g></g></g>`).join('')}</g>
 <g id="story-thread-layer" aria-hidden="true"><path id="story-thread"/><g id="thread-records">${strokes(330,851,.25,'record-cost')}${strokes(800,851,.25,'record-question')}${strokes(1270,851,.25,'record-choice')}</g></g>`;
 for(const zone of svg.querySelectorAll('.zone')){
  const first=(window.LINE_LESSON?.cues||[]).find(c=>c.zone===zone.id.replace('zone-',''));
  zone.dataset.state=first?.state||'quiet';zone.dataset.reached='false';
  zone.querySelectorAll('.focus-lens > g,.window-children,.window-birds,.window-memory .distant-city,.help-objects > g,.adults > g,.final-world > g,.protection-cost').forEach(el=>el.setAttribute('data-motion',''));
 }
 threadD=smoothPath(threadPoints.quiet);svg.querySelector('#story-thread').setAttribute('d',threadD);
 cameraTransform='translate(0px,0px)';svg.querySelector('#camera').style.transform=cameraTransform;
 // Only paths that can narrate a change receive a length measurement. Static
 // hair, furniture and scenery are never measured or redrawn per cue.
 svg.querySelectorAll('.route,.book-thread,.connection,.window-thread,.companionship,.missing,.bond,.incoming,.wish-route,.author-open-route,.support-join,.memory-link,.record-lines path').forEach(path=>{
  if(typeof path.getTotalLength==='function')pathLengths.set(path,path.getTotalLength());
 });
}
function play(el,frames,options={}){
 if(!el)return null;
 const a=el.animate(frames,{duration:1800,easing:EASE,fill:'backwards',...options});
 animationSet.add(a);if(paused)a.pause();
 a.onfinish=()=>animationSet.delete(a);a.oncancel=()=>animationSet.delete(a);
 return a;
}
function draw(zone,selector,{duration=2200,delay=0,stagger=90,max=8}={}){
 [...zone.querySelectorAll(selector)].slice(0,max).forEach((el,i)=>{
  let len=pathLengths.get(el);if(len==null){if(typeof el.getTotalLength!=='function')return;len=el.getTotalLength();pathLengths.set(el,len);}
  play(el,[{strokeDasharray:`${len} ${len}`,strokeDashoffset:len},{strokeDasharray:`${len} ${len}`,strokeDashoffset:0}],{duration,delay:delay+i*stagger});
 });
}
function snapshot(zone){
 return new Map([...zone.querySelectorAll(motionSelector)].map(el=>{const s=getComputedStyle(el);return [el,{opacity:s.opacity,transform:s.transform,stroke:s.stroke}];}));
}
function commitLogic(next){
 logicSelection=[!!next?.[0],!!next?.[1]];
 const zone=svgRoot?.querySelector('#zone-logic');if(!zone)return;
 zone.dataset.cutFirst=String(logicSelection[0]);zone.dataset.cutSecond=String(logicSelection[1]);
 zone.querySelectorAll('.inference-arrow').forEach((el,i)=>{el.dataset.cut=String(logicSelection[i]);});
}
function setLogicChoices(next,{instant=false}={}){
 if(!svgRoot){logicSelection=[!!next?.[0],!!next?.[1]];return;}
 const zone=svgRoot.querySelector('#zone-logic'),before=snapshot(zone);
 // A click may revise one arrow while another motion is still running. Cancel
 // only these four parts, leaving the camera and reading layer alone.
 for(const a of [...animationSet])if(a.effect?.target?.closest?.('.inference-arrow'))a.cancel();
 commitLogic(next);const after=snapshot(zone);terminalSnapshots.set(zone,after);
 if(!instant&&activeCue?.zone==='logic')animateChanged(zone,before,after,950);
}
function animateChanged(zone,before,after,duration){
 let count=0;
 for(const [el,from] of before){
  if(count>=20)break;
  // These have a sentence-specific gesture below, not a generic transition.
  if(el.matches('.arm-moving,.window-birds,.support-hand,.focus-lens,.protection-cost,.wish-traveller,.harm-root'))continue;
  if(zone.dataset.cue==='author-change'&&el.matches('.new-growth'))continue;
  if(zone.dataset.cue==='again-answer'&&el.matches('.protect-frame'))continue;
  if(zone.dataset.cue==='final-support'&&el.matches('.roof,.adults'))continue;
  const to=after.get(el);if(!to)continue;
  if(from.opacity===to.opacity&&from.transform===to.transform&&from.stroke===to.stroke)continue;
  play(el,[from,to],{duration:el.matches('.focus-lens')?2400:duration});count++;
 }
}
function updateThread(cue,animated){
 const el=svgRoot.querySelector('#story-thread'),t=threadFor(cue),nextD=smoothPath(threadPoints[t.shape]);
 const before=getComputedStyle(el),fromOpacity=before.opacity,fromStroke=before.stroke;
 el.dataset.kind=t.kind;el.style.opacity=t.opacity;el.setAttribute('d',nextD);
 const to=getComputedStyle(el);
 if(animated&&(threadD!==nextD||fromOpacity!==String(t.opacity)||fromStroke!==to.stroke)){
  const frames=[{d:`path("${threadD}")`,opacity:fromOpacity,stroke:fromStroke},{d:`path("${nextD}")`,opacity:String(t.opacity),stroke:to.stroke}];
  play(el,frames,{duration:cue.id==='final-reveal'?4600:2300});
 }
 threadD=nextD;
 const index=window.LINE_LESSON?.cues?.findIndex(c=>c.id===cue.id)??0;
 const reached=id=>{const n=window.LINE_LESSON?.cues?.findIndex(c=>c.id===id)??-1;return n>=0&&index>=n;};
 const records=svgRoot.querySelector('#thread-records');
 records.classList.toggle('cost-seen',reached('g1-record'));records.classList.toggle('question-seen',reached('g2-cut'));records.classList.toggle('choice-seen',reached('protection'));
 records.classList.toggle('quiet-records',READ_KINDS.has(cue.kind)||cue.kind==='art'||cue.kind==='photo');
 if(animated&&['g1-record','g2-cut','protection'].includes(cue.id)){
  const sel={ 'g1-record':'.record-cost path','g2-cut':'.record-question path',protection:'.record-choice path'}[cue.id];
  draw(records,sel,{duration:1500,delay:900,max:1});
 }
}
function transitionCamera(cue,old,animated){
 const cam=svgRoot.querySelector('#camera'),next=`translate(${-positions[cue.zone]}px,0px)`,previous=cameraTransform;
 cam.style.transform=next;cameraTransform=next;
 if(!animated||previous===next)return;
 // The ending recalls familiar objects at human scale. A flight across all
 // eleven scenes would compete with the hand, window, school and lamp.
 if(cue.id==='final-reveal'||cue.id==='final-day')return;
 const distance=Math.abs((positions[old?.zone]||0)-positions[cue.zone]);
 if(distance<=1760){
  play(cam,[{transform:previous},{transform:next}],{duration:1700});
 }else{
  // A wide establishing movement follows the existing world. It never flashes
  // unrelated intermediate text, which is owned by the reading layer.
  const from=positions[old?.zone]||0,to=positions[cue.zone],mid=(from+to)/2,zoom=Math.max(.12,Math.min(.44,1500/(distance+1700)));
  const wide=`translate(${800-(mid+800)*zoom}px,${820*(1-zoom)}px) scale(${zoom})`;
  play(cam,[{transform:previous,offset:0},{transform:wide,offset:.42},{transform:next,offset:1}],{duration:cue.id==='final-reveal'?4800:2900});
 }
}
function choreograph(zone,cue,mode){
 const replay=mode==='replay';
 if(cue.id==='day-road'){
  draw(zone,'.route',{duration:3200});
  play(zone.querySelector('.walker .person-body'),[{transform:'translate(-86px,0)'},{transform:'translate(0,0)'}],{duration:5100});
  play(zone.querySelector('.traveller .bike-parts'),[{transform:'translate(80px,0)'},{transform:'translate(0,0)'}],{duration:5100});
  zone.querySelectorAll('.traveller .wheel').forEach(el=>play(el,[{transform:'rotate(-105deg)'},{transform:'rotate(0deg)'}],{duration:5100}));
 }
 const traceMap={
  'book-entry':['.book-thread',2500],connection:['.connection',2800],
  'window-stay':['.companionship,.window-thread',2400], 'g1-record':['.missing,.repair-trace .record-lines path',2200],
  protection:['.bond',2900],'anne-help':['.incoming',3100],
  'share-two':['.first-record path',1900],'share-check':['.second-record path,.check-record path',2100],
  'final-reveal':['.memory-link',2900]
 };
 if(traceMap[cue.id]){const [selector,duration]=traceMap[cue.id];draw(zone,selector,{duration,delay:cue.id==='final-reveal'?1800:350,max:6,stagger:cue.id==='final-support'?650:100});}
 if(cue.id==='window-stay'){
  play(zone.querySelector('.window-birds'),[{opacity:.7,transform:'translate(0,0)'},{opacity:.8,transform:'translate(-28px,-24px)',offset:.45},{opacity:0,transform:'translate(-87px,-53px)'}],{duration:4500});
  play(zone.querySelector('.window-sasha .person-body'),[{transform:'translate(18px,0)'},{transform:'translate(0,0)'}],{duration:2600});
 }
 if(cue.id==='protection'){
  play(zone.querySelector('.arm-moving'),[{transform:'rotate(62deg)'},{transform:'rotate(-1.5deg)',offset:.86},{transform:'rotate(0deg)'}],{duration:2900});
 }
 if(cue.id==='protection-cost'){
  play(zone.querySelector('.protection-cost'),[{opacity:0},{opacity:1}],{duration:2400,delay:500});
 }
 if(cue.id==='again-answer'){
  play(zone.querySelector('.protect-frame'),[{opacity:.12},{opacity:.65}],{duration:2600,delay:700});
  draw(zone,'.protect-frame .boundary',{duration:2300,delay:1000,max:1});
 }
 if(cue.id==='anne-context'){
  const window=zone.querySelector('.shared-window');play(window,[{opacity:.1},{opacity:1}],{duration:2300,delay:400});
 }
 if(cue.id==='anne-help'){
  zone.querySelectorAll('.help-objects>g').forEach((el,i)=>{
   const base=getComputedStyle(el).transform;
   play(el,[{opacity:0,transform:base+' translate(-85px,18px)'},{opacity:1,transform:base}],{duration:1500,delay:500+i*750});
  });
  play(zone.querySelector('.help-hand'),[{opacity:0,transform:'translate(-45px,10px)'},{opacity:1,transform:'translate(0px,0px)'}],{duration:1500});
 }
 if(cue.id==='anne-wishes'){
  // The imagined route remains dashed throughout; it never briefly becomes a
  // solid, already available road during a generic stroke-dash reveal.
  play(zone.querySelector('.wish-route'),[{opacity:0},{opacity:1}],{duration:2200,delay:350});
  play(zone.querySelector('.wish-bike .bike-parts'),[{transform:'translate(-32px,0)',opacity:0},{transform:'translate(0,0)',opacity:1}],{duration:2800});
  zone.querySelectorAll('.wish-bike .wheel').forEach(el=>play(el,[{transform:'rotate(-180deg)'},{transform:'rotate(0deg)'}],{duration:2800}));
  play(zone.querySelector('.wish-dancer .person-body'),[{transform:'rotate(-5deg)'},{transform:'rotate(6deg)',offset:.45},{transform:'rotate(0deg)'}],{duration:3200,delay:650});
  draw(zone,'.whistle',{duration:1800,delay:1300,max:1});
 }
 if(cue.id==='anne-blocked'){
  play(zone.querySelector('.outer-danger'),[{opacity:.15},{opacity:1}],{duration:1300});
  const route=zone.querySelector('.wish-route'),traveller=zone.querySelector('.wish-traveller');
  const length=pathLengths.get(route)||route.getTotalLength(),start=route.getPointAtLength(0);
  const frames=Array.from({length:17},(_,i)=>{
   const p=route.getPointAtLength(length*i/16);
   return {transform:`translate(${p.x-start.x}px,${p.y-start.y}px)`,opacity:.6+i*.4/16,offset:i/16};
  });
  // A wish advances; Anne herself remains safely represented inside the room.
  // It stops at 2.2 seconds, before the separate danger edge. Help stays put.
  play(traveller,frames,{duration:2000,delay:200,easing:'cubic-bezier(.2,.5,.2,1)'});
 }
 if(cue.id==='g2-cut'&&replay){
  zone.querySelectorAll('.inference-arrow[data-cut="true"]').forEach((arrow,i)=>{
   for(const part of arrow.querySelectorAll('.cut-left,.cut-right'))play(part,[{transform:'none'},{transform:getComputedStyle(part).transform}],{duration:950,delay:i*100});
   play(arrow.querySelector('.uncut-mid'),[{opacity:1},{opacity:0}],{duration:800,delay:i*100});
   play(arrow.querySelector('.cut-mark'),[{opacity:0},{opacity:1}],{duration:950,delay:i*100});
  });
 }
 if(cue.id==='author-change'){
  // Harmful branches move away independently. The book remains; a new route
  // leaves its page rather than growing from the discarded cold branches.
  zone.querySelectorAll('.harm-root').forEach(el=>play(el,[{opacity:.42,transform:'none'},{opacity:.1,transform:getComputedStyle(el).transform}],{duration:2200}));
  play(zone.querySelector('.new-growth'),[{opacity:0},{opacity:1}],{duration:1900,delay:1700});
  draw(zone,'.author-open-route',{duration:2200,delay:1900,max:1});
 }
 if(cue.id==='yamen-close')draw(zone,'.school-memory>path',{duration:2100,delay:900,max:1});
 if(cue.id==='varvara-close')play(zone.querySelector('.lamp-memory'),[{opacity:0},{opacity:1}],{duration:2500,delay:850});
 if(cue.id==='final-reveal'){
  // Keep one recognizable hand in focus, then reveal the remembered objects.
  play(zone.querySelector('.focus-lens'),[{transform:'translate(44px,-316px) scale(1.55)'},{transform:lensFor(cue)}],{duration:5800});
  ['.memory-window','.memory-school','.memory-lamp'].forEach((sel,i)=>play(zone.querySelector(sel),[{opacity:0},{opacity:1}],{duration:2300,delay:1700+i*850}));
  play(zone.querySelector('.final-child'),[{opacity:0},{opacity:1}],{duration:2300,delay:2600});
  play(zone.querySelector('.roof'),[{opacity:0},{opacity:.38}],{duration:2300,delay:3500});
 }
 if(cue.id==='final-support'){
  zone.querySelectorAll('.support-hand').forEach((el,i)=>{
   play(el,[{opacity:0,transform:`translate(${i===0?-35:i===1?35:0}px,${i===2?28:8}px)`},{opacity:1,transform:'translate(0px,0px)'}],{duration:1800,delay:i*900});
   draw(el,'.support-join',{duration:1500,delay:1000+i*900,max:1});
  });
  const roof=zone.querySelector('.roof');
  // Only after all three joins can be seen does the boundary ease outward.
  play(roof,[{opacity:.38,transform:'none'},{opacity:.15,transform:getComputedStyle(roof).transform}],{duration:2500,delay:4400});
 }
 if(cue.id==='final-day'){
  ['.road-set','.desk-set'].forEach((sel,i)=>play(zone.querySelector(sel),[{opacity:0},{opacity:1}],{duration:2500,delay:450+i*1800}));
  play(zone.querySelector('.traveller .bike-parts'),[{transform:'translate(-45px,0)'},{transform:'translate(0,0)'}],{duration:4000,delay:1100});
  zone.querySelectorAll('.traveller .wheel').forEach(el=>play(el,[{transform:'rotate(-65deg)'},{transform:'rotate(0deg)'}],{duration:4000,delay:1100}));
 }
 if(replay&&!traceMap[cue.id]&&!['day-road','window-stay','protection-cost','again-answer','anne-context','anne-blocked','varvara-close','final-day'].includes(cue.id)){
  // A replay of a quiet reading/question keeps its evidence intact. There is
  // deliberately no decorative repaint when the cue has no narrative gesture.
  if(cue.kind==='art'||READ_KINDS.has(cue.kind))return;
 }
}
function set(cue,old,reduced,immediate=false,mode='forward',choices=null){
 if(!svgRoot||!positions.hasOwnProperty(cue.zone))return;
 stop();paused=false;
 const zone=svgRoot.querySelector('#zone-'+cue.zone),before=terminalSnapshots.get(zone)||snapshot(zone),first=!visited.has(cue.zone);
 const former=svgRoot.querySelector('.zone.current'),formerOpacity=former?getComputedStyle(former).opacity:'0.16';
 const zoneOpacity=getComputedStyle(zone).opacity;
 const timeline=window.LINE_LESSON?.cues||[],cueIndex=timeline.findIndex(c=>c.id===cue.id);
 for(const el of svgRoot.querySelectorAll('.zone')){
  const name=el.id.replace('zone-',''),last=timeline.slice(0,cueIndex+1).reverse().find(c=>c.zone===name);
  el.dataset.reached=String(!!last);
  if(last&&el!==zone){el.dataset.state=last.state;el.querySelector('.focus-lens').style.transform=lensFor(last);}
  el.classList.toggle('current',el===zone);
  if(name==='logic')commitLogic(cue.zone==='logic'?(choices||[cue.state==='cut',cue.state==='cut']):[last?.state==='cut',last?.state==='cut']);
 }
 zone.dataset.state=cue.state;zone.dataset.cue=cue.id;
 zone.querySelector('.focus-lens').style.transform=lensFor(cue);
 const animated=!reduced&&!immediate&&mode!=='restore';
 const after=snapshot(zone);terminalSnapshots.set(zone,after);
 transitionCamera(cue,old||activeCue,animated);
 updateThread(cue,animated);
 if(animated){
  if(former&&former!==zone){play(former,[{opacity:formerOpacity},{opacity:'.16'}],{duration:1400});play(zone,[{opacity:zoneOpacity},{opacity:'1'}],{duration:1500});}
  if(!first&&mode!=='replay')animateChanged(zone,before,after,cue.id==='g2-cut'?1100:2000);
  const lens=zone.querySelector('.focus-lens'),fromLens=before.get(lens)?.transform,toLens=after.get(lens)?.transform;
  if(cue.id!=='final-reveal'&&fromLens&&fromLens!==toLens)play(lens,[{transform:fromLens},{transform:toLens}],{duration:2400});
  choreograph(zone,cue,mode);
 }
 visited.add(cue.zone);activeCue=cue;
}
function stop(){for(const a of [...animationSet])a.cancel();animationSet.clear();paused=false;}
function finish(){for(const a of [...animationSet]){try{a.finish();}catch{}a.cancel();}animationSet.clear();paused=false;}
function pause(){paused=true;for(const a of animationSet)if(a.playState==='running'||a.pending)a.pause();}
function resume(){paused=false;for(const a of animationSet)if(a.playState==='paused')a.play();}
function isAnimating(){return [...animationSet].some(a=>a.playState==='running'||a.playState==='paused'||a.pending);}
function reset(){stop();}
window.LineWorld={setup,set,setLogicChoices,stop,reset,finish,pause,resume,isAnimating,positions,
 get state(){return {cue:activeCue?.id||null,paused,activeAnimations:animationSet.size,visited:visited.size,logicChoices:[...logicSelection]};}};
})();
