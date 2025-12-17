/* ============================
   CONFIG
============================ */
const CSV_URL = "PEGA_AQUI_TU_URL_DEL_CSV";

/* ============================
   ELEMENTS
============================ */
const tipoSelect = document.getElementById("tipoSelect");
const colorSelect = document.getElementById("colorSelect");
const marcaSelect = document.getElementById("marcaSelect");

const results = document.getElementById("results");
const selectedCard = document.getElementById("selectedCard");
const alternativeCards = document.getElementById("alternativeCards");

/* ============================
   DATA
============================ */
let data = [];

/* ============================
   INIT
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    data = parseCSV(text);
    populateFilters();
  });

/* ============================
   CSV PARSER
============================ */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
    return obj;
  });
}

/* ============================
   FILTERS
============================ */
function populateFilters() {
  fillSelect(tipoSelect, [...new Set(data.map(d => d.Tipo))]);
  fillSelect(colorSelect, [...new Set(data.map(d => d["Color Base"]))]);
  fillSelect(marcaSelect, [...new Set(data.map(d => d.Marca))]);
}

function fillSelect(select, values) {
  values.sort().forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  });
}

/* ============================
   EVENTS
============================ */
[tipoSelect, colorSelect, marcaSelect].forEach(sel =>
  sel.addEventListener("change", applyFilters)
);

/* ============================
   LOGIC
============================ */
function allFiltersSelected() {
  return tipoSelect.value && colorSelect.value && marcaSelect.value;
}

function applyFilters() {
  if (!allFiltersSelected()) {
    results.classList.add("hidden");
    return;
  }

  results.classList.remove("hidden");
  renderComparison();
}

function renderComparison() {
  selectedCard.innerHTML = "";
  alternativeCards.innerHTML = "";

  const selected = data.find(d =>
    d.Tipo === tipoSelect.value &&
    d["Color Base"] === colorSelect.value &&
    d.Marca === marcaSelect.value
  );

  if (!selected) return;

  selectedCard.appendChild(createCard(selected, true));

  const alternatives = data.filter(d =>
    d.Tipo === tipoSelect.value &&
    d["Color Base"] === colorSelect.value &&
    d.Marca !== marcaSelect.value
  );

  if (alternatives.length === 0) {
    alternativeCards.innerHTML =
      "<p>No se encontraron equivalentes.</p>";
    return;
  }

  alternatives.forEach(d =>
    alternativeCards.appendChild(createCard(d))
  );
}

/* ============================
   CARD
============================ */
function createCard(row, isSelected = false) {
  const card = document.createElement("div");
  card.className = `card ${isSelected ? "selected" : ""}`;

  card.innerHTML = `
    <div class="swatch" style="background:${row.ColorHex}"></div>
    <div class="brand">${row.Marca}</div>
    <div class="name">${row.Color}</div>
    <div class="code">${row.Code}</div>
  `;

  return card;
}
