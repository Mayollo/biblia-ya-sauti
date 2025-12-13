/* helpers.js - storage + toast + small utils */

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.warn("JSON parse error for key:", key, e);
        return fallback;
    }
}

function showToast(message, duration = 1600) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    requestAnimationFrame(()=> toast.classList.add("show"));
    setTimeout(()=> {
        toast.classList.remove("show");
        setTimeout(()=> toast.remove(), 220);
    }, duration);
}

function uid() {
    return "bm_" + Math.random().toString(36).slice(2,10);
}

function addToStoreArray(key, item) {
    const arr = loadJSON(key, []);
    arr.push(item);
    saveJSON(key, arr);
    return arr;
}

function removeFromStoreById(key, id) {
    const arr = loadJSON(key, []);
    const out = arr.filter(x => x.id !== id);
    saveJSON(key, out);
    return out;
}

function getStoreArray(key) {
    return loadJSON(key, []) || [];
}

function formatRange(verses) {
    if (!verses || verses.length === 0) return "";
    const nums = verses.map(v => Number(v)).sort((a,b)=>a-b);
    if (nums.length === 1) return `${nums[0]}`;
    // compress to ranges e.g. 1-3,5,7-9
    let out = [];
    let start = nums[0], end = nums[0];
    for (let i=1;i<nums.length;i++){
        const n = nums[i];
        if (n === end+1) end = n;
        else {
            out.push(start === end ? `${start}` : `${start}-${end}`);
            start = end = n;
        }
    }
    out.push(start === end ? `${start}` : `${start}-${end}`);
    return out.join(",");
}
