// generate_bible.js
// Node script -> run: node generate_bible.js
// It will create bible.json with all books, chapters & verses placeholders ("Mstari 1", ...)

const fs = require('fs');

// list of books in canonical order with chapter counts and testament tag
// Source: public bible chapter counts (Genesis 50, Exodus 40, ...). See citations.
const books = [
  // Old Testament (39)
  ["Mwanzo",50,"OT"],
  ["Kutoka",40,"OT"],
  ["Walawi",27,"OT"],
  ["Hesabu",36,"OT"],
  ["Kumbukumbu la Torati",34,"OT"],
  ["Yoshua",24,"OT"],
  ["Waamuzi",21,"OT"],
  ["Ruthu",4,"OT"],
  ["1 Samweli",31,"OT"],
  ["2 Samweli",24,"OT"],
  ["1 Wafalme",22,"OT"],
  ["2 Wafalme",25,"OT"],
  ["1 Mambo ya Nyakati",29,"OT"],
  ["2 Mambo ya Nyakati",36,"OT"],
  ["Ezra",10,"OT"],
  ["Nehemia",13,"OT"],
  ["Esta",10,"OT"],
  ["Ayubu",42,"OT"],
  ["Zaburi",150,"OT"],
  ["Mithali",31,"OT"],
  ["Mhubiri",12,"OT"],
  ["Wimbo Ulio Bora",8,"OT"],
  ["Isaya",66,"OT"],
  ["Yeremia",52,"OT"],
  ["Maombolezo",5,"OT"],
  ["Ezekieli",48,"OT"],
  ["Danieli",12,"OT"],
  ["Hosea",14,"OT"],
  ["Yoeli",3,"OT"],
  ["Amosi",9,"OT"],
  ["Obadia",1,"OT"],
  ["Yona",4,"OT"],
  ["Mika",7,"OT"],
  ["Nahumu",3,"OT"],
  ["Habakuki",3,"OT"],
  ["Sefania",3,"OT"],
  ["Hagai",2,"OT"],
  ["Zekaria",14,"OT"],
  ["Malaki",4,"OT"],

  // New Testament (27)
  ["Mathayo",28,"NT"],
  ["Marko",16,"NT"],
  ["Luka",24,"NT"],
  ["Yohana",21,"NT"],
  ["Matendo ya Mitume",28,"NT"],
  ["Warumi",16,"NT"],
  ["1 Wakorintho",16,"NT"],
  ["2 Wakorintho",13,"NT"],
  ["Wagalatia",6,"NT"],
  ["Waefeso",6,"NT"],
  ["Wafilipi",4,"NT"],
  ["Wakolosai",4,"NT"],
  ["1 Wathesalonike",5,"NT"],
  ["2 Wathesalonike",3,"NT"],
  ["1 Timotheo",6,"NT"],
  ["2 Timotheo",4,"NT"],
  ["Tito",3,"NT"],
  ["Filemoni",1,"NT"],
  ["Waebrania",13,"NT"],
  ["Yakobo",5,"NT"],
  ["1 Petro",5,"NT"],
  ["2 Petro",3,"NT"],
  ["1 Yohana",5,"NT"],
  ["2 Yohana",1,"NT"],
  ["3 Yohana",1,"NT"],
  ["Yuda",1,"NT"],
  ["Ufunuo",22,"NT"]
];

const output = { books: {} };

for (const [name, chapters, testament] of books) {
  const bookObj = { testament: testament, chapters: {} };
  for (let c = 1; c <= chapters; c++) {
    const ch = { heading: "Heading", verses: {} };
    // We'll create  (approx) 20 placeholder verses per chapter by default — but to be accurate,
    // we can set a reasonable default (e.g., 20). However better: create a placeholder count 20.
    // If you prefer exact verse counts, you'll replace later with real content.
    const defaultVerseCount = 20;
    for (let v = 1; v <= defaultVerseCount; v++) {
      ch.verses[String(v)] = `Mstari ${v}`;
    }
    bookObj.chapters[String(c)] = ch;
  }
  output.books[name] = bookObj;
}

// Write to bible.json
fs.writeFileSync('bible.json', JSON.stringify(output, null, 2), 'utf8');
console.log('bible.json generated with', Object.keys(output.books).length, 'books');
