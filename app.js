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

  // Generate package banner if package is selected
  if (data.selectedPackage) {
    generatePackageBanner(data);
  }
}

function generatePackageBanner(data) {
  if (!data.selectedPackage) return;

  const pkg = PACKAGES[data.selectedPackage];
  const bannerCard = document.getElementById("packageBannerCard");
  const bannerClientInfo = document.getElementById("bannerClientInfo");
  const bannerPackageDetails = document.getElementById("bannerPackageDetails");
  const bannerPricing = document.getElementById("bannerPricing");
  const bannerFeatures = document.getElementById("bannerFeatures");
  const bannerPackageBadge = document.getElementById("bannerPackageBadge");
  const bannerPackageName = document.getElementById("bannerPackageName");

  // Show banner card
  bannerCard.style.display = "block";

  // Package badge
  bannerPackageBadge.innerHTML = `<h2>${pkg.name}</h2>`;

  // Package name at top
  bannerPackageName.innerHTML = `<h2>${pkg.name}</h2>`;

  // Client info
  bannerClientInfo.innerHTML = `
    <div class="banner-info-row">
      <div class="banner-info-item">
        <span class="banner-label">Client Name</span>
        <span class="banner-value">${data.clientName || "–"}</span>
      </div>
      <div class="banner-info-item">
        <span class="banner-label">Project Name</span>
        <span class="banner-value">${data.projectName || "–"}</span>
      </div>
      <div class="banner-info-item">
        <span class="banner-label">Date</span>
        <span class="banner-value">${getTodayString()}</span>
      </div>
    </div>
  `;

  // Package details
  bannerPackageDetails.innerHTML = `
    <h3>Package Details</h3>
    <div class="banner-detail-grid">
      <div class="banner-detail-item">
        <span class="banner-detail-label">Interior Rate</span>
        <span class="banner-detail-value">${data.currency}${pkg.interiorRate}/sq ft</span>
      </div>
      ${pkg.elevationRate > 0 ? `
        <div class="banner-detail-item">
          <span class="banner-detail-label">Elevation Rate</span>
          <span class="banner-detail-value">${data.currency}${pkg.elevationRate}/sq ft</span>
        </div>
      ` : ''}
      <div class="banner-detail-item">
        <span class="banner-detail-label">Site Area</span>
        <span class="banner-detail-value">${data.siteArea.toLocaleString()} sq ft</span>
      </div>
      <div class="banner-detail-item">
        <span class="banner-detail-label">Discount Range</span>
        <span class="banner-detail-value">${pkg.discountMin}% - ${pkg.discountMax}%</span>
      </div>
    </div>
  `;

  // Pricing breakdown
  const calc = calculateInvoice(data);
  bannerPricing.innerHTML = `
    <h3>Investment Summary</h3>
    <div class="banner-pricing-details">
      <div class="banner-price-row">
        <span>Subtotal</span>
        <span class="banner-price-value">${formatCurrency(calc.subtotal, data.currency)}</span>
      </div>
      <div class="banner-price-row">
        <span>Discount (${data.discountPercent}%)</span>
        <span class="banner-price-value">- ${formatCurrency(calc.discountAmount, data.currency)}</span>
      </div>
      <div class="banner-price-row banner-price-total">
        <span>Total Investment</span>
        <span class="banner-price-value">${formatCurrency(calc.total, data.currency)}</span>
      </div>
    </div>
  `;

  // Features
  bannerFeatures.innerHTML = `
    <h3>What's Included</h3>
    <div class="banner-features-grid">
      ${pkg.features.map(feature => `
        <div class="banner-feature-item">
          <span class="banner-feature-icon">✓</span>
          <span>${feature}</span>
        </div>
      `).join('')}
    </div>
    <div class="banner-rules">
      <h4>Package Terms</h4>
      ${pkg.rules.map(rule => `<p>• ${rule}</p>`).join('')}
    </div>
  `;

  // Show PDF download button
  document.getElementById("downloadPdfBtn").style.display = "inline-flex";

  // Show stamp on invoice
  document.getElementById("companyStamp").style.display = "block";
}

async function downloadPackagePDF() {
  const { jsPDF } = window.jspdf;

  // Show loading state
  const downloadBtn = document.getElementById("downloadPdfBtn");
  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = "⏳ Generating PDF...";
  downloadBtn.disabled = true;

  try {
    // Create new PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Capture invoice section
    const invoiceCard = document.querySelector('.invoice-card');
    const invoiceCanvas = await html2canvas(invoiceCard, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });

    const invoiceImgData = invoiceCanvas.toDataURL('image/png');
    const invoiceImgWidth = pageWidth - 20;
    const invoiceImgHeight = (invoiceCanvas.height * invoiceImgWidth) / invoiceCanvas.width;

    // Add invoice to PDF
    pdf.addImage(invoiceImgData, 'PNG', 10, 10, invoiceImgWidth, invoiceImgHeight);

    // Add new page for banner if it exists
    const bannerCard = document.getElementById("packageBannerCard");
    if (bannerCard && bannerCard.style.display !== "none") {
      pdf.addPage();

      const bannerCanvas = await html2canvas(bannerCard, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const bannerImgData = bannerCanvas.toDataURL('image/png');
      const bannerImgWidth = pageWidth - 20;
      const bannerImgHeight = (bannerCanvas.height * bannerImgWidth) / bannerCanvas.width;

      pdf.addImage(bannerImgData, 'PNG', 10, 10, bannerImgWidth, bannerImgHeight);
    }

    // Generate filename
    const data = collectFormData();
    const clientName = data.clientName ? data.clientName.replace(/[^a-z0-9]/gi, '_') : 'Client';
    const packageName = data.selectedPackage ? PACKAGES[data.selectedPackage].name.replace(/[^a-z0-9]/gi, '_') : 'Package';
    const date = new Date().toISOString().split('T')[0];
    const filename = `DesignAurora_${packageName}_${clientName}_${date}.pdf`;

    // Download PDF
    pdf.save(filename);

    // Reset button
    downloadBtn.textContent = "✓ PDF Generated!";
    setTimeout(() => {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    downloadBtn.textContent = "❌ Error - Try again";
    setTimeout(() => {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
    }, 2000);
  }
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

async function downloadBrochurePDF() {
  const downloadBtn = document.getElementById("downloadBrochureBtn");
  if (!downloadBtn) return;
  const originalText = downloadBtn.innerHTML;

  // Show loading state
  downloadBtn.innerHTML = '<span class="icon">⏳</span> Generating Brochure...';
  downloadBtn.disabled = true;

  let iframe = null;

  try {
    // Create a hidden iframe to load brochure.html
    iframe = document.createElement('iframe');
    // Using visibility: hidden instead of display: none to ensure it has a layout
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1000px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // Wait for brochure to load
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout loading brochure")), 10000);
      iframe.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load brochure.html"));
      };
      iframe.src = 'brochure.html';
    });

    const brochureDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Wait for images and fonts to be ready inside the iframe
    await brochureDoc.fonts.ready;
    const images = Array.from(brochureDoc.images);
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Don't block forever if image fails
      });
    }));

    // Small extra delay to ensure rendering is stable
    await new Promise(resolve => setTimeout(resolve, 500));

    const brochureBody = brochureDoc.body;

    // Use html2canvas on the brochure's body
    const canvas = await html2canvas(brochureBody, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#020617',
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If brochure is longer than one page, add it across pages
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('DesignAurora_Packages_Brochure.pdf');

    // Reset button
    downloadBtn.innerHTML = '<span class="icon">✓</span> Brochure Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }, 3000);

  } catch (error) {
    console.error('Error generating brochure PDF:', error);
    downloadBtn.innerHTML = '<span class="icon">❌</span> Error - Try again';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }, 3000);
  } finally {
    // Ensure iframe is removed
    if (iframe && iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}

function printBrochure() {
  const printWindow = window.open('brochure.html', '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      // Small delay to ensure styles and fonts are loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } else {
    alert("Please allow pop-ups to open the brochure for printing.");
  }
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

  // Update discount label with package name
  const discountPackageLabel = document.getElementById("discountPackageLabel");
  if (discountPackageLabel) {
    discountPackageLabel.textContent = `(${pkg.name})`;
  }

  const discountHelp = document.getElementById("discountHelp");
  if (discountHelp) {
    discountHelp.textContent = `${pkg.name} discount range: ${pkg.discountMin}% to ${pkg.discountMax}%`;
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

  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", downloadPackagePDF);
  }

  const downloadBrochureBtn = document.getElementById("downloadBrochureBtn");
  if (downloadBrochureBtn) {
    downloadBrochureBtn.addEventListener("click", downloadBrochurePDF);
  }

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

  // New Brochure Print Action
  const printBrochureBtn = document.getElementById("printBrochureBtn");
  if (printBrochureBtn) {
    printBrochureBtn.addEventListener("click", printBrochure);
  }
});


