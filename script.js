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
   COLOR MAP
============================ */
const colorMap = {
  White: "#fafafa",
  Black: "#212121",
  Gray: "#9e9e9e",
  Silver: "",
  Beige: "#f5f5dc",
  Red: "#c62828",
  DarkRed: "#8e0000",
  Pink: "",
  LightPink: "",
  Orange: "#ef6c00",
  Yellow: "#fbc02d",
  Lime: "",
  Green: "#2e7d32",
  DarkGreen: "",
  Olive: "",
  Blue: "#1565c0",
  NavyBlue: "",
  LightBlue: "",
  Cyan: "",
  Purple: "",
  Lavender: "",
  Brown: "",
  Wood: "",
  Marble: "",
  GlowGreen: "",
  SilkGold: "",
  SilkSilver: "",
  MatteBlack: "",
  MatteWhite: ""
};

function normalizeColorName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_]/g, "");
}

function getSwatchColor(colorName) {
  if (!colorName) return "#cccccc";

  const key = normalizeColorName(colorName);
  return colorMap[key] || "#cccccc";
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
    applyFilters();
  });

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

  const colors = [...new Set(rawData.map(r => r[0]).filter(Boolean))];
  colorSelect.innerHTML = `<option value="">Color</option>`;
  colors.forEach(c => {
    colorSelect.innerHTML += `<option value="${c}">${c}</option>`;
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

  let filtered = rawData;

  if (color) filtered = filtered.filter(r => r[0] === color);
  if (material) filtered = filtered.filter(r => r[1] === material);

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

      if (col.i === 0) {
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.backgroundColor = getSwatchColor(row[col.i]);
        td.appendChild(swatch);
        td.appendChild(document.createTextNode(row[col.i]));
      } else {
        td.textContent = row[col.i] || "";
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  const container = document.getElementById("table-container");
  container.innerHTML = "";
  container.appendChild(table);
}
