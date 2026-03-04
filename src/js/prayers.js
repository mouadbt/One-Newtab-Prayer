import { renderAllPrayers, renderNextPrayer } from "./ui.js";
import { fetchData, loadData, saveData } from "./utils.js";
import {
  showNextPrayerNotification,
  showCurrentPrayerNotification,
} from "./notifications.js";

const PRAYERS_STORAGE_KEY = "prayers";
const ALLOWED_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Save forecast data with timestamp
const savePrayersData = (prayersData) => {
  saveData(PRAYERS_STORAGE_KEY, prayersData);
};

// helpers for formatting stored prayers data
// format the hijri date string from api object
const formatHijriDate = (date) => {
  return `${date.hijri.day} - ${date.hijri.month.ar} / ${date.hijri.month.en} - ${date.hijri.year}`;
};

// build the timings array for allowed prayers
const extractDayTimings = (day) => {
  return ALLOWED_PRAYERS.map((prayer) => ({
    name: prayer,
    time: day.timings?.[prayer] || "",
  }));
};

// build the stored prayers meta object
const buildStoredPrayersData = (extractedData, lat, lon) => {
  return {
    lastcoords: [lat, lon],
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    lastFetched: Date.now(),
    prayers: extractedData,
  };
};

// format the data that we gonna store to only what we need
const extractSotredData = (apidata, [lat, lon]) => {
  const extractedData = apidata.map((day) => ({
    date: day.date.readable,
    timestamp: day.date.timestamp,
    hijri: formatHijriDate(day.date),
    timings: extractDayTimings(day),
  }));

  return buildStoredPrayersData(extractedData, lat, lon);
};

// get the prayers array from localstorage
const getPrayersFromStorage = () => {
  const storedPrayers = loadData(PRAYERS_STORAGE_KEY, null);
  if (!storedPrayers) return null;
  return storedPrayers.prayers;
};

// get current timestamp in seconds
const getNowInSeconds = () => {
  // Get current time in seconds becasue api timestamp is in seconds not milliseconds
  return Math.floor(Date.now() / 1000);
};

// find index of today in stored prayers list
const findTodayIndex = (prayers, nowInSeconds) => {
  // check if our now is between the start of the day and the end using the api timestamp to get the day
  return prayers.findIndex((p) => {
    const start = Number(p.timestamp);
    const end = start + 86400;
    // 86400 seconds = 24 hours
    return nowInSeconds >= start && nowInSeconds < end;
  });
};

// get today prayers and tomorrow prayers objects
const getTodayAndTomorrowPrayers = (prayers, todayIndex) => {
  const todayPrayers = prayers[todayIndex];
  const tomorrowPrayers = prayers[todayIndex + 1] || null;
  return { todayPrayers, tomorrowPrayers };
};

// build all prayers list including tomorrow fajr
const getAllPrayersWithTomorrowFajr = (todayPrayers, tomorrowPrayers) => {
  const allPrayers = [...todayPrayers.timings];
  // Add tommorow's Fajr
  if (tomorrowPrayers) {
    allPrayers.push(tomorrowPrayers.timings[0]);
  }
  return allPrayers;
};

// get time left for a given timestamp
export const getTimeLeft = (timestamp) => {
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return { hours: null, mins: null };

  const MS_PER_MINUTE = 1000 * 60;
  const MS_PER_HOUR = MS_PER_MINUTE * 60;

  const hours = Math.floor(diff / MS_PER_HOUR);
  const mins = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  return { hours, mins };
};

// display current prayers in ui
const displayPrayers = () => {
  const prayers = getPrayersFromStorage();
  if (!prayers) return;

  const nowInSeconds = getNowInSeconds();
  const todayIndex = findTodayIndex(prayers, nowInSeconds);
  if (todayIndex === -1) return null;

  const { todayPrayers, tomorrowPrayers } = getTodayAndTomorrowPrayers(
    prayers,
    todayIndex
  );
  const allPrayers = getAllPrayersWithTomorrowFajr(
    todayPrayers,
    tomorrowPrayers
  );

  const categorizedPrayers = groupPrayers(allPrayers);

  const nextPrayer = categorizedPrayers.find((p) => p.type === "next");
  renderAllPrayers(categorizedPrayers);
  
  if (!nextPrayer) return;

  const { hours, mins } = getTimeLeft(nextPrayer.timestamp);

  renderNextPrayer(nextPrayer.name, hours, mins);

  // show notification if next prayer is in less than 5 minutes
  if (hours === 0 && mins < 5) {
    showNextPrayerNotification(mins, nextPrayer.name);
  }

  // show notification if next prayer time is here
  if (hours === 0 && mins === 0) {
    showCurrentPrayerNotification(nextPrayer.name);
  }
};

// split time string to hour and min
const splitPrayerTime = (time) => {
  const prayerTime = time.split(" ")[0];
  const [prayerHour, prayerMin] = prayerTime.split(":");
  return { prayerTime, prayerHour, prayerMin };
};

// create date timestamp from hour and min
const createPrayerTimestamp = (prayerHour, prayerMin) => {
  return new Date().setHours(Number(prayerHour), Number(prayerMin));
};

// adjust timestamp for last prayer (tomorrow fajr)
const adjustLastPrayerTimestamp = (timestamp, index, totalPrayers, now) => {
  // Last prayer in list is tomorrow's Fajr - add 24h if it's in the past
  if (index === totalPrayers - 1 && timestamp < now) {
    return timestamp + 24 * 60 * 60 * 1000;
  }
  return timestamp;
};

// decide if prayer is passed, next or upcoming
const getPrayerType = (now, prayerTimestamp, nextPrayerDetected, currentType) => {
  let prayerType = currentType;
  let hasDetectedNext = nextPrayerDetected;

  if (now < prayerTimestamp) {
    // The prayer is upcoming
    if (hasDetectedNext) {
      prayerType = "upcoming";
    } else {
      prayerType = "next";
      hasDetectedNext = true;
    }
  } else {
    prayerType = "passed";
  }

  return { prayerType, nextPrayerDetected: hasDetectedNext };
};

// group today prayers with type and timestamps
const groupPrayers = (todayPrayers) => {
  let nextPrayerDetected = false;
  let prayerType = "passed";
  const now = new Date().getTime();

  const prayersTimes = todayPrayers.map((prayer, index) => {
    const { prayerTime, prayerHour, prayerMin } = splitPrayerTime(prayer.time);

    let prayerTimestamp = createPrayerTimestamp(prayerHour, prayerMin);
    prayerTimestamp = adjustLastPrayerTimestamp(
      prayerTimestamp,
      index,
      todayPrayers.length,
      now
    );

    const typeInfo = getPrayerType(
      now,
      prayerTimestamp,
      nextPrayerDetected,
      prayerType
    );

    prayerType = typeInfo.prayerType;
    nextPrayerDetected = typeInfo.nextPrayerDetected;

    return {
      name: prayer.name,
      timestamp: prayerTimestamp,
      time: prayerTime,
      hour: prayerHour,
      min: prayerMin,
      type: prayerType,
    };
  });

  return prayersTimes;
};

// load stored prayers and render them
const loadStoredPrayers = () => {
  // Render the data in the page
  displayPrayers();
};

// helpers for fetching prayers
// build api url for calendar endpoint
const buildCalendarUrl = (year, month, lat, lon) => {
  return `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}`;
};

// get current date info (year, month)
const getCurrentDateInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return { now, year, month };
};

// get next month year and month
const getNextMonthInfo = (now) => {
  // First day of next month (handle December → January)
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth() + 1;
  return { nextYear, nextMonth };
};

// merge current month data with first day of next month
const combineMonthData = (currentData, nextMonthData) => {
  // Combine current month with first day of next month (if available)
  let allDays = currentData.data;
  if (nextMonthData?.data?.length) {
    allDays = [...allDays, nextMonthData.data[0]];
  }
  return allDays;
};

// Fetch prayers from API (entire month + first day of next month)
export const fetchPrayers = async (lat, lon) => {
  const { now, year, month } = getCurrentDateInfo();

  // Current month data
  const currentMonthUrl = buildCalendarUrl(year, month, lat, lon);

  const { nextYear, nextMonth } = getNextMonthInfo(now);
  const nextMonthUrl = buildCalendarUrl(nextYear, nextMonth, lat, lon);

  const [currentData, nextMonthData] = await Promise.all([
    fetchData(currentMonthUrl),
    fetchData(nextMonthUrl),
  ]);

  if (!currentData?.data) {
    return;
  }

  const allDays = combineMonthData(currentData, nextMonthData);

  const monthPrayers = extractSotredData(allDays, [lat, lon]);
  savePrayersData(monthPrayers);
  displayPrayers();
};

// helpers for checking if we should fetch new data
// check if stored prayers are from different month or year
const isDifferentYearOrMonth = (stored) => {
  const now = new Date();
  return (
    stored.year !== now.getFullYear() ||
    stored.month !== now.getMonth() + 1
  );
};

// check if saved coords are different from current
const hasCoordsChanged = (stored, coords) => {
  const [lat, lon] = coords;
  return (
    stored.lastcoords?.[0] !== lat || stored.lastcoords?.[1] !== lon
  );
};

// Check if we should fetch new data (1 month since last fetch)
const shouldFetchNewData = (coords) => {
  const stored = loadData(PRAYERS_STORAGE_KEY, null);
  if (!stored) return true;
  return isDifferentYearOrMonth(stored) || hasCoordsChanged(stored, coords);
};

// Initialize prayers logic
export const initPrayers = () => {
  const coords = loadData("location", null);
  if (!coords) return;

  displayPrayers();

  const [lat, lon] = coords;
  if (shouldFetchNewData(coords)) {
    fetchPrayers(lat, lon);
  } else {
    loadStoredPrayers();
  }
};

// every minute call the function to update the ui
setInterval(displayPrayers, 1000 * 60);