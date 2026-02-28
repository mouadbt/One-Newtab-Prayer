import { toggleClassName } from "./utils.js";

// render the settings options & search engines in the settings panel
export const renderSettings = (settings, engines, icons) => {
  const settingsContainer = document.querySelector("#settings-options");

  // render settings options
  settings.forEach(option => createOptionElement(option, icons, settingsContainer));
}

// Render the search engines in the page
export const renderEngines = (engines) => {
  const searchEnginesList = document.querySelector("#search-engines-list");
  const preferedEngineLabel = document.querySelector("#prefered-engine-label");
  //  Clear the container of search engines because this function is called on load and on update of the search engines selection / delegation
  searchEnginesList.innerHTML = '';
  engines.filter((el) => el.active === true).forEach((el, i) => {

    const liEL = document.createElement("li");
    const liButtonEl = document.createElement("button");
    toggleClassName(liButtonEl, "search-engine", 'add');
    liButtonEl.textContent = el.label;
    liButtonEl.dataset.key = el.key;
    liEL.appendChild(liButtonEl);

    if (el.preferred) {
      toggleClassName(liButtonEl, 'active', 'add');
      renderPreferedEngineIcon(el.key);
      preferedEngineLabel.textContent = el.label;
    }

    searchEnginesList.appendChild(liEL);
  });
}

// Render icon of the active prefered search engine
const renderPreferedEngineIcon = (key) => {
  const iconEl = document.querySelector("#searchIcon");
  const icon = document.createElement('img');
  icon.src = `/assets/images/searchLogos/${key}.webp`;
  iconEl.innerHTML = '';
  iconEl.appendChild(icon);
}

// Embed the svg icon to the page  
export const buildTheSvgIcon = (svgIconContent, btn, withDimensions) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  if (withDimensions) {
    svg.setAttribute("width", "20px");
    svg.setAttribute("height", "20px");
  }
  svg.innerHTML += svgIconContent;
  btn.appendChild(svg);
}

// Render the icons in the relevant button
export const renderIcons = (icons) => {
  document.querySelectorAll('.icon-btn').forEach((btn) => {
    console.log(btn)
    const svgIconContent = icons[btn.dataset.icon]?.content;
    btn.innerHTML = '';
    buildTheSvgIcon(svgIconContent, btn);
  });
}

// helper to create & append a single option
const createOptionElement = (option, icons, container) => {

  const liEl = document.createElement("li");
  const btnEl = document.createElement("button");

  const inputEl = document.createElement("input");
  inputEl.type = "checkbox";
  inputEl.id = option.key;
  inputEl.checked = option.active;

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", option.key);

  const checkDiv = document.createElement("div");
  toggleClassName(checkDiv, 'check', 'add');

  const iconData = icons["check"];
  if (iconData && iconData.content) {
    buildTheSvgIcon(iconData.content, checkDiv, true);
  }

  const spanEl = document.createElement("span");
  spanEl.textContent = option.label;

  labelEl.appendChild(checkDiv);
  labelEl.appendChild(spanEl);

  btnEl.appendChild(inputEl);
  btnEl.appendChild(labelEl);
  liEl.appendChild(btnEl);

  container.appendChild(liEl);
}

// Render TodoLists in page
export const renderTask = (task, svgIconContent) => {
  const taskCollection = document.querySelector("#task-collection");
  const taskDiv = document.createElement('div');
  toggleClassName(taskDiv, 'task-entry', 'add');
  taskDiv.dataset.id = task.id;

  const inputEl = document.createElement('input');
  inputEl.type = 'checkbox';
  inputEl.className = 'task-toggle-box';
  inputEl.id = task.id;
  if (task.done) inputEl.checked = true;

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', task.id);
  labelEl.className = 'task-text-label';
  labelEl.title = 'Click to set done or undo it';
  labelEl.textContent = task.text;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'task-remove-action';
  removeBtn.dataset.icon = 'close';
  removeBtn.dataset.remove = task.id;
  removeBtn.title = 'Click to remove task';
  removeBtn.tabIndex = -1;
  console.log(svgIconContent)
  if (svgIconContent) {
    buildTheSvgIcon(svgIconContent, removeBtn);
  } else {
    removeBtn.textContent = '×';
  }

  taskDiv.appendChild(inputEl);
  taskDiv.appendChild(labelEl);
  taskDiv.appendChild(removeBtn);

  taskCollection.appendChild(taskDiv);
  return true;
}