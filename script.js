/* ===== CONFIG ===== */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqQ7ZocXOFSN_kojnrH3dHhf2uHmQ2uFVVcG9FYNlbGg8YiTuS5piDSGyZ3-1P8hVUPcpazMHyOf18/pub?output=csv";

/* ===== STATE ===== */
let headers = [];
let rows = [];
let TYPE_COL = -1;
let BASE_COLOR_COL = -1;

/* ===== FETCH ===== */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    const data = text
      .trim()
      .split("\n")
      .map(l => l.replace(/\r/g, "").split(",").map(c => c.trim()));

    headers = data[0];
    rows = data.slice(1);

    TYPE_COL = headers.indexOf("Tipo");
    BASE_COLOR_COL = headers.indexOf("Color Base");

    initFilters();
  });

/* ===== HELPERS ===== */
function isBrandColumn(h) {
  return h && h !== "Tipo" && h !== "Color Base" && !h.includes("Code") && !h.includes("Color");
}

function getCode(row, brand) {
  return row[headers.indexOf(`${brand} Code`)] || "";
}

function getHex(row, brand) {
  return row[headers.indexOf(`${brand} Color`)] || "#ccc";
}

/* ===== FILTERS ===== */
function initFilters() {
  const typeFilter = document.getElementById("typeFilter");
  const colorFilter = document.getElementById("colorFilter");
  const brandFilter = document.getElementById("brandFilter");

  typeFilter.innerHTML =
    `<option value="" disabled selected hidden>Tipo</option>` +
    [...new Set(rows.map(r => r[TYPE_COL]).filter(Boolean))]
      .map(v => `<option value="${v}">${v}</option>`).join("");

  colorFilter.innerHTML =
    `<option value="" disabled selected hidden>Color Base</option>` +
    [...new Set(rows.map(r => r[BASE_COLOR_COL]).filter(Boolean))]
      .map(v => `<option value="${v}">${v}</option>`).join("");

  brandFilter.innerHTML =
    `<option value="" disabled selected hidden>Marca</option>` +
    headers.filter(isBrandColumn)
      .map(v => `<option value="${v}">${v}</option>`).join("");

  typeFilter.onchange = render;
  colorFilter.onchange = render;
  brandFilter.onchange = render;
}

/* ===== RENDER ===== */
function render() {
  const type = typeFilter.value;
  const color = colorFilter.value;
  const brand = brandFilter.value;

  const results = document.getElementById("results");
  results.innerHTML = "";

  // 🔒 Solo render si los 3 filtros están activos
  if (!type || !color || !brand) return;

  const row = rows.find(
    r => r[TYPE_COL] === type && r[BASE_COLOR_COL] === color
  );
  if (!row) return;

  const layout = document.createElement("div");
  layout.className = "compare-layout";

  // LEFT (selected brand)
  layout.appendChild(buildColumn("Seleccionado", [brand], row));

  // RIGHT (others)
  const others = headers.filter(isBrandColumn).filter(b => b !== brand);
  layout.appendChild(buildColumn("Equivalencias", others, row));

  results.appendChild(layout);
}

/* ===== COLUMN BUILDER ===== */
function buildColumn(title, brands, row) {
  const col = document.createElement("div");

  const h = document.createElement("div");
  h.className = "column-title";
  h.textContent = title;
  col.appendChild(h);

  const grid = document.createElement("div");
  grid.className = "card-grid";

  brands.forEach(brand => {
    const name = row[headers.indexOf(brand)];
    if (!name) return;

    const card = document.createElement("div");
    card.className = "color-card";

    card.innerHTML = `
      <div class="color-swatch" style="background:${getHex(row, brand)}"></div>
      <div class="color-brand">${brand}</div>
      <div class="color-type">${row[TYPE_COL]}</div>
      <div class="color-name">${name}</div>
      <div class="color-code">${getCode(row, brand)}</div>
    `;

    grid.appendChild(card);
  });

  col.appendChild(grid);
  return col;
}

/* ===== CLEAR BUTTON ===== */
document.querySelectorAll(".clear-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const select = document.getElementById(btn.dataset.target);
    select.value = "";
    select.dispatchEvent(new Event("change"));
  });
});
