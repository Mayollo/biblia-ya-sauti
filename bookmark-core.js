/* =========================================
   BOOKMARK CORE – FINAL STABLE VERSION
========================================= */

/* ===============================
   STATE
================================ */
let bmBook = null;
let bmChapter = null;
let bmFrom = null;
let bmTo = null;

let currentUnderline = false;
let currentFont = "normal";

const STORAGE_KEY = "bibleBookmarks";
const LAST_READ_KEY = "lastReadingPosition";

/* ===============================
   STORAGE HELPERS
================================ */
function loadBookmarks(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookmarks(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function same(a, b){
  return (
    a.book === b.book &&
    a.chapter === b.chapter &&
    a.from === b.from &&
    a.to === b.to
  );
}

/* ===============================
   DELETE BOOKMARK (SAFE)
================================ */
function deleteBookmarkSafe(target){
  const list = loadBookmarks().filter(b => !same(b, target));
  saveBookmarks(list);
}

/* ===============================
   OPEN / CLOSE OVERLAY
================================ */
function openBookmark(book, chapter, verse){
  bmBook = book;
  bmChapter = Number(chapter);
  bmFrom = bmTo = Number(verse);

  currentUnderline = false;
  currentFont = "normal";

  updateBmRange();
  bookmarkOverlay.classList.remove("hidden");
}

function closeBookmark(){
  bookmarkOverlay.classList.add("hidden");
}

/* ===============================
   RANGE CONTROL
================================ */
function incRange(){
  bmTo++;
  updateBmRange();
}

function decRange(){
  if (bmTo > bmFrom){
    bmTo--;
    updateBmRange();
  }
}

function updateBmRange(){
  bmRange.innerText = `${bmBook} ${bmChapter}:${bmFrom}-${bmTo}`;
}

/* ===============================
   CLEAR PREVIEW STYLES
================================ */
function clearPreview(){
  document.querySelectorAll(".verse").forEach(v=>{
    v.classList.remove(
      "bm-yellow","bm-red","bm-blue","bm-cyan",
      "bm-underline",
      "bm-font-small","bm-font-normal","bm-font-large"
    );
  });
}

/* ===============================
   SAVE CURRENT BOOKMARK (MERGE SAFE)
================================ */
function saveCurrentBookmark(color){

  const list = loadBookmarks();

  const existing = list.find(b =>
    same(b, {
      book: bmBook,
      chapter: bmChapter,
      from: bmFrom,
      to: bmTo
    })
  );

  const clean = list.filter(b =>
    !same(b, {
      book: bmBook,
      chapter: bmChapter,
      from: bmFrom,
      to: bmTo
    })
  );

  clean.push({
    book: bmBook,
    chapter: bmChapter,
    from: bmFrom,
    to: bmTo,

    // 🔒 preserve content
    note: existing?.note || "",
    links: existing?.links || [],
    videos: existing?.videos || [],

    // 🎨 visual
    color,
    underline: currentUnderline,
    font: currentFont
  });

  saveBookmarks(clean);
}

/* ===============================
   STYLE ACTIONS
================================ */
function applyColor(color){
  clearPreview();

  for (let i = bmFrom; i <= bmTo; i++){
    const el = document.getElementById(`v-${i}`);
    if (!el) continue;

    if (color) el.classList.add(`bm-${color}`);
    if (currentUnderline) el.classList.add("bm-underline");
    el.classList.add(`bm-font-${currentFont}`);
  }

  saveCurrentBookmark(color);
}

function removeColor(){
  clearPreview();
  saveCurrentBookmark(null);
}

function toggleUnderline(){
  currentUnderline = !currentUnderline;
  saveCurrentBookmark(getCurrentColor());
}

function toggleFont(){
  currentFont =
    currentFont === "normal" ? "large" :
    currentFont === "large" ? "small" : "normal";

  saveCurrentBookmark(getCurrentColor());
}

function getCurrentColor(){
  const el = document.querySelector(
    ".bm-yellow,.bm-red,.bm-blue,.bm-cyan"
  );
  if (!el) return null;

  if (el.classList.contains("bm-yellow")) return "yellow";
  if (el.classList.contains("bm-red")) return "red";
  if (el.classList.contains("bm-blue")) return "blue";
  if (el.classList.contains("bm-cyan")) return "cyan";
}

/* ===============================
   APPLY SAVED BOOKMARKS ON LOAD
================================ */
function applyBookmarksOnChapter(book, chapter){
  loadBookmarks().forEach(b=>{
    if (b.book === book && b.chapter === Number(chapter)){
      for (let i = b.from; i <= b.to; i++){
        const el = document.getElementById(`v-${i}`);
        if (!el) continue;

        if (b.color) el.classList.add(`bm-${b.color}`);
        if (b.underline) el.classList.add("bm-underline");
        if (b.font) el.classList.add(`bm-font-${b.font}`);
      }
    }
  });
}

/* ===============================
   EVENTS
================================ */
document.addEventListener("DOMContentLoaded", () => {

  // basic overlay controls
  bmClose.onclick = closeBookmark;
  bmNext.onclick  = incRange;
  bmPrev.onclick  = decRange;

  // color buttons
  document.querySelector(".c1").onclick = () => applyColor("cyan");
  document.querySelector(".c2").onclick = () => applyColor("yellow");
  document.querySelector(".c3").onclick = () => applyColor("red");
  document.querySelector(".c4").onclick = removeColor;

  // underline & font
  bmUnderlineBtn.onclick = toggleUnderline;
  bmFontBtn.onclick = toggleFont;

  // ✏️ PEN → OPEN NOTES + SAVE LAST POSITION
  if (typeof bmNotesBtn !== "undefined" && bmNotesBtn){
    bmNotesBtn.onclick = () => {

      // save last reading position
      localStorage.setItem(LAST_READ_KEY, JSON.stringify({
        book: bmBook,
        chapter: bmChapter,
        verse: bmFrom
      }));

      // go to notes page
      location.href =
        `notes.html?book=${encodeURIComponent(bmBook)}&chapter=${bmChapter}&from=${bmFrom}&to=${bmTo}`;
    };
  }

  // 🗑️ DELETE BOOKMARK
  if (typeof bmDeleteBtn !== "undefined" && bmDeleteBtn){
    bmDeleteBtn.onclick = () => {
      if (confirm("Futa bookmark yote kabisa?")){
        deleteBookmarkSafe({
          book: bmBook,
          chapter: bmChapter,
          from: bmFrom,
          to: bmTo
        });
        closeBookmark();
      }
    };
  }

});
