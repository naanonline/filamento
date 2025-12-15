/* ============================
   CONFIG
============================ */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqQ7ZocXOFSN_kojnrH3dHhf2uHmQ2uFVVcG9FYNlbGg8YiTuS5piDSGyZ3-1P8hVUPcpazMHyOf18/pub?output=csv";

/* ============================
   STATE
============================ */
let headers = [];
let rawData = [];

/* ============================
   HELPERS
============================ */

function getBrandColumns() {
  return headers
    .map((h, i) => ({ h, i }))
    .filter(col =>
      col.h !== "Tipo" &&
      !col.h.toLowerCase().includes("code") &&
      !col.h.toLowerCase().includes("color")
    );
}

function getColorColumnIndex(brand) {
  return headers.indexOf(`${brand} Color`);
}

function getCodeColumnIndex(brand) {
  return headers.indexOf(`${brand} Code`);
}

/* ============================
   INIT
============================ */
fetch(CSV_URL)
  .then(r => r.text())
  .then(text => {
    rawData = text.trim().split("\n").map(r => r.split(","));
    headers = rawData.shift();
    initFilters();
  });

/* ============================
   FILTERS
============================ */

function initFilters() {
  const materialSelect = document.getElementById("materialSelect");
  const brandSelect = document.getElementById("brandSelect");
  const colorSelect = document.getElementById("colorSelect");

  const brandCols = getBrandColumns();

  /* === TIPO === */
  const tipos = [...new Set(rawData.map(r => r[0]).filter(Boolean))];
  materialSelect.innerHTML =
    `<option value="">Tipo</option>` +
    tipos.map(t => `<option value="${t}">${t}</option>`).join("");

  /* === MARCA === */
  brandSelect.innerHTML =
    `<option value="">Marca</option>` +
    brandCols.map(b => `<option value="${b.h}">${b.h}</option>`).join("");

  /* === COLOR (todas las marcas) === */
  const colors = new Set();
  brandCols.forEach(b => {
    rawData.forEach(r => {
      if (r[b.i]) colors.add(r[b.i]);
    });
  });

  colorSelect.innerHTML =
    `<option value="">Color</option>` +
    [...colors].sort().map(c => `<option value="${c}">${c}</option>`).join("");

  materialSelect.onchange =
    brandSelect.onchange =
    colorSelect.onchange =
      applyFilters;
}

function applyFilters() {
  renderCards(
    rawData,
    document.getElementById("materialSelect").value,
    document.getElementById("brandSelect").value,
    document.getElementById("colorSelect").value
  );
}

/* ============================
   CARDS
============================ */

function renderCards(data, selectedType, selectedBrand, selectedColor) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!selectedType && !selectedBrand && !selectedColor) return;

  const brandCols = getBrandColumns();

  const brandsToRender = selectedBrand
    ? brandCols.filter(b => b.h === selectedBrand)
    : brandCols;

  brandsToRender.forEach(({ h, i }) => {
    const colorCol = getColorColumnIndex(h);
    const codeCol = getCodeColumnIndex(h);

    const cards = [];

    data.forEach(row => {
      /* Tipo */
      if (selectedType && row[0] !== selectedType) return;

      /* Color por equivalencia (fila) */
      if (selectedColor) {
        const rowHasColor = brandCols.some(b => row[b.i] === selectedColor);
        if (!rowHasColor) return;
      }

      const name = row[i];
      if (!name) return;

      cards.push({
        brand: h,
        type: row[0],
        name,
        code: row[codeCol] || "",
        hex: row[colorCol] || "#cccccc"
      });
    });

    if (!cards.length) return;

    /* Render */
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

      card.appendChild(swatch);
      card.appendChild(brand);
      card.appendChild(type);
      card.appendChild(name);
      card.appendChild(code);

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
