import { useState, useMemo, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { calcularEstadoMembresia } from "../lib/membership";
import { useAuth } from "../contexts/AuthContext";
import UserCard from "./UserCard";
import UserFormModal from "./UserFormModal";

const FIREBASE_API_KEY = "AIzaSyCd2_9-2CrqWCSACLuM2QK14FTbzYAzbQg";

async function crearCuentaFirebase(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || "Error al crear la cuenta";
    throw new Error(msg);
  }
  return data.localId;
}

export default function AdminDashboard() {
  const { perfil, cerrarSesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usuarios"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      setUsuarios(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  const conteos = useMemo(() => {
    const c = { activo: 0, porVencer: 0, vencido: 0 };
    usuarios.forEach((u) => {
      const estado = calcularEstadoMembresia(u.fechaVencimiento);
      c[estado]++;
    });
    return c;
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda = u.nombre?.toLowerCase().includes(busqueda.toLowerCase());
      if (!coincideBusqueda) return false;
      if (filtro === "todos") return true;
      return calcularEstadoMembresia(u.fechaVencimiento) === filtro;
    });
  }, [usuarios, busqueda, filtro]);

  function abrirNuevo() {
    setUsuarioSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEdicion(usuario) {
    setUsuarioSeleccionado(usuario);
    setModalAbierto(true);
  }

  async function guardarUsuario(datos) {
    if (usuarioSeleccionado) {
      const { password, email, ...resto } = datos;
      await updateDoc(doc(db, "usuarios", usuarioSeleccionado.id), {
        ...resto,
        actualizadoEn: serverTimestamp(),
      });
    } else {
      const uid = await crearCuentaFirebase(datos.email.trim(), datos.password);
      const { password, ...datosUsuario } = datos;
      await setDoc(doc(db, "usuarios", uid), {
        ...datosUsuario,
        creadoEn: serverTimestamp(),
      });
      await setDoc(doc(db, "perfiles", uid), {
        rol: "usuario",
        nombre: datos.nombre,
        email: datos.email.trim(),
      });
    }
    setModalAbierto(false);
  }

  async function eliminarUsuario(usuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) return;
    await deleteDoc(doc(db, "usuarios", usuario.id));
    setModalAbierto(false);
  }

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-bone uppercase tracking-wide">
              Gimnasio <span className="text-forge-glow">Guerra</span>
            </h1>
            <p className="text-xs text-bone-dim">Hola, {perfil?.nombre || "Admin"}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-28">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Al día" valor={conteos.activo} tono="verde" />
          <StatCard label="Por vencer" valor={conteos.porVencer} tono="amarillo" />
          <StatCard label="Vencidos" valor={conteos.vencido} tono="rojo" />
        </div>

        <div className="space-y-3">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar usuario..."
            className="campo-input"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <FiltroChip activo={filtro === "todos"} onClick={() => setFiltro("todos")}>
              Todos ({usuarios.length})
            </FiltroChip>
            <FiltroChip activo={filtro === "activo"} onClick={() => setFiltro("activo")} tono="verde">
              Al día
            </FiltroChip>
            <FiltroChip activo={filtro === "porVencer"} onClick={() => setFiltro("porVencer")} tono="amarillo">
              Por vencer
            </FiltroChip>
            <FiltroChip activo={filtro === "vencido"} onClick={() => setFiltro("vencido")} tono="rojo">
              Vencidos
            </FiltroChip>
          </div>
        </div>

        {cargando ? (
          <p className="text-center text-bone-dim py-10">Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
            <p className="text-bone-dim">
              {usuarios.length === 0
                ? "Aún no hay usuarios registrados."
                : "No se encontraron usuarios con ese filtro."}
            </p>
            {usuarios.length === 0 && (
              <button onClick={abrirNuevo} className="mt-4 text-forge-glow font-medium underline">
                Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {usuariosFiltrados.map((u) => (
              <UserCard key={u.id} usuario={u} onClick={() => abrirEdicion(u)} />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={abrirNuevo}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-forge hover:bg-forge-glow text-carbon shadow-glow-gold flex items-center justify-center transition-transform active:scale-90"
        aria-label="Agregar usuario"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {modalAbierto && (
        <UserFormModal
          usuarioExistente={usuarioSeleccionado}
          onClose={() => setModalAbierto(false)}
          onSave={guardarUsuario}
          onDelete={eliminarUsuario}
        />
      )}
    </div>
  );
}

function StatCard({ label, valor, tono }) {
  const tonos = {
    verde: "text-emerald-400 border-emerald-500/30",
    amarillo: "text-amberwarn-glow border-amber-500/30",
    rojo: "text-blood-glow border-blood/30",
  };
  return (
    <div className={`bg-carbon-surface border rounded-xl p-3.5 text-center ${tonos[tono]}`}>
      <p className="font-display text-2xl">{valor}</p>
      <p className="text-xs text-bone-dim mt-0.5">{label}</p>
    </div>
  );
}

function FiltroChip({ activo, onClick, children, tono }) {
  const tonoActivo = {
    verde: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    amarillo: "bg-amber-500/15 border-amber-500/40 text-amberwarn-glow",
    rojo: "bg-blood/15 border-blood/40 text-blood-glow",
  };
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
        activo
          ? tono
            ? tonoActivo[tono]
            : "bg-forge/15 border-forge/40 text-forge-glow"
          : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"
      }`}
    >
      {children}
    </button>
  );
}