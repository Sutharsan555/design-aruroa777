function formatCurrency(value, currencySymbol) {
  if (isNaN(value)) return "–";
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol} ${formatted}`;
}

function generateInvoiceId() {
  const now = new Date();
  return (
    "INV-" +
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0")
  );
}

function getTodayString() {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function parseNumberInput(input) {
  if (!input) return 0;
  const value = parseFloat(input);
  return isNaN(value) ? 0 : value;
}

function collectFormData() {
  const clientName = document.getElementById("clientName").value.trim();
  const projectName = document.getElementById("projectName").value.trim();
  const currency = document.getElementById("currency").value || "₹";
  const siteArea = parseNumberInput(
    document.getElementById("siteArea").value
  );
  const discountPercent = parseNumberInput(
    document.getElementById("discount").value
  );

  const elevationAreaRaw = document.getElementById("elevationArea").value;
  const elevationArea = elevationAreaRaw
    ? parseNumberInput(elevationAreaRaw)
    : siteArea;
  const elevationRate = parseNumberInput(
    document.getElementById("elevationRate").value
  );
  const elevationNotes = document
    .getElementById("elevationNotes")
    .value.trim();

  const interiorAreaRaw = document.getElementById("interiorArea").value;
  const interiorArea = interiorAreaRaw
    ? parseNumberInput(interiorAreaRaw)
    : siteArea;
  const interiorRate = parseNumberInput(
    document.getElementById("interiorRate").value
  );
  const interiorNotes = document
    .getElementById("interiorNotes")
    .value.trim();

  const extraItems = [];
  const rows = document.querySelectorAll(".extra-item-row");
  rows.forEach((row) => {
    const description = row
      .querySelector(".extra-desc")
      .value.trim();
    const qty = parseNumberInput(row.querySelector(".extra-qty").value);
    const rate = parseNumberInput(
      row.querySelector(".extra-rate").value
    );
    if (description && (qty > 0 || rate > 0)) {
      extraItems.push({ description, qty, rate });
    }
  });

  return {
    clientName,
    projectName,
    currency,
    siteArea,
    discountPercent,
    elevationArea,
    elevationRate,
    elevationNotes,
    interiorArea,
    interiorRate,
    interiorNotes,
    extraItems,
  };
}

function calculateInvoice(data) {
  const items = [];

  if (data.elevationArea > 0 && data.elevationRate > 0) {
    const amount = data.elevationArea * data.elevationRate;
    items.push({
      description:
        "Elevation Design" +
        (data.elevationNotes ? " – " + data.elevationNotes : ""),
      area: data.elevationArea,
      rate: data.elevationRate,
      amount,
    });
  }

  if (data.interiorArea > 0 && data.interiorRate > 0) {
    const amount = data.interiorArea * data.interiorRate;
    items.push({
      description:
        "Interior Design" +
        (data.interiorNotes ? " – " + data.interiorNotes : ""),
      area: data.interiorArea,
      rate: data.interiorRate,
      amount,
    });
  }

  data.extraItems.forEach((extra) => {
    const amount =
      (extra.qty > 0 ? extra.qty : 1) *
      (extra.rate > 0 ? extra.rate : 0);
    items.push({
      description: extra.description,
      area: extra.qty || "",
      rate: extra.rate,
      amount,
    });
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount =
    subtotal * (isNaN(data.discountPercent) ? 0 : data.discountPercent / 100);
  const total = subtotal - discountAmount;

  return { items, subtotal, discountAmount, total };
}

function renderInvoice(data, calc) {
  const invoiceProject = document.getElementById("invoiceProject");
  const invoiceClient = document.getElementById("invoiceClient");
  const invoiceDate = document.getElementById("invoiceDate");
  const invoiceId = document.getElementById("invoiceId");
  const invoiceBody = document.getElementById("invoiceBody");
  const subtotalValue = document.getElementById("subtotalValue");
  const discountValue = document.getElementById("discountValue");
  const totalValue = document.getElementById("totalValue");
  const invoiceNotes = document.getElementById("invoiceNotes");

  invoiceProject.textContent =
    "Project: " + (data.projectName || "–");
  invoiceClient.textContent =
    "Client: " + (data.clientName || "–");
  invoiceDate.textContent = "Date: " + getTodayString();
  invoiceId.textContent = generateInvoiceId();

  invoiceBody.innerHTML = "";
  if (!calc.items.length) {
    const row = document.createElement("tr");
    row.className = "placeholder-row";
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent =
      "Please enter at least one rate and area to generate an invoice.";
    row.appendChild(cell);
    invoiceBody.appendChild(row);
  } else {
    calc.items.forEach((item) => {
      const row = document.createElement("tr");

      const descTd = document.createElement("td");
      descTd.textContent = item.description;
      row.appendChild(descTd);

      const areaTd = document.createElement("td");
      areaTd.className = "numeric";
      areaTd.textContent =
        item.area !== "" && !isNaN(item.area)
          ? item.area.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })
          : "–";
      row.appendChild(areaTd);

      const rateTd = document.createElement("td");
      rateTd.className = "numeric";
      rateTd.textContent = item.rate
        ? formatCurrency(item.rate, data.currency)
        : "–";
      row.appendChild(rateTd);

      const amountTd = document.createElement("td");
      amountTd.className = "numeric";
      amountTd.textContent = formatCurrency(
        item.amount,
        data.currency
      );
      row.appendChild(amountTd);

      invoiceBody.appendChild(row);
    });
  }

  subtotalValue.textContent = formatCurrency(
    calc.subtotal,
    data.currency
  );
  discountValue.textContent = calc.discountAmount
    ? `${formatCurrency(calc.discountAmount, data.currency)} (${parseNumberInput(
        document.getElementById("discount").value
      )}% )`
    : "–";
  totalValue.textContent = formatCurrency(
    calc.total,
    data.currency
  );

  const noteParts = [];
  if (data.siteArea) {
    noteParts.push(
      `Total site area considered: ${data.siteArea.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} sq ft`
    );
  }
  if (data.discountPercent) {
    noteParts.push(
      `Discount applied: ${data.discountPercent.toFixed(2)}%`
    );
  }

  invoiceNotes.textContent = noteParts.join(" • ");
}

function addExtraItemRow() {
  const container = document.getElementById("extra-items");
  const row = document.createElement("div");
  row.className = "extra-item-row";
  row.innerHTML = `
    <div class="field">
      <label>Item description</label>
      <input type="text" class="extra-desc" placeholder="e.g. 3D walkthrough, site visit" />
    </div>
    <div class="field">
      <label>Qty / Area</label>
      <input type="number" class="extra-qty" min="0" step="0.01" placeholder="Optional" />
    </div>
    <div class="field">
      <label>Rate</label>
      <input type="number" class="extra-rate" min="0" step="0.01" placeholder="e.g. 5000" />
    </div>
    <button type="button" class="remove-item-btn" aria-label="Remove item">
      ✕
    </button>
  `;

  row
    .querySelector(".remove-item-btn")
    .addEventListener("click", () => {
      row.remove();
    });

  container.appendChild(row);
}

function resetFormAndInvoice() {
  document.getElementById("calculator-form").reset();
  document.getElementById("extra-items").innerHTML = "";
  document.getElementById("invoiceBody").innerHTML = `
    <tr class="placeholder-row">
      <td colspan="4">Fill in project details and click “Calculate & Generate Invoice”.</td>
    </tr>
  `;
  document.getElementById("subtotalValue").textContent = "–";
  document.getElementById("discountValue").textContent = "–";
  document.getElementById("totalValue").textContent = "–";
  document.getElementById("invoiceProject").textContent = "Project: –";
  document.getElementById("invoiceClient").textContent = "Client: –";
  document.getElementById("invoiceNotes").textContent = "";
  document.getElementById("invoiceDate").textContent = "";
  document.getElementById("invoiceId").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calculator-form");
  const addItemBtn = document.getElementById("addItemBtn");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");

  document.getElementById("invoiceDate").textContent =
    "Date: " + getTodayString();

  addItemBtn.addEventListener("click", () => {
    addExtraItemRow();
  });

  resetBtn.addEventListener("click", () => {
    resetFormAndInvoice();
  });

  printBtn.addEventListener("click", () => {
    window.print();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = collectFormData();

    if (!data.siteArea) {
      alert("Please enter the site area in sq ft.");
      return;
    }

    const calc = calculateInvoice(data);
    if (!calc.items.length) {
      alert(
        "Please enter at least one valid rate and area (for Elevation, Interior or an extra item)."
      );
      return;
    }

    renderInvoice(data, calc);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch((err) => console.error("SW registration failed", err));
  }
});


