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
   COLOR KEYWORDS (REAL DATA)
   Orden: específicos → genéricos
============================ */
const colorKeywords = [

  // ---- FINISH / SPECIAL ----
  { key: "matteblack", hex: "#1c1c1c" },
  { key: "mattewhite", hex: "#f2f2f2" },
  { key: "silkgold", hex: "#d4af37" },
  { key: "silksilver", hex: "#cfd8dc" },
  { key: "glowgreen", hex: "#39ff14" },

  // ---- PATTERNS / MATERIAL ----
  { key: "marble", hex: "#e0e0e0" },
  { key: "wood", hex: "#8d6e63" },

  // ---- REDS / PINKS ----
  { key: "darkred", hex: "#8e0000" },
  { key: "red", hex: "#c62828" },
  { key: "lightpink", hex: "#f8bbd0" },
  { key: "pink", hex: "#ec407a" },

  // ---- ORANGE / YELLOW ----
  { key: "orange", hex: "#ef6c00" },
  { key: "yellow", hex: "#fbc02d" },
  { key: "lime", hex: "#cddc39" },

  // ---- GREENS ----
  { key: "darkgreen", hex: "#1b5e20" },
  { key: "olive", hex: "#808000" },
  { key: "green", hex: "#2e7d32" },

  // ---- BLUES / CYAN ----
  { key: "navyblue", hex: "#0d47a1" },
  { key: "lightblue", hex: "#64b5f6" },
  { key: "cyan", hex: "#00acc1" },
  { key: "blue", hex: "#1565c0" },

  // ---- PURPLES ----
  { key: "lavender", hex: "#ce93d8" },
  { key: "purple", hex: "#7b1fa2" },

  // ---- BROWNS / NEUTRALS ----
  { key: "brown", hex: "#6d4c41" },
  { key: "beige", hex: "#f5f5dc" },

  // ---- GRAYS / METALS ----
  { key: "silver", hex: "#b0bec5" },
  { key: "gray", hex: "#9e9e9e" },

  // ---- BASICS ----
  { key: "white", hex: "#fafafa" },
  { key: "black", hex: "#212121" }
];

function normalizeColorName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_]/g, "");
}

function getSwatchColor(cellValue) {
  if (!cellValue) return "#cccccc";

  const normalized = normalizeColorName(cellValue);

  for (const color of colorKeywords) {
    if (normalized.includes(color.key)) {
      return color.hex;
    }
  }
  return "#cccccc";
}

function detectColor(cellValue) {
  if (!cellValue) return null;

  const normalized = normalizeColorName(cellValue);

  for (const color of colorKeywords) {
    if (normalized.includes(color.key)) {
      return color.key;
    }
  }
  return null;
}

/* ============================
   INIT
============================ */
fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    rawData = text.trim().split("\n").map(r => r.split(","));
    headers = rawData.shift();
    initFilters();
  });

   function baseColor(colorKey) {
     return colorKey
       .replace(/^dark/, "")
       .replace(/^light/, "")
       .replace(/^matte/, "")
       .replace(/^silk/, "");
   }

/* ============================
   FILTERS
============================ */
function initFilters() {
  const brandSelect = document.getElementById("brandSelect");
  const colorSelect = document.getElementById("colorSelect");
  const materialSelect = document.getElementById("materialSelect");

  brandSelect.innerHTML = `<option value="">Marca base</option>`;
   headers.forEach(h => {
     brandSelect.innerHTML += `<option value="${h}">${h}</option>`;
   });

  const colors = [
     ...new Set(
       rawData
         .flat()
         .map(cell => detectColor(cell))
         .filter(Boolean)
         .map(c => baseColor(c))
     )
   ];

   colorSelect.innerHTML = `<option value="">Color</option>`;
  colors.forEach(c => {
     colorSelect.innerHTML += <option value="${c}">${c}</option>;
   });

  const materials = [...new Set(rawData.map(r => r[1]).filter(Boolean))];
  materialSelect.innerHTML = `<option value="">Material</option>`;
  materials.forEach(m => {
    materialSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });

  brandSelect.onchange =
  colorSelect.onchange =
  materialSelect.onchange = applyFilters;
}

function applyFilters() {
  const brand = document.getElementById("brandSelect").value;
  const color = document.getElementById("colorSelect").value;
  const material = document.getElementById("materialSelect").value;
  const brandIndex = brand ? headers.indexOf(brand) : -1;

  const container = document.getElementById("table-container");

  // 👉 Si NO hay ningún filtro activo, no mostramos nada
  if (!brand && !color && !material) {
    container.innerHTML = "";
    return;
  }

  let filtered = rawData;

  if (color) {
     filtered = filtered.filter(row => {

       // 🎯 Hay marca base → match SOLO en esa columna
       if (brandIndex >= 0) {
         return normalizeColorName(row[brandIndex] || "").includes(color);
       }

       // 🎯 Sin marca base → match en cualquier columna
       return row.some(cell =>
         normalizeColorName(cell || "").includes(color)
       );
     });
   }

  if (material) {
    filtered = filtered.filter(r => r[1] === material);
  }

  renderTable(filtered, brand);
}

/* ============================
   TABLE
============================ */
function renderTable(data, brand) {
  const table = document.createElement("table");

  const visibleColumns = headers
    .map((h, i) => ({ h, i }))
    .filter(col => {
      if (col.i < 2) return true;
      if (!brand) return true;
      if (col.h === brand) return true;
      return data.some(row => row[col.i]);
    });

  if (brand) {
    visibleColumns.sort((a, b) => {
      if (a.h === brand) return -1;
      if (b.h === brand) return 1;
      return 0;
    });
  }

  const thead = document.createElement("tr");
  visibleColumns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.h;
    thead.appendChild(th);
  });
  table.appendChild(thead);

  data.forEach(row => {
    const tr = document.createElement("tr");

    visibleColumns.forEach(col => {
      const td = document.createElement("td");
      const cellValue = row[col.i] || "";

      if (cellValue) {
        const color = getSwatchColor(cellValue);

        if (color !== "#cccccc") {
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.backgroundColor = color;
          td.appendChild(swatch);
        }

        td.appendChild(document.createTextNode(cellValue));
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  const container = document.getElementById("table-container");
  container.innerHTML = "";
  container.appendChild(table);
}
