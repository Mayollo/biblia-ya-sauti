/* =========================================
   BOOKMARKS PAGE – DELETE SAFE
========================================= */

const STORAGE_KEY="bibleBookmarks";

function loadBookmarks(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[];}
  catch{return[];}
}

function same(a,b){
  return a.book===b.book &&
         a.chapter===b.chapter &&
         a.from===b.from &&
         a.to===b.to;
}

function saveBookmarks(list){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(list));
}

function deleteBookmarkSafe(bm){
  const list=loadBookmarks().filter(b=>!same(b,bm));
  saveBookmarks(list);
}

function renderBookmarks(){
  const wrap=document.getElementById("bookmarkList");
  const list=loadBookmarks();

  wrap.innerHTML="";
  if(!list.length){
    wrap.innerHTML="<div class='empty'>Hakuna bookmarks</div>";
    return;
  }

  list.forEach(bm=>{
    const card=document.createElement("div");
    card.className="bookmark-card";

    card.innerHTML=`
      <div>${bm.book} ${bm.chapter}:${bm.from}-${bm.to}</div>
      <div>${bm.note||""}</div>
      <button class="delete">Futa</button>
    `;

    card.querySelector(".delete").onclick=()=>{
      if(confirm("Futa bookmark hii?")){
        deleteBookmarkSafe(bm);
        renderBookmarks();
      }
    };

    wrap.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded",renderBookmarks);
