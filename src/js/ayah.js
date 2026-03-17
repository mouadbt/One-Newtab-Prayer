import { renderAyah, showPlayingAyahError } from "./ui";
import { loadData, saveData, toggleClassName } from "./utils";

const QURAN_STORAGE_KEY = "quran_data";
const AYAH_DAILY_KEY = "ayah_daily";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const QURAN_API_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani";
const TAFSIR_API_URL = "https://api.alquran.cloud/v1/quran/ar.muyassar";
const AUDIO_BASE_URL = "https://cdn.islamic.network/quran/audio/128/";

let ayahData = [];
let currentIndex = 0;
let audio = null;
let isPlaying = false;
let isLoading = false;


const initBars = () => {
  const container = document.getElementById('bars');
  if (!container) return;

  const heights = [22, 36, 52, 60, 48, 56, 44, 58, 38, 52, 46, 60, 36, 50, 42, 58, 34, 52, 48, 60, 40, 54, 44, 56, 38];
  const durations = [0.6, 0.9, 0.7, 1.1, 0.8, 0.65, 1.0, 0.75, 0.85, 0.7, 0.95, 0.8, 0.6, 1.05, 0.9, 0.7, 0.85, 0.65, 1.0, 0.75, 0.8, 0.7, 0.9, 0.65, 1.1];
  const delays = [0, .1, .2, .05, .15, .25, .08, .18, .28, .03, .13, .23, .07, .17, .27, .04, .14, .24, .09, .19, .12, .22, .06, .16, .26];

  heights.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = h + 'px';
    bar.style.setProperty('--dur', durations[i] + 's');
    bar.style.setProperty('--delay', delays[i] + 's');
    container.appendChild(bar);
  });
}


const updateBars = () => {
  const container = document.getElementById('bars');
  if (!container) return;
  container.classList.toggle('play', isPlaying);
  if (!isPlaying) {
    container.classList.remove('visible');
  } else {
    setTimeout(() => container.classList.add('visible'), 250);
  }
}

export async function initAyah() {
  await loadQuranData();
  loadDailyAyah();
  displayeAyah();
  bindControls();
  updateAyahPlayingIcon();
  initBars();
}

const loadQuranData = async () => {
  const storedAyat = loadData(QURAN_STORAGE_KEY, null);
  if (storedAyat) {
    ayahData = storedAyat;
    return;
  }
  const { quranJson, tafsirJson } = await fetchVerses();
  ayahData = formatVerses(quranJson, tafsirJson);
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
  if (!action) {
    return
  };
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

const getSelectedReciter = () => {
  return loadData('selectedReciter', 'ar.husarymujawwad');
}

const audioUrl = (index) => {
  const globalNum = ayahData[index]?.global ?? index + 1;
  const reciter = getSelectedReciter();
  return `${AUDIO_BASE_URL}${reciter}/${globalNum}.mp3`;
}

const updateAyahPlayingIcon = () => {
  const playIcon = document.querySelector('#play-ayah');
  const pauseIcon = document.querySelector('#pause-ayah');
  const loadingIcon = document.querySelector('#loading-ayah');

  if (!playIcon || !pauseIcon || !loadingIcon) return;

  [playIcon, pauseIcon, loadingIcon].forEach(icon => {
    icon.classList.remove('icon-active');
    icon.classList.add('icon-not-active');
  });

  const activeIcon = isLoading ? loadingIcon
    : isPlaying ? pauseIcon
      : playIcon;

  activeIcon.classList.remove('icon-not-active');
  activeIcon.classList.add('icon-active');
}

export const onPlayToggle = () => {
  if (isPlaying) {
    stopAudio();
  } else {
    playAyah();
  }
}

const stopAudio = () => {
  if (audio) audio.pause();
  isPlaying = false;
  updateAyahPlayingIcon();
  updateBars();
}

const playAyah = () => {
  const url = audioUrl(currentIndex);

  isLoading = true;
  isPlaying = false;
  updateAyahPlayingIcon();
  updateBars();

  if (!audio) {
    audio = new Audio(url);
    audio.onended = () => {
      currentIndex = (currentIndex + 1) % ayahData.length;
      displayeAyah();
      saveData(AYAH_DAILY_KEY, { index: currentIndex, timestamp: Date.now() });
      playAyah();
    };
  } else {
    audio.src = url;
    audio.load();
  }

  audio.oncanplaythrough = () => {
    isLoading = false;
    isPlaying = true;
    updateAyahPlayingIcon();
    updateBars();
  };

  audio.play().catch(err => {
    isLoading = false;
    isPlaying = false;
    updateAyahPlayingIcon();
    updateBars();
    showPlayingAyahError();
    console.warn("[Ayah] play error", err);
  });
}