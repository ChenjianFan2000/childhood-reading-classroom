/* Hand-drawn scenery. All movement belongs to a finite, teacher-paced shot. */
(function () {
  'use strict';

  const svg = (viewBox, body, cls = '') => '<svg class="' + cls + '" viewBox="' + viewBox + '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  const figure = (cls, pose = 0) => '<span class="sb-figure ' + cls + '"><span class="sb-figure-body sb-pose-' + pose + '"></span><span class="sb-foot-shadow"></span></span>';
  const leaf = (cls = '') => '<span class="sb-leaf ' + cls + '">' + svg('0 0 70 110', '<path d="M35 101C4 76 3 34 48 6 66 36 66 72 35 101Z" fill="currentColor" fill-opacity=".7"/><path d="M34 108 45 20M40 55 22 43M38 75 54 56" stroke="#66704d" stroke-width="2" stroke-linecap="round"/>') + '</span>';
  const sprig = (cls = '') => '<span class="sb-sprig ' + cls + '">' + svg('0 0 150 220', '<path d="M43 213C89 150 79 92 124 13" stroke="#68775b" stroke-width="2.2" stroke-linecap="round"/><path d="M60 181C27 177 17 156 18 145 44 139 62 154 60 181ZM72 153C109 151 130 132 128 121 102 115 80 129 72 153ZM79 120C48 109 46 88 49 78 74 78 87 98 79 120ZM91 91C119 92 141 74 142 62 118 55 100 70 91 91ZM104 60C80 45 80 24 84 16 106 20 115 39 104 60ZM117 31C132 30 147 18 147 6 130 5 121 15 117 31Z" fill="#9ba577" fill-opacity=".55" stroke="#73805d" stroke-width="1"/><path d="M45 206C59 181 67 153 79 125" stroke="#a58e5c" stroke-width="1.1"/>') + '</span>';
  const sprigGold = (cls = '') => '<span class="sb-sprig sb-gold-sprig ' + cls + '">' + svg('0 0 120 170', '<path d="M16 160C59 131 74 85 93 14M48 128 12 88M64 101 112 66M78 66 48 30" stroke="#ac9462" stroke-width="1.6" stroke-linecap="round"/><path d="M22 99C7 95 4 82 8 71 21 75 28 88 22 99ZM39 119C31 101 34 89 42 83 52 93 51 111 39 119ZM84 87C87 66 99 56 110 60 110 74 98 87 84 87ZM95 64C99 44 111 40 119 44 117 59 109 65 95 64ZM63 48C48 48 42 35 47 23 61 25 68 37 63 48ZM87 36C83 18 91 8 99 5 106 19 99 34 87 36Z" fill="#b8a16b" fill-opacity=".45"/>') + '</span>';

  function ball() {
    return svg('0 0 100 100', '<circle cx="50" cy="50" r="44" fill="#d4aa61" stroke="#8f7149" stroke-width="2.2"/><path d="M8 48C30 46 57 20 65 9M24 15C41 40 72 63 92 67M14 75C39 67 77 38 85 26" stroke="#f4dfaf" stroke-width="7"/><path d="M8 48C30 46 57 20 65 9M24 15C41 40 72 63 92 67M14 75C39 67 77 38 85 26" stroke="#8e6e4d" stroke-width="1.2"/><path d="M24 28C30 16 47 12 57 17" stroke="#fff4d8" stroke-width="5" stroke-linecap="round" opacity=".7"/>', 'sb-ball-drawing');
  }

  function today() {
    return '<div class="sb-path-scene" aria-hidden="true">' +
      '<div class="sb-sun-patches"></div>' +
      '<div class="sb-path-chalk">' + svg('0 0 1600 260', '<path d="M30 201C190 247 219 144 390 172S640 243 816 170 1092 61 1559 120" stroke="#fff8dd" stroke-width="4" stroke-dasharray="1 28" stroke-linecap="round" opacity=".43"/><path d="m323 151 12 3m-4-10 1 17m685-9 15 3m-5-9-2 15" stroke="#f7edcb" stroke-width="3" stroke-linecap="round" opacity=".6"/>') + '</div>' +
      '<div class="sb-friend">' + figure('sb-waiting-child', 4) + '<span class="sb-greeting">' + svg('0 0 70 60', '<path d="m18 44-9-8m28-4-2-15m19 23 9-10" stroke="#f7e2a1" stroke-width="3" stroke-linecap="round"/>') + '</span></div>' +
      '<div class="sb-playmate">' + figure('sb-running-child', 0) + '</div>' +
      '<div class="sb-ball-route"><span class="sb-ball-shadow"></span><span class="sb-ball">' + ball() + '</span></div>' +
      '<div class="sb-traveller">' + figure('sb-reader', 0) + '</div>' +
      '<div class="sb-tree-shadow">' + svg('0 0 700 500', '<path d="M680 480 461 265 502 87M488 280 295 210 191 72M468 274 287 370M510 308 637 167" stroke="#466248" stroke-width="15" stroke-linecap="round"/><g fill="#597451"><ellipse cx="498" cy="112" rx="91" ry="47" transform="rotate(-55 498 112)"/><ellipse cx="262" cy="204" rx="82" ry="38" transform="rotate(20 262 204)"/><ellipse cx="212" cy="95" rx="79" ry="42" transform="rotate(39 212 95)"/><ellipse cx="320" cy="349" rx="86" ry="38" transform="rotate(-22 320 349)"/><ellipse cx="616" cy="167" rx="85" ry="46" transform="rotate(-40 616 167)"/></g>') + '</div>' +
      '<div class="sb-canopy">' + sprig('sb-canopy-sprig') + '</div>' +
      leaf('sb-falling-leaf sb-leaf-a') + leaf('sb-falling-leaf sb-leaf-b') + leaf('sb-falling-leaf sb-leaf-c') +
      '<span class="sb-path-spark sb-spark-a"></span><span class="sb-path-spark sb-spark-b"></span>' +
      '</div>';
  }

  function dust(className = '') {
    return '<div class="sb-dust ' + className + '" aria-hidden="true">' + Array.from({length: 9}, (_, i) => '<i class="sb-dust-grain" style="--sb-x:' + (8 + ((i * 17) % 85)) + '%;--sb-y:' + (12 + ((i * 23) % 69)) + '%;--sb-d:' + (i * .29) + 's"></i>').join('') + '</div>';
  }

  function parcel(kind) {
    const drawings = {
      food: '<path d="M16 79 27 111 110 114 125 77" fill="#a1875c" stroke="#725b3e" stroke-width="2"/><path d="m24 92 94 2m-88 9 83 3M35 81l8 30m14-29 5 31m15-31 1 32m17-32-4 30m18-33-5 32" stroke="#d0b47b" stroke-width="2"/><path d="M32 79C22 61 35 45 53 47 57 19 103 24 112 45 130 48 133 65 119 82Z" fill="#e0bd78" stroke="#a1814c" stroke-width="2"/><path d="m53 51 9 14m14-24 10 15m11-8 8 13" stroke="#f9e6bb" stroke-width="7" stroke-linecap="round"/><path d="M38 74C57 81 89 79 118 74" stroke="#b99159" stroke-width="1.5"/><path d="M28 78C39 58 99 58 116 80" stroke="#7a6547" stroke-width="3" stroke-linecap="round"/>',
      clothes: '<path d="m28 54 30-19 35 5 30 20-18 30-20-12-5 37-48-6 1-33-17 7Z" fill="#8e9c84" stroke="#60715b" stroke-width="2" stroke-linejoin="round"/><path d="M58 36c1 18 23 25 35 4M58 52l-9 58m43-53-8 57M29 66l10 10m71-4-10 8" stroke="#bec6a8" stroke-width="2"/><path d="m35 90 43 2 27 10-4 22-69-5Z" fill="#c3ad87" stroke="#927b57" stroke-width="2" stroke-linejoin="round"/><path d="m39 103 52 6m-50 3 48 5" stroke="#ebdbb9" stroke-width="2"/><path d="M48 94c12 7 30 10 49 9" stroke="#9c8867" stroke-width="1.3"/>',
      books: '<path d="m25 103 82 4 20-17-80-9Z" fill="#e6d9b6" stroke="#998760" stroke-width="2"/><path d="m25 103 81 5 1 11-81-6Z" fill="#8c6f53" stroke="#675a42" stroke-width="2"/><path d="m107 108 20-17v10l-20 17" fill="#b69e72" stroke="#8b7b57" stroke-width="1.5"/><path d="m29 80 63-18 31 16-63 20Z" fill="#79917c" stroke="#56725e" stroke-width="2"/><path d="m29 80v11l31 18V98Z" fill="#b5c2a0" stroke="#6c7c5f" stroke-width="2"/><path d="m60 98 63-20v11l-63 20" fill="#e7ddbe" stroke="#a59a79" stroke-width="1.5"/><path d="m46 51 49-13 20 18-48 15Z" fill="#f1ead7" stroke="#aca080" stroke-width="2"/><path d="m46 51 6 26 24 18-9-24Z" fill="#e3d7b8" stroke="#b6a787" stroke-width="1.5"/><path d="m67 71 48-15 2 26-41 13Z" fill="#f8f0d9" stroke="#b6a787" stroke-width="1.5"/><path d="m74 74 33-10m-31 16 32-9m-31 16 20-6" stroke="#9b9b80" stroke-width="1.5"/>'
    };
    return '<span class="sb-parcel sb-parcel-' + kind + '" aria-hidden="true">' + svg('0 0 145 135', '<ellipse cx="76" cy="122" rx="54" ry="6" fill="#a59b78" opacity=".15"/>' + (drawings[kind] || drawings.books)) + '</span>';
  }

  function deskDetails() {
    return '<div class="sb-desk-details" aria-hidden="true"><span class="sb-loose-paper">' + svg('0 0 200 125', '<path d="m24 25 142-12 14 88-146 6Z" fill="#f5edcf" stroke="#c1b392" stroke-width="1.5"/><path d="m49 46 85-8m-82 22 101-9m-97 24 77-7" stroke="#97a18c" stroke-width="2" stroke-linecap="round" opacity=".55"/><path d="m130 84 17-22 6 5-18 21-7 2Z" fill="#b49b64" stroke="#8c7852" stroke-width="1.5"/>') + '</span><span class="sb-erasing-dust"></span><div class="sb-desk-light"></div></div>';
  }

  function windowDetails() {
    return '<div class="sb-window-weather" aria-hidden="true"><span class="sb-window-glint"></span>' + dust('sb-window-dust') + '</div>';
  }

  function inkBook() {
    return '<span class="sb-ink-book" aria-hidden="true">' + svg('0 0 210 130', '<path d="M104 109C77 94 48 91 14 99L25 23C59 16 85 24 107 41 128 20 156 18 194 27l-7 76c-31-10-58-8-83 6Z" fill="#eee5cb" stroke="#8c9270" stroke-width="1.6"/><path d="m107 41-3 68M37 36c20-2 36 2 52 11m-54 3c21-2 36 2 52 11m-53 3c20-1 35 3 51 12m39-29c17-11 34-15 55-12m-55 26c17-11 33-13 53-11m-54 23c15-10 31-12 51-10" stroke="#9ba083" stroke-width="1.4" stroke-linecap="round"/><path d="m111 43-2 43 11-7 7 3 2-50" fill="#bc995d" opacity=".8"/>') + '</span>';
  }

  function chapterMotif(kind) {
    // Small still-life studies sit inside the page margin, below the reading area.
    const drawings = {
      lamp: '<ellipse cx="145" cy="135" rx="55" ry="5" fill="#b5a77b" opacity=".15"/><path d="M119 126h48l-6-9h-36Zm8-12h32l-4-20h-25Z" fill="#a7a382" fill-opacity=".4" stroke="#8b8b6d" stroke-width="1.7"/><path d="M126 92c-19-19-13-33-4-46l1-19h36l1 19c12 14 16 29-4 46Z" fill="#e8dab2" fill-opacity=".24" stroke="#9d9679" stroke-width="1.6"/><path d="M130 47c-8 13-13 25-2 35m9-51h14m-19 62h19" stroke="#b2aa8b" stroke-width="1.2" stroke-linecap="round"/><path d="M140 84c-7-7-9-13-2-23 0 7 9 8 8 15 0 4-2 6-6 8Z" fill="#c7ad64" fill-opacity=".55"/><path d="M139 86v10m-13 8h33" stroke="#8e8967" stroke-width="1.4"/><path d="M83 130c-6-7-16-8-24-6m123 8 22-2" stroke="#c1b699" stroke-width="1.1" stroke-linecap="round"/>',
      cup: '<path d="M63 113c21-10 84-9 105 1-3 15-103 16-105-1Z" fill="#d4ceb0" fill-opacity=".27" stroke="#a4a184" stroke-width="1.5"/><path d="m81 64 6 39c7 13 47 13 54-1l5-38Z" fill="#dbe0c5" fill-opacity=".42" stroke="#8c9c7a" stroke-width="1.8"/><ellipse cx="113" cy="64" rx="32" ry="8" fill="#dfcfa4" fill-opacity=".5" stroke="#9c9d7d" stroke-width="1.5"/><path d="M147 70c28-6 27 24-3 26m5-19c15-3 15 13-3 12M99 47c-10-9 8-15 1-24m20 23c-7-7 7-11 5-19" stroke="#9a9d7f" stroke-width="1.4" stroke-linecap="round"/><path d="m158 120 46-13m-7-3c15-3 20 3 6 7" stroke="#ac9c76" stroke-width="2" stroke-linecap="round"/><path d="M55 131c25 5 72 9 101 4" stroke="#bcb18e" stroke-width="1.1"/>',
      thread: '<path d="m70 47 13 59m28-63 13 60" stroke="#8c9476" stroke-width="2"/><ellipse cx="90" cy="46" rx="26" ry="7" transform="rotate(-12 90 46)" fill="#b9b18d" fill-opacity=".45" stroke="#8c9476" stroke-width="1.4"/><ellipse cx="104" cy="107" rx="28" ry="7" transform="rotate(-12 104 107)" fill="#b9b18d" fill-opacity=".45" stroke="#8c9476" stroke-width="1.4"/><path d="m74 55 39-8m-37 15 39-8m-37 15 39-8m-37 15 38-8m-36 15 38-8m-37 15 38-8m-36 15 37-8" stroke="#a79872" stroke-width="2.1" stroke-linecap="round"/><path d="M118 95c31 2 50 28 28 36-26 8-30-22-8-19 30 4 32 23 65 11" stroke="#a79979" stroke-width="1.3" stroke-linecap="round"/><path d="m155 59 43 43m-47-47 5 6m2-3-5-6" stroke="#8f9b87" stroke-width="1.2" stroke-linecap="round"/>',
      pencil: '<path d="m52 109 121-65 6 9-121 64-16 2Z" fill="#d3ba80" fill-opacity=".55" stroke="#9f8d65" stroke-width="1.6" stroke-linejoin="round"/><path d="m57 113 117-64m-123 60 6 8m113-72 6 9" stroke="#b6a174" stroke-width="1.2"/><path d="m42 119 10-10 5 8Z" fill="#e7d7af" stroke="#a79570" stroke-width="1"/><path d="m42 119 5-5 3 4Z" fill="#7c806d"/><path d="m173 44 8-4 6 9-8 4Z" fill="#b28f7d" fill-opacity=".55" stroke="#a08c73" stroke-width="1.3"/><path d="M121 115c-2-16 15-21 23-7-11 2-16 8-10 16m17-5c1-10 14-13 19-2-9 1-13 5-10 11" fill="#d8c899" fill-opacity=".38" stroke="#ac9d79" stroke-width="1.3"/><path d="m89 130 3 2m8-4 2 3m10-2 2 2" stroke="#aba183" stroke-width="2" stroke-linecap="round"/>',
      bookmark: '<path d="m100 29 40 3-7 95-18-12-20 9Z" fill="#b6ad83" fill-opacity=".28" stroke="#9c9a79" stroke-width="1.5"/><path d="m106 39 25 2-4 57m-22-50 24 2m-25 7 23 2m-24 7 23 1" stroke="#b5ac88" stroke-width="1.2"/><path d="M119 30c9-16 18-20 25-9 10 15-19 18-25 9 3 20-10 23-15 17-5-7 1-16 15-17Z" stroke="#b19b68" stroke-width="1.7"/><path d="M76 119c-9 10-4 16 6 9l19-14c11-9 0-18-9-11L76 115c-5 4-2 8 3 5l17-12" stroke="#8b9b83" stroke-width="1.4" stroke-linecap="round"/>',
      window: '<path d="M82 117V43q0-22 27-22t26 22v75m-59 3h66m-61-13h55M109 24v85M84 66h49" stroke="#92977b" stroke-width="1.5" stroke-linecap="round"/><path d="M88 44q0-16 18-17v35H88Zm24-17q18 2 18 17v18h-18Z" fill="#c5cfbd" fill-opacity=".25"/><path d="m147 122 12-66m-8 50-16-17m21-9 19-13" stroke="#94a283" stroke-width="1.5" stroke-linecap="round"/><path d="M153 104c-18-1-21-13-21-21 15 4 21 11 21 21Zm4-22c16 0 23-13 22-20-14 3-21 11-22 20Z" fill="#abb694" fill-opacity=".4"/><path d="M160 58c-12-1-12-10-7-14-7-9-1-17 7-12 8-8 16-2 11 6 12 5 7 15-3 13-1 7-5 10-8 7Z" fill="#c6ad98" fill-opacity=".4" stroke="#b5a58c" stroke-width="1.1"/><circle cx="161" cy="42" r="3" fill="#ac9a6c" fill-opacity=".7"/>',
      notebook: '<path d="m67 34 96 12-10 83-96-13Z" fill="#ccd3bc" fill-opacity=".35" stroke="#909a80" stroke-width="1.8"/><path d="m77 36-9 82m13-68 59 8m-61 6 57 8m-59 6 58 8m-59 5 39 5" stroke="#a4ab92" stroke-width="1.2"/><path d="m138 44-4 34 10-6 6 8 4-34" fill="#c2a976" fill-opacity=".55"/><path d="m163 116 35-54 5 3-34 54-8 5Z" fill="#cbb58b" fill-opacity=".48" stroke="#9b9478" stroke-width="1.3"/><path d="m161 124 5-3-3-3Z" fill="#8c947e"/>'
    };
    if (kind === 'book') return inkBook();
    return '<span class="sb-chapter-motif sb-motif-' + kind + '" aria-hidden="true">' + svg('0 0 240 150', drawings[kind] || drawings.notebook) + '</span>';
  }

  function fireflyMotes() {
    return '<div class="sb-memory-motes" aria-hidden="true">' + [0, 1, 2, 3, 4].map(i => '<span class="sb-memory-mote" style="--sb-mote-x:' + (12 + i * 19) + '%;--sb-mote-delay:' + i * .4 + 's"></span>').join('') + '</div>';
  }

  function supportDetails() {
    return '<div class="sb-air-returning" aria-hidden="true"><span class="sb-air-ray sb-air-one"></span><span class="sb-air-ray sb-air-two"></span></div>';
  }

  function decorate(id) {
    const fullArt = new Set(['cover', 'today', 'ordinary', 'window', 'arrival', 'haulers', 'bubbles', 'pressure', 'support', 'ending']);
    if (fullArt.has(id)) return '';
    const gold = ['annecontext', 'annehelp', 'annewish', 'annetwist', 'yamen', 'varvara'].includes(id);
    const motif = /^r[123]/.test(id) ? (id.includes('recall') ? 'bookmark' : 'pencil') :
      ({initial:'lamp',parallel:'cup',compare:'thread',grandfather:'lamp',turnone:'thread',rules:'pencil',again:'thread',againanswer:'lamp',annecontext:'window',annehelp:'window',annewish:'window',annetwist:'window',group:'notebook',share:'notebook',author:'lamp',revise:'bookmark',yamen:'notebook',varvara:'lamp',daily:'cup',exit:'book',homework:'book'}[id] || 'bookmark');
    return '<div class="sb-page-embellishments sb-chapter-margin" aria-hidden="true">' +
      (gold ? sprigGold('sb-corner-north') : sprig('sb-corner-north')) +
      sprig(gold ? 'sb-corner-south sb-sage' : 'sb-corner-south') +
      '<span class="sb-pencil-dash sb-dash-top"></span>' + chapterMotif(motif) +
      '</div>';
  }

  function render(id) {
    switch (id) {
      case 'cover': return '<div class="sb-cover-botany" aria-hidden="true">' + sprig('sb-cover-sprig') + leaf('sb-cover-leaf') + '</div>' + dust('sb-cover-dust');
      case 'today': return today();
      case 'ordinary': return deskDetails();
      case 'window': return windowDetails();
      case 'arrival': return dust('sb-arrival-dust');
      case 'bubbles': return fireflyMotes();
      case 'pressure': return '<div class="sb-edge-weight" aria-hidden="true"></div>';
      case 'support': return supportDetails();
      case 'ending': return deskDetails() + '<span class="sb-ending-sunbeam" aria-hidden="true"></span>';
      default: return '';
    }
  }

  window.StoryScenery = { render, decorate, parcel };
})();
