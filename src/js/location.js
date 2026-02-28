import { initPrayers } from './prayers.js';
import { saveData, fetchData, loadData } from './utils.js';
import { initWeather } from './weather.js';

// Load the map and show the user's location on the map and let the user update it
// Load the map and show the user's location on the map and let the user update it
export const handleMap = (coords) => {

    // Initialize the map and set the initial view using the provided coordinates
    const map = L.map("map").setView(coords, 6);

    // Create the dark theme tile layer
    const darkLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
            attribution: "&copy; OpenStreetMap & Carto",
        }
    );

    // Create the satellite tile layer
    const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles &copy; Esri",
        }
    );

    // Load the previously saved map layer preference from localStorage
    const layer = loadData('mapLayer', null);

    // Add the saved layer if it is satellite, otherwise default to dark layer
    layer === 'satellite' ? satelliteLayer.addTo(map) : darkLayer.addTo(map);

    // Add layer switch control to allow the user to change between map styles
    L.control
        .layers({
            "Dark Map": darkLayer,
            Satellite: satelliteLayer,
        })
        .addTo(map);

    // Listen for base layer changes and save the selected layer to localStorage
    map.on('baselayerchange', (e) => {
        if (e.name === 'Satellite') {
            saveData('mapLayer', 'satellite');
        } else {
            saveData('mapLayer', 'dark');
        }
    });

    // Create a marker at the initial coordinates
    let marker = L.marker(coords).addTo(map);

    // Update marker position and save new location when user clicks on the map
    map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        marker.setLatLng([lat, lng]);
        saveData("location", [lat, lng]);
    });
}

// Get the user's IP address
const getUserIpAddress = async () => {
    const ipData = await fetchData('https://api.ipify.org?format=json');
    return ipData;
}

// Function that gets the location details from an IP address
const getUserCoordinatesFromIp = async (ip) => {
    const coordsData = await fetchData(`https://api.techniknews.net/ipgeo/${ip}`);
    return coordsData;
}

const getCoords = async () => {
    const coordsData = await fetchData(`https://ipwho.is/?format=json`);
    return coordsData;
}

export const handleUserLocation = async () => {

    // Get the coords from localStorage
    let coords = loadData('location', null);

    // There isn't any location store , we get it using api calls
    if (!coords) {

        // Get the IP address of the user
        const ipData = await getUserIpAddress();

        // If there is an IP then get the user's coordinates
        if (ipData && ipData.ip) {

            const location = await getUserCoordinatesFromIp(ipData.ip);

            if (location && location.lat && location.lon) {
                coords = [location.lat, location.lon];
            }
        }

        // First attempt faild using first api try the other api
        if (!coords) {

            // get the coords from api
            const lat_Lon_Obj = await getCoords();
            if (lat_Lon_Obj && lat_Lon_Obj.latitude && lat_Lon_Obj.longitude) {
                coords = [lat_Lon_Obj.latitude, lat_Lon_Obj.longitude];
            }
        }

        // If coords are still not defined, fallback to Cairo coords
        if (!coords) {
            coords = [30.0444, 31.2357];
        }

        // Save the coords of the user to localStorage
        saveData('location', coords);
    }

    // Call the map handling function
    // handleMap(coords);

    // Initialize weather logic
    initWeather(coords);

    // Initialize weather logic
    initPrayers();
}