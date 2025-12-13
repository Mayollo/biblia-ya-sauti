/* ============================================
   NOTES STORAGE HELPERS
============================================ */
function getStoreArray(key){
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch(e){ return []; }
}
function setStoreArray(key, arr){
    localStorage.setItem(key, JSON.stringify(arr));
}

function fmtDate(ts){
    const d = new Date(ts);
    return `${d.getDate()} ${d.toLocaleString("en",{month:"short"})} ${d.getFullYear()}`;
}

function formatRef(bm){
    if (bm.startVerse === bm.endVerse){
        return `${bm.book} ${bm.chapter}:${bm.startVerse}`;
    }
    return `${bm.book} ${bm.chapter}:${bm.startVerse}–${bm.endVerse}`;
}

/* ============================================
   AUDIO ENGINE – PLAYS VERSE RANGE
============================================ */
let notesAudio = new Audio();
let playQueue = [];
let playIndex = 0;

function playBookmarkAudio(bm){
    const safeBook = bm.book.toLowerCase().replace(/\s+/g, "_");

    playQueue = [];
    for (let v = bm.startVerse; v <= bm.endVerse; v++){
        playQueue.push(`sauti/${safeBook}_${bm.chapter}_${v}.mp3`);
    }

    playIndex = 0;
    playNextInQueue(bm);
}

function playNextInQueue(bm){
    if (playIndex >= playQueue.length){
        console.log("Audio ya bookmark imeisha.");
        return;
    }

    const src = playQueue[playIndex];
    notesAudio.src = src;
    notesAudio.play();

    console.log("Playing:", src);

    notesAudio.onended = () => {
        playIndex++;
        playNextInQueue(bm);
    };
}

/* ============================================
   RENDER NOTES LIST
============================================ */
function renderNotes(){
    const wrap = document.getElementById("notesList");
    const notes = getStoreArray("bookmarks").sort((a,b)=> b.created - a.created);

    if (notes.length === 0){
        wrap.innerHTML = `<div class="empty">Hakuna bookmarks wala notes bado.</div>`;
        return;
    }

    wrap.innerHTML = "";

    notes.forEach(n => {
        const ref = formatRef(n);

        const card = document.createElement("div");
        card.className = "note-item";

        card.innerHTML = `
            <div class="note-header">
                <div class="note-ref">${ref}</div>
                <div class="note-date">${fmtDate(n.created)}</div>
            </div>

            <textarea class="note-text" data-id="${n.id}">${n.note || ""}</textarea>

            <div class="note-actions">
                <button class="btn playBtn" data-id="${n.id}">▶ Sauti</button>
                <button class="btn saveBtn" data-id="${n.id}">Hifadhi</button>
                <button class="btn delBtn" data-id="${n.id}">Futa</button>
                <button class="btn openBtn" data-id="${n.id}">Fungua</button>
            </div>
        `;

        wrap.appendChild(card);
    });

    /* PLAY BUTTON */
    document.querySelectorAll(".playBtn").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const list = getStoreArray("bookmarks");
            const bm = list.find(x => x.id === id);
            if (!bm) return;

            playBookmarkAudio(bm);
        };
    });

    /* SAVE NOTE */
    document.querySelectorAll(".saveBtn").forEach(btn=>{
        btn.onclick = () => {
            const id = btn.dataset.id;
            const area = document.querySelector(`textarea[data-id="${id}"]`).value;

            const list = getStoreArray("bookmarks").map(n=>{
                if (n.id === id) n.note = area;
                return n;
            });
            setStoreArray("bookmarks", list);
            alert("Note imehifadhiwa!");
        };
    });

    /* DELETE */
    document.querySelectorAll(".delBtn").forEach(btn=>{
        btn.onclick = () => {
            if (!confirm("Futa bookmark hii?")) return;
            const id = btn.dataset.id;
            const list = getStoreArray("bookmarks").filter(n=> n.id !== id);
            setStoreArray("bookmarks", list);
            renderNotes();
        };
    });

    /* OPEN IN BIBLE */
    document.querySelectorAll(".openBtn").forEach(btn=>{
        btn.onclick = () => {
            const id = btn.dataset.id;
            const list = getStoreArray("bookmarks");
            const b = list.find(x=> x.id === id);
            if (!b) return;

            window.location.href =
                `chapter.html?book=${encodeURIComponent(b.book)}&chapter=${b.chapter}&jump=${b.startVerse}`;
        };
    });
}

/* ============================================
   PAGE INIT
============================================ */
document.addEventListener("DOMContentLoaded", ()=>{
    renderNotes();

    document.getElementById("clearAll").onclick = () => {
        if (!confirm("Futa bookmarks zote?")) return;
        setStoreArray("bookmarks", []);
        renderNotes();
    };

    document.getElementById("addNewNote").onclick = () => {
        alert("Chagua mstari kwenye Biblia ili kuongeza bookmark.");
        history.back();
    };
});
