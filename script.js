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

/* ============================
   FETCH
============================ */
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

    initFilters();
  });

/* ============================
   HELPERS
============================ */
function isBrandColumn(h) {
  return h && h !== "Tipo" && h !== "Color Base" && !h.includes("Code") && !h.includes("Color");
}

function hasBrandValue(row, brand) {
  const val = row[headers.indexOf(brand)];
  return val && val.trim() !== "";
}

function getCode(row, brand) {
  return row[headers.indexOf(`${brand} Code`)] || "";
}

function getHex(row, brand) {
  return row[headers.indexOf(`${brand} Color`)] || "#ccc";
}

function hexToRgb(hex) {
  if (!hex || hex === "#ccc") return null;

  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function colorSimilarity(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 0;

  const dist = Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );

  const maxDist = Math.sqrt(255 * 255 * 3);
  return Math.round((1 - dist / maxDist) * 100);
}

/* ============================
   FILTERS INIT
============================ */
function initFilters() {
  window.brandFilter = document.getElementById("brandFilter");
  window.typeFilter = document.getElementById("typeFilter");
  window.colorFilter = document.getElementById("colorFilter");

  /* ---- Marca ---- */
  brandFilter.innerHTML =
    `<option value="" disabled selected hidden>Marca</option>` +
    headers.filter(isBrandColumn)
      .map(b => `<option value="${b}">${b}</option>`)
      .join("");

  /* ---- Inicial ---- */
  typeFilter.innerHTML = `<option value="" disabled selected hidden>Material</option>`;
  colorFilter.innerHTML = `<option value="" disabled selected hidden>Color</option>`;

  typeFilter.disabled = true;
  colorFilter.disabled = true;

  brandFilter.addEventListener("change", onBrandChange);
  typeFilter.addEventListener("change", onTypeChange);
  colorFilter.addEventListener("change", render);
}

/* ============================
   BRAND CHANGE
============================ */
function onBrandChange() {
  const brand = brandFilter.value;

  typeFilter.innerHTML = `<option value="" disabled selected hidden>Material</option>`;
  colorFilter.innerHTML = `<option value="" disabled selected hidden>Color</option>`;
  colorFilter.disabled = true;

  if (!brand) {
    typeFilter.disabled = true;
    render();
    return;
  }

  const types = [
    ...new Set(
      rows
        .filter(r => hasBrandValue(r, brand))
        .map(r => r[TYPE_COL])
        .filter(Boolean)
    )
  ];

  typeFilter.innerHTML += types
    .map(t => `<option value="${t}">${t}</option>`)
    .join("");

  typeFilter.disabled = false;
  render();
}

/* ============================
   TYPE CHANGE
============================ */
function onTypeChange() {
  const brand = brandFilter.value;
  const type = typeFilter.value;

  colorFilter.innerHTML = `<option value="" disabled selected hidden>Color</option>`;

  if (!brand || !type) {
    colorFilter.disabled = true;
    render();
    return;
  }

  const colors = [
  ...new Set(
    rows
      .filter(r =>
        r[TYPE_COL] === type &&
        hasBrandValue(r, brand)
      )
      .map(r => r[headers.indexOf(brand)])
      .filter(Boolean)
  )
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  colorFilter.innerHTML += colors
    .map(c => `<option value="${c}">${c}</option>`)
    .join("");

  colorFilter.disabled = false;
  render();
}

/* ============================
   RENDER
============================ */
function render() {
  const brand = brandFilter.value;
  const type = typeFilter.value;
  const color = colorFilter.value;

  const results = document.getElementById("results");
  results.innerHTML = "";

  if (!brand || !type || !color) return;

  const row = rows.find(
    r =>
      r[TYPE_COL] === type &&
      r[headers.indexOf(brand)] === color
  );

  if (!row) return;

  const layout = document.createElement("div");
  layout.className = "compare-layout";

  /* ---- Seleccionado ---- */
  layout.appendChild(buildColumn("My Spool", [brand], row));

  /* ---- Equivalencias ---- */
  const baseHex = getHex(row, brand);

   const others = headers
     .filter(isBrandColumn)
     .filter(b => b !== brand)
     .map(b => ({
       brand: b,
       similarity: colorSimilarity(baseHex, getHex(row, b))
     }))
     .sort((a, b) => b.similarity - a.similarity)
     .map(o => o.brand);
   
   layout.appendChild(buildColumn("Substitutes", others, row, baseHex));

  results.appendChild(layout);
}

/* ============================
   COLUMN BUILDER
============================ */
function buildColumn(title, brands, row, baseHex = null) {
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

    if (title === "Seleccionado") {
      card.classList.add("highlight-card");
    }

    const similarity =
     baseHex && title === "Equivalencias"
       ? colorSimilarity(baseHex, getHex(row, brand))
       : null;

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

/* ============================
   CLEAR BUTTONS
============================ */
document.querySelectorAll(".clear-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const select = document.getElementById(btn.dataset.target);

    select.value = "";
    select.dispatchEvent(new Event("change"));

    if (select.id === "brandFilter") {
      typeFilter.disabled = true;
      colorFilter.disabled = true;
      typeFilter.value = "";
      colorFilter.value = "";
    }

    if (select.id === "typeFilter") {
      colorFilter.disabled = true;
      colorFilter.value = "";
    }
  });
});
