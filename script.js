document.addEventListener("DOMContentLoaded", async () => {
  const bible = await loadBible();
  renderBooks(bible);

  function loadBible() {
    return fetch("bible.json").then(response => response.json());
  }

  function renderBooks(bible) {
    // Clear existing content
    const oldTestamentContainer = document.querySelector(".old-testament-books");
    const newTestamentContainer = document.querySelector(".new-testament-books");
    oldTestamentContainer.innerHTML = "";
    newTestamentContainer.innerHTML = "";

    // Separate books by testament
    const oldTestamentBooks = Object.keys(bible.books).filter(book => bible.books[book].testament === 'OT');
    const newTestamentBooks = Object.keys(bible.books).filter(book => bible.books[book].testament === 'NT');

    // Render Old Testament Books
    oldTestamentBooks.forEach(bookName => {
      const meta = bible.books[bookName];
      const row = document.createElement("div");
      row.className = "book";
      
      // Create book title and download button
      const downloadIcon = document.createElement("img");
      downloadIcon.src = "icons/download.png";  // Path to your download icon
      downloadIcon.alt = "Download Audio";
      downloadIcon.classList.add("download-icon");

      const bookTitle = document.createElement("div");
      bookTitle.className = "book-name";
      bookTitle.textContent = bookName;

      row.appendChild(downloadIcon); // Add download icon in front of book title
      row.appendChild(bookTitle);

      const box = document.createElement("div");
      box.className = "chapter-box";
      const grid = document.createElement("div");
      grid.className = "chapter-grid";

      Object.keys(meta.chapters).forEach(ch => {
        const btn = document.createElement("button");
        btn.innerText = ch;
        btn.onclick = () => {
          location.href = `chapter.html?book=${encodeURIComponent(bookName)}&chapter=${ch}`;
        };
        grid.appendChild(btn);
      });

      box.appendChild(grid);

      // Toggling chapter list visibility on book click
      row.onclick = () => {
        const isOpen = row.classList.contains("active");
        document.querySelectorAll(".book").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".chapter-box").forEach(b => b.style.display = "none");

        if (!isOpen) {
          row.classList.add("active");
          box.style.display = "block";
        }
      };

      // Add download functionality to the download icon
      downloadIcon.onclick = (event) => {
        event.stopPropagation();  // Prevent triggering the chapter toggle
        alert(`Downloading audio for all chapters of ${bookName}...`);
        // Trigger download logic here for the whole book
        downloadAudio(bookName, downloadIcon);
      };

      oldTestamentContainer.appendChild(row);
      oldTestamentContainer.appendChild(box);
    });

    // Render New Testament Books
    newTestamentBooks.forEach(bookName => {
      const meta = bible.books[bookName];
      const row = document.createElement("div");
      row.className = "book";
      
      // Create book title and download button
      const downloadIcon = document.createElement("img");
      downloadIcon.src = "icons/download.png";  // Path to your download icon
      downloadIcon.alt = "Download Audio";
      downloadIcon.classList.add("download-icon");

      const bookTitle = document.createElement("div");
      bookTitle.className = "book-name";
      bookTitle.textContent = bookName;

      row.appendChild(downloadIcon); // Add download icon in front of book title
      row.appendChild(bookTitle);

      const box = document.createElement("div");
      box.className = "chapter-box";
      const grid = document.createElement("div");
      grid.className = "chapter-grid";

      Object.keys(meta.chapters).forEach(ch => {
        const btn = document.createElement("button");
        btn.innerText = ch;
        btn.onclick = () => {
          location.href = `chapter.html?book=${encodeURIComponent(bookName)}&chapter=${ch}`;
        };
        grid.appendChild(btn);
      });

      box.appendChild(grid);

      row.onclick = () => {
        const isOpen = row.classList.contains("active");
        document.querySelectorAll(".book").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".chapter-box").forEach(b => b.style.display = "none");

        if (!isOpen) {
          row.classList.add("active");
          box.style.display = "block";
        }
      };

      // Add download functionality to the download icon
      downloadIcon.onclick = (event) => {
        event.stopPropagation();  // Prevent triggering the chapter toggle
        alert(`Downloading audio for all chapters of ${bookName}...`);
        // Trigger download logic here for the whole book
        downloadAudio(bookName, downloadIcon);
      };

      newTestamentContainer.appendChild(row);
      newTestamentContainer.appendChild(box);
    });
  }

  // Function to handle downloading the audio for a book
  function downloadAudio(bookName, downloadIcon) {
    // Path to the book's audio
    const audioPath = `sauti/${bookName.toLowerCase()}.mp3`; // Path for the entire book's audio

    // Check if audio is already downloaded (e.g., by checking if file exists in local storage)
    if (localStorage.getItem(bookName)) {
      // If it's already downloaded, just change the icon to play
      downloadIcon.src = "icons/play_sauti.png"; // Change to play icon
      downloadIcon.onclick = () => {
        playAudio(audioPath);  // Play the audio when clicked
      };
      return;
    }

    // Simulate download
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;  // Simulating 10% progress per interval
      downloadIcon.alt = `Downloading ${progress}%`;  // Update icon alt text with progress
      downloadIcon.src = "icons/download.png";  // Show downloading icon
      if (progress >= 100) {
        clearInterval(interval); // Stop interval once download is complete
        localStorage.setItem(bookName, "downloaded");  // Mark the book as downloaded in local storage
        downloadIcon.src = "icons/play_sauti.png";  // Change to play icon
        downloadIcon.onclick = () => {
          playAudio(audioPath);  // Play the audio when clicked
        };
        alert("Download complete!");
      }
    }, 1000);  // Simulate download every 1 second
  }

  // Function to handle playing the audio
  function playAudio(audioPath) {
    const audio = new Audio(audioPath);
    audio.play();  // Play the audio
  }
});
