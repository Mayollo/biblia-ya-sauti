// settings.js

function applyThemeFromStorage(){
  document.documentElement.style.setProperty('--text-color', localStorage.getItem('textColor') || '#000000');
  document.documentElement.style.setProperty('--bg-color', localStorage.getItem('bgColor') || '#ffffff');
  document.documentElement.style.setProperty('--book-color', localStorage.getItem('bookColor') || '#000000');
  document.documentElement.style.setProperty('--chapter-number-color', localStorage.getItem('chapterNumColor') || '#471B1B');
  document.documentElement.style.setProperty('--verse-text-color', localStorage.getItem('verseTextColor') || '#000000');
}

document.addEventListener('DOMContentLoaded', ()=>{
  applyThemeFromStorage();

  // set pickers initial values
  document.getElementById('textColorPicker').value = localStorage.getItem('textColor') || '#000000';
  document.getElementById('bgColorPicker').value = localStorage.getItem('bgColor') || '#ffffff';
  document.getElementById('bookColorPicker').value = localStorage.getItem('bookColor') || '#000000';
  document.getElementById('chapterNumberPicker').value = localStorage.getItem('chapterNumColor') || '#471B1B';
  document.getElementById('verseColorPicker').value = localStorage.getItem('verseTextColor') || '#000000';

  document.getElementById('saveColors').onclick = ()=>{
    const t = document.getElementById('textColorPicker').value;
    const b = document.getElementById('bgColorPicker').value;
    const book = document.getElementById('bookColorPicker').value;
    const ch = document.getElementById('chapterNumberPicker').value;
    const v = document.getElementById('verseColorPicker').value;
    localStorage.setItem('textColor', t);
    localStorage.setItem('bgColor', b);
    localStorage.setItem('bookColor', book);
    localStorage.setItem('chapterNumColor', ch);
    localStorage.setItem('verseTextColor', v);
    applyThemeFromStorage();
    alert('Mabadiliko yametumika.');
  };

  document.getElementById('exportBookmarks').onclick = ()=>{
    const bk = JSON.parse(localStorage.getItem('bookmarks')||'[]');
    const data = JSON.stringify(bk, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('clearBookmarks').onclick = ()=>{
    if(confirm('Ondoa bookmarks zote?')) {
      localStorage.removeItem('bookmarks');
      alert('Bookmarks zimeondolewa.');
    }
  };

  document.getElementById('showHistory').onclick = ()=>{
    const hist = JSON.parse(localStorage.getItem('history')||'[]');
    if(!hist.length) return alert('Hakuna historia.');
    const top = hist.slice(0,20).map(h=>`${h.book} ${h.chapter} — ${new Date(h.time).toLocaleString()}`).join('\n');
    alert('Historia (juu 20):\n' + top);
  };
});
