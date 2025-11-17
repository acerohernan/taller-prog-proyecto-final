import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registroButton = document.getElementById("registro-button");
const registroErrorMessage = document.getElementById("registro-error-message");

const registroForm = document.getElementById("registro-form");

registroButton.addEventListener("click", (e) => {
  e.preventDefault();

  registroErrorMessage.textContent = "";

  if (!registroForm.checkValidity()) {
    registroForm.reportValidity();
    return;
  }

  registroButton.disabled = true;

  const email = emailInput.value;
  const password = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Registro exitoso. Ahora puedes iniciar sesión.");

      window.location.href = "../login/login.html";
    })
    .catch((error) => {
      console.error("Error durante el registro:", error.code, error.message);

      registroErrorMessage.textContent =
        "Ocurrió un error al registrar el usuario. Inténtalo de nuevo.";
    })
    .finally(() => {
      registroButton.disabled = false;
    });
});
