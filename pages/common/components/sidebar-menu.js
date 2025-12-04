import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

class SidebarMenu extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
        <div class="d-flex flex-column flex-shrink-0 dashboard-sidebar">
        <a
          href="/"
          class="d-flex align-items-center justify-content-center link-dark text-decoration-none pt-2"
        >
          <img
            class="dashboard-sidebar-logo"
            src="../../images/logo.png"
            class="logo"
          />
        </a>
        <hr class="dropdown-divider" />
        <ul class="nav nav-pills nav-flush flex-column mb-auto text-center">
          <li class="nav-item">
            <a
              href="/pages/inicio/inicio.html"
              class="nav-link py-3 border-bottom d-flex align-items-center justify-content-center justify-content-md-start px-3"
              id="nav-link-inicio"
              data-section="inicio"
              data-bs-toggle="tooltip" 
              data-bs-placement="right" 
              title="Contiene las estadísticas generales del inventario."
            >
              <i class="bi bi-house-door fs-4"></i>
              <span class="ms-2 d-none d-md-inline">Inicio</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              href="/pages/productos/productos.html"
              class="nav-link py-3 border-bottom d-flex align-items-center justify-content-center justify-content-md-start px-3"
              id="nav-link-products"
              data-section="productos"
              data-bs-toggle="tooltip" 
              data-bs-placement="right" 
              title="Contiene los productos registrados y permite registrar nuevos."
            >
              <i class="bi bi-grid fs-4"></i>
              <span class="ms-2 d-none d-md-inline">Productos</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              href="/pages/entradas/entradas.html"
              class="nav-link py-3 border-bottom d-flex align-items-center justify-content-center justify-content-md-start px-3"
              id="nav-link-entradas"
              data-section="entradas"
              data-bs-toggle="tooltip" 
              data-bs-placement="right" 
              title="Contiene las entradas registradas y permite crear nuevas."
            >
              <i class="bi bi-box-arrow-right fs-4"></i>
              <span class="ms-2 d-none d-md-inline">Entradas</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              href="/pages/salidas/salidas.html"
              class="nav-link py-3 border-bottom d-flex align-items-center justify-content-center justify-content-md-start px-3"
              id="nav-link-salidas"
              data-section="salidas"
              data-bs-toggle="tooltip" 
              data-bs-placement="right" 
              title="Contiene las salidas registradas y permite crear nuevas."
            >
              <i class="bi bi-box-arrow-left fs-4"></i>
              <span class="ms-2 d-none d-md-inline">Salidas</span>
            </a>
          </li>
          
        </ul>
        <div class="dropdown border-top">
          <a
            href="#"
            class="d-flex align-items-center justify-content-center p-3 link-dark text-decoration-none dropdown-toggle"
            id="dropdownUser3"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img
              src="../../images/user-placeholder.svg"
              alt="mdo"
              width="24"
              height="24"
              class="rounded-circle"
            />
          </a>
          <ul
            class="dropdown-menu text-small shadow"
            aria-labelledby="dropdownUser3"
          >
            <li>
              <button class="dropdown-item" id="logout-button">
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    `;
    this.style.height = "100%";

    // Cambiar el color del link activo
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const section = link.dataset.section;
      // Verifica si la ruta contiene la carpeta
      if (currentPath.includes(`/pages/${section}/`)) {
        if (section === "salidas") {
          link.classList.add("active-salidas");
        } else if (section === "entradas") {
          link.classList.add("active-entradas");
        } else {
          link.classList.add("active");
        }
      } else {
        link.classList.remove("active");
        link.classList.remove("active-salidas");
        link.classList.remove("active-entradas");
      }
    });

    // Agregar la lógica de cerrar sesión
    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", () => {
      logoutButton.disable = true;
      signOut(auth)
        .catch((error) => {
          console.error("Error signing out:", error);
        })
        .finally(() => {
          logoutButton.disable = false;
        });
    });
  }
}

customElements.define("sidebar-menu", SidebarMenu);
