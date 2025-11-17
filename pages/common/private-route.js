import { auth } from "../common/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Si el usuario no está autenticado, redirigir a la página de login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../login/login.html";
  }
});
