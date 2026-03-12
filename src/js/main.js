import { fetchData, loadData } from "./utils.js";
import { renderEngines, renderIcons } from "./ui.js";
import { applyAllSettings } from "./settings.js";
import { setupGlobalListeners } from "./events.js";
import { initSuggestionsLogic } from "./suggestions.js";
import { renderSettings } from "./ui.js";
import { handleUserLocation } from "./location.js";
import { initTasks } from "./todo.js";
import { initClock } from "./time.js";
import "../css/style.css";
import { initAyah } from "./ayah.js";
const init = async () => {
  // get the default data
  const DEFAULTS = await fetchData("./assets/data/defaults.json");

  // Load icons from json file
  const icons = await fetchData("./assets/data/icons.json");

  // Get the search engines from localstorage or default const
  const engines = loadData("searchEngines", DEFAULTS.searchEngines);

  // Get the settings from localstorage or default const
  const settings = loadData("settingsOptions", DEFAULTS.settingsOptions);
  const renderedSettings = settings.filter((el) => {
    return el.regular == true;
  });

  // Render the icons in the page
  renderIcons(icons);

  // Render the search engines in the page
  renderEngines(engines);

  //  Render the settings in the page
  renderSettings(renderedSettings, engines, icons);

  // Apply settings to the page element
  applyAllSettings(settings);

  // handle page actions
  setupGlobalListeners(engines, settings);

  // Initialize suggestions logic
  initSuggestionsLogic();

  // Initialize tasks logic
  initTasks(icons);

  // load map and handle updating location from map
  handleUserLocation();

  // Initialize clock logic
  initClock();

  // Remove hidden class from settings panel afetr 500ms
  setTimeout(() => {
    document.querySelector("#settings-panel").classList.remove("hidden");
  }, 500);

  // Initialize ayah logic
  initAyah();

};

// load and execute and start script after page fully load
document.addEventListener("DOMContentLoaded", init);
