/* =========================================
   HOME SCRIPT – BOOKS ONLY (NO AUDIO)
========================================= */

let bible = null;
let currentTestament = "OT";

/* ===============================
   LOAD BIBLE
================================ */
async function loadBible() {
  try {
    const res = await fetch("bible.json");
    bible = await res.json();
    renderBooks();
  } catch (e) {
    document.getElementById("bookList").innerHTML =
      `<div class="loading">Imeshindikana kupakia vitabu</div>`;
    console.error(e);
  }
}

/* ===============================
   RENDER BOOK LIST
================================ */
function renderBooks() {
  const list = document.getElementById("bookList");
  list.innerHTML = "";

  Object.keys(bible.books).forEach(bookName => {
    const meta = bible.books[bookName];
    if (meta.testament !== currentTestament) return;

    const row = document.createElement("div");
    row.className = "book";
    row.innerHTML = `<div class="book-name">${bookName}</div>`;

    const box = document.createElement("div");
    box.className = "chapter-box";

    const grid = document.createElement("div");
    grid.className = "chapter-grid";

    Object.keys(meta.chapters).forEach(ch => {
      const btn = document.createElement("button");
      btn.innerText = ch;
      btn.onclick = (e) => {
        e.stopPropagation();
        location.href =
          `chapter.html?book=${encodeURIComponent(bookName)}&chapter=${ch}`;
      };
      grid.appendChild(btn);
    });

    box.appendChild(grid);

    row.onclick = () => {
  const isOpen = row.classList.contains("active");

  // funga zote kwanza
  document.querySelectorAll(".book")
    .forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".chapter-box")
    .forEach(b => b.style.display = "none");

  // kama haikuwa wazi → ifungue
  if (!isOpen) {
    row.classList.add("active");
    box.style.display = "block";
  }
};

    list.appendChild(row);
    list.appendChild(box);
  });
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {

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

  loadBible();
});
