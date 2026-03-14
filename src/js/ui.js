import { toggleClassName, saveData } from "./utils.js";

// render the settings options & search engines in the settings panel
export const renderSettings = (settings, engines, icons, reciters) => {
  const settingsContainer = document.querySelector("#settings-options");

  // render settings options
  settings.forEach(option => createOptionElement(option, icons, settingsContainer));

  // render reciters section
  renderReciters(reciters, icons);
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
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const svgIconContent = icons[el.dataset.icon]?.content;
    el.innerHTML = '';
    buildTheSvgIcon(svgIconContent, el);
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

// render reciters in the reciters list
export const renderReciters = (reciters, icons) => {
  const recitersContainer = document.querySelector("#reciters-list");
  const storedReciter = localStorage.getItem('selectedReciter');
  const currentReciter = storedReciter || 'ar.husarymujawwad';

  reciters.forEach(reciter => {
    const liEl = document.createElement("li");
    const btnEl = document.createElement("button");

    const inputEl = document.createElement("input");
    inputEl.type = "radio";
    inputEl.name = "reciter";
    inputEl.id = reciter.identifier;
    inputEl.checked = reciter.identifier === currentReciter;

    const labelEl = document.createElement("label");
    labelEl.setAttribute("for", reciter.identifier);

    const checkDiv = document.createElement("div");
    toggleClassName(checkDiv, 'check', 'add');

    const iconData = icons["check"];
    if (iconData && iconData.content) {
      buildTheSvgIcon(iconData.content, checkDiv, true);
    }

    const spanEl = document.createElement("span");
    spanEl.textContent = `${reciter.englishName} - ${reciter.name}`;

    labelEl.appendChild(checkDiv);
    labelEl.appendChild(spanEl);

    btnEl.appendChild(inputEl);
    btnEl.appendChild(labelEl);
    liEl.appendChild(btnEl);

    recitersContainer.appendChild(liEl);
  });
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

// Renders the next prayer in #next-prayer: name, hours left, and minutes left
export const renderNextPrayer = (name, hours, mins) => {
  const nameEl = document.querySelector("#next-prayer-name");
  const hoursEl = document.querySelector("#next-prayer-hours");
  const minsEl = document.querySelector("#next-prayer-mins");
  nameEl.textContent = name || "---";
  hoursEl.textContent = hours;
  minsEl.textContent = mins;
}

// Renders all prayers
export const renderAllPrayers = (categorizedPrayers) => {
  const listEl = document.getElementById("prayers-list");
  listEl.innerHTML = "";

  categorizedPrayers.forEach((prayer) => {
    const li = document.createElement("li");
    li.className = prayer.type;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = prayer.name;

    const timeSpan = document.createElement("span");
    timeSpan.textContent = prayer.time;
    timeSpan.classList.add("low-opacity");

    li.appendChild(nameSpan);
    li.appendChild(timeSpan);
    listEl.appendChild(li);
  });
}

export const renderTodayhijri = (todayDateInfo) => {
  const todayHijriEl = document.querySelector("#today-hijri");
  todayHijriEl.textContent = todayDateInfo?.hijri;
}

export const renderAyah = (ayah) => {
  const ayahInfo = document.querySelector("#ayah-info");
  const ayahEL = document.querySelector("#ayah-value");
  const ayahTafsir = document.querySelector("#ayah-tafsir");

  ayahInfo.textContent = `${ayah.surah} · الآية ${ayah.number}`;
  ayahEL.textContent = `﴿${ayah.arabic}﴾`;
  ayahTafsir.textContent = `${ayah.tafsir}`;
  // el.innerHTML = `
  //   <div class="ayah-header">
  //     <h3>Today's Ayah</h3>
  //   </div>

  //   <div class="ayah-meta" dir="rtl" lang="ar">${ayah.surah} · الآية ${ayah.number}</div>

  //   <p class="ayah-arabic" dir="rtl" lang="ar">${ayah.arabic}</p>

  //   <div class="ayah-tafsir-wrap">
  //     <p class="ayah-tafsir">${ayah.tafsir}</p>
  //   </div>

  //   <div class="ayah-controls">
  //     <button class="ayah-btn" id="ayah-prev" title="Previous Ayah">
  //       ${svgPrev()}
  //     </button>

  //     <button class="ayah-btn ayah-play-btn" id="ayah-play" title="Play Recitation">
  //       ${svgPlay()}
  //     </button>

  //     <button class="ayah-btn" id="ayah-next" title="Next Ayah">
  //       ${svgNext()}
  //     </button>

  //     <button class="ayah-btn" id="ayah-copy" title="Copy Ayah">
  //       ${svgCopy()}
  //     </button>
  //   </div>

  //   <div class="ayah-copy-toast" id="ayah-copy-toast">Copied!</div>
  // `;

  // bindControls();
  // preloadAudio(currentIndex);
}

export const showPlayingAyahError = () => {
  // Create a new div element
  const toast = document.createElement('div');

  // Set Tailwind CSS classes for styling
  toast.className = 'fixed bottom-4 left-1/2 w-10/12 max-w-sm rounded-3xl p-4 text-center text-(--background100)! bg-(--foreground100)! -translate-x-[50%] z-50 text-sm! opacity-50';

  // Create a text node and append it to the toast
  const text = document.createTextNode('Error playing ayah. Check internet or change reciter. Report if persists.');
  toast.appendChild(text);

  // Append the toast to the body of the document
  document.body.appendChild(toast);

  // Remove the toast after 20 seconds
  setTimeout(() => {
    removeElement(toast);
  }, 20000);

  toast.addEventListener('click', () => {
    removeElement(toast);
  });
};

const removeElement = (el) => {
  if (el) document.body.removeChild(el);
}