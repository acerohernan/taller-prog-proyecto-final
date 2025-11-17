class ProductQuantityList extends HTMLElement {
  constructor() {
    super();
    this._products = [];
    this._quantities = {}; // Almacena cantidades de salida por producto (inicialmente 0)
    this._hasStockLimit = true; // Por defecto hay límite de stock
    this.attachShadow({ mode: "open" });
  }

  set products(value) {
    this._products = Array.isArray(value) ? value : [];
    // Inicializar cantidades en 0 para cada producto
    this._quantities = {};
    this._products.forEach((p) => {
      this._quantities[p.id] = 0;
    });
    this.render();
  }

  get products() {
    // Retornar productos con sus cantidades de salida
    return this._products.map((p) => ({
      ...p,
      quantity: this._quantities[p.id] || 0,
    }));
  }

  set hasStockLimit(value) {
    this._hasStockLimit = value;
  }

  get hasStockLimit() {
    return this._hasStockLimit;
  }

  connectedCallback() {
    // Leer atributo hasStockLimit si existe
    if (this.hasAttribute("no-stock-limit")) {
      this._hasStockLimit = false;
    }
    this.render();
  }

  render() {
    const style = `
      :host {
        display: block;
      }
      .list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      @media (min-width: 768px) {
        .list {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .card {
        border: 1px solid #e6e6e6;
        border-radius: 12px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: #fff;
      }
      .left {
        display: flex;
        flex-direction: column;
      }
      .name {
        font-weight: 600;
        font-size: 1rem;
      }
      .meta {
        color: #666;
        font-size: 0.85rem;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      button {
        border: none;
        background: transparent;
        font-size: 1.25rem;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        cursor: pointer;
      }
      button:active { transform: scale(0.98); }
      .count {
        min-width: 28px;
        text-align: center;
        font-size: 1.1rem;
      }
    `;

    const itemsHtml =
      this._products
        .map((p) => {
          const salida = this._quantities[p.id] || 0;
          return `
          <div class="card" data-id="${p.id || ""}">
            <div class="left">
              <div class="name">${this._escapeHtml(p.name || "Untitled")}</div>
              <div class="meta">Código: ${this._escapeHtml(p.code || "-")}</div>
              <div class="meta">Stock: ${p.quantity || 0}</div>
            </div>
            <div class="controls">
              <button class="decrease" title="Restar">-</button>
              <div class="count">${salida}</div>
              <button class="increase" title="Agregar">+</button>
            </div>
          </div>
        `;
        })
        .join("\n") || `<div class=\"meta\">No hay productos</div>`;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="list">${itemsHtml}</div>
    `;

    // Attach event listeners
    this.shadowRoot.querySelectorAll(".card").forEach((card) => {
      const id = card.getAttribute("data-id");
      const incBtn = card.querySelector(".increase");
      const decBtn = card.querySelector(".decrease");
      const countEl = card.querySelector(".count");

      // Obtener el stock máximo del producto
      const product = this._products.find((p) => p.id === id);
      const maxStock = product?.quantity || 0;
      const current = this._quantities[id] || 0;

      // Establecer estado inicial de botones
      this._updateButtonStates(decBtn, incBtn, current, maxStock);

      incBtn.addEventListener("click", () => {
        const current = parseInt(countEl.textContent, 10) || 0;
        const next = Math.min(current + 1, maxStock);
        countEl.textContent = next;
        this._quantities[id] = next;
        this._updateButtonStates(decBtn, incBtn, next, maxStock);
        this._emitChange(id, next);
      });

      decBtn.addEventListener("click", () => {
        const current = parseInt(countEl.textContent, 10) || 0;
        const next = Math.max(0, current - 1);
        countEl.textContent = next;
        this._quantities[id] = next;
        this._updateButtonStates(decBtn, incBtn, next, maxStock);
        this._emitChange(id, next);
      });
    });
  }

  _updateButtonStates(decBtn, incBtn, current, maxStock) {
    // Deshabilitar decrecer si es 0
    decBtn.disabled = current === 0;
    // Deshabilitar agregar si tiene límite y alcanza el stock máximo
    incBtn.disabled = this._hasStockLimit && current >= maxStock;
  }

  _emitChange(productId, newQuantity) {
    this.dispatchEvent(
      new CustomEvent("quantity-change", {
        detail: { productId, quantity: newQuantity },
        bubbles: true,
        composed: true,
      })
    );
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

customElements.define("product-quantity-list", ProductQuantityList);
