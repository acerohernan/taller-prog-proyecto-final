import "../common/private-route.js";
import "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import {
  getProductsByUser,
  saveSalida,
  updateProductQuantities,
  incrementStatistic,
} from "../common/firestore.js";
import { showToast } from "../common/utils/toast.js";
import { playScannerBeep } from "../common/utils/audio.js";

const html5QrCode = new Html5Qrcode("scanner-reader", false);

let productsData = [];
let productsLoaded = false;
let scannedProducts = [];
let currentUser = null;
let scannerStarted = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUser = user;

  showToast("Cargando productos de la base de datos...", "info");

  // Show loader while fetching products
  showLoader();

  try {
    productsData = (await getProductsByUser(user.uid)) || [];
    productsLoaded = true;

    showToast("Productos cargados, iniciando scanner...", "info");

    startScannerIfReady();
  } catch (error) {
    showToast("Error al cargar productos", "danger");
    productsLoaded = false;
  }
});

function showLoader() {
  const el = document.getElementById("scanner-loading");
  if (el) el.classList.remove("d-none");
}

function hideLoader() {
  const el = document.getElementById("scanner-loading");
  if (el) el.classList.add("d-none");
}

const config = { fps: 10, qrbox: { width: 250, height: 250 } };

async function startScannerIfReady() {
  if (!productsLoaded) return;
  if (scannerStarted) return;
  scannerStarted = true;
  showLoader();
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback
    );
    hideLoader();
  } catch (err) {
    console.error("Error starting scanner:", err);
    showToast(
      "No se pudo iniciar el scanner: " +
        (err && err.message ? err.message : String(err)),
      "danger"
    );
    scannerStarted = false;
  }
}

// Retain the last decoded value to avoid duplicate rapid toasts
let lastDecodedValue = null;
let lastDecodedTimestamp = 0;

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
  const code = String(decodedText || "").trim();
  const now = Date.now();

  // Si es el mismo código dentro de los 1.5 segundos, ignorar
  if (lastDecodedValue === code && now - lastDecodedTimestamp < 1500) {
    return;
  }

  lastDecodedValue = code;
  lastDecodedTimestamp = now;

  // Si los productos no han cargado, mostrar mensaje de advertencia
  if (!productsLoaded) {
    showToast(
      "Cargando productos... inténtalo de nuevo en unos segundos",
      "warning"
    );
    return;
  }

  const product = productsData.find((p) => String(p.code).trim() === code);

  if (!product) {
    showToast(
      `Producto no encontrado: ${code}`.replace(/undefined/g, ""),
      "danger"
    );
    return;
  }

  addScannedProduct(product);
  const added = scannedProducts.find(
    (p) => (p.id || p.code) === (product.id || String(product.code || ""))
  );
  const countMsg = added && added.quantity ? ` (x${added.quantity})` : "";

  playScannerBeep();

  showToast(
    `Producto agregado: ${product.name}${countMsg}`.replace(/undefined/g, ""),
    "success"
  );
};

// Añadir un producto a la lista de escaneados
function addScannedProduct(product) {
  const identifier = product.id || String(product.code || "");
  const existing = scannedProducts.find((p) => (p.id || p.code) === identifier);
  if (existing) {
    existing.quantity = (existing.quantity || 0) + 1;
  } else {
    scannedProducts.push({
      id: product.id || identifier,
      name: product.name || "",
      code: product.code || "",
      quantity: 1,
      price: product.price || 0,
    });
  }
  updateScannedCountBadge();
}

// Pintar el resumen de productos escaneados en el modal
function populateSummaryModal() {
  const tbody = document.getElementById("scan-summary-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!scannedProducts || scannedProducts.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan=3 class='text-center text-muted'>No hay productos escaneados.</td>`;
    tbody.appendChild(tr);
    return;
  }

  scannedProducts.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${String(p.code)}</td>
      <td>${p.quantity}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Register modal button behavior once DOM is loaded
function registerModalHandlers() {
  const btnSummary = document.getElementById("btn-summary");
  const btnSave = document.getElementById("btn-save-salida");
  const modalEl = document.getElementById("scan-summary-modal");
  let bsModal = null;
  if (modalEl) {
    bsModal = new bootstrap.Modal(modalEl, { backdrop: true });
  }

  if (btnSummary) {
    btnSummary.addEventListener("click", () => {
      populateSummaryModal();
      if (bsModal) bsModal.show();
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      if (!scannedProducts || scannedProducts.length === 0) {
        showToast("No hay productos para guardar", "warning");
        return;
      }
      if (!currentUser) {
        showToast("Usuario no autenticado", "danger");
        return;
      }

      btnSave.disabled = true;
      const previousHtml = btnSave.innerHTML;
      btnSave.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

      try {
        await saveSalida({
          products: scannedProducts,
          userId: currentUser.uid,
        });

        const productsToUpdate = scannedProducts.map((p) => ({
          id: p.id,
          quantity: p.quantity,
          originalQuantity:
            productsData.find(
              (pd) => (pd.id || String(pd.code)) === (p.id || p.code)
            )?.quantity || 0,
        }));
        await updateProductQuantities(productsToUpdate);

        // Increment stats
        await incrementStatistic(currentUser.uid, "totalSalidas");

        showToast("Salida guardada exitosamente", "success");

        // Stop the scanner and redirect to salidas
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
        } catch (stopErr) {
          console.warn("No se pudo detener el scanner correctamente:", stopErr);
        }

        // Give a small delay to allow UI cleanup, then redirect
        setTimeout(() => {
          window.location.href = "../salidas/salidas.html";
        }, 500);
      } catch (error) {
        console.error("Error al guardar la salida:", error);
        showToast(
          "Error al guardar la salida: " +
            (error && error.message ? error.message : String(error)),
          "danger"
        );
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = previousHtml;
      }
      // Clear current list locally and update badge
      scannedProducts = [];
      updateScannedCountBadge();
      if (bsModal) bsModal.hide();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", registerModalHandlers);
} else {
  registerModalHandlers();
}

// Actualizar el badge con la cantidad de productos escaneados
function updateScannedCountBadge() {
  const badge = document.getElementById("scanned-count");
  if (!badge) return;
  const count = scannedProducts.length;
  if (count <= 0) {
    badge.classList.add("d-none");
    return;
  }
  badge.classList.remove("d-none");
  badge.textContent = count;
}
