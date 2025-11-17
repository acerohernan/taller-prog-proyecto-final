import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ28z-alOEd94E1syssSG4GUO9Hv_3mdg",
  authDomain: "inventaria-3e635.firebaseapp.com",
  projectId: "inventaria-3e635",
  storageBucket: "inventaria-3e635.firebasestorage.app",
  messagingSenderId: "486800436605",
  appId: "1:486800436605:web:9c9426caa58c05910bb014",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
