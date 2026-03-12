import { performSearch } from './search.js';
import { toggleClassName } from './utils.js';
import { saveData } from './utils.js';
import { renderEngines } from './ui.js';
import { handleSettingChange } from './settings.js';
import { handleAddNewTask } from './todo.js';
import { navigateBetweenVerses } from './ayah.js';

export const setupGlobalListeners = (engines, settings) => {
    const searchEnginesListTrigger = document.querySelector('#search-engines-list-trigger');
    const searchEnginesList = document.querySelector('#search-engines-list');
    const searchInput = document.querySelector("#search-input");
    const searchContainer = document.querySelector("#search-container");
    const searchBtn = document.querySelector("#search-btn");
    const focusedSearchContainerClassName = 'active-search-container';
    const suggestionsList = document.querySelector("#suggestions-list");
    const settingsOpenBtn = document.querySelector("#settings-trigger");
    const settingsPanel = document.querySelector("#settings-panel");
    const settingsOverlay = document.querySelector("#settings-overlay");
    const settingsCloseBtn = document.querySelector("#settings-close-btn");
    const ayahControlesContainer = document.querySelector("#cover-container");
    const settingsPanelTriggers = [
        {
            el: settingsOpenBtn,
            condition: false
        },
        {
            el: settingsOverlay,
            condition: true
        },
        {
            el: settingsCloseBtn,
            condition: true
        },
    ];
    const newTaskInput = document.querySelector("#nexusTaskNewInput");

    /*
        Toggle search engines list's appearence
        and handle focus
    */
    searchEnginesListTrigger.addEventListener('click', () => {
        handleEnginesListAppearence(searchEnginesList, searchEnginesListTrigger);
    });

    /*
        Search engine selection / delegation
    */
    searchEnginesList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            handleEngineSelect(btn.dataset.key, engines, searchEnginesList, searchInput);
        }
    });

    /*
        handle keyboard events
    */
    document.addEventListener('keydown', (e) => {
        // Close settings panel
        if (e.key === 'Escape') {
            toggleClassName(searchEnginesList, 'hidden', 'add');
            toggleClassName(searchContainer, focusedSearchContainerClassName, 'remove');
            togglesettingsPanel(settingsPanel, settingsOverlay, settingsOpenBtn, true);
        }

        // Focus on the search input
        if (e.key === '/' && document.activeElement.id !== "search-input") {
            e.preventDefault();
            searchInput.focus();
        }

        // perform search
        if (e.key === 'Enter' && e.target === searchInput) {
            const query = e.target.value.trim().toLowerCase();
            performSearch(query, engines);
        }

        // Add new task
        if (e.key === 'Enter' && e.target === newTaskInput) {
            handleAddNewTask(newTaskInput);
        }
    });

    /*
        when start typing set the search container as the main primary widget
    */
    searchInput.addEventListener('input', () => {
        handleSearchContainerFocusing(searchContainer, focusedSearchContainerClassName, searchInput);
    });

    /*
        Close any overlay or focused element when clicking outside
    */
    document.addEventListener('click', (e) => {
        // Close Search Engine list
        if (!searchEnginesList.contains(e.target) && !searchEnginesListTrigger.contains(e.target) && !searchEnginesList.classList.contains("hidden")) {
            toggleClassName(searchEnginesList, 'hidden', 'add');
        }
        // unset focusing of search container 
        if (!searchContainer.contains(e.target) && !searchEnginesList.classList.contains(focusedSearchContainerClassName)) {
            toggleClassName(searchContainer, focusedSearchContainerClassName, 'remove');
        }
    });

    // perform search when the search button is clicked
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        performSearch(query, engines);
    });

    // show loading icon in the clicked search suggestion
    suggestionsList.addEventListener("click", (e) => {
        const link = e.target.closest(".suggestion-link");
        if (!link) return;
        toggleClassName(link, 'loading', 'add');
    });

    // Handle setttings panel appearing
    settingsPanelTriggers.forEach((trigger) => {
        trigger.el.addEventListener('click', () => {
            togglesettingsPanel(settingsPanel, settingsOverlay, settingsOpenBtn, trigger.condition);
        });
    });

    // settings and search engines change handlers
    const delegatedSettings = [
        {
            container: "#settings-options",
            callback: handleSettingChange,
            store: settings
        }
    ];

    // attach listeners to each container
    delegatedSettings.forEach(({ container, callback, store }) => {
        const el = document.querySelector(container);
        if (!el) return;
        el.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT') {
                callback(e.target.id, e.target.checked, store);
            }
        });
        el.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const input = e.target.querySelector('input');
                input.checked = !input.checked;
                callback(input.id, input.checked, store);
            }
        });
    });

    // Move to  next Ayah
    ayahControlesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest("[data-ayah-action]");
        if (!btn) return;
        const action = btn.dataset.ayahAction
        navigateBetweenVerses(action);
    });
}

const togglesettingsPanel = (settingsPanel, settingsOverlay, settingsOpenBtn, condition) => {
    document.body.classList.toggle('overflow-hidden', condition);
    settingsPanel.classList.toggle('translate-x-full', condition);
    settingsOverlay.classList.toggle('hidden', condition);
    const settingsBtns = settingsPanel.querySelectorAll('button');
    settingsBtns.forEach((btn) => {
        if (condition) {
            btn.setAttribute("tabindex", "-1");
            settingsOpenBtn.focus();
        } else {
            settingsBtns[0].focus();
            btn.removeAttribute("tabindex");
        }
    });
}

const handleEnginesListAppearence = (searchEnginesList, searchEnginesListTrigger) => {

    // show or hide the search engines lists
    toggleClassName(searchEnginesList, 'hidden', 'toggle');

    // focus on the first searach engine element when list is displayed or on the trigger if it hidden 
    if (!searchEnginesList.classList.contains('hidden')) {
        const firstSearchEngineEl = searchEnginesList.querySelector('button');
        if (!firstSearchEngineEl) {
            return
        }
        firstSearchEngineEl.focus();
    } else {
        searchEnginesListTrigger.focus();
    }

}

const handleSearchContainerFocusing = (searchContainer, focusedSearchContainerClassName, searchInput) => {
    toggleClassName(searchContainer, focusedSearchContainerClassName, 'add');

    // set a border radius to the container when there is no value in the input and with no value there is no suggestions there for there is no need to remove border radius
    const value = searchInput.value.trim();
    if (value) {
        toggleClassName(searchContainer, 'with-suggestions', 'add');
    } else {
        toggleClassName(searchContainer, 'with-suggestions', 'remove');
    }
}

//  Update the search engines list to set the selected engine as pref erred and ensure it's active
const handleEngineSelect = (key, engines, parent, input) => {
    // Find the engine that was clicked
    const clickedEngine = engines.find(e => e.key === key);

    // If the clicked engine is not active (not checked in settings), make it active
    if (clickedEngine && !clickedEngine.active) {
        clickedEngine.active = true;
    }

    // Set the clicked engine as preferred (active in the UI)
    const updated = engines.map(e => ({
        ...e,
        preferred: e.key === key,
        active: e.key === key ? true : e.active
    }));
    saveData('searchEngines', updated);
    renderEngines(updated);

    // hide the list and focus again on the triger
    toggleClassName(parent, 'hidden', 'add');
    input.focus();
}
