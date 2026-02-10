import { saveData } from './utils.js';

// apply the settings to the page and behavior
export const applySystemSetting = (key, isActive) => {
    switch (key) {
        case 'focusOnLoad':
            isActive && focusOnSearchInput(document.querySelector("#search-input"));
            break;

        default:
            // no-op
            break;
    }
};

// Apply the settings to the page on load and on settings change
export const applyAllSettings = (settings) => {
    settings.forEach(s => applySystemSetting(s.key, s.active));
};

// update the new settings applied by user in the localstorage and in the page 
export const handleSettingChange = (key, isActive, settings) => {
    console.log(key);
    const option = settings.find(s => s.key === key);
    if (option) {
        option.active = isActive;
        saveData('settingsOptions', settings);
        applySystemSetting(key, isActive);
    }
};

// Focus the cursor on the search input and override the browser's default behavior of focusing the address bar
export const focusOnSearchInput = (inputEl) => {
    inputEl.focus();
    if (location.search !== "?focus") {
        location.search = "?focus";
        throw new Error("Redirecting to focus mode");
    }
};