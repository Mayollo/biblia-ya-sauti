// chapter.js
// Reader + Bookmark panel + Audio auto-continue
// Requirements: bible.json in same folder, audio files in sauti/ as safebook_chapter_verse.mp3 (lowercase & underscores)

/////////////////////////////////////
// Helpers
/////////////////////////////////////
function uid() {
  return 'bm_' + Math.random().toString(36).slice(2,9);
}
function getParams() {
  const q = location.search.substring(1);
  if (!q) return {};
  return q.split('&').reduce((acc, kv) => {
    const [k,v] = kv.split('=');
    if (k) acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}
async function loadBibleJson(){
  const res = await fetch('bible.json');
  return await res.json();
}

function getStoreArray(key){
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch(e){ return []; }
}
function setStoreArray(key, arr){
  localStorage.setItem(key, JSON.stringify(arr || []));
}
function addToStoreArray(key, item){
  const arr = getStoreArray(key);
  arr.push(item);
  setStoreArray(key, arr);
}
function updateBookmark(updated){
  const arr = getStoreArray('bookmarks').map(b => b.id===updated.id ? updated : b);
  setStoreArray('bookmarks', arr);
}
function removeBookmarkById(id){
  const arr = getStoreArray('bookmarks').filter(b => b.id !== id);
  setStoreArray('bookmarks', arr);
}

/////////////////////////////////////
// Audio engine (single click: toggle play/pause; auto-continue)
/////////////////////////////////////
let audioPlayer = new Audio();
audioPlayer.preload = 'auto';
let isPlaying = false;
let currentPlaying = null; // {book,chapter,verse}
let verseOrder = []; // numeric sorted list of verses in this chapter

function safeBookName(book){
  return book.toLowerCase().replace(/\s+/g,'_');
}

function playVerseAudio(book, chapter, verse){
  const src = `sauti/${safeBookName(book)}_${chapter}_${verse}.mp3`;
  audioPlayer.src = src;
  audioPlayer.play().catch(err=>{
    console.warn('Audio play error',err);
  });
  isPlaying = true;
  currentPlaying = {book,chapter,verse};
  document.getElementById('nowTitle').innerText = `${book} ${chapter}:${verse}`;
  highlightPlayingVerse(verse);
  // update progress UI
  audioPlayer.onended = ()=> {
    // go to next verse in chapter, if exists
    const idx = verseOrder.indexOf(Number(verse));
    const next = (idx>=0 && idx < verseOrder.length - 1) ? verseOrder[idx+1] : null;
    if (next !== null) {
      playVerseAudio(book, chapter, next);
      // scroll into view
      const el = document.getElementById(`v-${next}`);
      if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
    } else {
      isPlaying = false;
      currentPlaying = null;
      // optionally show finished
    }
  };
  audioPlayer.ontimeupdate = ()=> {
    const pct = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
    document.getElementById('progressFill').style.width = pct + '%';
  };
}

function pauseAudio(){
  audioPlayer.pause();
  isPlaying = false;
  document.getElementById('playPauseBtn').innerText = '⏯';
  if (currentPlaying) removePlayingHighlight(currentPlaying.verse);
  currentPlaying = null;
}

function togglePlayForVerse(book, chapter, verse){
  if (isPlaying && currentPlaying && currentPlaying.verse == verse) {
    // stop
    pauseAudio();
    return;
  }
  // otherwise play this verse
  playVerseAudio(book, chapter, verse);
  document.getElementById('playPauseBtn').innerText = '⏯';
}

function highlightPlayingVerse(verseNum){
  // color for playing highlight: #E5A073FF
  document.querySelectorAll('.verse.playing').forEach(el=>{
    el.classList.remove('playing');
    el.style.background = '';
  });
  const el = document.getElementById(`v-${verseNum}`);
  if (el){
    el.classList.add('playing');
    el.style.background = '#E5A073FF';
  }
}
function removePlayingHighlight(verseNum){
  const el = document.getElementById(`v-${verseNum}`);
  if (el){
    el.classList.remove('playing');
    // if verse has bookmark color applied, restore that background
    if (el.dataset.bmColor) {
      el.style.background = el.dataset.bmColor;
    } else {
      el.style.background = '';
    }
  }
}

/////////////////////////////////////
// Bookmark UI + logic (pen icon on right)
/////////////////////////////////////

// allowed palette (exact as requested)
const PALETTE = ['#0018E7FF', '#E7171DFF', '#E7E700FF', '#1EE700FF'];

function createVerseElement(book, chapterNum, verseNum, text){
  const div = document.createElement('div');
  div.className = 'verse';
  div.id = `v-${verseNum}`;
  div.dataset.book = book;
  div.dataset.chapter = chapterNum;
  div.dataset.verse = verseNum;

  // inner layout: number, text, pen icon (right)
  div.innerHTML = `
    <div class="num">${verseNum}</div>
    <div class="text">${text}</div>
    <button class="verse-pen" title="Bookmark / Options"><img src="icons/pen.png" alt="pen" /></button>
  `;

  // single click on verse -> toggle play/pause for that verse
  div.addEventListener('click', (e)=>{
    // avoid clicks on pen button
    if (e.target.closest('.verse-pen')) return;
    const book = div.dataset.book;
    const chapter = div.dataset.chapter;
    const verse = div.dataset.verse;
    togglePlayForVerse(book, chapter, verse);
  });

  // pen button handler (open panel)
  const penBtn = div.querySelector('.verse-pen');
  penBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    openBookmarkPanelForVerse(div);
  });

  return div;
}

/* Bookmark panel DOM */
let panelEl = null;
function ensurePanel(){
  if (panelEl) return panelEl;
  panelEl = document.createElement('div');
  panelEl.className = 'bm-panel';
  panelEl.innerHTML = `
    <div class="bm-header">
      <div class="bm-ref"></div>
      <div class="bm-controls">
        <button class="bm-close">×</button>
      </div>
    </div>
    <div class="bm-body">
      <div class="bm-range">
        <button class="bm-dec">◀</button>
        <div class="bm-range-label">1 – 1</div>
        <button class="bm-inc">▶</button>
      </div>
      <div class="bm-colors"></div>
      <div class="bm-actions">
        <button class="bm-remove">X Ondoa</button>
        <button class="bm-cancel">Ghairi</button>
      </div>
      <div style="height:6px"></div>
      <div style="display:flex;gap:8px">
         <button class="bm-continue">Endelea Kusoma</button>
         <button class="bm-notes">Notes</button>
      </div>
    </div>
  `;
  document.body.appendChild(panelEl);

  // populate palette
  const colorsWrap = panelEl.querySelector('.bm-colors');
  PALETTE.forEach(c=>{
    const sw = document.createElement('div');
    sw.className = 'bm-color';
    sw.style.background = c;
    sw.dataset.color = c;
    sw.title = c;
    colorsWrap.appendChild(sw);
    sw.addEventListener('click', ()=>{
      // apply highlight instantly & save bookmark (range)
      const chosen = sw.dataset.color;
      panelEl.dataset.chosenColor = chosen;
      panelEl.querySelectorAll('.bm-color').forEach(x=>x.classList.remove('selected'));
      sw.classList.add('selected');
      // immediately save bookmark for current range
      saveBookmarkFromPanel();
    });
  });

  // actions
  panelEl.querySelector('.bm-close').onclick = ()=> panelEl.style.display='none';
  panelEl.querySelector('.bm-cancel').onclick = ()=> panelEl.style.display='none';
  panelEl.querySelector('.bm-remove').onclick = ()=> {
    // remove bookmark for that exact range if exists
    const bmId = panelEl.dataset.bmId;
    if (bmId) {
      removeBookmarkById(bmId);
      applyBookmarksForCurrentChapter();
      showToast('Bookmark imeondolewa');
    } else {
      // remove any bookmark that overlaps that selection
      const params = getParams();
      const start = Number(panelEl.dataset.start);
      const end = Number(panelEl.dataset.end);
      const all = getStoreArray('bookmarks');
      const survivors = all.filter(b=>{
        if (b.book !== params.book || b.chapter !== Number(params.chapter)) return true;
        // if overlap, remove it
        if (end < b.startVerse || start > b.endVerse) return true;
        return false;
      });
      setStoreArray('bookmarks', survivors);
      applyBookmarksForCurrentChapter();
      showToast('Bookmark(s) imeondolewa');
    }
    panelEl.style.display='none';
  };

  panelEl.querySelector('.bm-continue').onclick = ()=> {
    panelEl.style.display='none';
    // go to next chapter
    continueToNextChapter();
  };
  panelEl.querySelector('.bm-notes').onclick = ()=> {
    // go to notes page
    window.location.href = 'notes.html';
  };

  // range increment/decrement
  panelEl.querySelector('.bm-inc').onclick = ()=>{
    const end = Number(panelEl.dataset.end) || Number(panelEl.dataset.start);
    const max = Number(panelEl.dataset.maxVerse) || end;
    if (end < max) {
      panelEl.dataset.end = Number(end) + 1;
      updateRangeLabel();
    }
  };
  panelEl.querySelector('.bm-dec').onclick = ()=>{
    const start = Number(panelEl.dataset.start);
    const end = Number(panelEl.dataset.end);
    if (end > start) {
      panelEl.dataset.end = Number(end) - 1;
      updateRangeLabel();
    }
  };

  return panelEl;
}

function updateRangeLabel(){
  const lbl = panelEl.querySelector('.bm-range-label');
  lbl.innerText = `${panelEl.dataset.start} – ${panelEl.dataset.end}`;
  // if a saved bookmark exactly matches this range, mark panelEl.dataset.bmId
  const params = getParams();
  const all = getStoreArray('bookmarks');
  const found = all.find(b=> b.book===params.book && b.chapter===Number(params.chapter) && b.startVerse===Number(panelEl.dataset.start) && b.endVerse===Number(panelEl.dataset.end));
  if (found){
    panelEl.dataset.bmId = found.id;
    panelEl.dataset.chosenColor = found.color;
    panelEl.querySelectorAll('.bm-color').forEach(x=> x.classList.remove('selected'));
    panelEl.querySelectorAll('.bm-color').forEach(x=> { if (x.dataset.color===found.color) x.classList.add('selected')});
  } else {
    delete panelEl.dataset.bmId;
    // reflect chosenColor if set
    panelEl.querySelectorAll('.bm-color').forEach(x=> x.classList.remove('selected'));
    if (panelEl.dataset.chosenColor) {
      const el = panelEl.querySelector(`.bm-color[data-color="${panelEl.dataset.chosenColor}"]`);
      if (el) el.classList.add('selected');
    }
  }
}

/* open panel for given verse element */
function openBookmarkPanelForVerse(verseEl){
  const params = getParams();
  if (!params.book || !params.chapter) return showToast('Sura haijapangwa');
  const book = params.book;
  const chapter = Number(params.chapter);
  const verse = Number(verseEl.dataset.verse);
  const panel = ensurePanel();
  panel.style.display = 'block';
  // set dataset start/end (start fixed)
  panel.dataset.book = book;
  panel.dataset.chapter = chapter;
  panel.dataset.start = verse;
  panel.dataset.end = verse;
  panel.dataset.maxVerse = Number( getMaxVerseInChapter() );
  // show ref label
  panel.querySelector('.bm-ref').innerText = `${book} ${chapter}: ${verse} -`;
  // clear chosen color selection (unless existing bm for this verse)
  delete panel.dataset.chosenColor;
  delete panel.dataset.bmId;
  // if there is a bookmark that includes this verse, preselect it (first found)
  const all = getStoreArray('bookmarks');
  const found = all.find(b=> b.book===book && b.chapter===chapter && verse >= b.startVerse && verse <= b.endVerse);
  if (found) {
    panel.dataset.start = found.startVerse;
    panel.dataset.end = found.endVerse;
    panel.dataset.chosenColor = found.color;
    panel.dataset.bmId = found.id;
  }
  updateRangeLabel();
  // position panel close to verse element (right side)
  const rect = verseEl.getBoundingClientRect();
  const left = Math.min(window.innerWidth - 220, rect.right + 6);
  const top = Math.max(8, rect.top + window.pageYOffset - 6);
  panel.style.left = left + 'px';
  panel.style.top = top + 'px';
  // ensure view
  verseEl.scrollIntoView({behavior:'smooth', block:'center'});
}

/* Save bookmark from panel settings */
function saveBookmarkFromPanel(){
  const panel = ensurePanel();
  const params = getParams();
  const book = panel.dataset.book || params.book;
  const chapter = Number(panel.dataset.chapter || params.chapter);
  const start = Number(panel.dataset.start);
  const end = Number(panel.dataset.end);
  const color = panel.dataset.chosenColor || PALETTE[0];
  // create bookmark object (single ID)
  const id = uid();
  const bm = { id, book, chapter, startVerse: start, endVerse: end, color, created: Date.now(), note: '' };
  // remove any existing that exactly match
  let arr = getStoreArray('bookmarks').filter(b => !(b.book===book && b.chapter===chapter && b.startVerse===start && b.endVerse===end));
  arr.push(bm);
  setStoreArray('bookmarks', arr);
  applyBookmarksForCurrentChapter();
  showToast('Bookmark imesafishwa');
  // mark panel with bm id
  panel.dataset.bmId = id;
}

/* Apply bookmark object highlight(s) to DOM - supports ranges */
function applyBookmarkHighlight(bm){
  if (!bm) return;
  // only apply if this chapter is loaded
  const params = getParams();
  if (!params.book || !params.chapter) return;
  if (params.book !== bm.book || Number(params.chapter) !== Number(bm.chapter)) return;
  for (let v=bm.startVerse; v<=bm.endVerse; v++){
    const el = document.getElementById(`v-${v}`);
    if (!el) continue;
    el.dataset.bmId = bm.id;
    el.dataset.bmColor = bm.color;
    el.style.background = bm.color;
    el.style.padding = '8px';
    el.style.borderRadius = '8px';
  }
}

/* Apply all bookmarks for current chapter */
function applyBookmarksForCurrentChapter(){
  // clear previous bookmark styles
  document.querySelectorAll('.verse').forEach(el=>{
    delete el.dataset.bmId;
    delete el.dataset.bmColor;
    el.style.background = '';
    el.style.padding = '';
    el.style.borderRadius = '';
  });
  const params = getParams();
  const all = getStoreArray('bookmarks') || [];
  all.forEach(bm => applyBookmarkHighlight(bm));
}

/* helper: get max verse in current chapter */
function getMaxVerseInChapter(){
  const params = getParams();
  if (!params.book || !params.chapter) return 1;
  const dataPromise = loadBibleJson(); // synchronous call not allowed - but in our flow data already loaded before opening panel, so we'll read from globalData
  if (window._CHAPTER_MAX) return window._CHAPTER_MAX;
  // fallback scan DOM
  const verses = document.querySelectorAll('.verse');
  return verses.length ? Number(verses[verses.length-1].dataset.verse) : 1;
}

/* Load and apply bookmarks on load */
function applyBookmarksForCurrent(){
  applyBookmarksForCurrentChapter();
}

/////////////////////////////////////
// Continue to next chapter
/////////////////////////////////////
function continueToNextChapter(){
  const params = getParams();
  const book = params.book;
  const chap = Number(params.chapter);
  loadBibleJson().then(data=>{
    if (!data || !data.books || !data.books[book]) return showToast('Hujapakia kitabu');
    const chapters = Object.keys(data.books[book].chapters).map(Number).sort((a,b)=>a-b);
    const idx = chapters.indexOf(chap);
    const next = (idx >=0 && idx < chapters.length-1) ? chapters[idx+1] : null;
    if (next) {
      window.location.href = `chapter.html?book=${encodeURIComponent(book)}&chapter=${next}`;
    } else {
      showToast('Hii ni sura ya mwisho ya kitabu');
    }
  });
}

/////////////////////////////////////
// Toast helper
function showToast(msg, timeout=1800){
  let t = document.getElementById('app-toast');
  if (!t){
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'app-toast';
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.style.opacity = 1;
  setTimeout(()=> t.style.opacity = 0, timeout);
}

/////////////////////////////////////
// Main init: load chapter & render verses
/////////////////////////////////////
document.addEventListener('DOMContentLoaded', async ()=>{
  const params = getParams();
  const book = params.book;
  const chapter = params.chapter;
  const data = await loadBibleJson();

  if (!book || !chapter || !data.books[book] || !data.books[book].chapters[chapter]){
    document.getElementById("chapterContent").innerHTML = '<div class="loading">Sura haipatikani</div>';
    return;
  }

  const ch = data.books[book].chapters[chapter];

  // Title at top
  document.getElementById("chapterHeading").innerText = `${book} ${chapter}`;

  const content = document.getElementById("chapterContent");
  content.innerHTML = "";

  // Heading (if exists)
  if (ch.heading) {
    const heading = document.createElement('div');
    heading.className = 'chapter-title-large';
    heading.innerText = ch.heading;
    content.appendChild(heading);
  }

  // Verses - build verseOrder
  verseOrder = [];
  const verses = ch.verses || {};
  Object.keys(verses).map(Number).sort((a,b)=>a-b).forEach(vnum=>{
    verseOrder.push(vnum);
    const el = createVerseElement(book, chapter, vnum, verses[vnum]);
    content.appendChild(el);
  });

  // store max for panel
  window._CHAPTER_MAX = verseOrder.length ? Math.max(...verseOrder) : 1;

  // apply bookmarks for chapter
  applyBookmarksForCurrentChapter();

  // restore playing highlight if audio was playing and user navigated back? (optional)
  // wire play/pause buttons
  document.getElementById('playPauseBtn').onclick = ()=>{
    if (isPlaying){
      pauseAudio();
    } else {
      // if nothing is playing, start from first verse
      const first = verseOrder[0];
      if (first) {
        togglePlayForVerse(book, chapter, String(first));
      }
    }
  };
  document.getElementById('prevBtn').onclick = ()=>{
    if (!currentPlaying) return showToast('Chagua mstari ili urejee');
    const idx = verseOrder.indexOf(Number(currentPlaying.verse));
    if (idx>0) {
      const prev = verseOrder[idx-1];
      playVerseAudio(currentPlaying.book, currentPlaying.chapter, prev);
      const el = document.getElementById(`v-${prev}`);
      if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
    } else {
      showToast('Hapana mstari uliotangulia');
    }
  };
  document.getElementById('nextBtn').onclick = ()=>{
    if (!currentPlaying) return showToast('Chagua mstari ili uendelee');
    const idx = verseOrder.indexOf(Number(currentPlaying.verse));
    if (idx < verseOrder.length - 1) {
      const next = verseOrder[idx+1];
      playVerseAudio(currentPlaying.book, currentPlaying.chapter, next);
      const el = document.getElementById(`v-${next}`);
      if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
    } else {
      showToast('Hapana mstari wa ziada');
    }
  };

  // apply stored bookmarks visually
  applyBookmarksForCurrentChapter();

});
