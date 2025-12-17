/* =========================================
   NOTES PAGE – FINAL FULL (STABLE)
   ✔ Play audio ndani ya Notes
   ✔ +Kitabu works
   ✔ +Video shows iframe
   ✔ Export: Text / PDF / Share
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
   DATE & NORMALIZE
================================ */
function ensureCreatedAt(b){
  if(!b.createdAt) b.createdAt = Date.now();
  b.videos = b.videos || [];
  b.links  = b.links  || [];
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
   AUDIO – PLAY INSIDE NOTES
================================ */
function playBookmark(bm){
  if (!window.AudioCore) {
    alert("AudioCore haipo");
    return;
  }
  const order=[];
  for(let i=bm.from;i<=bm.to;i++) order.push(i);
  AudioCore.setVerseOrder(order);
  AudioCore.play(bm.book, bm.chapter, bm.from);

  localStorage.setItem(LAST_READ_KEY, JSON.stringify({
    book: bm.book, chapter: bm.chapter, verse: bm.from
  }));
}

/* ===============================
   EXPORT
================================ */
function buildExportText(bm){
  let t=`📖 ${bm.book} ${bm.chapter}:${bm.from}-${bm.to}\n`;
  t+=`🕒 ${formatDate(bm.createdAt)}\n\n`;
  if(bm.note) t+=`📝 Notes:\n${bm.note}\n\n`;
  if(bm.links.length){
    t+="🔗 Links:\n";
    bm.links.forEach(l=>t+=`- ${l.book} ${l.chapter}:${l.verse}\n`);
    t+="\n";
  }
  if(bm.videos.length){
    t+="🎬 Videos:\n";
    bm.videos.forEach(v=>t+=`- ${v.url}\n`);
  }
  return t;
}
function exportText(bm){
  const blob=new Blob([buildExportText(bm)],{type:"text/plain"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${bm.book}_${bm.chapter}_${bm.from}-${bm.to}.txt`;
  a.click();
}
function exportPDF(bm){
  const w=window.open("", "_blank");
  w.document.write(`<pre>${buildExportText(bm)}</pre>`);
  w.document.close();
  w.print();
}
function exportShare(bm){
  const t=buildExportText(bm);
  if(navigator.share){
    navigator.share({ title:"Bible Note", text:t });
  } else {
    navigator.clipboard.writeText(t);
    alert("Imecopy kwenye clipboard");
  }
}

/* ===============================
   VIDEO
================================ */
function extractYouTubeID(u){
  const m=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m?m[1]:null;
}
function addVideo(bm,url){
  const list=loadBookmarks();
  list.forEach(b=>{
    if(same(b,bm)){
      b.videos.push({ url, note:"" });
    }
  });
  saveBookmarks(list);
}
function removeVideo(bm, index){
  const list=loadBookmarks();
  list.forEach(b=>{
    if(same(b,bm)) b.videos.splice(index,1);
  });
  saveBookmarks(list);
}

/* ===============================
   BOOK LINK MODAL
================================ */
function openBookModal(bm){
  activeBookmark=bm;
  selectedBook=null;
  document.getElementById("chapterSection").classList.add("hidden");
  document.getElementById("verseSection").classList.add("hidden");
  document.getElementById("bookLinkModal").classList.remove("hidden");
  renderBookGrid();
}
function closeBookModal(){
  document.getElementById("bookLinkModal").classList.add("hidden");
}
async function renderBookGrid(){
  const bible=await loadBible();
  const g=document.getElementById("bookGrid");
  g.innerHTML="";
  Object.keys(bible.books)
    .filter(b=>bible.books[b].testament===currentTestament)
    .forEach(book=>{
      const d=document.createElement("div");
      d.textContent=book;
      d.onclick=()=>{
        selectedBook=book;
        renderChapterGrid(book);
      };
      g.appendChild(d);
    });
}
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
  chapterSection.classList.remove("hidden");
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
  verseSection.classList.remove("hidden");
}
function addBookLink(book,chapter,verse){
  const list=loadBookmarks();
  list.forEach(b=>{
    if(same(b,activeBookmark)){
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

          <select class="export-select">
            <option value="">Export</option>
            <option value="text">Text</option>
            <option value="pdf">PDF</option>
            <option value="share">Share</option>
          </select>

          <button class="del">🗑</button>
        </div>
      </div>

      <textarea class="general-notes hidden"
        placeholder="Andika general notes hapa...">${bm.note||""}</textarea>

      <div class="note-links">
        ${bm.links.map(l=>`
          <span class="link-item">📖 ${l.book} ${l.chapter}:${l.verse}</span>
        `).join("")}
      </div>

      <div class="video-input hidden">
        <input class="video-url" placeholder="Bandika link ya YouTube"/>
        <button class="video-ok">OK</button>
      </div>

      <div class="video-list"></div>
    `;

    /* ACTIONS */
    c.querySelector(".play").onclick=()=>playBookmark(bm);
    c.querySelector(".link").onclick=()=>openBookModal(bm);

    c.querySelector(".toggle-notes").onclick=()=>{
      c.querySelector(".general-notes").classList.toggle("hidden");
    };

    c.querySelector(".general-notes").oninput=e=>{
      const arr=loadBookmarks();
      arr.forEach(b=>{ if(same(b,bm)) b.note=e.target.value; });
      saveBookmarks(arr);
    };

    /* VIDEO ADD */
    c.querySelector(".add-video").onclick=()=>{
      c.querySelector(".video-input").classList.remove("hidden");
    };
    c.querySelector(".video-ok").onclick=()=>{
      const url=c.querySelector(".video-url").value.trim();
      const id=extractYouTubeID(url);
      if(!id) return alert("Link ya YouTube si sahihi");
      addVideo(bm,url);
      renderNotes();
    };

    /* VIDEO RENDER (FIX) */
    const vList=c.querySelector(".video-list");
    bm.videos.forEach((v,idx)=>{
      const id=extractYouTubeID(v.url);
      if(!id) return;

      const vc=document.createElement("div");
      vc.className="video-card";
      vc.innerHTML=`
        <iframe
          src="https://www.youtube.com/embed/${id}"
          loading="lazy"
          allowfullscreen>
        </iframe>
        <button class="remove-video">❌ Ondoa Video</button>
      `;
      vc.querySelector(".remove-video").onclick=()=>{
        if(confirm("Ondoa video hii?")){
          removeVideo(bm,idx);
          renderNotes();
        }
      };
      vList.appendChild(vc);
    });

    /* EXPORT */
    c.querySelector(".export-select").onchange=e=>{
      if(e.target.value==="text") exportText(bm);
      if(e.target.value==="pdf") exportPDF(bm);
      if(e.target.value==="share") exportShare(bm);
      e.target.value="";
    };

    /* DELETE */
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
    renderBookGrid();
  };
  document.getElementById("ntBtn").onclick=()=>{
    currentTestament="NT";
    renderBookGrid();
  };

  renderNotes();
});
