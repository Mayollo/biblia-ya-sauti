/* =========================================
   AUDIO CORE – FINAL (VERSE / CHAPTER)
========================================= */
(function(){

  const audio = new Audio();
  audio.preload = "auto";

  const state = {
    book: null,
    chapter: null,
    verse: null,
    verseOrder: [],

    repeat: "off", // off | one | chapter

    onVerseChange: null,
    onProgress: null
  };

  /* ===============================
     HELPERS
  ================================ */
  function safeBook(book){
    return book.toLowerCase().replace(/\s+/g, "_");
  }

  function audioPath(book, chapter, verse){
    return `sauti/${safeBook(book)}_${chapter}_${verse}.mp3`;
  }

  /* ===============================
     RESUME STORAGE
  ================================ */
  function saveProgress(){
    try{
      localStorage.setItem("lastAudioProgress", JSON.stringify({
        book: state.book,
        chapter: state.chapter,
        verse: state.verse,
        time: audio.currentTime || 0
      }));
    }catch(e){}
  }

  function loadProgress(){
    try{
      return JSON.parse(localStorage.getItem("lastAudioProgress"));
    }catch(e){
      return null;
    }
  }

  /* ===============================
     PLAY LOGIC (TOGGLE SAFE)
  ================================ */
  function play(book, chapter, verse){

    const sameVerse =
      state.book === book &&
      state.chapter === chapter &&
      state.verse === verse;

    // 🔁 Toggle play / pause kama ni mstari huohuo
    if (sameVerse){
      if (audio.paused){
        audio.play().catch(()=>{});
      }else{
        audio.pause();
      }
      return;
    }

    // ▶️ Cheza mstari mpya
    state.book = book;
    state.chapter = chapter;
    state.verse = verse;

    audio.src = audioPath(book, chapter, verse);

    const last = loadProgress();
    audio.onloadedmetadata = () => {
      if (
        last &&
        last.book === book &&
        last.chapter === chapter &&
        last.verse === verse &&
        last.time > 1
      ){
        audio.currentTime = last.time;
      }
      audio.play().catch(()=>{});
    };

    if (typeof state.onVerseChange === "function"){
      state.onVerseChange(book, chapter, verse);
    }
  }

  /* ===============================
     VERSE ORDER
  ================================ */
  function setVerseOrder(arr){
    state.verseOrder = arr.map(Number);
  }

  /* ===============================
     PROGRESS BAR + SAVE
  ================================ */
  audio.ontimeupdate = () => {
    if (!audio.duration) return;

    // progress callback
    if (typeof state.onProgress === "function"){
      state.onProgress(audio.currentTime / audio.duration);
    }

    // save resume info
    saveProgress();
  };

  /* ===============================
     END / NEXT LOGIC
  ================================ */
  audio.onended = () => {

    // 🔁 Repeat mstari
    if (state.repeat === "one"){
      play(state.book, state.chapter, state.verse);
      return;
    }

    const i = state.verseOrder.indexOf(state.verse);
    const nextVerse = state.verseOrder[i + 1];

    if (nextVerse){
      play(state.book, state.chapter, nextVerse);
      return;
    }

    // 🔁 Repeat sura
    if (state.repeat === "chapter"){
      play(state.book, state.chapter, state.verseOrder[0]);
    }
  };

  /* ===============================
     CONTROLS
  ================================ */
  function next(){
    audio.onended();
  }

  function prev(){
    const i = state.verseOrder.indexOf(state.verse);
    const prevVerse = state.verseOrder[i - 1];
    if (prevVerse){
      play(state.book, state.chapter, prevVerse);
    }
  }

  function toggleRepeat(){
    state.repeat =
      state.repeat === "off" ? "one" :
      state.repeat === "one" ? "chapter" : "off";
    return state.repeat;
  }

  /* ===============================
     EXPORT
  ================================ */
  window.AudioCore = {
    play,
    next,
    prev,
    toggleRepeat,
    setVerseOrder,
    state,
    audio
  };

})();
