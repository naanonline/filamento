/* ============================
   CONFIG
============================ */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqQ7ZocXOFSN_kojnrH3dHhf2uHmQ2uFVVcG9FYNlbGg8YiTuS5piDSGyZ3-1P8hVUPcpazMHyOf18/pub?output=csv";

/* ============================
   STATE
============================ */
let rawData = [];
let headers = [];

/* ============================
   HELPERS
============================ */

// Columnas de marca reales
function getBrandColumns() {
  return headers
    .map((h, i) => ({ h, i }))
    .filter(col =>
      col.h !== "Tipo" &&
      !col.h.toLowerCase().includes("code") &&
      !col.h.toLowerCase().includes("color")
    );
}

function getCodeColumnIndex(brandHeader) {
  return headers.indexOf(`${brandHeader} Code`);
}

// Columna HEX de una marca
function getColorColumnIndex(brandHeader) {
  return headers.indexOf(`${brandHeader} Color`);
}

/* ============================
   INIT
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    rawData = text
      .trim()
      .split("\n")
      .map(r => r.split(","));

    headers = rawData.shift();
    initFilters();
  });

/* ============================
   FILTERS
============================ */
function initFilters() {
  const typeSelect = document.getElementById("materialSelect");
  const brandSelect = document.getElementById("brandSelect");
  const colorSelect = document.getElementById("colorSelect");

  const brandColumns = getBrandColumns();

  /* ===== TIPO ===== */
  const types = [...new Set(rawData.map(r => r[0]).filter(Boolean))];
  typeSelect.innerHTML =
    `<option value="">Tipo</option>` +
    types.map(t => `<option value="${t}">${t}</option>`).join("");

  /* ===== MARCA ===== */
  brandSelect.innerHTML =
    `<option value="">Marca</option>` +
    brandColumns.map(b => `<option value="${b.h}">${b.h}</option>`).join("");

  /* ===== COLOR (de todas las marcas) ===== */
  const colors = new Set();
  brandColumns.forEach(b => {
    rawData.forEach(r => {
      if (r[b.i]) colors.add(r[b.i]);
    });
  });

  colorSelect.innerHTML =
    `<option value="">Color</option>` +
    [...colors].sort().map(c => `<option value="${c}">${c}</option>`).join("");

  typeSelect.onchange =
    brandSelect.onchange =
    colorSelect.onchange =
      applyFilters;
}

function applyFilters() {
  renderCards(
    rawData,
    document.getElementById("brandSelect").value,
    document.getElementById("colorSelect").value,
    document.getElementById("materialSelect").value
  );
}

/* ============================
   CARDS (EQUIVALENCIAS)
============================ */
function renderCards(data, selectedBrand, selectedColor, selectedType) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!selectedBrand && !selectedColor && !selectedType) return;

  const brandColumns = getBrandColumns();

  const brandsToRender = selectedBrand
    ? brandColumns.filter(b => b.h === selectedBrand)
    : brandColumns;

  brandsToRender.forEach(({ h, i }) => {
    const colorColIndex = getColorColumnIndex(h);
    const codeColIndex = getCodeColumnIndex(h);
    const cards = [];

    data.forEach(row => {
      /* ===== FILTRO TIPO ===== */
      if (selectedType && row[0] !== selectedType) return;

      /* ===== FILTRO COLOR (POR FILA) ===== */
      if (selectedColor) {
        const rowHasColor = brandColumns.some(b => row[b.i] === selectedColor);
        if (!rowHasColor) return;
      }

      const name = row[i];
      if (!name) return;

      const hex = row[colorColIndex];

      cards.push({
        brand: h,
        type: row[0],
        name: colorName,
        code: row[codeColIndex] || "",
        hex: hex || "#cccccc"
      });
    });

    if (!cards.length) return;

    /* ===== RENDER ===== */
    const section = document.createElement("div");
    section.className = "brand-section";

    const title = document.createElement("div");
    title.className = "brand-title";
    title.textContent = h;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "brand-grid";

    cards.forEach(c => {
      const card = document.createElement("div");
      card.className = "color-card";

      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = c.hex;

      const brandLabel = document.createElement("div");
      brandLabel.className = "color-brand";
      brandLabel.textContent = c.brand;
      
      const typeLabel = document.createElement("div");
      typeLabel.className = "color-type";
      typeLabel.textContent = c.type;
      
      const colorName = document.createElement("div");
      colorName.className = "color-name";
      colorName.textContent = c.name;
      
      const colorCode = document.createElement("div");
      colorCode.className = "color-code";
      colorCode.textContent = c.code;

      card.appendChild(swatch);
      card.appendChild(brandLabel);
      card.appendChild(typeLabel);
      card.appendChild(colorName);
      card.appendChild(colorCode);

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
