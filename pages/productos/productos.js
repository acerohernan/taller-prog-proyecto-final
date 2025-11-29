import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import { getProductsByUser } from "../common/firestore.js";
import "../common/private-route.js";
import "../common/components/index.js";
import "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
import "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";

const loadingMessage = document.getElementById("loading-message");
const productsTable = document.getElementById("products-table");
const productsAddButton = document.getElementById("products-add-button");
const productsDownloadButton = document.getElementById(
  "products-download-button"
);

let currentProducts = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  loadingMessage.style.display = "flex";

  getProductsByUser(user.uid)
    .then(getProductsCallback)
    .finally(() => {
      loadingMessage.style.display = "none";
    });
});

productsDownloadButton.addEventListener("click", () => {
  downloadProductsExcel(currentProducts);
});

function getProductsCallback(products) {
  if (products.length === 0) {
    const noProductsMessage = document.createElement("div");
    noProductsMessage.className =
      "d-flex flex-column align-items-center justify-content-center h-50";
    noProductsMessage.innerHTML = `
      <p class="fs-4">No hay productos registrados.</p> 
      <p class="text-muted">Haz clic en el botón "+" para agregar nuevos productos.</p>
    `;
    loadingMessage.replaceWith(noProductsMessage);
    productsAddButton.disabled = false;
    return;
  }

  // Guardar los productos para usar en la descarga
  currentProducts = products;

  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = "";

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name || "-"}</td>
      <td>${product.code || "-"}</td>
      <td>$${product.price || "0"}</td>
      <td>${product.quantity || "0"}</td>
      <td class="text-center">
        <div class="d-flex align-items-center justify-content-center gap-2">
          <button
            class="btn btn-sm btn-outline-primary rounded-circle view-barcode"
            ${product.code ? `data-code="${product.code}"` : "disabled"}
            title="Ver código de barras"
            style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;"
          >
            <i class="bi bi-eye"></i>
          </button>
          <button
            class="btn btn-sm btn-outline-success rounded-circle download-barcode"
            ${product.code ? `data-code="${product.code}"` : "disabled"}
            title="Descargar código de barras"
            style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;"
          >
            <i class="bi bi-download"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  productsTable.style.display = "block";
  productsAddButton.disabled = false;
  productsDownloadButton.disabled = false;

  // Barcode modal logic
  const barcodeModalEl = document.getElementById("barcode-modal");
  const barcodeViewer = document.getElementById("barcode-viewer");
  const barcodeDownloadModalBtn = document.getElementById(
    "barcode-download-modal"
  );
  let currentBarcodeCanvas = null;
  let barcodeModalInstance = null;
  if (barcodeModalEl && window.bootstrap) {
    barcodeModalInstance = new bootstrap.Modal(barcodeModalEl);
  }

  function createBarcodeCanvas(code) {
    if (!window.JsBarcode) {
      throw new Error("JsBarcode library is not loaded");
    }
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, String(code), {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
      });
    } catch (err) {
      console.error("Error generating barcode:", err);
    }
    return canvas;
  }

  function downloadCanvasAsPng(canvas, filename) {
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Delegated click handlers for view/download buttons
  tbody.addEventListener("click", (event) => {
    const viewBtn = event.target.closest(".view-barcode");
    const downloadBtn = event.target.closest(".download-barcode");
    if (viewBtn) {
      const code = viewBtn.dataset.code;
      if (!code) return;
      try {
        const canvas = createBarcodeCanvas(code);
        currentBarcodeCanvas = canvas;
        if (barcodeViewer) {
          barcodeViewer.innerHTML = "";
          barcodeViewer.appendChild(canvas);
        }
        if (barcodeModalInstance) barcodeModalInstance.show();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (downloadBtn) {
      const code = downloadBtn.dataset.code;
      if (!code) return;
      try {
        const canvas = createBarcodeCanvas(code);
        const filename = `codigo_${code}.png`;
        downloadCanvasAsPng(canvas, filename);
      } catch (err) {
        console.error(err);
      }
      return;
    }
  });

  // Modal download button handler
  if (barcodeDownloadModalBtn) {
    barcodeDownloadModalBtn.addEventListener("click", () => {
      if (currentBarcodeCanvas) {
        const filename = `codigo_${Date.now()}.png`;
        downloadCanvasAsPng(currentBarcodeCanvas, filename);
      }
    });
  }
}

function downloadProductsExcel(products) {
  // Preparar los datos para el Excel
  const dataToExport = products.map((product) => ({
    Nombre: product.name,
    Código: product.code,
    Precio: product.price,
    Cantidad: product.quantity,
  }));

  // Crear un nuevo workbook
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  // Generar el archivo y descargarlo
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD
  XLSX.writeFile(wb, `productos_${timestamp}.xlsx`);
}
