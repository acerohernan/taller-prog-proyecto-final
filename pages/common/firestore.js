import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export const productsRef = collection(db, "products");
export const salidasRef = collection(db, "salidas");
export const entradasRef = collection(db, "entradas");

export const getProductsByUser = async (userId) => {
  const q = query(productsRef, where("userId", "==", userId));
  try {
    const querySnapshot = await getDocs(q);

    const listaDeElementos = [];
    querySnapshot.forEach((doc) => {
      listaDeElementos.push({ id: doc.id, ...doc.data() });
    });

    console.log(
      `Elementos encontrados para el usuario ${userId}:`,
      listaDeElementos
    );
    return listaDeElementos;
  } catch (error) {
    console.error("Error al obtener documentos: ", error);
  }
};

export const saveProduct = async (productData) => {
  try {
    // Guardar documento en Firestore
    const docRef = await addDoc(productsRef, {
      name: productData.nombre,
      price: productData.precio,
      code: productData.codigo,
      quantity: productData.cantidad,
      userId: productData.userId,
      createdAt: new Date(),
    });

    console.log("Producto guardado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    throw error;
  }
};

export const getSalidasByUser = async (userId) => {
  const q = query(salidasRef, where("userId", "==", userId));
  try {
    const querySnapshot = await getDocs(q);

    const listaDeElementos = [];
    querySnapshot.forEach((doc) => {
      listaDeElementos.push({ id: doc.id, ...doc.data() });
    });

    console.log(
      `Salidas encontradas para el usuario ${userId}:`,
      listaDeElementos
    );
    return listaDeElementos;
  } catch (error) {
    console.error("Error al obtener salidas: ", error);
  }
};

export const saveSalida = async (salidasData) => {
  try {
    // Calcular el monto total (suma de precios * cantidades)
    let amount = 0;
    const details = salidasData.products
      .filter((p) => p.quantity > 0)
      .map((p) => {
        amount += p.price * p.quantity;
        return {
          product: p.name,
          quantity: p.quantity,
        };
      });

    // Guardar documento en Firestore
    const docRef = await addDoc(salidasRef, {
      amount,
      date: new Date(),
      details: JSON.stringify(details),
      userId: salidasData.userId,
      createdAt: new Date(),
    });

    console.log("Salida guardada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar la salida:", error);
    throw error;
  }
};

export const updateProductQuantities = async (products) => {
  try {
    // Actualizar la cantidad de cada producto
    await Promise.all(
      products
        .filter((p) => p.quantity > 0) // Solo actualizar productos con cantidad > 0
        .map((p) =>
          updateDoc(doc(db, "products", p.id), {
            quantity: Math.max(
              0,
              (p.originalQuantity || p.quantity) - p.quantity
            ),
          })
        )
    );

    console.log("Cantidades de productos actualizadas");
  } catch (error) {
    console.error("Error al actualizar cantidades de productos:", error);
    throw error;
  }
};

export const getEntradasByUser = async (userId) => {
  const q = query(entradasRef, where("userId", "==", userId));
  try {
    const querySnapshot = await getDocs(q);

    const listaDeElementos = [];
    querySnapshot.forEach((doc) => {
      listaDeElementos.push({ id: doc.id, ...doc.data() });
    });

    console.log(
      `Entradas encontradas para el usuario ${userId}:`,
      listaDeElementos
    );
    return listaDeElementos;
  } catch (error) {
    console.error("Error al obtener entradas: ", error);
  }
};

export const saveEntrada = async (entradasData) => {
  try {
    // Calcular el monto total (suma de precios * cantidades)
    let amount = 0;
    const details = entradasData.products
      .filter((p) => p.quantity > 0)
      .map((p) => {
        amount += p.price * p.quantity;
        return {
          product: p.name,
          quantity: p.quantity,
        };
      });

    // Guardar documento en Firestore
    const docRef = await addDoc(entradasRef, {
      amount,
      date: new Date(),
      details: JSON.stringify(details),
      userId: entradasData.userId,
      createdAt: new Date(),
    });

    console.log("Entrada guardada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar la entrada:", error);
    throw error;
  }
};

export const updateProductQuantitiesAdd = async (products) => {
  try {
    // Actualizar la cantidad de cada producto sumando
    await Promise.all(
      products
        .filter((p) => p.quantity > 0) // Solo actualizar productos con cantidad > 0
        .map((p) =>
          updateDoc(doc(db, "products", p.id), {
            quantity: (p.originalQuantity || 0) + p.quantity,
          })
        )
    );

    console.log("Cantidades de productos actualizadas (suma)");
  } catch (error) {
    console.error("Error al actualizar cantidades de productos:", error);
    throw error;
  }
};

export const getOrCreateStatistics = async (userId) => {
  try {
    const statisticsRef = collection(db, "statistics");
    const q = query(statisticsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc_data = querySnapshot.docs[0];
      return { id: doc_data.id, ...doc_data.data() };
    } else {
      // Crear documento de estadísticas si no existe
      const docRef = await addDoc(statisticsRef, {
        userId,
        totalProducts: 0,
        totalSalidas: 0,
        totalEntradas: 0,
        createdAt: new Date(),
      });
      return {
        id: docRef.id,
        userId,
        totalProducts: 0,
        totalSalidas: 0,
        totalEntradas: 0,
      };
    }
  } catch (error) {
    console.error("Error al obtener/crear estadísticas:", error);
    throw error;
  }
};

export const incrementStatistic = async (userId, field) => {
  try {
    const statistics = await getOrCreateStatistics(userId);
    const statisticsRef = doc(db, "statistics", statistics.id);

    await updateDoc(statisticsRef, {
      [field]: (statistics[field] || 0) + 1,
    });

    console.log(`Estadística ${field} incrementada`);
  } catch (error) {
    console.error(`Error al incrementar estadística ${field}:`, error);
    throw error;
  }
};
