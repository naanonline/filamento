/* ============================
   CONFIG
============================ */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqQ7ZocXOFSN_kojnrH3dHhf2uHmQ2uFVVcG9FYNlbGg8YiTuS5piDSGyZ3-1P8hVUPcpazMHyOf18/pub?output=csv";

/* ============================
   STATE
============================ */
let headers = [];
let rows = [];

/* ============================
   FETCH CSV
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    const lines = text
      .trim()
      .split("\n")
      .map(l => l.replace(/\r/g, ""));

    const data = lines.map(line =>
      line.split(",").map(cell => cell.trim())
    );

    headers = data[0];
    rows = data.slice(1);

    initFilters();
    render();
  });

/* ============================
   CONSTANTS
============================ */
const TYPE_COL = 0;
const BASE_COLOR_COL = 1;

/* ============================
   HELPERS
============================ */
function isBrandColumn(header) {
  return (
    header &&
    header !== "Tipo" &&
    header !== "Color Base" &&
    !header.includes("Code") &&
    !header.includes("Color")
  );
}

function getCode(row, brand) {
  const idx = headers.indexOf(`${brand} Code`);
  return idx !== -1 ? row[idx] : "";
}

function getHex(row, brand) {
  const idx = headers.indexOf(`${brand} Color`);
  return idx !== -1 ? row[idx] : "#cccccc";
}

/* ============================
   FILTERS
============================ */
function initFilters() {
  const typeFilter = document.getElementById("typeFilter");
  const brandFilter = document.getElementById("brandFilter");
  const colorFilter = document.getElementById("colorFilter");

  // Tipo
  const types = [...new Set(rows.map(r => r[TYPE_COL]).filter(Boolean))];
  typeFilter.innerHTML =
    `<option value="">Tipo</option>` +
    types.map(t => `<option value="${t}">${t}</option>`).join("");

  // Color Base
  const baseColors = [...new Set(rows.map(r => r[BASE_COLOR_COL]).filter(Boolean))];
  colorFilter.innerHTML =
    `<option value="">Color Base</option>` +
    baseColors.map(c => `<option value="${c}">${c}</option>`).join("");

  // Marca
  const brands = headers.filter(isBrandColumn);
  brandFilter.innerHTML =
    `<option value="">Marca</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");

  typeFilter.onchange = render;
  brandFilter.onchange = render;
  colorFilter.onchange = render;
}

/* ============================
   RENDER
============================ */
function render() {
  const typeValue = document.getElementById("typeFilter").value;
  const brandValue = document.getElementById("brandFilter").value;
  const colorValue = document.getElementById("colorFilter").value;

  const results = document.getElementById("results");
  results.innerHTML = "";

  const brands = brandValue
    ? [brandValue]
    : headers.filter(isBrandColumn);

  const grid = document.createElement("div");
  grid.className = "brand-grid";

  let hasResults = false;

  rows.forEach(row => {
    if (typeValue && row[TYPE_COL] !== typeValue) return;
    if (colorValue && row[BASE_COLOR_COL] !== colorValue) return;

    brands.forEach(brand => {
      const colIndex = headers.indexOf(brand);
      const name = row[colIndex];
      if (!name) return;

      hasResults = true;

      const card = document.createElement("div");
      card.className = "color-card";

      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.background = getHex(row, brand);

      const brandDiv = document.createElement("div");
      brandDiv.className = "color-brand";
      brandDiv.textContent = brand;

      const typeDiv = document.createElement("div");
      typeDiv.className = "color-type";
      typeDiv.textContent = row[TYPE_COL];

      const nameDiv = document.createElement("div");
      nameDiv.className = "color-name";
      nameDiv.textContent = name;

      const codeDiv = document.createElement("div");
      codeDiv.className = "color-code";
      codeDiv.textContent = getCode(row, brand);

      card.append(swatch, brandDiv, typeDiv, nameDiv, codeDiv);
      grid.appendChild(card);
    });
  });

  if (!hasResults) {
    results.innerHTML = "<p>No hay resultados.</p>";
    return;
  }

  results.appendChild(grid);
}
