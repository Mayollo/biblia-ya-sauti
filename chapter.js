/* =========================================
   CHAPTER SCRIPT – WITH NOTES BUTTON
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

  if (!window.AudioCore) {
    console.error("AudioCore haipo");
    return;
  }

  const AudioCore = window.AudioCore;

  function getParams() {
    const p = {};
    location.search.substring(1).split("&").forEach(kv => {
      const [k, v] = kv.split("=");
      if (k) p[k] = decodeURIComponent(v || "");
    });
    return p;
  }

  async function loadBible() {
    const res = await fetch("bible.json");
    return await res.json();
  }

  function clearHighlight() {
    document.querySelectorAll(".verse")
      .forEach(v => v.classList.remove("playing"));
  }

  /* ===============================
     INIT PARAMS
  ================================ */
  const { book, chapter } = getParams();
  if (!book || !chapter) return;

  const bible = await loadBible();
  const verses =
    bible.books?.[book]?.chapters?.[chapter]?.verses;
  if (!verses) return;

  document.getElementById("chapterHeading").innerText =
    `${book} ${chapter}`;

  /* ===============================
     NOTES BUTTON (NEW)
  ================================ */
  const notesBtn = document.getElementById("openNotesBtn");
  if (notesBtn) {
    notesBtn.onclick = () => {

      // hifadhi last reading position
      const lastVerse =
        AudioCore.state?.currentVerse || 1;

      localStorage.setItem(
        "lastReadingPosition",
        JSON.stringify({
          book,
          chapter: Number(chapter),
          verse: lastVerse
        })
      );

      // nenda notes
      location.href =
        `notes.html?book=${encodeURIComponent(book)}&chapter=${chapter}&from=${lastVerse}&to=${lastVerse}`;
    };
  }

  /* ===============================
     RENDER CHAPTER
  ================================ */
  function renderChapter(book, chapter, verses) {
    const wrap = document.getElementById("chapterContent");
    wrap.innerHTML = "";

    const order = [];

    Object.keys(verses).forEach(v => {
      const num = Number(v);
      order.push(num);

      const row = document.createElement("div");
      row.className = "verse";
      row.id = `v-${num}`;

      row.innerHTML = `
        <div class="num">${num}</div>
        <div class="text">${verses[v]}</div>
        <img src="icons/pen.png" class="pen-btn" />
      `;

      row.onclick = () => {
        AudioCore.play(book, chapter, num);

        localStorage.setItem(
          "lastReadingPosition",
          JSON.stringify({ book, chapter: Number(chapter), verse: num })
        );
      };

      const pen = row.querySelector(".pen-btn");
      if (pen && typeof openBookmark === "function") {
        pen.onclick = (e) => {
          e.stopPropagation();
          openBookmark(book, chapter, num);
        };
      }

      wrap.appendChild(row);
    });

    AudioCore.setVerseOrder(order);

    if (typeof applyBookmarksOnChapter === "function") {
      applyBookmarksOnChapter(book, chapter);
    }
  }

  renderChapter(book, chapter, verses);

  /* ===============================
     AUDIO UI
  ================================ */
  const nowTitle = document.getElementById("nowTitle");
  const progressFill = document.getElementById("progressFill");

  document.getElementById("playPauseBtn").onclick = () => {
    AudioCore.audio.paused
      ? AudioCore.audio.play()
      : AudioCore.audio.pause();
  };

  document.getElementById("nextVerseBtn").onclick = () => AudioCore.next();
  document.getElementById("prevVerseBtn").onclick = () => AudioCore.prev();

  document.getElementById("repeatBtn").onclick = () => {
    const r = AudioCore.toggleRepeat();
    nowTitle.innerText =
      r === "off" ? "Rudia: Zima" :
      r === "one" ? "Rudia: Mstari" :
      "Rudia: Sura";
  };

  AudioCore.state.onVerseChange = (b, c, v) => {
    nowTitle.innerText = `${b} ${c}:${v}`;
    clearHighlight();
    const el = document.getElementById(`v-${v}`);
    if (el) el.classList.add("playing");
  };

  AudioCore.state.onProgress = (p) => {
    progressFill.style.width = (p * 100) + "%";
  };

  document.getElementById("prevChapterBtn").onclick =
    () => location.href =
      `chapter.html?book=${encodeURIComponent(book)}&chapter=${Number(chapter)-1}`;

  document.getElementById("nextChapterBtn").onclick =
    () => location.href =
      `chapter.html?book=${encodeURIComponent(book)}&chapter=${Number(chapter)+1}`;

});
