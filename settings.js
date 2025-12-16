/* =========================================
   SETTINGS – THEME & DATA (FINAL)
========================================= */

function applyThemeFromStorage() {
  const mode = localStorage.getItem("themeMode") || "light";

  const root = document.documentElement;

  // colors
  root.style.setProperty("--text-color", localStorage.getItem("textColor") || "#000000");
  root.style.setProperty("--bg-color", localStorage.getItem("bgColor") || "#ffffff");
  root.style.setProperty("--book-color", localStorage.getItem("bookColor") || "#000000");
  root.style.setProperty("--chapter-number-color", localStorage.getItem("chapterNumColor") || "#471B1B");
  root.style.setProperty("--verse-text-color", localStorage.getItem("verseTextColor") || "#000000");

  // theme mode
  document.body.classList.remove("dark", "light");

  if (mode === "dark") {
    document.body.classList.add("dark");
  } else if (mode === "light") {
    document.body.classList.add("light");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.add("light");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {

  applyThemeFromStorage();

  /* ===============================
     INIT RADIO BUTTONS
  ================================ */
  const savedMode = localStorage.getItem("themeMode") || "light";
  document.querySelectorAll('input[name="themeMode"]').forEach(r => {
    r.checked = r.value === savedMode;
    r.onchange = () => {
      localStorage.setItem("themeMode", r.value);
      applyThemeFromStorage();
    };
  });

  /* ===============================
     COLOR PICKERS
  ================================ */
  textColorPicker.value = localStorage.getItem("textColor") || "#000000";
  bgColorPicker.value = localStorage.getItem("bgColor") || "#ffffff";
  bookColorPicker.value = localStorage.getItem("bookColor") || "#000000";
  chapterNumberPicker.value = localStorage.getItem("chapterNumColor") || "#471B1B";
  verseColorPicker.value = localStorage.getItem("verseTextColor") || "#000000";

  saveColors.onclick = () => {
    localStorage.setItem("textColor", textColorPicker.value);
    localStorage.setItem("bgColor", bgColorPicker.value);
    localStorage.setItem("bookColor", bookColorPicker.value);
    localStorage.setItem("chapterNumColor", chapterNumberPicker.value);
    localStorage.setItem("verseTextColor", verseColorPicker.value);
    applyThemeFromStorage();
    alert("Mabadiliko yametumika ✅");
  };

  /* ===============================
     DATA ACTIONS
  ================================ */
  exportBookmarks.onclick = () => {
    const data = JSON.stringify(JSON.parse(localStorage.getItem("bookmarks") || "[]"), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bookmarks.json";
    a.click();
  };

  clearBookmarks.onclick = () => {
    if (confirm("Ondoa bookmarks zote?")) {
      localStorage.removeItem("bookmarks");
      alert("Bookmarks zimeondolewa.");
    }
  };

  showHistory.onclick = () => {
    const hist = JSON.parse(localStorage.getItem("history") || "[]");
    if (!hist.length) return alert("Hakuna historia.");
    alert(
      hist.slice(0, 20)
        .map(h => `${h.book} ${h.chapter} — ${new Date(h.time).toLocaleString()}`)
        .join("\n")
    );
  };
});
