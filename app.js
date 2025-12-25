// Package Definitions
const PACKAGES = {
  basic: {
    name: "Basic Package",
    interiorRate: 15,
    elevationRate: 0,
    discountMin: 5,
    discountMax: 5,
    features: [
      "Basic interior design planning",
      "2D floor plans",
      "Basic material recommendations"
    ],
    rules: [
      "Elevation design is not included in this package",
      "Interior rate is fixed at ₹15 per sq ft",
      "Standard discount of 5% applies",
      "1 revision included",
      "Suitable for small to medium projects"
    ]
  },
  standard: {
    name: "Standard Package",
    interiorRate: 25,
    elevationRate: 12,
    discountMin: 5,
    discountMax: 7,
    features: [
      "Complete interior design",
      "3D renderings",
      "Detailed material schedule",
      "Elevation design (₹12/sq ft)",
      "2 revisions included"
    ],
    rules: [
      "Interior rate fixed at ₹25 per sq ft",
      "Elevation rate fixed at ₹12 per sq ft (optional)",
      "Discount range: 5% to 7%",
      "2 design revisions included",
      "Best for medium-sized residential projects"
    ]
  },
  luxury: {
    name: "Luxury Package",
    interiorRate: 40,
    elevationRate: 20,
    discountMin: 5,
    discountMax: 10,
    features: [
      "Premium interior design",
      "Photorealistic 3D renders",
      "Custom material sourcing",
      "Premium elevation design (₹20/sq ft)",
      "Lighting design consultation",
      "Unlimited revisions",
      "Dedicated project manager"
    ],
    rules: [
      "Interior rate fixed at ₹40 per sq ft",
      "Elevation rate fixed at ₹20 per sq ft (optional)",
      "Discount range: 5% to 10%",
      "Unlimited design revisions",
      "Includes lighting and consultation services",
      "Dedicated project manager assigned",
      "Suitable for high-end luxury projects"
    ]
  }
};

let selectedPackage = null;
let pendingPackageSelection = null;

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
    : 0;
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
    selectedPackage,
  };
}

function calculateInvoice(data) {
  const items = [];

  // Elevation is optional - only add if both area and rate are provided and > 0
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

  // Interior can be printed independently even if elevation is not filled
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

  invoiceProject.textContent = "Project: " + (data.projectName || "–");
  invoiceClient.textContent = "Client: " + (data.clientName || "–");
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

  // Render invoice rules/terms
  const invoiceRulesList = document.getElementById("invoiceRulesList");
  invoiceRulesList.innerHTML = "";

  if (data.selectedPackage) {
    const pkg = PACKAGES[data.selectedPackage];
    const rulesContainer = document.createElement("div");
    rulesContainer.className = "terms-section";

    const packageTitle = document.createElement("p");
    packageTitle.className = "terms-title";
    packageTitle.textContent = `${pkg.name} - Project Guidelines:`;
    rulesContainer.appendChild(packageTitle);

    pkg.rules.forEach(rule => {
      const p = document.createElement("p");
      p.className = "terms-item";
      p.textContent = "• " + rule;
      rulesContainer.appendChild(p);
    });

    invoiceRulesList.appendChild(rulesContainer);
  }

  // Add general terms
  const generalTerms = document.createElement("div");
  generalTerms.className = "terms-section";

  const generalTitle = document.createElement("p");
  generalTitle.className = "terms-title";
  generalTitle.textContent = "General Terms:";
  generalTerms.appendChild(generalTitle);

  const generalRules = [
    "Payment terms: 50% advance, 50% upon project completion",
    "Design revisions as per package terms",
    "Timeline may vary based on project scope and complexity",
    "All rates are exclusive of materials and execution costs",
    "Client approval required at each design milestone"
  ];

  generalRules.forEach(rule => {
    const p = document.createElement("p");
    p.className = "terms-item";
    p.textContent = "• " + rule;
    generalTerms.appendChild(p);
  });

  invoiceRulesList.appendChild(generalTerms);
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

function showPackageModal(packageKey) {
  pendingPackageSelection = packageKey;
  const pkg = PACKAGES[packageKey];
  const modal = document.getElementById("packageModal");

  document.getElementById("modalPackageName").textContent = pkg.name;
  document.getElementById("modalPackagePrice").textContent =
    `Interior: ₹${pkg.interiorRate}/sq ft` +
    (pkg.elevationRate > 0 ? ` | Elevation: ₹${pkg.elevationRate}/sq ft` : " | No elevation included");

  const featuresList = document.getElementById("modalFeatures");
  featuresList.innerHTML = "";
  pkg.features.forEach(feature => {
    const li = document.createElement("li");
    li.textContent = "✓ " + feature;
    featuresList.appendChild(li);
  });

  const rulesDiv = document.getElementById("modalRules");
  rulesDiv.innerHTML = "";
  pkg.rules.forEach(rule => {
    const p = document.createElement("p");
    p.textContent = "• " + rule;
    rulesDiv.appendChild(p);
  });

  modal.classList.add("active");
}

function closePackageModal() {
  const modal = document.getElementById("packageModal");
  modal.classList.remove("active");
  pendingPackageSelection = null;
}

function confirmPackageSelection() {
  if (!pendingPackageSelection) return;

  selectedPackage = pendingPackageSelection;
  const pkg = PACKAGES[selectedPackage];

  // Show selected package badge
  const selectedDisplay = document.getElementById("selectedPackageDisplay");
  const selectedName = document.getElementById("selectedPackageName");
  selectedDisplay.style.display = "flex";
  selectedName.textContent = pkg.name;

  // Apply package rates
  document.getElementById("interiorRate").value = pkg.interiorRate;
  document.getElementById("interiorRate").readOnly = true;

  if (pkg.elevationRate > 0) {
    document.getElementById("elevationRate").value = pkg.elevationRate;
    document.getElementById("elevationRate").readOnly = true;
  } else {
    document.getElementById("elevationArea").value = "";
    document.getElementById("elevationArea").disabled = true;
    document.getElementById("elevationRate").value = "";
    document.getElementById("elevationRate").disabled = true;
    document.getElementById("elevationNotes").disabled = true;
  }

  // Update discount range
  const discountInput = document.getElementById("discount");
  discountInput.min = pkg.discountMin;
  discountInput.max = pkg.discountMax;
  discountInput.value = pkg.discountMin;

  const discountHelp = discountInput.nextElementSibling;
  if (discountHelp && discountHelp.classList.contains("field-help")) {
    discountHelp.textContent = `Package discount range: ${pkg.discountMin}% to ${pkg.discountMax}%`;
  }

  closePackageModal();

  // Scroll to form
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
}

function handleProjectTypeChange() {
  const projectType = document.getElementById("projectType").value;
  const elevationHeading = document.getElementById("elevationHeading");
  const interiorHeading = document.querySelector(".form-card h3:nth-of-type(2)");
  const elevationSection = elevationHeading.nextElementSibling;
  const interiorSection = interiorHeading.nextElementSibling;

  // Reset all fields to enabled
  document.getElementById("elevationArea").disabled = false;
  document.getElementById("elevationRate").disabled = false;
  document.getElementById("elevationNotes").disabled = false;
  document.getElementById("interiorArea").disabled = false;
  document.getElementById("interiorRate").disabled = false;
  document.getElementById("interiorNotes").disabled = false;

  if (projectType === "exterior") {
    // Exterior only - hide interior section
    if (interiorHeading) interiorHeading.style.display = "none";
    if (interiorSection) interiorSection.style.display = "none";
    elevationHeading.textContent = "Exterior/Elevation";

    // Make interior rate 0 or clear it
    document.getElementById("interiorArea").value = "";
    document.getElementById("interiorRate").value = "0";
  } else if (projectType === "interior") {
    // Interior only - hide elevation section
    if (elevationHeading) elevationHeading.style.display = "none";
    if (elevationSection) elevationSection.style.display = "none";

    // Clear elevation fields
    document.getElementById("elevationArea").value = "";
    document.getElementById("elevationRate").value = "";
  } else {
    // Full project - show both
    if (elevationHeading) elevationHeading.style.display = "block";
    if (elevationSection) elevationSection.style.display = "grid";
    if (interiorHeading) interiorHeading.style.display = "block";
    if (interiorSection) interiorSection.style.display = "grid";
    elevationHeading.textContent = "Exterior/Elevation (Optional)";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calculator-form");
  const addItemBtn = document.getElementById("addItemBtn");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");

  document.getElementById("invoiceDate").textContent =
    "Date: " + getTodayString();

  // Project type change listener
  const projectTypeSelect = document.getElementById("projectType");
  if (projectTypeSelect) {
    projectTypeSelect.addEventListener("change", handleProjectTypeChange);
  }

  // Package selection event listener
  const packageSelect = document.getElementById("packageSelect");
  if (packageSelect) {
    packageSelect.addEventListener("change", (e) => {
      const packageKey = e.target.value;
      if (packageKey) {
        showPackageModal(packageKey);
      }
    });
  }

  // Modal event listeners
  document.getElementById("closeModal").addEventListener("click", closePackageModal);
  document.getElementById("cancelPackage").addEventListener("click", closePackageModal);
  document.getElementById("confirmPackage").addEventListener("click", confirmPackageSelection);

  // Close modal on outside click
  document.getElementById("packageModal").addEventListener("click", (e) => {
    if (e.target.id === "packageModal") {
      closePackageModal();
    }
  });

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
    const projectType = document.getElementById("projectType").value;

    if (!data.siteArea) {
      alert("Please enter the site area in sq ft.");
      return;
    }

    const calc = calculateInvoice(data);
    if (!calc.items.length) {
      if (projectType === "exterior") {
        alert("Please enter valid exterior/elevation area and rate.");
      } else if (projectType === "interior") {
        alert("Please enter valid interior area and rate.");
      } else {
        alert("Please enter at least one valid rate and area (for Interior, Exterior, or an extra item).");
      }
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


