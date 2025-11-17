import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import "../common/public-route.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const loginErrorMessage = document.getElementById("login-error-message");

const loginForm = document.getElementById("login-form");

loginButton.addEventListener("click", (e) => {
  e.preventDefault();

  loginErrorMessage.textContent = "";

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  loginButton.disabled = true;

  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error("Error durante el registro:", error.code, error.message);
      loginErrorMessage.textContent =
        "La constraseña o el correo son incorrectos. Inténtalo de nuevo.";
    })
    .finally(() => {
      loginButton.disabled = false;
    });
});
