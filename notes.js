/* =========================================
   SOMO / NOTES ENGINE – FINAL (AI)
   ✔ Uliza Swali Button
   ✔ AI response ndani ya SOMO
   ✔ Popup ya Confirm swali
========================================= */

const OLD_KEY = "bibleBookmarks";
const STORAGE_KEY = "bibleSomoNotes";

/* ===============================
   BOOK ALIASES
================================ */
const BOOK_ALIASES = {
  mwa: "Mwanzo",
  mat: "Mathayo",
  mar: "Marko",
  luk: "Luka",
  yoh: "Yohana",
  rom: "Warumi",
  gal: "Wagalatia",
  efe: "Waefeso",
  fil: "Wafilipi",
  kol: "Wakolosai",
  tim: "Timotheo",
  "1tim": "1 Timotheo",
  "2tim": "2 Timotheo",
  tit: "Tito",
  ebr: "Waebrania",
  ufu: "Ufunuo"
};

let activeRef = null;
let savedRange = null;

/* ===============================
   MIGRATION
================================ */
function migrateOldNotes(){
  const old = JSON.parse(localStorage.getItem(OLD_KEY) || "[]");
  if(!old.length) return;
  if(localStorage.getItem(STORAGE_KEY)) return;

  const migrated = old.map(b => ({
    id: uid(),
    createdAt: b.createdAt || Date.now(),
    subject: `${b.book || ""} ${b.chapter || ""}`,
    somo: b.note || ""
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
}

/* ===============================
   STORAGE
================================ */
function loadNotes(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}
function saveNotes(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ===============================
   AUDIO
================================ */
function playRange(book, chapter, from, to){
  if(!window.AudioCore) return;
  const order=[];
  for(let i=from;i<=to;i++) order.push(i);
  AudioCore.setVerseOrder(order);
  AudioCore.play(book, chapter, from);
}

/* ===============================
   CLICK BIBLE REF
================================ */
document.addEventListener("click", e=>{
  const ref = e.target.closest(".bible-ref");
  if(!ref) return;

  const { book, chapter, from, to } = ref.dataset;

  if(activeRef === ref){
    AudioCore.pause();
    ref.classList.remove("playing");
    activeRef = null;
  }else{
    if(activeRef) activeRef.classList.remove("playing");
    playRange(book, +chapter, +from, +to);
    ref.classList.add("playing");
    activeRef = ref;
  }
});

document.addEventListener("dblclick", e=>{
  const ref = e.target.closest(".bible-ref");
  if(!ref) return;
  const { book, chapter, from, to } = ref.dataset;
  playRange(book, +chapter, +from, +to);
});

/* ===============================
   CURSOR SAVE / RESTORE
================================ */
function saveCursor(){
  const sel = window.getSelection();
  if(sel.rangeCount){
    savedRange = sel.getRangeAt(0);
  }
}
function restoreCursor(){
  if(!savedRange) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
}

/* ===============================
   WORD BEFORE CURSOR
================================ */
function getWordBeforeCursor(){
  const sel = window.getSelection();
  if(!sel.rangeCount) return "";
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if(!node || node.nodeType !== Node.TEXT_NODE) return "";
  return node.textContent
    .slice(0, range.startOffset)
    .split(/\s/)
    .pop()
    .toLowerCase();
}

/* ===============================
   INSERT BIBLE REF (ATOMIC)
================================ */
function replaceWordWithBibleRef(editor, word, book, chapter, from, to){
  const sel = window.getSelection();
  if(!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if(!node || node.nodeType !== Node.TEXT_NODE) return;

  const text = node.textContent;
  const index = text.toLowerCase().lastIndexOf(word);
  if(index === -1) return;

  const before = text.slice(0, index);
  const after = text.slice(index + word.length);

  const span = document.createElement("span");
  span.className = "bible-ref";
  span.contentEditable = "false";
  span.dataset.book = book;
  span.dataset.chapter = chapter;
  span.dataset.from = from;
  span.dataset.to = to;
  span.textContent = `${book} ${chapter}:${from}-${to}`;

  const space = document.createTextNode(" ");

  const parent = node.parentNode;
  parent.insertBefore(document.createTextNode(before), node);
  parent.insertBefore(span, node);
  parent.insertBefore(space, node);
  parent.insertBefore(document.createTextNode(after), node);
  parent.removeChild(node);

  const newRange = document.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

/* ===============================
   YOUTUBE HELPERS
================================ */
function extractYouTubeID(text){
  const m = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function insertTazamaButton(editor, videoId){
  restoreCursor();

  const btn = document.createElement("button");
  btn.className = "video-inline-btn";
  btn.textContent = "Video";
  btn.dataset.videoId = videoId;
  btn.contentEditable = "false"; // prevent editing

  btn.onclick = ()=>openInlineVideo(editor, videoId);

  const space = document.createTextNode(" ");

  const sel = window.getSelection();
  if(!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(btn);
  range.insertNode(space);

  const newRange = document.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

function openInlineVideo(editor, videoId){
  closeInlineVideo(editor);

  const box = document.createElement("div");
  box.className = "inline-video-player";
  box.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1"
      allowfullscreen></iframe>
    <div class="inline-video-actions">
      <button>Funga</button>
    </div>
  `;

  box.querySelector("button").onclick = ()=>box.remove();
  editor.appendChild(box);
}

function closeInlineVideo(editor){
  const ex = editor.querySelector(".inline-video-player");
  if(ex) ex.remove();
}

/* ===============================
   VIDEO CONFIRM MODAL (PASTE ONLY)
================================ */
function showVideoConfirm(editor, videoId){
  let modal = document.getElementById("videoConfirm");
  if(modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "videoConfirm";
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-box">
      <h3>Ongeza Video</h3>
      <p>Je, ungependa kuambatanisha video hii kwenye somo?</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
        <button id="cancelVideo">Ghairi</button>
        <button id="okVideo">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#cancelVideo").onclick = ()=>modal.remove();
  modal.querySelector("#okVideo").onclick = ()=>{
    modal.remove();
    restoreCursor();
    insertTazamaButton(editor, videoId);
  };
}

/* ===============================
   CRUD
================================ */
function createSomo(){
  const list = loadNotes();
  list.unshift({ id: uid(), createdAt: Date.now(), subject:"", somo:"" });
  saveNotes(list);
  renderNotes();
}

function deleteSomo(id){
  if(!confirm("Futa somo hili?")) return;
  saveNotes(loadNotes().filter(n=>n.id!==id));
  renderNotes();
}

/* ===============================
   RENDER
================================ */
function renderNotes(){
  const wrap = document.getElementById("notesContainer");
  wrap.innerHTML = "";

  loadNotes().forEach(note=>{
    const card = document.createElement("div");
    card.className = "somo-box";

    const date = new Date(note.createdAt).toLocaleString("sw-TZ",{
      day:"2-digit", month:"short", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });

    card.innerHTML = `
      <div class="somo-header">
        <span class="somo-date">${date}</span>
        <input class="somo-subject"
          placeholder="Subject ya somo"
          value="${note.subject || ""}">
      </div>

      <div class="somo-editor" contenteditable="true"
        placeholder="Andika SOMO hapa...">
        ${note.somo || ""}
      </div>

      <div class="somo-actions">
        <button class="danger">Futa</button>
      </div>
    `;

    const subject = card.querySelector(".somo-subject");
    subject.oninput = ()=>{
      const a = loadNotes();
      a.forEach(n=>{ if(n.id===note.id) n.subject = subject.value; });
      saveNotes(a);
    };

    const editor = card.querySelector(".somo-editor");

    // SAVE CONTENT
    editor.oninput = ()=>{
      const a = loadNotes();
      a.forEach(n=>{ if(n.id===note.id) n.somo = editor.innerHTML; });
      saveNotes(a);
    };

    // YOUTUBE – DETECT ON PASTE ONLY
    editor.addEventListener("paste", e=>{
      const text = (e.clipboardData || window.clipboardData).getData("text");
      const videoId = extractYouTubeID(text);
      if(!videoId) return;

      e.preventDefault();
      saveCursor();
      showVideoConfirm(editor, videoId);
    });

    // BOOK AUTO DETECT
    editor.addEventListener("keyup", ()=>{
      saveCursor();
      const word = getWordBeforeCursor();
      if(!word) return;

      const matches = Object.keys(BOOK_ALIASES)
        .filter(k=>k.startsWith(word))
        .map(k=>BOOK_ALIASES[k]);

      if(matches.length){
        showPopup(editor, [...new Set(matches)], word);
      }else{
        const p=document.getElementById("refPopup");
        if(p) p.classList.add("hidden");
      }
    });

    // DELETE ATOMIC TOKENS
    editor.addEventListener("keydown", e=>{
      if(e.key!=="Backspace" && e.key!=="Delete") return;
      const sel = window.getSelection();
      if(!sel.rangeCount) return;
      const node = sel.getRangeAt(0).startContainer;
      const token = node.nodeType===Node.ELEMENT_NODE
        ? node.closest(".bible-ref, .video-inline-btn")
        : node.parentElement?.closest(".bible-ref, .video-inline-btn");
      if(token){
        e.preventDefault();
        token.remove();
      }
    });

    card.querySelector(".danger").onclick = ()=>deleteSomo(note.id);
    wrap.appendChild(card);
  });
}

/* ===============================
   POPUP (BOOK SELECT)
================================ */
function showPopup(editor, books, typedWord){
  let popup = document.getElementById("refPopup");
  if(!popup){
    popup = document.createElement("div");
    popup.id = "refPopup";
    popup.className = "ref-popup";
    document.body.appendChild(popup);
  }

  popup.innerHTML = "";

  books.forEach(book=>{
    const div = document.createElement("div");
    div.textContent = book;
    div.onclick = ()=>{
      popup.classList.add("hidden");

      const ch = prompt(`Sura ya ${book}`);
      if(!ch) return;
      const from = prompt("Mstari kuanzia?");
      if(!from) return;
      const to = prompt("Mstari wa mwisho?");
      if(!to) return;

      restoreCursor();
      replaceWordWithBibleRef(editor, typedWord, book, ch, from, to);
    };
    popup.appendChild(div);
  });

  const rect = editor.getBoundingClientRect();
  popup.style.top = rect.bottom + window.scrollY + "px";
  popup.style.left = rect.left + "px";
  popup.classList.remove("hidden");
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", ()=>{
  migrateOldNotes();
  renderNotes();
  document.getElementById("addSomoBtn").onclick = createSomo;
});
