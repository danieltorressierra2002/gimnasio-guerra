import { useEffect, useState } from "react";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { calcularEstadoMembresia, calcularDiasRestantes, ESTADO_CONFIG, formatearFecha } from "../lib/membership";
import Tienda from "./Tienda";

export default function UserDashboard() {
  const { perfil, cerrarSesion } = useAuth();
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [ofertasFlash, setOfertasFlash] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState("membresia");

  useEffect(() => {
    if (!perfil?.id) return;
    const unsub = onSnapshot(doc(db, "usuarios", perfil.id), (snap) => {
      setDatosUsuario(snap.exists() ? snap.data() : null);
      setCargando(false);
    });
    return unsub;
  }, [perfil?.id]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ofertasFlash"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOfertasFlash(lista.filter(o => o.activa));
    });
    return unsub;
  }, []);

  if (cargando) return <div className="min-h-screen bg-carbon flex items-center justify-center"><p className="text-bone-dim">Cargando...</p></div>;

  if (!datosUsuario) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-bone-dim">No se encontró tu información. Contacta al administrador.</p>
          <button onClick={cerrarSesion} className="mt-5 text-forge-glow underline">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const estado = calcularEstadoMembresia(datosUsuario.fechaVencimiento);
  const config = ESTADO_CONFIG[estado];
  const dias = calcularDiasRestantes(datosUsuario.fechaVencimiento);
  const esActivo = estado === "activo";

  // Filtrar ofertas según el estado de membresía
  const ofertasVisibles = ofertasFlash.filter(o =>
    o.visibilidad === "todos" || o.visibilidad === "publico" || (o.visibilidad === "miembros_activos" && esActivo)
  );

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg text-bone uppercase tracking-wide">GYM <span className="text-forge-glow">GUERRA</span></h1>
          <button onClick={cerrarSesion} className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors">Salir</button>
        </div>
        <div className="max-w-md mx-auto px-4 flex border-t border-steel/20">
          <NavTab activo={seccion === "membresia"} onClick={() => setSeccion("membresia")}>🏋️ Mi membresía</NavTab>
          <NavTab activo={seccion === "tienda"} onClick={() => setSeccion("tienda")}>🛒 Tienda</NavTab>
          {ofertasVisibles.length > 0 && (
            <NavTab activo={seccion === "ofertas"} onClick={() => setSeccion("ofertas")}>⚡ Ofertas</NavTab>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {seccion === "membresia" && (
          <>
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
              {datosUsuario.telefono && <Detalle label="Teléfono" valor={datosUsuario.telefono} />}
            </div>

            {/* Aviso si tiene ofertas exclusivas disponibles */}
            {esActivo && ofertasFlash.some(o => o.visibilidad === "miembros_activos" && o.activa) && (
              <button
                onClick={() => setSeccion("ofertas")}
                className="mt-4 w-full bg-blood/10 border border-blood/40 text-blood-glow font-medium py-3 rounded-xl text-sm transition-colors hover:bg-blood/15"
              >
                ⚡ Tienes ofertas exclusivas disponibles — ver ahora
              </button>
            )}

            {estado === "vencido" && <p className="text-center text-sm text-blood-glow mt-5">Acércate al administrador para renovar tu membresía.</p>}
            {estado === "porVencer" && <p className="text-center text-sm text-amberwarn-glow mt-5">Tu membresía está por vencer. ¡Renueva pronto!</p>}
          </>
        )}

        {seccion === "tienda" && <Tienda esAdmin={false} />}

        {seccion === "ofertas" && (
          <div className="space-y-4">
            {ofertasVisibles.length === 0 ? (
              <p className="text-center text-bone-dim py-10">No hay ofertas activas en este momento.</p>
            ) : (
              <>
                {!esActivo && ofertasFlash.some(o => o.visibilidad === "miembros_activos" && o.activa) && (
                  <div className="bg-steel/20 border border-steel/40 rounded-xl p-4 text-center">
                    <p className="text-bone-dim text-sm">🔒 Algunas ofertas son exclusivas para miembros con membresía activa.</p>
                  </div>
                )}
                {ofertasVisibles.map(oferta => (
                  <div key={oferta.id} className="bg-blood/10 border border-blood/40 rounded-xl p-4 flex items-start gap-4">
                    <span className="text-3xl shrink-0">{oferta.emoji || "⚡"}</span>
                    <div>
                      <p className="font-display text-bone uppercase tracking-wide">{oferta.titulo}</p>
                      <p className="text-sm text-bone-dim mt-0.5">{oferta.descripcion}</p>
                      {oferta.fechaFin && <p className="text-xs text-blood-glow mt-1">Válido hasta: {oferta.fechaFin}</p>}
                      {oferta.visibilidad === "miembros_activos" && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-forge/10 border border-forge/30 text-forge-glow">⭐ Exclusiva para miembros activos</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NavTab({ activo, onClick, children }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activo ? "border-forge text-forge-glow" : "border-transparent text-bone-dim hover:text-bone"}`}>
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
