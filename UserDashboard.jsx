import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  calcularEstadoMembresia,
  calcularDiasRestantes,
  ESTADO_CONFIG,
  formatearFecha,
} from "../lib/membership";

export default function UserDashboard() {
  const { perfil, cerrarSesion } = useAuth();
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!perfil?.id) return;
    const unsub = onSnapshot(doc(db, "usuarios", perfil.id), (snap) => {
      setDatosUsuario(snap.exists() ? snap.data() : null);
      setCargando(false);
    });
    return unsub;
  }, [perfil?.id]);

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
          <p className="text-bone-dim text-sm mt-1">Contacta al administrador del gimnasio.</p>
          <button onClick={cerrarSesion} className="mt-5 text-forge-glow underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const estado = calcularEstadoMembresia(datosUsuario.fechaVencimiento);
  const config = ESTADO_CONFIG[estado];
  const dias = calcularDiasRestantes(datosUsuario.fechaVencimiento);

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg text-bone uppercase tracking-wide">
            Gimnasio <span className="text-forge-glow">Guerra</span>
          </h1>
          <button
            onClick={cerrarSesion}
            className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {/* Tarjeta principal de estado */}
        <div
          className={`bg-carbon-surface border-2 rounded-2xl p-6 text-center shadow-plate ${config.glow}`}
          style={{ borderColor: estado === "vencido" ? "#DC2626" : estado === "porVencer" ? "#D97706" : "#22C55E" }}
        >
          <div className="flex justify-center mb-4">
            {datosUsuario.fotoURL ? (
              <img
                src={datosUsuario.fotoURL}
                alt={datosUsuario.nombre}
                className="w-24 h-24 rounded-full object-cover border-2 border-steel"
              />
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

        {estado === "vencido" && (
          <p className="text-center text-sm text-blood-glow mt-5">
            Acércate al administrador para renovar tu membresía y volver a entrenar sin interrupciones.
          </p>
        )}
        {estado === "porVencer" && (
          <p className="text-center text-sm text-amberwarn-glow mt-5">
            Tu membresía está por vencer. Renueva pronto para mantenerte activo.
          </p>
        )}
      </main>
    </div>
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
