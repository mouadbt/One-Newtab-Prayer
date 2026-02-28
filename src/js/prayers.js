import { fetchData, loadData, saveData } from "./utils.js";
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
const PRAYERS_STORAGE_KEY = 'prayers';

// save prayers to localstorage
const savePrayers = (data) => {
    saveData(PRAYERS_STORAGE_KEY, data);
};

// get stored prayers from localstorage
const getStoredPrayers = () => {
    return loadData(PRAYERS_STORAGE_KEY, null);
};

// initialize prayers logic
export const initPrayers = () => {
    const storedCoords = loadData('location', null);
    if (!storedCoords) return;

    const [lat, lon] = storedCoords;
    const coords = new Coordinates(lat, lon);
    const params = CalculationMethod.MuslimWorldLeague();
    const date = new Date();
    const prayerTimes = new PrayerTimes(coords, date, params);
    console.log(prayerTimes);

};
