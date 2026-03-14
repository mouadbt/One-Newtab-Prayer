import { renderAyah, showPlayingAyahError } from "./ui";
import { loadData, saveData, toggleClassName } from "./utils";

const QURAN_STORAGE_KEY = "quran_data";          // full quran data cache
const AYAH_DAILY_KEY = "ayah_daily";             // today's ayah index + timestamp
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const QURAN_API_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani";
const TAFSIR_API_URL = "https://api.alquran.cloud/v1/quran/ar.muyassar";
const AUDIO_BASE_URL = "https://cdn.islamic.network/quran/audio/128/";

let ayahData = [];        // [{arabic, tafsir, number}] – full quran
let currentIndex = 0;     // index inside ayahData (daily ayah)
let audio = null;         // Audio instance
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
  if (action === 'next-ayah') {
    currentIndex = (currentIndex + 1) % ayahData.length;
  } else if (action === 'prev-ayah') {
    currentIndex = (currentIndex - 1 + ayahData.length) % ayahData.length;
  }
  displayeAyah();
  saveData(AYAH_DAILY_KEY, { index: currentIndex, timestamp: Date.now() });
  if (isPlaying) {
    playAyah();
  }
}

export const onPlayToggle = () => {
  if (isPlaying) {
    stopAudio();
  } else {
    playAyah();
  }
}

const stopAudio = () => {
  if (audio) {
    audio.pause();
  }
  isPlaying = false;
}

const getSelectedReciter = () => {
  return loadData('selectedReciter', 'ar.husarymujawwad');
}

const audioUrl = (index) => {
  const globalNum = ayahData[index]?.global ?? index + 1;
  const reciter = getSelectedReciter();
  return `${AUDIO_BASE_URL}${reciter}/${globalNum}.mp3`;
}

const playAyah = () => {
  const url = audioUrl(currentIndex);

  if (!audio) {
    audio = new Audio(url);
    audio.onended = () => {
      const nextIdx = (currentIndex + 1) % ayahData.length;
      currentIndex = nextIdx;
      displayeAyah();
      saveData(AYAH_DAILY_KEY, { index: currentIndex, timestamp: Date.now() });
      playAyah();
    };
  } else {
    audio.src = url;
    audio.load();
  }

  audio.play().then(() => {
    isPlaying = true;
  }).catch(err => {
    isPlaying = false;
    showPlayingAyahError();
    console.warn("[Ayah] play error", err);
  });
};  