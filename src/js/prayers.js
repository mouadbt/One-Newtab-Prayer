import { loadData } from "./utils.js";

// Initialize pryaers logic
export const initPrayers = () => {

        const coords = loadData('location', null);
        if (!coords) return;
    
        const [lat, lon] = coords;
    
        // Check if we need to fetch new data
        if (shouldFetchNewData()) {
            fetchPrayers(lat, lon);
        } else {
            // Use cached data
            loadBackupPrayers();
        }
}
