// chapter.js
function getParams(){
  const q = location.search.substring(1);
  const parts = q.split('&');
  const p = {};
  parts.forEach(kv=>{
    const [k,v] = kv.split('=');
    if (k) p[k]=decodeURIComponent(v||'');
  });
  return p;
}

async function loadBibleJson(){
  const res = await fetch('bible.json');
  return await res.json();
}

function createVerseElement(book, chapterNum, verseNum, text){
  const div = document.createElement('div');
  div.className = 'verse';
  div.dataset.book = book;
  div.dataset.chapter = chapterNum;
  div.dataset.verse = verseNum;
  div.innerHTML = `<div class="num">${verseNum}</div><div class="text">${text}</div>`;
  div.onclick = ()=>{
    document.querySelectorAll('.verse').forEach(v=>v.classList.remove('highlight'));
    div.classList.add('highlight');
    document.getElementById('nowTitleChapter').innerText = `${book} ${chapterNum}:${verseNum}`;
    // audio hook placeholder:
    // const audioSrc = `audio/${book}_${chapterNum}_${verseNum}.mp3`;
    // playAudio(audioSrc);
  };
  return div;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const params = getParams();
  const book = params.book;
  const chapter = params.chapter;
  const data = await loadBibleJson();

  if (!book || !chapter || !data.books[book] || !data.books[book].chapters[chapter]){
    document.getElementById('chapterContent').innerHTML = '<div class="loading">Sura haipatikani</div>';
    return;
  }

  const ch = data.books[book].chapters[chapter];
  document.getElementById('chapterTitle').innerText = `${book} ${chapter}`;
  document.getElementById('chapterLabel').innerText = `${book} ${chapter}`;
  const content = document.getElementById('chapterContent');
  content.innerHTML = '';

  // heading placeholder
  const heading = document.createElement('div');
  heading.className = 'chapter-title-large';
  heading.innerText = ch.heading || 'Heading';
  content.appendChild(heading);

  // verses
  const verses = ch.verses;
  Object.keys(verses).forEach(vnum=>{
    const vtext = verses[vnum];
    const el = createVerseElement(book, chapter, vnum, vtext);
    content.appendChild(el);
  });

  // back button
  document.getElementById('backBtn').onclick = ()=> history.back();

  // prev/next chapter arrows
  const bookMeta = data.books[book];
  const chapterNumbers = Object.keys(bookMeta.chapters).map(Number).sort((a,b)=>a-b);
  const idx = chapterNumbers.indexOf(Number(chapter));
  const prev = idx>0 ? chapterNumbers[idx-1] : null;
  const next = idx < chapterNumbers.length-1 ? chapterNumbers[idx+1] : null;

  document.getElementById('prevChapter').onclick = ()=>{
    if (prev) window.location.href = `chapter.html?book=${encodeURIComponent(book)}&chapter=${prev}`;
    else alert('Hii ni sura ya kwanza ya kitabu');
  };
  document.getElementById('nextChapter').onclick = ()=>{
    if (next) window.location.href = `chapter.html?book=${encodeURIComponent(book)}&chapter=${next}`;
    else alert('Hii ni sura ya mwisho ya kitabu');
  };

  // prev/next verse controls (simple)
  document.getElementById('prevVerse').onclick = ()=>{
    const highlighted = document.querySelector('.verse.highlight');
    if (!highlighted) return alert('Chagua mstari kwanza');
    const v = Number(highlighted.dataset.verse);
    if (v>1) window.location.hash = `verse-${v-1}`; // quick nav
  };
  document.getElementById('nextVerse').onclick = ()=>{
    const highlighted = document.querySelector('.verse.highlight');
    if (!highlighted) return alert('Chagua mstari kwanza');
    const v = Number(highlighted.dataset.verse);
    if (v < Object.keys(verses).length) window.location.hash = `verse-${v+1}`;
  };
});
