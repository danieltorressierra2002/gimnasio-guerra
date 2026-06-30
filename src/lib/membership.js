/**
 * Lógica central de estado de membresía.
 *
 * Cada usuario tiene un campo `fechaVencimiento` (string ISO "YYYY-MM-DD")
 * que representa el último día en que su mes pagado sigue vigente.
 *
 * Estados:
 *  - "activo"   (verde)  -> faltan más de DIAS_ALERTA_AMARILLO días para vencer
 *  - "porVencer"(amarillo)-> faltan entre 0 y DIAS_ALERTA_AMARILLO días
 *  - "vencido"  (rojo)   -> la fecha de vencimiento ya pasó
 */

export const DIAS_ALERTA_AMARILLO = 5;

export function calcularDiasRestantes(fechaVencimiento) {
  if (!fechaVencimiento) return -Infinity;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimiento + "T00:00:00");
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((vencimiento.getTime() - hoy.getTime()) / msPorDia);
}

export function calcularEstadoMembresia(fechaVencimiento) {
  const dias = calcularDiasRestantes(fechaVencimiento);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_ALERTA_AMARILLO) return "porVencer";
  return "activo";
}

export const ESTADO_CONFIG = {
  activo: {
    label: "Al día",
    color: "verde",
    barClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    glow: "shadow-glow-green",
  },
  porVencer: {
    label: "Por vencer",
    color: "amarillo",
    barClass: "bg-amberwarn",
    dotClass: "bg-amberwarn",
    textClass: "text-amberwarn-glow",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    glow: "shadow-glow-amber",
  },
  vencido: {
    label: "Vencido",
    color: "rojo",
    barClass: "bg-blood",
    dotClass: "bg-blood",
    textClass: "text-blood-glow",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    glow: "shadow-glow-red",
  },
};

/**
 * Dada una fecha de inicio de pago (string ISO), devuelve la fecha
 * de vencimiento (1 mes después) en formato ISO "YYYY-MM-DD".
 */
export function calcularVencimientoDesdeInicio(fechaInicioISO) {
  const inicio = new Date(fechaInicioISO + "T00:00:00");
  const vencimiento = new Date(inicio);
  vencimiento.setMonth(vencimiento.getMonth() + 1);
  return vencimiento.toISOString().split("T")[0];
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO + "T00:00:00");
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function hoyISO() {
  return new Date().toISOString().split("T")[0];
}
