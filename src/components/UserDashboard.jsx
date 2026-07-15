import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  calcularEstadoMembresia,
  calcularDiasRestantes,
  ESTADO_CONFIG,
  formatearFecha,
} from "../lib/membership";
import Tienda from "./Tienda";

export default function UserDashboard() {
  const { perfil, cerrarSesion } = useAuth();
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState("membresia");
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  useEffect(() => {
    if (!perfil?.id) return;
    const unsub = onSnapshot(doc(db, "usuarios", perfil.id), (snap) => {
      setDatosUsuario(snap.exists() ? snap.data() : null);
      setCargando(false);
    });
    return unsub;
  }, [perfil?.id]);

  async function cambiarPassword(e) {
    e.preventDefault();
    setErrorPassword("");
    setMensajePassword("");

    if (passwordNueva.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres."); return;
    }
    if (passwordNueva !== passwordConfirm) {
      setErrorPassword("Las contraseñas no coinciden."); return;
    }

    setCambiandoPassword(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordNueva);

      // Limpiar la contraseña temporal de Firestore
      await updateDoc(doc(db, "usuarios", perfil.id), { passwordTemporal: "" });

      setMensajePassword("✓ Contraseña cambiada exitosamente.");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
      setTimeout(() => setMostrarCambioPassword(false), 2000);
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorPassword("La contraseña actual es incorrecta.");
      } else {
        setErrorPassword(err.message || "Error al cambiar la contraseña.");
      }
    } finally {
      setCambiandoPassword(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <p className="text-bone-dim">Cargando tu membresía...</p>
      </div>
    );
  }

  if (!datosUsuario) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-bone-dim">No se encontró tu información de membresía.</p>
          <button onClick={cerrarSesion} className="mt-5 text-forge-glow underline">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const estado = calcularEstadoMembresia(datosUsuario.fechaVencimiento);
  const config = ESTADO_CONFIG[estado];
  const dias = calcularDiasRestantes(datosUsuario.fechaVencimiento);
  const tienePasswordTemporal = datosUsuario.passwordTemporal && datosUsuario.passwordTemporal.trim();

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg text-bone uppercase tracking-wide">
            GYM <span className="text-forge-glow">GUERRA</span>
          </h1>
          <button onClick={cerrarSesion} className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors">
            Salir
          </button>
        </div>
        <div className="max-w-md mx-auto px-4 flex border-t border-steel/20">
          <NavTab activo={seccion === "membresia"} onClick={() => setSeccion("membresia")}>🏋️ Mi membresía</NavTab>
          <NavTab activo={seccion === "tienda"} onClick={() => setSeccion("tienda")}>🛒 Tienda</NavTab>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {seccion === "membresia" && (
          <>
            {/* Aviso de contraseña temporal */}
            {tienePasswordTemporal && !mostrarCambioPassword && (
              <div className="mb-5 bg-amberwarn/10 border border-amberwarn/40 rounded-xl p-4">
                <p className="text-sm text-amberwarn-glow font-medium">⚠️ Tienes una contraseña temporal</p>
                <p className="text-xs text-bone-dim mt-1">
                  Tu contraseña temporal es: <span className="font-bold text-bone">{datosUsuario.passwordTemporal}</span>
                </p>
                <p className="text-xs text-bone-dim mt-1">Por seguridad, cámbiala ahora.</p>
                <button
                  onClick={() => setMostrarCambioPassword(true)}
                  className="mt-3 w-full bg-amberwarn/20 border border-amberwarn/40 text-amberwarn-glow font-medium py-2 rounded-lg text-sm"
                >
                  Cambiar contraseña ahora
                </button>
              </div>
            )}

            {/* Formulario cambio de contraseña */}
            {mostrarCambioPassword && (
              <div className="mb-5 bg-carbon-surface border border-steel/40 rounded-xl p-4">
                <h3 className="font-display text-bone uppercase tracking-wide mb-4">Cambiar contraseña</h3>
                <form onSubmit={cambiarPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs text-bone-dim mb-1">Contraseña actual</label>
                    <input type="password" required value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} className="campo-input" placeholder={tienePasswordTemporal ? datosUsuario.passwordTemporal : "Tu contraseña actual"} />
                  </div>
                  <div>
                    <label className="block text-xs text-bone-dim mb-1">Nueva contraseña</label>
                    <input type="password" required value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} className="campo-input" placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-xs text-bone-dim mb-1">Confirmar nueva contraseña</label>
                    <input type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="campo-input" placeholder="Repite la nueva contraseña" />
                  </div>
                  {errorPassword && <p className="text-xs text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">{errorPassword}</p>}
                  {mensajePassword && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{mensajePassword}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMostrarCambioPassword(false)} className="flex-1 border border-steel/40 text-bone-dim py-2.5 rounded-lg text-sm">Cancelar</button>
                    <button type="submit" disabled={cambiandoPassword} className="flex-1 bg-forge text-carbon font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                      {cambiandoPassword ? "Cambiando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tarjeta de estado */}
            <div
              className={`bg-carbon-surface border-2 rounded-2xl p-6 text-center shadow-plate ${config.glow}`}
              style={{ borderColor: estado === "vencido" ? "#DC2626" : estado === "porVencer" ? "#D97706" : "#22C55E" }}
            >
              <div className="flex justify-center mb-4">
                {datosUsuario.fotoURL ? (
                  <img src={datosUsuario.fotoURL} alt={datosUsuario.nombre} className="w-24 h-24 rounded-full object-cover border-2 border-steel" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-carbon-raised border-2 border-steel flex items-center justify-center font-display text-bone-dim text-3xl">
                    {datosUsuario.nombre?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <h2 className="font-display text-2xl text-bone tracking-wide">{datosUsuario.nombre}</h2>
              <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border ${config.badgeClass}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
                <span className="font-display uppercase tracking-wide text-sm">{config.label}</span>
              </div>
              <p className="text-bone-dim text-sm mt-4">
                {estado === "vencido"
                  ? `Tu membresía venció el ${formatearFecha(datosUsuario.fechaVencimiento)}.`
                  : `Vence el ${formatearFecha(datosUsuario.fechaVencimiento)} (${dias} día${dias === 1 ? "" : "s"} restante${dias === 1 ? "" : "s"}).`}
              </p>
            </div>

            {/* Detalles */}
            <div className="mt-5 bg-carbon-surface border border-steel/40 rounded-xl divide-y divide-steel/30">
              <Detalle label="Método de pago" valor={datosUsuario.metodoPago === "online" ? "Pago en línea" : "Pago directo"} />
              <Detalle label="Entrenador personal" valor={datosUsuario.tieneEntrenador ? "Sí" : "No"} />
              <Detalle label="Inicio del periodo" valor={formatearFecha(datosUsuario.fechaInicioPago)} />
              {datosUsuario.telefono && <Detalle label="Teléfono registrado" valor={datosUsuario.telefono} />}
            </div>

            {/* Botón cambiar contraseña */}
            {!mostrarCambioPassword && !tienePasswordTemporal && (
              <button
                onClick={() => setMostrarCambioPassword(true)}
                className="mt-4 w-full border border-steel/40 text-bone-dim hover:border-forge hover:text-forge-glow py-3 rounded-xl text-sm transition-colors"
              >
                🔑 Cambiar mi contraseña
              </button>
            )}

            {estado === "vencido" && (
              <p className="text-center text-sm text-blood-glow mt-5">Acércate al administrador para renovar tu membresía.</p>
            )}
            {estado === "porVencer" && (
              <p className="text-center text-sm text-amberwarn-glow mt-5">Tu membresía está por vencer. ¡Renueva pronto!</p>
            )}
          </>
        )}

        {seccion === "tienda" && <Tienda esAdmin={false} />}
      </main>
    </div>
  );
}

function NavTab({ activo, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activo ? "border-forge text-forge-glow" : "border-transparent text-bone-dim hover:text-bone"}`}>
      {children}
    </button>
  );
}

function Detalle({ label, valor }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-bone-dim">{label}</span>
      <span className="text-sm font-medium text-bone">{valor}</span>
    </div>
  );
}

