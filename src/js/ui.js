
// Render the search engines in the page
export const renderEngines = (engines) => {
    const searchEnginesList = document.querySelector("#search-engines-list");
    const preferedEngineLabel = document.querySelector("#prefered-engine-label");
    //  Clear the container of search engines because this function is called on load and on update of the search engines selection / delegation
    searchEnginesList.innerHTML = '';
    engines.filter((el) => el.active === true).forEach((el, i) => {

        const liEL = document.createElement("li");
        const liButtonEl = document.createElement("button");
        liButtonEl.classList.add("search-engine");
        liButtonEl.textContent = el.label;
        liButtonEl.dataset.key = el.key;
        liEL.appendChild(liButtonEl);

        if (el.preferred) {
            liButtonEl.classList.add("active");
            renderPreferedEngineIcon(el.key);
            preferedEngineLabel.textContent = el.label;
        }

        searchEnginesList.appendChild(liEL);
    });
};

// Render icon of the active prefered search engine
const renderPreferedEngineIcon = (key) => {
    const iconEl = document.querySelector("#searchIcon");
    const icon = document.createElement('img');
    icon.src = `./assets/images/searchLogos/${key}.webp`;
    iconEl.innerHTML = '';
    iconEl.appendChild(icon);
};

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
};

// Render the icons in the relevant button
export const renderIcons = (icons) => {
  document.querySelectorAll('.icon-btn').forEach((btn) => {
    const svgIconContent = icons[btn.dataset.icon]?.content;
    btn.innerHTML = '';
    buildTheSvgIcon(svgIconContent, btn);
  });
};

