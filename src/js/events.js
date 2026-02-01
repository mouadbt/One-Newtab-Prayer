import { handleEngineSelect } from './settings.js';
import { toggleClassName } from './utils.js';

export const setupGlobalListeners = (engines, settings) => {
    const searchEnginesListTrigger = document.querySelector('#search-engines-list-trigger');
    const searchEnginesList = document.querySelector('#search-engines-list');
    const searchInput = document.querySelector("#search-input");
    const searchContainer = document.querySelector("#search-container");
    const searchBtn = document.querySelector("#search-btn");
    const focusedSearchContainerClassName = 'active-search-container';
    const suggestionsList = document.querySelector("#suggestions-list");

    /*
        Toggle search engines list's appearence
        and handle focus
    */
    searchEnginesListTrigger.addEventListener('click', () => {
        // show or hide the search engines lists
        toggleClassName(searchEnginesList, 'hidden', 0);

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
    });

    /*
        Search engine selection / delegation
    */
    searchEnginesList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            handleEngineSelect(btn.dataset.key, engines, searchEnginesList, searchInput);
        };
    });

    /*
        handle keyboard events
    */
    document.addEventListener('keydown', (e) => {
        // Close settings panel
        if (e.key === 'Escape') {
            toggleClassName(searchEnginesList, 'hidden', 1);
            toggleClassName(searchContainer, focusedSearchContainerClassName, -1);
        };

        // Focus on the search input
        if (e.key === '/' && document.activeElement.id !== "search-input") {
            e.preventDefault();
            searchInput.focus();
        };

        // perform search
        if (e.key === 'Enter' && e.target === searchInput) {
            const query = e.target.value.trim().toLowerCase();
            performSearch(query, engines);
        };
    });

    /*
        when start typing set the search container as the main primary widget
    */
    searchInput.addEventListener('input', () => {
        toggleClassName(searchContainer, focusedSearchContainerClassName, 1);
        
        // set a border radius to the container when there is no value in the input and with no value there is no suggestions there for there is no need to remove border radius
        const value = searchInput.value.trim();
        if (!value) {
            toggleClassName(searchContainer, 'no-suggestioons', 1);
        } else {
            toggleClassName(searchContainer, 'no-suggestioons', -1);
        }
    });

    /*
        Close any overlay or focused element when clicking outside
    */
    document.addEventListener('click', (e) => {
        // Close Search Engine list
        if (!searchEnginesList.contains(e.target) && !searchEnginesListTrigger.contains(e.target) && !searchEnginesList.classList.contains("hidden")) {
            toggleClassName(searchEnginesList, 'hidden', 1);
        }
        // unset search container
        if (!searchContainer.contains(e.target) && !searchEnginesList.classList.contains(focusedSearchContainerClassName)) {
            toggleClassName(searchContainer, focusedSearchContainerClassName, -1);
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
        link.classList.add("loading"); // show loading icon
    });
};
