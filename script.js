let bible = null;
let currentTestament = "OT"; // default AGANO LA KALE

/* LOAD JSON */
async function loadBible() {
  try {
    const res = await fetch("bible.json");
    bible = await res.json();
  } catch (e) {
    document.getElementById("bookList").innerHTML =
      `<div class="loading">Tafadhali tumia Live Server — bible.json haipatikani</div>`;
    console.error(e);
    return;
  }
  renderBooks();
}

/* CREATE BOOK ROW (NO PLAY/NO DOWNLOAD/NO OLD SHARE) */
function createBookElement(bookName, meta) {
  const row = document.createElement("div");
  row.className = "book";

  row.innerHTML = `
        <div class="book-name">${bookName}</div>
        <div class="actions">
            <button class="icon-btn shareModern" title="Share Book">🔗</button>
        </div>
    `;
  return row;
}

/* CHAPTER BOX */
function createChapterBox(bookName, chaptersCount) {
  const box = document.createElement("div");
  box.className = "chapter-box";
  box.id = "chap_" + bookName.replace(/\s+/g, "_");

  const header = document.createElement("div");
  header.className = "chapter-title";
  header.innerText = "Sura";

  const grid = document.createElement("div");
  grid.className = "chapter-grid";

  for (let i = 1; i <= chaptersCount; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    btn.onclick = (e) => {
      e.stopPropagation();
      window.location.href =
        `chapter.html?book=${encodeURIComponent(bookName)}&chapter=${i}`;
    };

    grid.appendChild(btn);
  }

  box.appendChild(header);
  box.appendChild(grid);
  return box;
}

/* SHARE TEXT FROM BOOKMARK */
async function shareBookContent(bookName) {
  const all = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  const relevant = all.filter(b => b.book === bookName);

  if (relevant.length === 0) {
    alert("Hakuna maandiko ya kushare kwa kitabu hiki.");
    return;
  }

  let output = "";
  for (const bm of relevant) {
    output += `${bm.book} ${bm.chapter}:${bm.startVerse}–${bm.endVerse}\n`;

    const bibleData = bible.books[bm.book].chapters[bm.chapter].verses;
    for (let v = bm.startVerse; v <= bm.endVerse; v++){
        if (bibleData[v]) {
            output += `${v}. ${bibleData[v]}\n\n`;
        }
    }
    output += "\n";
  }

  // Try Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: bookName,
        text: output
      });
      return;
    } catch (e) {
      console.warn("Web Share failed:", e);
    }
  }

  // fallback: copy to clipboard
  navigator.clipboard.writeText(output);
  alert("Maandiko yamenakiliwa! Unaweza kuyabandika sehemu yoyote.");
}

/* RENDER BOOK LIST */
function renderBooks() {
  const listEl = document.getElementById("bookList");
  listEl.innerHTML = "";

  const books = Object.keys(bible.books);

  for (const b of books) {
    const meta = bible.books[b];
    if (!meta || meta.testament !== currentTestament) continue;

    const chaptersCount = Object.keys(meta.chapters).length;

    const row = createBookElement(b, meta);
    const chapterBox = createChapterBox(b, chaptersCount);

    /* TOGGLE CHAPTER BOX */
    row.onclick = () => {
      const id = "chap_" + b.replace(/\s+/g, "_");
      const el = document.getElementById(id);

      if (el.style.display === "block") {
        el.style.display = "none";
        row.classList.remove("active");
      } else {
        document.querySelectorAll(".chapter-box").forEach(c => c.style.display = "none");
        document.querySelectorAll(".book").forEach(r => r.classList.remove("active"));

        el.style.display = "block";
        row.classList.add("active");
      }
    };

    /* SHARE BUTTON */
    row.querySelector(".shareModern").onclick = (e) => {
      e.stopPropagation();
      shareBookContent(b);
    };

    listEl.appendChild(row);
    listEl.appendChild(chapterBox);
  }
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("leftArrow").onclick = () => {
    currentTestament = "OT";
    document.getElementById("testamentTitle").innerText = "AGANO LA KALE";
    renderBooks();
  };

  document.getElementById("rightArrow").onclick = () => {
    currentTestament = "NT";
    document.getElementById("testamentTitle").innerText = "AGANO JIPYA";
    renderBooks();
  };

  await loadBible();
});
