import { renderAllPrayers, renderNextPrayer } from "./ui.js";
import { fetchData, loadData, saveData } from "./utils.js";
const PRAYERS_STORAGE_KEY = "prayers";

// Save forecast data with timestamp 
const savePrayersData = (prayersData) => { saveData(PRAYERS_STORAGE_KEY, prayersData); }

// format the data that we gonna store to only what we need 
const extractSotredData = (apidata, [lat, lon]) => {
    const allowed = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const extractedData = apidata.map(day => ({
        date: day.date.readable,
        timestamp: day.date.timestamp,
        hijri: `${day.date.hijri.day} - ${day.date.hijri.month.ar} / ${day.date.hijri.month.en} - ${day.date.hijri.year}`, timings: allowed.map(prayer => ({
            name: prayer,
            time: day.timings?.[prayer] || ""
        }))
    }));
    const storedData = { lastcoords: [lat, lon], year: new Date().getFullYear(), month: new Date().getMonth() + 1, lastFetched: Date.now(), prayers: extractedData }
    return storedData;
}

const displayPrayers = () => {
    // Get the data from localstorage 
    const storedPrayers = loadData(PRAYERS_STORAGE_KEY, null); if (!storedPrayers) return; const prayers = storedPrayers.prayers;
    // Get current time in seconds becasue api timestamp is in seconds not milliseconds 
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // check if our now is between the start of the day and the end using the api timestamp to get the day 
    const todayIndex = prayers.findIndex(p => {
        const start = Number(p.timestamp); const end = start + 86400;
        // 86400 seconds = 24 hours 
        return nowInSeconds >= start && nowInSeconds < end;
    });
    if (todayIndex === -1) return null;
    const todayPrayers = prayers[todayIndex];
    const tomorrowPrayers = prayers[todayIndex + 1] || null;
    const allPrayers = [...todayPrayers.timings];
    // Add tommorow's Fajr 
    if (tomorrowPrayers) allPrayers.push(...[tomorrowPrayers.timings[0]]);
    const categorizedPrayers = groupPrayers(allPrayers);
    renderNextPrayer(categorizedPrayers);
    renderAllPrayers(categorizedPrayers);
}

const groupPrayers = (todayPrayers) => {
    let nextPrayerDetected = false; let prayerType = 'passed'; const now = new Date().getTime(); const prayersTimes = todayPrayers.map((prayer, index) => {
        const prayerTime = prayer.time.split(' ')[0]; const prayerHour = prayerTime.split(':')[0]; const prayerMin = prayerTime.split(':')[1]; let prayerTimestamp = new Date().setHours(Number(prayerHour), Number(prayerMin));
        // Last prayer in list is tomorrow's Fajr - add 24h if it's in the past
        if (index === todayPrayers.length - 1 && prayerTimestamp < now) {
            prayerTimestamp += 24 * 60 * 60 * 1000;
        }
        if (now < prayerTimestamp) {
            // The prayer is upcoming
            if (nextPrayerDetected) {
                prayerType = 'upcoming';
            } else {
                prayerType = 'next';
                nextPrayerDetected = true;
            }
        } else {
            prayerType = 'passed';
        }
        return { 'name': prayer.name, 'timestamp': prayerTimestamp, 'time': prayerTime, 'hour': prayerHour, 'min': prayerMin, 'type': prayerType }
    }); return prayersTimes;
}

const loadStoredPrayers = () => {
    // // Get the data from localstorage 
    const storedPrayers = loadData(PRAYERS_STORAGE_KEY, null);
    // // Render the data in the page // 
    displayPrayers(storedPrayers.prayers);
}

// Fetch prayers from API (entire month + first day of next month) 
export const fetchPrayers = async (lat, lon) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Current month data
    const currentMonthUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}`;

    // First day of next month (handle December → January)
    const nextMonthDate = new Date(year, now.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth() + 1;
    const nextMonthUrl = `https://api.aladhan.com/v1/calendar/${nextYear}/${nextMonth}?latitude=${lat}&longitude=${lon}`;

    const [currentData, nextMonthData] = await Promise.all([
        fetchData(currentMonthUrl),
        fetchData(nextMonthUrl)
    ]);

    if (!currentData?.data) { return; }

    // Combine current month with first day of next month (if available)
    let allDays = currentData.data;
    if (nextMonthData?.data?.length) {
        allDays = [...allDays, nextMonthData.data[0]];
    }

    const monthPrayers = extractSotredData(allDays, [lat, lon]);
    savePrayersData(monthPrayers);
    displayPrayers(monthPrayers.prayers);
}

// Check if we should fetch new data (1 month since last fetch) 
const shouldFetchNewData = (coords) => {
    const stored = loadData(PRAYERS_STORAGE_KEY, null);
    if (!stored) return true;
    const [lat, lon] = coords; return stored.year !== new Date().getFullYear() || stored.month !== (new Date().getMonth() + 1) || stored.lastcoords?.[0] !== lat || stored.lastcoords?.[1] !== lon;
}

// Initialize pryaers logic 
export const initPrayers = () => {
    const coords = loadData('location', null);
    if (!coords) return;
    displayPrayers(); const [lat, lon] = coords;
    if (shouldFetchNewData(coords)) { fetchPrayers(lat, lon); }
    else {
        loadStoredPrayers();
    }
}

setInterval(displayPrayers, 1000 * 60); // every minute call the function to update the ui