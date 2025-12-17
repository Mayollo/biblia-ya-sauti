/* =========================================
   NOTES PAGE – FINAL
   +Notes juu ya videos
   +Video Notes per video
   +Ondoa Video
========================================= */

const STORAGE_KEY = "bibleBookmarks";
const LAST_READ_KEY = "lastReadingPosition";

let bibleData = null;
let activeBookmark = null;
let currentTestament = "OT";
let selectedBook = null;

/* ===============================
   STORAGE
================================ */
function loadBookmarks(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}
function saveBookmarks(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function same(a,b){
  return a.book===b.book && a.chapter===b.chapter &&
         a.from===b.from && a.to===b.to;
}

/* ===============================
   DATE
================================ */
function ensureCreatedAt(b){
  if(!b.createdAt) b.createdAt = Date.now();
}
function formatDate(ts){
  return new Date(ts).toLocaleString("sw-TZ",{
    day:"2-digit",month:"short",year:"numeric",
    hour:"2-digit",minute:"2-digit"
  });
}

/* ===============================
   LOAD BIBLE
================================ */
async function loadBible(){
  if(bibleData) return bibleData;
  const res = await fetch("bible.json");
  bibleData = await res.json();
  return bibleData;
}

/* ===============================
   CONTINUE READING
================================ */
function continueReading(){
  const p = JSON.parse(localStorage.getItem(LAST_READ_KEY) || "{}");
  if(p.book && p.chapter){
    location.href =
      `chapter.html?book=${encodeURIComponent(p.book)}&chapter=${p.chapter}`;
  } else {
    location.href = "index.html";
  }
}

/* ===============================
   AUDIO
================================ */
function playBookmark(bm){
  if(!window.AudioCore) return;

  const order=[];
  for(let i=bm.from;i<=bm.to;i++) order.push(i);

  AudioCore.setVerseOrder(order);
  AudioCore.play(bm.book,bm.chapter,bm.from);

  localStorage.setItem(LAST_READ_KEY, JSON.stringify({
    book: bm.book, chapter: bm.chapter, verse: bm.from
  }));
}

/* ===============================
   YOUTUBE
================================ */
function extractYouTubeID(url){
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

function normalizeVideos(bm){
  bm.videos = bm.videos || [];
  bm.videos = bm.videos.map(v=>{
    if(typeof v === "string"){
      return { url: v, note: "" };
    }
    return v;
  });
}

function addVideo(bm,url){
  const list = loadBookmarks();
  list.forEach(b=>{
    if(same(b,bm)){
      b.videos = b.videos || [];
      b.videos.push({ url, note: "" });
    }
  });
  saveBookmarks(list);
}

function removeVideo(bm, index){
  const list = loadBookmarks();
  list.forEach(b=>{
    if(same(b,bm)){
      b.videos.splice(index, 1);
    }
  });
  saveBookmarks(list);
}

/* ===============================
   BOOK LINK MODAL
================================ */
function openBookModal(bm){
  activeBookmark = bm;
  selectedBook = null;

  document.getElementById("chapterSection").classList.add("hidden");
  document.getElementById("verseSection").classList.add("hidden");

  document.getElementById("bookLinkModal").classList.remove("hidden");
  renderBookGrid();
}
function closeBookModal(){
  document.getElementById("bookLinkModal").classList.add("hidden");
}

/* ===============================
   BOOK GRID
================================ */
async function renderBookGrid(){
  const bible = await loadBible();
  const grid = document.getElementById("bookGrid");
  grid.innerHTML="";

  Object.keys(bible.books)
    .filter(b=>bible.books[b].testament===currentTestament)
    .forEach(book=>{
      const d=document.createElement("div");
      d.textContent=book;
      if(book===selectedBook) d.classList.add("active");
      d.onclick=()=>{
        selectedBook=book;
        renderBookGrid();
        renderChapterGrid(book);
      };
      grid.appendChild(d);
    });
}

/* ===============================
   CHAPTER & VERSE
================================ */
async function renderChapterGrid(book){
  const bible=await loadBible();
  const g=document.getElementById("chapterGrid");
  g.innerHTML="";
  Object.keys(bible.books[book].chapters).forEach(ch=>{
    const s=document.createElement("span");
    s.textContent=ch;
    s.onclick=()=>renderVerseGrid(book,ch);
    g.appendChild(s);
  });
  document.getElementById("chapterSection").classList.remove("hidden");
}

async function renderVerseGrid(book,ch){
  const bible=await loadBible();
  const g=document.getElementById("verseGrid");
  g.innerHTML="";
  Object.keys(bible.books[book].chapters[ch].verses).forEach(v=>{
    const s=document.createElement("span");
    s.textContent=v;
    s.onclick=()=>addBookLink(book,+ch,+v);
    g.appendChild(s);
  });
  document.getElementById("verseSection").classList.remove("hidden");
}

function addBookLink(book,chapter,verse){
  const list=loadBookmarks();
  list.forEach(b=>{
    if(same(b,activeBookmark)){
      b.links=b.links||[];
      if(!b.links.find(l=>l.book===book&&l.chapter===chapter&&l.verse===verse)){
        b.links.push({book,chapter,verse});
      }
    }
  });
  saveBookmarks(list);
  closeBookModal();
  renderNotes();
}

/* ===============================
   RENDER NOTES
================================ */
function renderNotes(){
  const wrap=document.getElementById("notesContainer");
  const list=loadBookmarks();
  wrap.innerHTML="";

  list.forEach(bm=>{
    ensureCreatedAt(bm);
    normalizeVideos(bm);

    const c=document.createElement("div");
    c.className="note-card";

    c.innerHTML=`
      <div class="note-header">
        <div>
          <strong>${bm.book} ${bm.chapter}:${bm.from}-${bm.to}</strong>
          <div class="note-date">🕒 ${formatDate(bm.createdAt)}</div>
        </div>
        <div class="note-actions">
          <button class="play">▶</button>
          <button class="link">➕ Kitabu</button>
          <button class="add-video">➕ Video</button>
          <button class="toggle-notes">➕ Notes</button>
          <button class="del">🗑</button>
        </div>
      </div>

      <textarea class="general-notes hidden"
        placeholder="Andika general notes hapa...">${bm.note||""}</textarea>

      <div class="video-input hidden">
        <input class="video-url" placeholder="Bandika link ya YouTube..." />
        <button class="video-ok">OK</button>
      </div>

      <div class="video-list"></div>
    `;

    /* GENERAL NOTES */
    const gNotes=c.querySelector(".general-notes");
    c.querySelector(".toggle-notes").onclick=()=>{
      gNotes.classList.toggle("hidden");
      gNotes.focus();
    };
    gNotes.oninput=()=>{
      const arr=loadBookmarks();
      arr.forEach(b=>{ if(same(b,bm)) b.note=gNotes.value; });
      saveBookmarks(arr);
    };

    /* ADD VIDEO */
    const vBox=c.querySelector(".video-input");
    const vInput=c.querySelector(".video-url");
    const vList=c.querySelector(".video-list");

    c.querySelector(".add-video").onclick=()=>{
      vBox.classList.remove("hidden");
      vInput.value="";
      vInput.focus();
    };

    c.querySelector(".video-ok").onclick=()=>{
      const id=extractYouTubeID(vInput.value);
      if(!id) return alert("Link ya YouTube si sahihi");
      addVideo(bm,vInput.value);
      vBox.classList.add("hidden");
      renderNotes();
    };

    /* VIDEOS */
    bm.videos.forEach((v,idx)=>{
      const id=extractYouTubeID(v.url);
      if(!id) return;

      const vc=document.createElement("div");
      vc.className="video-card";

      vc.innerHTML=`
        <iframe src="https://www.youtube.com/embed/${id}" height="200" allowfullscreen></iframe>
        <div class="video-actions">
          <button class="toggle-video-note">➕ Video Notes</button>
          <button class="remove-video">❌ Ondoa Video</button>
        </div>
        <textarea class="video-note hidden"
          placeholder="Andika notes za video hii...">${v.note||""}</textarea>
      `;

      const vNote=vc.querySelector(".video-note");

      vc.querySelector(".toggle-video-note").onclick=()=>{
        vNote.classList.toggle("hidden");
        vNote.focus();
      };

      vc.querySelector(".remove-video").onclick=()=>{
        if(confirm("Ondoa video hii?")){
          removeVideo(bm, idx);
          renderNotes();
        }
      };

      vNote.oninput=()=>{
        const arr=loadBookmarks();
        arr.forEach(b=>{
          if(same(b,bm)){
            b.videos[idx].note = vNote.value;
          }
        });
        saveBookmarks(arr);
      };

      vList.appendChild(vc);
    });

    /* DELETE BOOKMARK */
    c.querySelector(".del").onclick=()=>{
      if(confirm("Futa bookmark yote pamoja na notes na video?")){
        saveBookmarks(loadBookmarks().filter(b=>!same(b,bm)));
        renderNotes();
      }
    };

    wrap.appendChild(c);
  });

  saveBookmarks(list);
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("continueReadingBtn").onclick=continueReading;
  document.getElementById("cancelBookLinkBtn").onclick=closeBookModal;

  document.getElementById("otBtn").onclick=()=>{
    currentTestament="OT";
    otBtn.classList.add("active"); ntBtn.classList.remove("active");
    renderBookGrid();
  };
  document.getElementById("ntBtn").onclick=()=>{
    currentTestament="NT";
    ntBtn.classList.add("active"); otBtn.classList.remove("active");
    renderBookGrid();
  };

  renderNotes();
});
