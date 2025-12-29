/* ============================
   CONFIG
============================ */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqQ7ZocXOFSN_kojnrH3dHhf2uHmQ2uFVVcG9FYNlbGg8YiTuS5piDSGyZ3-1P8hVUPcpazMHyOf18/pub?output=csv";

const SIMILARITY_THRESHOLD = 80;

/* ============================
   STATE
============================ */
let rows = [];

/* ============================
   FETCH
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    const data = text
      .trim()
      .split("\n")
      .map(l =>
        l.replace(/\r/g, "")
         .split(",")
         .map(c => c.trim())
      );

    const headers = data[0];

    rows = data.slice(1).map(r => ({
      tipo: r[headers.indexOf("Tipo")],
      marca: r[headers.indexOf("Marca")],
      nombre: r[headers.indexOf("Nombre Color")],
      code: r[headers.indexOf("Code")],
      hex: r[headers.indexOf("Color Hex")] || "#ccc"
    }));

    initFilters();
  });

/* ============================
   COLOR SIMILARITY
============================ */
function hexToRgb(hex) {
  if (!hex || hex === "#ccc") return null;
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // gris
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h *= 60;
  }

  return { h, s, l };
}

function colorSimilarity(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 0;

  const hsl1 = rgbToHsl(c1.r, c1.g, c1.b);
  const hsl2 = rgbToHsl(c2.r, c2.g, c2.b);

  // Diferencia de Hue (circular)
  let dh = Math.abs(hsl1.h - hsl2.h);
  dh = Math.min(dh, 360 - dh) / 180; // 0–1

  const ds = Math.abs(hsl1.s - hsl2.s); // 0–1
  const dl = Math.abs(hsl1.l - hsl2.l); // 0–1

  // Pesos (ajustables)
  const WEIGHT_H = 0.6;
  const WEIGHT_S = 0.2;
  const WEIGHT_L = 0.2;

  const distance =
    dh * WEIGHT_H +
    ds * WEIGHT_S +
    dl * WEIGHT_L;

  const similarity = (1 - distance) * 100;
  return Math.max(0, Math.min(100, similarity)).toFixed(1);
}

/* ============================
   FILTERS INIT
============================ */
function initFilters() {
  const brands = [...new Set(rows.map(r => r.marca))].sort();

  brandFilter.innerHTML =
    `<option value="" disabled selected hidden>Marca</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");

  typeFilter.innerHTML =
    `<option value="" disabled selected hidden>Material</option>`;
  colorFilter.innerHTML =
    `<option value="" disabled selected hidden>Color</option>`;

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

  typeFilter.innerHTML =
    `<option value="" disabled selected hidden>Material</option>`;
  colorFilter.innerHTML =
    `<option value="" disabled selected hidden>Color</option>`;
  colorFilter.disabled = true;

  if (!brand) {
    typeFilter.disabled = true;
    render();
    return;
  }

  const types = [
    ...new Set(
      rows
        .filter(r => r.marca === brand)
        .map(r => r.tipo)
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

  colorFilter.innerHTML =
    `<option value="" disabled selected hidden>Color</option>`;

  if (!brand || !type) {
    colorFilter.disabled = true;
    render();
    return;
  }

  const colors = [
    ...new Set(
      rows
        .filter(r => r.marca === brand && r.tipo === type)
        .map(r => r.nombre)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

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
  const colorName = colorFilter.value;

  const results = document.getElementById("results");
  results.innerHTML = "";

  if (!brand || !type || !colorName) return;

  const baseRow = rows.find(
    r =>
      r.marca === brand &&
      r.tipo === type &&
      r.nombre === colorName
  );

  if (!baseRow) return;

  const layout = document.createElement("div");
  layout.className = "compare-layout";

  /* ---- My Spool ---- */
  layout.appendChild(buildMySpool("My Spool", baseRow));

  /* ---- Substitutes ---- */
  const substitutes = rows
    .filter(
      r =>
        r.tipo === baseRow.tipo &&
        r.marca !== baseRow.marca
    )
    .map(r => ({
      ...r,
      similarity: colorSimilarity(baseRow.hex, r.hex)
    }))
    .filter(r => r.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);

  layout.appendChild(
    buildSubstitutesColumn("Substitutes", substitutes)
  );

  results.appendChild(layout);
}

/* ============================
   MY SPOOL COLUMN
============================ */
function buildMySpool(title, row) {
  const col = document.createElement("div");

  const h = document.createElement("div");
  h.className = "column-title";
  h.textContent = title;
  col.appendChild(h);

  const grid = document.createElement("div");
  grid.className = "card-grid";

  const card = document.createElement("div");
  card.className = "color-card highlight-card";

  card.innerHTML = `
    <div class="color-swatch" style="background:${row.hex}"></div>
    <div class="color-brand">${row.marca}</div>
    <div class="color-type">${row.tipo}</div>
    <div class="color-name">${row.nombre}</div>
    <div class="color-code">${row.code || ""}</div>
  `;

  grid.appendChild(card);
  col.appendChild(grid);

  return col;
}

/* ============================
   SUBSTITUTES COLUMN
============================ */
function buildSubstitutesColumn(title, items) {
  const col = document.createElement("div");

  const h = document.createElement("div");
  h.className = "column-title";
  h.textContent = title;
  col.appendChild(h);

  const grid = document.createElement("div");
  grid.className = "card-grid";

  const seen = new Set();

  items.forEach(r => {
    const key = `${r.marca}|${r.nombre}|${r.hex}|${r.code}`;
    if (seen.has(key)) return;
    seen.add(key);

    const card = document.createElement("div");
    card.className = "color-card";

    card.innerHTML = `
      <div class="color-swatch" style="background:${r.hex}"></div>
      <div class="color-brand">${r.marca}</div>
      <div class="color-type">${r.tipo}</div>
      <div class="color-name">${r.nombre}</div>
      <div class="color-code">${r.code || ""}</div>
      <div class="color-similarity">
        <div class="similarity-value">${r.similarity}%</div>
        <div class="similarity-label">Color Match</div>
      </div>
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

/* ============================
   BACKGROUND NOISE
============================ */
(function addNoiseBackground() {
  const style = document.createElement("style");

  style.innerHTML = `
    body {
      position: relative;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;

      background-image:
        repeating-linear-gradient(
          110deg,
          rgba(0,0,0,0.045) 0px,
          rgba(0,0,0,0.045) 6px,
          transparent 6px,
          transparent 180px
        ),
        repeating-linear-gradient(
          160deg,
          rgba(0,0,0,0.03) 0px,
          rgba(0,0,0,0.03) 10px,
          transparent 10px,
          transparent 260px
        ),
        repeating-linear-gradient(
          25deg,
          rgba(0,0,0,0.02) 0px,
          rgba(0,0,0,0.02) 14px,
          transparent 14px,
          transparent 320px
        );

      opacity: 0.18;
      pointer-events: none;
      z-index: 0;
    }

    .page,
    #results {
      position: relative;
      z-index: 1;
    }
  `;

  document.head.appendChild(style);
})();
