import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatearFecha } from "../lib/membership";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

export default function HistorialPagos() {
  const [usuarios, setUsuarios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString());
  const [usuarioFiltro, setUsuarioFiltro] = useState("todos");

  useEffect(() => {
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubHistorial = onSnapshot(
      query(collection(db, "historialPagos"), orderBy("fechaPago", "desc")),
      (snap) => {
        setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCargando(false);
      }
    );
    return () => { unsubUsuarios(); unsubHistorial(); };
  }, []);

  const pagosFiltrados = historial.filter((p) => {
    const fecha = p.fechaPago || "";
    const coincideAnio = filtroAnio ? fecha.startsWith(filtroAnio) : true;
    const coincideMes = filtroMes ? fecha.startsWith(`${filtroAnio}-${filtroMes}`) : true;
    const coincideUsuario = usuarioFiltro === "todos" ? true : p.usuarioId === usuarioFiltro;
    return coincideAnio && coincideMes && coincideUsuario;
  });

  // Estadísticas
  const totalPagos = pagosFiltrados.length;
  const usuariosPagaron = new Set(pagosFiltrados.map(p => p.usuarioId)).size;
  const pagoDirecto = pagosFiltrados.filter(p => p.metodoPago === "directo").length;
  const pagoOnline = pagosFiltrados.filter(p => p.metodoPago === "online").length;

  function exportarExcel() {
    const datos = pagosFiltrados.map((p) => ({
      "Nombre": p.nombreUsuario || "—",
      "Fecha de pago": p.fechaPago || "—",
      "Fecha inicio período": p.fechaInicioPago || "—",
      "Fecha vencimiento": p.fechaVencimiento || "—",
      "Método de pago": p.metodoPago === "online" ? "Pago en línea" : "Pago directo",
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de Pagos");

    // Ajustar ancho de columnas
    ws["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
    ];

    const nombreArchivo = `GymGuerra_Pagos_${filtroAnio}${filtroMes ? "_" + filtroMes : ""}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }

  const meses = [
    { valor: "01", label: "Enero" }, { valor: "02", label: "Febrero" },
    { valor: "03", label: "Marzo" }, { valor: "04", label: "Abril" },
    { valor: "05", label: "Mayo" }, { valor: "06", label: "Junio" },
    { valor: "07", label: "Julio" }, { valor: "08", label: "Agosto" },
    { valor: "09", label: "Septiembre" }, { valor: "10", label: "Octubre" },
    { valor: "11", label: "Noviembre" }, { valor: "12", label: "Diciembre" },
  ];

  const anios = ["2025", "2026", "2027", "2028"];

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="bg-carbon-surface border border-steel/40 rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium text-bone-dim uppercase tracking-wide">Filtrar por</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-bone-dim mb-1">Año</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="campo-input">
              <option value="">Todos</option>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-bone-dim mb-1">Mes</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="campo-input">
              <option value="">Todos</option>
              {meses.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-bone-dim mb-1">Usuario</label>
          <select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)} className="campo-input">
            <option value="todos">Todos los usuarios</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total pagos" valor={totalPagos} />
        <StatCard label="Usuarios" valor={usuariosPagaron} />
        <StatCard label="Pago directo" valor={pagoDirecto} tono="amarillo" />
        <StatCard label="Pago online" valor={pagoOnline} tono="verde" />
      </div>

      {/* Botón exportar */}
      {pagosFiltrados.length > 0 && (
        <button
          onClick={exportarExcel}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-semibold uppercase tracking-wide py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          📊 Exportar a Excel
        </button>
      )}

      {/* Lista de pagos */}
      {cargando ? (
        <p className="text-center text-bone-dim py-10">Cargando historial...</p>
      ) : pagosFiltrados.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
          <p className="text-bone-dim">No hay registros de pago para este período.</p>
          <p className="text-xs text-bone-dim mt-2">Los pagos se registran automáticamente cuando actualizas la fecha de un usuario.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pagosFiltrados.map((pago) => (
            <div key={pago.id} className="bg-carbon-surface border border-steel/40 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-bone tracking-wide">{pago.nombreUsuario || "—"}</p>
                  <p className="text-xs text-bone-dim mt-0.5">Pagado el {formatearFecha(pago.fechaPago)}</p>
                  <p className="text-xs text-bone-dim">Período: {formatearFecha(pago.fechaInicioPago)} → {formatearFecha(pago.fechaVencimiento)}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                  pago.metodoPago === "online"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amberwarn/10 border-amberwarn/30 text-amberwarn-glow"
                }`}>
                  {pago.metodoPago === "online" ? "Online" : "Directo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, valor, tono }) {
  const tonos = {
    verde: "text-emerald-400 border-emerald-500/30",
    amarillo: "text-amberwarn-glow border-amber-500/30",
    default: "text-bone border-steel/40",
  };
  return (
    <div className={`bg-carbon-surface border rounded-xl p-3.5 text-center ${tonos[tono] || tonos.default}`}>
      <p className="font-display text-2xl">{valor}</p>
      <p className="text-xs text-bone-dim mt-0.5">{label}</p>
    </div>
  );
}
