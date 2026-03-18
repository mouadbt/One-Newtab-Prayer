import { initPrayers } from './prayers.js';
import { saveData, fetchData, loadData } from './utils.js';
import { initWeather } from './weather.js';
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Marker Icons (markers disappear in production builds so this is fix that)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


// Load the map and show the user's location on the map and let the user update it
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

let mapInstance = null;

const handleMap = (coords) => {

    // If map already exists, remove it cleanly
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Create map and store it globally
    mapInstance = L.map("map").setView(coords, 6);

    const darkLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; OpenStreetMap & Carto" }
    );

    const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/arcgis/rest/services/world_imagery/mapserver/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri" }
    );

    const layer = loadData('mapLayer', null);

    layer === 'satellite'
        ? satelliteLayer.addTo(mapInstance)
        : darkLayer.addTo(mapInstance);

    L.control.layers(
        { "Dark Map": darkLayer, Satellite: satelliteLayer }
    ).addTo(mapInstance);

    mapInstance.on('baselayerchange', (e) => {
        saveData('mapLayer', e.name === 'Satellite' ? 'satellite' : 'dark');
    });

    let marker = L.marker(coords).addTo(mapInstance);

    mapInstance.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        saveData("location", [lat, lng]);
        initPrayers();
        initWeather();
    });
};

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
    handleMap(coords);

    // Initialize weather logic
    initWeather();

    // Initialize prayers logic
    initPrayers();
}