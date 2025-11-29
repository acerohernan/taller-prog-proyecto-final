import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import { saveProduct, incrementStatistic } from "../common/firestore.js";
import { showToast } from "../common/utils/toast.js";
import "../common/private-route.js";
import "../common/components/index.js";

const productForm = document.getElementById("product-form");
const productName = document.getElementById("product-name");
const productPrice = document.getElementById("product-price");
const productCode = document.getElementById("product-code");
const productQuantity = document.getElementById("product-quantity");
const saveButton = document.querySelector("button[type='submit']");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

saveButton.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    showToast("No hay usuario autenticado", "danger");
    return;
  }

  if (!productForm.checkValidity()) {
    showToast("Por favor completa todos los campos requeridos", "warning");
    productForm.classList.add("was-validated");
    return;
  }

  saveButton.disabled = true;
  saveButton.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

  try {
    const productData = {
      nombre: productName.value,
      precio: parseFloat(productPrice.value),
      codigo: productCode.value,
      cantidad: parseInt(productQuantity.value),
      userId: currentUser.uid,
    };

    await saveProduct(productData);

    // Incrementar estadística de productos
    await incrementStatistic(currentUser.uid, "totalProducts");

    showToast("Producto guardado exitosamente", "success");

    // Limpiar formulario
    productForm.reset();

    // Redirigir a productos
    window.location.href = "./productos.html";
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    showToast("Error al guardar el producto: " + error.message, "danger");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = "Guardar";
  }
});
