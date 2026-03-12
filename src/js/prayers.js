import { renderAllPrayers, renderNextPrayer, renderTodayhijri } from "./ui.js";
import { fetchData, loadData, saveData } from "./utils.js";

const STORAGE_KEY = "prayers";
const ALLOWED_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

let todayPrayers = null;

let todayDateInfo = null;

let midnightTimer = null;

// Save prayers to storage
const savePrayers = (data) => saveData(STORAGE_KEY, data);

// Load prayers from storage
const loadPrayers = () => loadData(STORAGE_KEY, null);

// Format hijri date string from api object
const formatHijri = (date) => {
  return `${date.hijri.day} - ${date.hijri.month.ar} / ${date.hijri.month.en} - ${date.hijri.year}`
};

// extract only the 5 allowed prayers timings from a day
const extractTimings = (day) => {
  return ALLOWED_PRAYERS.map(name => {
    const timeStr = day.timings?.[name] || "";
    // Remove timezone suffix like " (+00)" - keep only "HH:MM"
    const cleanTime = timeStr.split(" ")[0];
    return { name, time: cleanTime };
  });
};

// Format full api month data for storage
const formatForStorage = (apiData, lat, lon) => {
  const prayers = apiData.map((day) => ({
    date: day.date.readable,
    timestamp: day.date.timestamp,
    hijri: formatHijri(day.date),
    timings: extractTimings(day),
  }));
  return {
    lastcoords: [lat, lon],
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    lastFetched: Date.now(),
    prayers,
  };
};

// Get current time in seconds (api timestamps are in seconds)
const nowSeconds = () => Math.floor(Date.now() / 1000);

// Find today's index in the stored prayers array
const findTodayIndex = (prayers) => {
  const now = nowSeconds();
  return prayers.findIndex((p) => {
    const start = Number(p.timestamp);
    return now >= start && now < start + 86400; // 86400s = 24h
  });
};

// Load today's prayers + tomorrow's fajr from storage into memory
const prepareTodayPrayers = () => {
  const stored = loadPrayers();
  if (!stored) return;

  const idx = findTodayIndex(stored.prayers);
  if (idx === -1) return;

  const today = stored.prayers[idx];
  const tomorrow = stored.prayers[idx + 1] || null;
  todayDateInfo = today
  todayPrayers = [...today.timings];
  // add tomorrow's fajr so the next prayer
  if (tomorrow) todayPrayers.push(tomorrow.timings[0]);
};

// Parse "HH:MM (TZ)" string into hour and min numbers
const parseTime = (timeStr) => {
  const [hour, min] = timeStr.split(" ")[0].split(":");
  return { hour: Number(hour), min: Number(min) };
};

// Build a ms timestamp for a prayer time today
const toTimestamp = (hour, min) => new Date().setHours(hour, min, 0, 0);

// Add 24h to tomorrow's fajr so it became for tomorow not just like regular 5 today's prayers
const fixTomorrowFajr = (timestamp, isLast) => {
  if (isLast && timestamp < Date.now()) {
    return timestamp + 24 * 60 * 60 * 1000;
  }
  return timestamp;
};

// Mark each prayer as "passed" / "next" / "upcoming"
const categorizePrayers = (prayers) => {
  const now = Date.now();
  let foundNext = false;

  return prayers.map((prayer, i) => {
    const { hour, min } = parseTime(prayer.time);
    let timestamp = toTimestamp(hour, min);
    timestamp = fixTomorrowFajr(timestamp, i === prayers.length - 1);

    let type;
    if (timestamp > now) {
      type = foundNext ? "upcoming" : "next";
      if (!foundNext) foundNext = true;
    } else {
      type = "passed";
    }

    return { ...prayer, timestamp, type };
  });
};

// Get hours and mins remaining until a timestamp
const getTimeLeft = (timestamp) => {
  const diff = timestamp - Date.now();
  if (diff <= 0) return { hours: null, mins: null };
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { hours, mins };
};

// Send prayer timestamps to background so it can schedule alarms
const scheduleAlarms = (categorized) => {
  const browserApi = typeof chrome !== "undefined" ? chrome : browser;
  if (!browserApi.runtime?.sendMessage) return;

  // only send prayers that haven't passed yet
  const upcoming = categorized
    .filter((p) => p.type !== "passed")
    .map((p) => ({ name: p.name, timestamp: p.timestamp }));

  browserApi.runtime.sendMessage({ type: "SCHEDULE_PRAYER_ALARMS", payload: upcoming });
};

// ms remaining until next midnight
const msUntilMidnight = () => {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - Date.now();
};

// Refresh cache, render ui, schedule all alarms
const dailySetup = () => {
  prepareTodayPrayers();
  if (!todayPrayers) return;

  const categorized = categorizePrayers(todayPrayers);

  renderAllPrayers(categorized);
  scheduleAlarms(categorized);

  if (todayDateInfo) {
    renderTodayhijri(todayDateInfo)
  };

  const next = categorized.find((p) => p.type === "next");
  if (next) {
    const { hours, mins } = getTimeLeft(next.timestamp);
    renderNextPrayer(next.name, hours, mins);
  }

  // clear old timer and set a new one for next midnight
  if (midnightTimer) {
    clearTimeout(midnightTimer)
  };
  midnightTimer = setTimeout(dailySetup, msUntilMidnight());
};

// Re-categorize from cache and update ui countdown
const minuteUpdate = () => {
  if (!todayPrayers) return;

  const categorized = categorizePrayers(todayPrayers);
  renderAllPrayers(categorized); // update passed/next/upcoming states

  const next = categorized.find((p) => p.type === "next");
  if (!next) return;

  const { hours, mins } = getTimeLeft(next.timestamp);
  renderNextPrayer(next.name, hours, mins);
};

// Build api url for a given month
const buildApiEndpoint = (year, month, lat, lon) => {
  return `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}`;
};

// Fetch current month + first day of next month then save and refresh ui
const fetchPrayers = async (lat, lon) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth() + 1;

  const [current, next] = await Promise.all([
    fetchData(buildApiEndpoint(year, month, lat, lon)),
    fetchData(buildApiEndpoint(nextYear, nextMonth, lat, lon)),
  ]);

  if (!current?.data) return;

  // combine current month with first day of next month for tomorrow's fajr at month end
  const allDays = next?.data?.length
    ? [...current.data, next.data[0]]
    : current.data;

  savePrayers(formatForStorage(allDays, lat, lon));

  // re-run daily setup now that we have fresh data
  dailySetup();
};

// Check if stored data is from a different month or year
const isOldData = (stored) => {
  const now = new Date();
  return stored.year !== now.getFullYear() || stored.month !== now.getMonth() + 1;
};

// Check if the user has moved (coords changed)
const isCoordsChanged = (stored, coords) => {
  return stored.lastcoords?.[0] !== coords[0] || stored.lastcoords?.[1] !== coords[1]
};

// Return true if we need to call the api again
const needsFetch = (coords) => {
  const stored = loadPrayers();
  if (!stored) return true;
  return isOldData(stored) || isCoordsChanged(stored, coords);
};

// init praeyrs logic
export const initPrayers = () => {
  const coords = loadData("location", null);
  if (!coords) return;

  dailySetup();                          // render today + schedule alarms
  setInterval(minuteUpdate, 60 * 1000); // update countdown every minute

  const [lat, lon] = coords;
  if (needsFetch(coords)) {
    fetchPrayers(lat, lon)
  };
};