import { renderAyah } from "./ui";
import { loadData, saveData, toggleClassName } from "./utils";

const QURAN_STORAGE_KEY = "quran_data";          // full quran data cache
const AYAH_DAILY_KEY = "ayah_daily";             // today's ayah index + timestamp
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const AUDIO_BASE_URL = "https://cdn.islamic.network/quran/audio/128/ar.husarymujawwad/";
const QURAN_API_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani";
const TAFSIR_API_URL = "https://api.alquran.cloud/v1/quran/ar.muyassar";

let ayahData = [];        // [{arabic, tafsir, number}] – full quran
let currentIndex = 0;     // index inside ayahData (daily ayah)
let audio = null;         // Audio instance
let nextAudio = null;     // preloaded next ayah
let isPlaying = false;

export async function initAyah() {
  // Load the quran and verses data
  await loadQuranData();

  // Get today's random ayah
  loadDailyAyah();

  // Render the ayah in the ui
  displayeAyah();

  bindControls();

  // preloadAudio(currentIndex);
}

const loadQuranData = async () => {
  // Get stored data
  const storedAyat = loadData(QURAN_STORAGE_KEY, null);
  if (storedAyat) {
    ayahData = storedAyat;
    return;
  }

  // Get data from api
  const { quranJson, tafsirJson } = await fetchVerses();

  // Format verses data
  ayahData = formatVerses(quranJson, tafsirJson);

  // Save verses to storage
  saveData(QURAN_STORAGE_KEY, ayahData);
}

const fetchVerses = async () => {
  const [quranRes, tafsirRes] = await Promise.all([
    fetch(QURAN_API_URL),
    fetch(TAFSIR_API_URL),
  ]);

  const quranJson = await quranRes.json();
  const tafsirJson = await tafsirRes.json();
  return { quranJson, tafsirJson };
}

const formatVerses = (quranJson, tafsirJson) => {
  const arabicVerses = quranJson.data.surahs.flatMap(surah =>
    surah.ayahs.map(ayah => ({ ...ayah, surahName: surah.name, surahEn: surah.englishName }))
  );
  const tafsirVerses = tafsirJson.data.surahs.flatMap(surah => surah.ayahs);

  return arabicVerses.map((v, i) => ({
    number: v.numberInSurah,
    global: v.number,
    arabic: v.text,
    tafsir: tafsirVerses[i]?.text ?? "",
    surah: v.surahName,
    surahEn: v.surahEn,
  }));
}

const loadDailyAyah = () => {
  const raw = loadData(AYAH_DAILY_KEY, null);
  if (raw) {
    const { index, timestamp } = raw;
    if (Date.now() - timestamp < ONE_DAY_MS) {
      currentIndex = index;
      return;
    }
  }

  // pick new random ayah
  currentIndex = Math.floor(Math.random() * ayahData.length);
  saveData(AYAH_DAILY_KEY, { index: currentIndex, timestamp: Date.now() });
}

const displayeAyah = () => {
  const ayah = ayahData[currentIndex];
  if (!ayah) return;
  renderAyah(ayah);
}

const bindControls = () => {
  const coverContainer = document.querySelector('#cover-container');
  toggleClassName(coverContainer, 'hidden!', 'remove');
  toggleClassName(coverContainer, 'flex', 'add');
}

export const navigateBetweenVerses = (action) => {
  if (!action) return;
  stopAudio();
  if (action === 'next-ayah') {
    currentIndex = (currentIndex + 1) % ayahData.length;
  } else if (action === 'prev-ayah') {
    currentIndex = (currentIndex - 1 + ayahData.length) % ayahData.length;
  }
  displayeAyah();
  saveData(AYAH_DAILY_KEY, { index: currentIndex, timestamp: Date.now() });
}

// function onPlayToggle() {
//   if (isPlaying) {
//     stopAudio();
//     setPlayIcon(false);
//   } else {
//     playAyah(currentIndex);
//   }
// }

// // ─── Audio ───────────────────────────────────────────────────────────────────
// function audioUrl(index) {
//   const globalNum = ayahData[index]?.global ?? index + 1;
//   return `${AUDIO_BASE_URL}${globalNum}.mp3`;
// }

// function preloadAudio(index) {
//   // preload current + next
//   const cur = new Audio(audioUrl(index));
//   const next = new Audio(audioUrl((index + 1) % ayahData.length));
//   cur.preload = "auto";
//   next.preload = "auto";
//   audio = cur;
//   nextAudio = next;
// }

// function playAyah(index) {
//   if (!audio || audio.src !== new URL(audioUrl(index), location.href).href) {
//     audio = new Audio(audioUrl(index));
//     audio.preload = "auto";
//   }

//   // preload next right away
//   const nextIdx = (index + 1) % ayahData.length;
//   nextAudio = new Audio(audioUrl(nextIdx));
//   nextAudio.preload = "auto";

//   audio.play().then(() => {
//     isPlaying = true;
//     setPlayIcon(true);
//   }).catch(err => console.warn("[Ayah] play error", err));

//   audio.onended = () => {
//     // auto-advance
//     currentIndex = nextIdx;
//     renderAyah();       // re-renders and rebinds; audio swapped inside
//     // use preloaded next audio
//     audio = nextAudio;
//     const afterNext = (nextIdx + 1) % ayahData.length;
//     nextAudio = new Audio(audioUrl(afterNext));
//     nextAudio.preload = "auto";

//     audio.play().then(() => {
//       isPlaying = true;
//       setPlayIcon(true);
//     }).catch(err => console.warn("[Ayah] auto-play error", err));

//     audio.onended = () => playAyah((currentIndex + 1) % ayahData.length);
//   };
// }

// function stopAudio() {
//   if (audio) {
//     audio.pause();
//     audio.onended = null;
//   }
//   isPlaying = false;
// }

// function setPlayIcon(playing) {
//   const btn = document.getElementById("ayah-play");
//   if (!btn) return;
//   btn.innerHTML = playing ? svgStop() : svgPlay();
//   btn.title = playing ? "Stop Recitation" : "Play Recitation";
// }

// // ─── SVG Icons ───────────────────────────────────────────────────────────────
// function svgPlay() {
//   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
//     <path d="M8 5v14l11-7z"/>
//   </svg>`;
// }

// function svgStop() {
//   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
//     <rect x="6" y="6" width="12" height="12" rx="1"/>
//   </svg>`;
// }