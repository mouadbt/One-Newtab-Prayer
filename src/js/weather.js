import { fetchData, loadData, saveData, toggleClassName } from './utils.js';

const WEATHER_STORAGE_KEY = 'weatherForecast';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Weather codes map
const WEATHER_CODES = {
    0: { desc: "Clear sky", condition: "clear" },
    1: { desc: "Mainly clear", condition: "clear" },
    2: { desc: "Partly cloudy", condition: "cloudy" },
    3: { desc: "Overcast", condition: "cloudy" },
    45: { desc: "Foggy", condition: "cloudy" },
    48: { desc: "Depositing rime fog", condition: "cloudy" },
    51: { desc: "Light drizzle", condition: "rain" },
    53: { desc: "Moderate drizzle", condition: "rain" },
    55: { desc: "Dense drizzle", condition: "rain" },
    61: { desc: "Slight rain", condition: "rain" },
    63: { desc: "Moderate rain", condition: "rain" },
    65: { desc: "Heavy rain", condition: "rain" },
    71: { desc: "Slight snow", condition: "snow" },
    73: { desc: "Moderate snow", condition: "snow" },
    75: { desc: "Heavy snow", condition: "snow" },
    77: { desc: "Snow grains", condition: "snow" },
    80: { desc: "Slight rain showers", condition: "rain" },
    81: { desc: "Moderate rain showers", condition: "rain" },
    82: { desc: "Violent rain showers", condition: "rain" },
    95: { desc: "Thunderstorm", condition: "storm" },
    96: { desc: "Thunderstorm with hail", condition: "storm" },
    99: { desc: "Thunderstorm with heavy hail", condition: "storm" }
};

// Get time of day to choose correct background image
const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 20) return "evening";
    return "night";
};

// Get weather info from weather code
const getWeatherSummary = (code) => {
    return WEATHER_CODES[Number(code)] || { desc: "Unknown", condition: "clear" };
};

// Save forecast data with timestamp
const saveWeatherData = (forecast) => {
    saveData(WEATHER_STORAGE_KEY, {
        forecast,
        lastFetched: Date.now()
    });
};

// Load stored forecast (no time check - just return what we have)
const getStoredWeatherData = () => {
    const stored = loadData(WEATHER_STORAGE_KEY, null);
    if (!stored) return null;
    return stored.forecast;
};

// Check if we should fetch new data (6+ hours since last fetch)
const shouldFetchNewData = () => {
    const stored = loadData(WEATHER_STORAGE_KEY, null);
    if (!stored) return true; // No data, need to fetch

    return Date.now() - stored.lastFetched > SIX_HOURS_MS;
};

// Update temperature element
const updateTemperature = (value) => {
    const el = document.querySelector("#weather-temp");
    if (!el || value == null) return;
    el.textContent = `${Math.round(value)}°`;
};

// Update condition element
const updateCondition = (desc) => {
    const el = document.querySelector("#weather-condition");
    if (!el) return;
    el.textContent = desc;
};

// Update humidity element
const updateHumidity = (value) => {
    const el = document.querySelector("#weather-humidity");
    if (!el || value == null) return;
    el.textContent = `${value}%`;
};

// Update wind element
const updateWind = (value) => {
    const el = document.querySelector("#weather-wind");
    if (!el || value == null) return;
    el.textContent = `${value} km/h`;
};

// Update background image
const updateWeatherBackground = (condition) => {
    const weatherEl = document.querySelector("#weather");
    if (!weatherEl) return;

    const imagePath = `./assets/images/weather/${getTimeOfDay()}_${condition}.jpeg`;
    weatherEl.style.backgroundImage = `url('${imagePath}')`;

    toggleClassName(weatherEl, 'after:bg-blue-400/5!', 'remove');
    toggleClassName(weatherEl, 'after:bg-black', 'add');
};

// Get current weather from forecast (first entry or current time)
const getCurrentWeather = (forecast) => {
    if (!forecast) return null;

    const now = new Date();
    const currentHour = now.getHours();

    // Find the closest hour in the forecast
    const timeIndex = forecast.time.findIndex(t => {
        const forecastHour = new Date(t).getHours();
        return forecastHour >= currentHour;
    });

    if (timeIndex === -1) return forecast[0];

    return {
        temperature: forecast.temperature_2m[timeIndex],
        humidity: forecast.relative_humidity_2m[timeIndex],
        wind: forecast.wind_speed_10m[timeIndex],
        code: forecast.weather_code[timeIndex]
    };
};

// Display weather data on UI
const displayWeather = (weather) => {
    if (!weather) return;

    const weatherInfo = getWeatherSummary(weather.code);

    updateTemperature(weather.temperature);
    updateCondition(weatherInfo.desc);
    updateHumidity(weather.humidity);
    updateWind(weather.wind);
    updateWeatherBackground(weatherInfo.condition);
};

// Fetch weather from API (3-day forecast, 6h intervals)
const fetchWeather = async (lat, lon) => {
    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&forecast_days=3` +
        `&timezone=auto`;

    const data = await fetchData(url);

    if (!data?.hourly) {
        loadBackupWeather();
        return;
    }

    saveWeatherData(data.hourly);
    displayWeather(getCurrentWeather(data.hourly));
};

// Load backup weather if API fails
const loadBackupWeather = () => {
    const stored = getStoredWeatherData();
    if (!stored) return;
    displayWeather(getCurrentWeather(stored));
};

// Initialize weather logic
export const initWeather = () => {
    const coords = loadData('location', null);
    if (!coords) return;

    const [lat, lon] = coords;

    // Check if we need to fetch new data
    if (shouldFetchNewData()) {
        fetchWeather(lat, lon);
    } else {
        // Use cached data
        loadBackupWeather();
    }
};