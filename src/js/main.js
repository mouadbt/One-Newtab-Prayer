// import { initLogic } from "./suggestions.js";
import { fetchData, loadData } from "./utils.js";
import { renderEngines, renderIcons } from "./ui.js";
// import { applyAllSettings } from "./settings.js";
import { setupGlobalListeners } from "./events.js";
import { initSuggestionsLogic } from "./suggestions.js";
// import { renderTasks } from './ui.js';

const init = async () => {
  // get the default data
  const DEFAULTS = await fetchData("./assets/data/defaults.json");

  // Load icons from json file
  const icons = await fetchData("./assets/data/icons.json");

  // Get the search engines from localstorage or default const
  const engines = loadData("searchEngines", DEFAULTS.searchEngines);

  // // Get the settings from localstorage or default const
  // const settings = loadData("settingsOptions", DEFAULTS.settingsOptions);
  // const renderedSettings = settings.filter((el) => { return el.regular == true });

  // // get the Todo Items
  // const todoItems = loadData('tasks', []);

  // Render the icons in the page
  renderIcons(icons);

  //  Render the search engines in the page
  renderEngines(engines);

  // // Apply settings to the page element
  // applyAllSettings(settings);

  // handle page actions
  setupGlobalListeners(engines);

  // Initialize suggestions logic
    initSuggestionsLogic();

  // // Render TodoItems
  // renderTasks(todoItems);
};

// load and execute and start script after page fully load
document.addEventListener("DOMContentLoaded", () => {
  init();
});
