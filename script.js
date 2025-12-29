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
  return +((1 - dist / maxDist) * 100).toFixed(1);
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
