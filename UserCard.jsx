import { calcularEstadoMembresia, calcularDiasRestantes, ESTADO_CONFIG, formatearFecha } from "../lib/membership";

export default function UserCard({ usuario, onClick, vistaAdmin = true }) {
  const estado = calcularEstadoMembresia(usuario.fechaVencimiento);
  const config = ESTADO_CONFIG[estado];
  const diasRestantes = calcularDiasRestantes(usuario.fechaVencimiento);

  let textoVencimiento;
  if (estado === "vencido") {
    textoVencimiento = `Vencido hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) === 1 ? "" : "s"}`;
  } else if (diasRestantes === 0) {
    textoVencimiento = "Vence hoy";
  } else {
    textoVencimiento = `Vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`;
  }

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left bg-carbon-surface border border-steel/40 rounded-lg overflow-hidden
        flex items-stretch transition-all duration-200
        hover:border-steel-light hover:-translate-y-0.5 hover:shadow-plate
        ${estado === "vencido" ? "hover:shadow-glow-red" : estado === "porVencer" ? "hover:shadow-glow-amber" : "hover:shadow-glow-green"}
      `}
    >
      {/* Barra lateral tipo disco de pesas — el indicador de estado */}
      <span
        className={`plate-bar w-2.5 shrink-0 ${config.barClass} ${estado === "vencido" ? "pulse-red" : ""}`}
        aria-hidden="true"
      />

      <div className="flex items-center gap-4 p-4 flex-1 min-w-0">
        {/* Foto */}
        <div className="shrink-0">
          {usuario.fotoURL ? (
            <img
              src={usuario.fotoURL}
              alt={usuario.nombre}
              className="w-14 h-14 rounded-full object-cover border-2 border-steel"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-carbon-raised border-2 border-steel flex items-center justify-center font-display text-bone-dim text-lg">
              {usuario.nombre?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-display text-bone text-base truncate tracking-wide">
            {usuario.nombre}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${config.badgeClass}`}>
              {config.label}
            </span>
            {usuario.tieneEntrenador && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border border-forge/40 bg-forge/10 text-forge-glow">
                Entrenador
              </span>
            )}
          </div>
          {vistaAdmin && (
            <p className="text-xs text-bone-dim mt-1.5 truncate">
              {textoVencimiento} · {formatearFecha(usuario.fechaVencimiento)}
            </p>
          )}
        </div>

        {/* Flecha */}
        <svg className="w-5 h-5 text-steel-light group-hover:text-bone-dim shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
