// Get data from Data
export const fetchData = async (endpoint) => {
    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
};

// Get the defaults data from the localstorage or the default
export const loadData = (key, defaults) => {
    const raw = localStorage.getItem(key);
    try {
        return raw ? JSON.parse(raw) : defaults;
    } catch {
        return defaults;
    }
};

// Store updated data in localstorage
export const saveData = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

// Toggles theme between light and dark mode
export const switchTheme = (isChecked) => {
    if (isChecked) {
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
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

// Toggle classname of the element
export const toggleClassName = (el, className, addOrRemove) => {
    switch (addOrRemove) {
        case 1:
            el.classList.add(className);
            break
        case -1:
            el.classList.remove(className);
            break
        default:
            el.classList.toggle(className);
            break
    }
};