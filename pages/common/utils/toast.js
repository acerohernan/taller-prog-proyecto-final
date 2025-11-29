// Centralized Bootstrap toast helper
export function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = 2000;
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = "success", delay = 2500) {
  const container = ensureToastContainer();
  const toastEl = document.createElement("div");
  const bgClass =
    type === "success"
      ? "bg-success text-white"
      : type === "danger"
      ? "bg-danger text-white"
      : type === "warning"
      ? "bg-warning text-dark"
      : "bg-info text-white";
  toastEl.className = `toast align-items-center ${bgClass} border-0 my-2`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${String(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
    const bsToast = new bootstrap.Toast(toastEl, { delay, autohide: true });
    bsToast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  } else {
    // Fallback: remove after delay if Bootstrap is not available
    setTimeout(() => toastEl.remove(), delay + 300);
  }
}

export default showToast;
