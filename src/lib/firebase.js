import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Reemplaza estos valores con los de tu proyecto de Firebase
// (Firebase Console > Configuración del proyecto > Tus apps > Config SDK)
const firebaseConfig = {
  apiKey: "AIzaSyCd2_9-2CrqWCSACLuM2QK14FTbzYAzbQg",
  authDomain: "gymguerra-fb628.firebaseapp.com",
  projectId: "gymguerra-fb628",
  storageBucket: "gymguerra-fb628.firebasestorage.app",
  messagingSenderId: "840060700076",
  appId: "1:840060700076:web:7a9fe613eff110f6ae2609",
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
