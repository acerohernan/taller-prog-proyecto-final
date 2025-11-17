import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import { getProductsByUser } from "../common/firestore.js";
import "../common/private-route.js";
import "../common/components/index.js";
import "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";

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
    `;
    tbody.appendChild(row);
  });

  productsTable.style.display = "block";
  productsAddButton.disabled = false;
  productsDownloadButton.disabled = false;
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
