/* ============================
   CONFIG
============================ */
const CSV_URL = "PEGA_AQUI_TU_URL_DEL_CSV";

/* ============================
   STATE
============================ */
let headers = [];
let rows = [];

/* ============================
   FETCH & PARSE CSV
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    const data = text.trim().split("\n").map(r => r.split(","));
    headers = data[0];
    rows = data.slice(1);
    initFilters();
    render();
  });

/* ============================
   HELPERS
============================ */
const TYPE_COL = 0;
const BASE_COLOR_COL = 1;

function isBrandColumn(header) {
  return (
    header !== "Tipo" &&
    header !== "Color Base" &&
    !header.includes("Code") &&
    !header.includes("Color")
  );
}

function getColorHex(row, brand) {
  const idx = headers.indexOf(`${brand} Color`);
  return idx !== -1 ? row[idx] : "";
}

function getCode(row, brand) {
  const idx = headers.indexOf(`${brand} Code`);
  return idx !== -1 ? row[idx] : "";
}

/* ============================
   FILTER SETUP
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

  // Events
  typeFilter.addEventListener("change", render);
  brandFilter.addEventListener("change", render);
  colorFilter.addEventListener("change", render);
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

  const cards = [];

  rows.forEach(row => {
    if (typeValue && row[TYPE_COL] !== typeValue) return;
    if (colorValue && row[BASE_COLOR_COL] !== colorValue) return;

    brands.forEach(brand => {
      const name = row[headers.indexOf(brand)];
      if (!name) return;

      cards.push({
        brand,
        type: row[TYPE_COL],
        baseColor: row[BASE_COLOR_COL],
        name,
        code: getCode(row, brand),
        hex: getColorHex(row, brand) || "#cccccc"
      });
    });
  });

  if (!cards.length) {
    results.innerHTML = "<p>No hay resultados.</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "brand-grid";

  cards.forEach(c => {
    const card = document.createElement("div");
    card.className = "color-card";

    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.background = c.hex;

    const brand = document.createElement("div");
    brand.className = "color-brand";
    brand.textContent = c.brand;

    const type = document.createElement("div");
    type.className = "color-type";
    type.textContent = c.type;

    const name = document.createElement("div");
    name.className = "color-name";
    name.textContent = c.name;

    const code = document.createElement("div");
    code.className = "color-code";
    code.textContent = c.code;

    card.append(swatch, brand, type, name, code);
    grid.appendChild(card);
  });

  results.appendChild(grid);
}
