import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [perfil, setPerfil] = useState(null); // datos extendidos: rol, nombre, etc.
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "perfiles", user.uid));
          if (snap.exists()) {
            setPerfil({ id: user.uid, ...snap.data() });
          } else {
            setPerfil(null);
          }
        } catch (err) {
          console.error("Error cargando perfil:", err);
          setPerfil(null);
        }
      } else {
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  async function iniciarSesion(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function cerrarSesion() {
    await signOut(auth);
  }

  const esAdmin = perfil?.rol === "admin";
  const esUsuario = perfil?.rol === "usuario";

  const value = {
    firebaseUser,
    perfil,
    cargando,
    esAdmin,
    esUsuario,
    iniciarSesion,
    cerrarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
