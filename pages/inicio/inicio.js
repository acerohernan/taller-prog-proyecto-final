import "../common/private-route.js";
import "../common/components/index.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "../common/firebase.js";
import { getOrCreateStatistics } from "../common/firestore.js";

const totalProductsElement = document.getElementById("total-products");
const totalSalidasElement = document.getElementById("total-salidas");
const totalEntradasElement = document.getElementById("total-entradas");

const loadingMessage = document.getElementById("loading-message");
const statisticsCards = document.getElementById("statistics-cards");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // show loader
  if (loadingMessage) loadingMessage.style.display = "flex";
  if (statisticsCards) statisticsCards.style.display = "none";

  try {
    const statistics = await getOrCreateStatistics(user.uid);

    if (totalProductsElement)
      totalProductsElement.textContent = statistics.totalProducts || 0;
    if (totalSalidasElement)
      totalSalidasElement.textContent = statistics.totalSalidas || 0;
    if (totalEntradasElement)
      totalEntradasElement.textContent = statistics.totalEntradas || 0;
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  } finally {
    // hide loader and show cards
    if (loadingMessage) loadingMessage.style.display = "none";
    if (statisticsCards) statisticsCards.style.display = "flex";
  }
});
