// script.js
let bible = null;
let currentTestament = 'OT'; // 'OT' or 'NT'

async function loadBible() {
  try {
    const res = await fetch('bible.json');
    bible = await res.json();
  } catch (e) {
    document.getElementById('bookList').innerHTML = `<div class="loading">Tafadhali tumia local server (Live Server) — bible.json haipatikani</div>`;
    console.error(e);
    return;
  }
  renderBooks();
}

function createBookElement(bookName, meta) {
  const row = document.createElement('div');
  row.className = 'book';
  row.innerHTML = `
    <div class="book-name">${bookName}</div>
    <div class="actions">
      <button class="icon-btn playBook" title="Anza kusoma kutoka sura ya 1">▶</button>
      <button class="icon-btn downloadBook" title="Download">⬇</button>
      <button class="icon-btn shareBook" title="Share">🔗</button>
    </div>
  `;
  return row;
}

function createChapterBox(bookName, chaptersCount) {
  const box = document.createElement('div');
  box.className = 'chapter-box';
  box.id = 'chap_' + bookName.replace(/\s+/g,'_');

  const header = document.createElement('div');
  header.className = 'chapter-title';
  header.innerText = `${bookName}`;

  const grid = document.createElement('div');
  grid.className = 'chapter-grid';
  for (let i=1;i<=chaptersCount;i++){
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.onclick = (e)=>{
      e.stopPropagation();
      // go to chapter page
      const url = `chapter.html?book=${encodeURIComponent(bookName)}&chapter=${i}`;
      window.location.href = url;
    };
    grid.appendChild(btn);
  }

  box.appendChild(header);
  box.appendChild(grid);
  return box;
}

function renderBooks(){
  const listEl = document.getElementById('bookList');
  listEl.innerHTML = '';
  const books = Object.keys(bible.books);
  for (const b of books) {
    const meta = bible.books[b];
    if (!meta || meta.testament !== currentTestament) continue;
    const chaptersCount = Object.keys(meta.chapters).length;
    const row = createBookElement(b, meta);
    const chapterBox = createChapterBox(b, chaptersCount);

    row.onclick = ()=>{
      // toggle
      document.querySelectorAll('.chapter-box').forEach(c=>c.style.display='none');
      document.querySelectorAll('.book').forEach(r=>r.classList.remove('active'));
      const id = 'chap_' + b.replace(/\s+/g,'_');
      const el = document.getElementById(id);
      if (el){
        const wasOpen = el.style.display === 'block';
        if (!wasOpen){
          el.style.display = 'block';
          row.classList.add('active');
        } else {
          el.style.display = 'none';
          row.classList.remove('active');
        }
      }
    };

    // play button (start from chapter 1)
    row.querySelector('.playBook').onclick = (e)=>{
      e.stopPropagation();
      const url = `chapter.html?book=${encodeURIComponent(b)}&chapter=1`;
      window.location.href = url;
    };

    // download and share hooks (placeholders)
    row.querySelector('.downloadBook').onclick = (e)=>{
      e.stopPropagation();
      alert('Download hook: use this to download audio for ' + b);
    };
    row.querySelector('.shareBook').onclick = (e)=>{
      e.stopPropagation();
      alert('Share hook: share '+ b);
    };

    listEl.appendChild(row);
    listEl.appendChild(chapterBox);
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('leftArrow').onclick = ()=>{ currentTestament='OT'; document.getElementById('testamentTitle').innerText='AGANO LA KALE'; renderBooks(); };
  document.getElementById('rightArrow').onclick = ()=>{ currentTestament='NT'; document.getElementById('testamentTitle').innerText='AGANO JIPYA'; renderBooks(); };
  await loadBible();
});
