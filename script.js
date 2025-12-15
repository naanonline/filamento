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
let TYPE_COL = -1;
let BASE_COLOR_COL = -1;

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
    headers[0] = headers[0].replace(/^\uFEFF/, ""); // 🔥 FIX BOM

    rows = data.slice(1);

    TYPE_COL = headers.indexOf("Tipo");
    BASE_COLOR_COL = headers.indexOf("Color Base");

    initFilters();
    render();
  });

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

   // 🚫 SI NO HAY FILTROS ACTIVOS, NO MOSTRAR NADA
  if (!typeValue && !brandValue && !colorValue) {
    return;
  }
   
  const brands = brandValue
    ? [brandValue]
    : headers.filter(isBrandColumn);

  let hasResults = false;

  brands.forEach(brand => {
    const section = document.createElement("section");
    section.className = "brand-section";

    const title = document.createElement("h2");
    title.className = "brand-title";
    title.textContent = brand;

    const grid = document.createElement("div");
    grid.className = "brand-grid";

    rows.forEach(row => {
      if (typeValue && row[TYPE_COL] !== typeValue) return;
      if (BASE_COLOR_COL !== -1 && colorValue && row[BASE_COLOR_COL] !== colorValue) return;

      const colIndex = headers.indexOf(brand);
      const name = row[colIndex];
      if (!name) return;

      hasResults = true;

      const card = document.createElement("div");
      card.className = "color-card";

      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.background = getHex(row, brand);

      card.innerHTML += `
        <div class="color-brand">${brand}</div>
        <div class="color-type">${row[TYPE_COL]}</div>
        <div class="color-name">${name}</div>
        <div class="color-code">${getCode(row, brand)}</div>
      `;

      card.prepend(swatch);
      grid.appendChild(card);
    });

    if (grid.children.length) {
      section.append(title, grid);
      results.appendChild(section);
    }
  });

  if (!hasResults) {
    results.innerHTML = "<p>No hay resultados.</p>";
  }

  results.appendChild(grid);
}


document.querySelectorAll(".clear-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const select = document.getElementById(btn.dataset.target);
    select.value = "";
    select.dispatchEvent(new Event("change"));
  });
});
