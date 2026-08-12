import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { formatearFecha } from "../lib/membership"

export default function HistorialPagos() {
  const [usuarios, setUsuarios] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [usuarioFiltro, setUsuarioFiltro] = useState("todos")

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: u } = await supabase.from("usuarios").select("id, nombre").order("nombre")
    const { data: h } = await supabase.from("historial_pagos").select("*").order("fecha_pago", { ascending: false })
    setUsuarios(u || [])
    setHistorial(h || [])
    setCargando(false)
  }

  const pagosFiltrados = historial.filter(p => {
    const fecha = p.fecha_pago || ""
    const coincideAnio = filtroAnio ? fecha.startsWith(filtroAnio) : true
    const coincideMes = filtroMes ? fecha.startsWith(`${filtroAnio}-${filtroMes}`) : true
    const coincideUsuario = usuarioFiltro === "todos" ? true : p.usuario_id === usuarioFiltro
    return coincideAnio && coincideMes && coincideUsuario
  })

  const totalPagos = pagosFiltrados.length
  const usuariosPagaron = new Set(pagosFiltrados.map(p => p.usuario_id)).size
  const pagoDirecto = pagosFiltrados.filter(p => p.metodo_pago === "directo").length
  const pagoOnline = pagosFiltrados.filter(p => p.metodo_pago === "online").length

  function exportarCSV() {
    const encabezados = ["Nombre", "Fecha de pago", "Fecha inicio período", "Fecha vencimiento", "Método de pago"]
    const filas = pagosFiltrados.map(p => [
      p.nombre_usuario || "—", p.fecha_pago || "—",
      p.fecha_inicio_pago || "—", p.fecha_vencimiento || "—",
      p.metodo_pago === "online" ? "Pago en línea" : "Pago directo",
    ])
    const contenido = [encabezados, ...filas].map(fila => fila.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `GymGuerra_Pagos_${filtroAnio}${filtroMes ? "_" + filtroMes : ""}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const meses = [
    { valor: "01", label: "Enero" }, { valor: "02", label: "Febrero" },
    { valor: "03", label: "Marzo" }, { valor: "04", label: "Abril" },
    { valor: "05", label: "Mayo" }, { valor: "06", label: "Junio" },
    { valor: "07", label: "Julio" }, { valor: "08", label: "Agosto" },
    { valor: "09", label: "Septiembre" }, { valor: "10", label: "Octubre" },
    { valor: "11", label: "Noviembre" }, { valor: "12", label: "Diciembre" },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-carbon-surface border border-steel/40 rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium text-bone-dim uppercase tracking-wide">Filtrar por</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-bone-dim mb-1">Año</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="campo-input">
              {["2025", "2026", "2027", "2028"].map(a => <option key={a} value={a}>{a}</option>)}
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
            <option value="todos">Todos</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total pagos" valor={totalPagos} />
        <StatCard label="Usuarios" valor={usuariosPagaron} />
        <StatCard label="Pago directo" valor={pagoDirecto} tono="amarillo" />
        <StatCard label="Pago online" valor={pagoOnline} tono="verde" />
      </div>

      {pagosFiltrados.length > 0 && (
        <button onClick={exportarCSV} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-display font-semibold uppercase tracking-wide py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          📊 Descargar resumen (Excel/CSV)
        </button>
      )}

      {cargando ? (
        <p className="text-center text-bone-dim py-10">Cargando historial...</p>
      ) : pagosFiltrados.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
          <p className="text-bone-dim">No hay registros para este período.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pagosFiltrados.map(pago => (
            <div key={pago.id} className="bg-carbon-surface border border-steel/40 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-bone tracking-wide">{pago.nombre_usuario || "—"}</p>
                  <p className="text-xs text-bone-dim mt-0.5">Registrado el {formatearFecha(pago.fecha_pago)}</p>
                  <p className="text-xs text-bone-dim">Período: {formatearFecha(pago.fecha_inicio_pago)} → {formatearFecha(pago.fecha_vencimiento)}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${pago.metodo_pago === "online" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amberwarn/10 border-amberwarn/30 text-amberwarn-glow"}`}>
                  {pago.metodo_pago === "online" ? "Online" : "Directo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, valor, tono }) {
  const tonos = { verde: "text-emerald-400 border-emerald-500/30", amarillo: "text-amberwarn-glow border-amber-500/30", default: "text-bone border-steel/40" }
  return (
    <div className={`bg-carbon-surface border rounded-xl p-3.5 text-center ${tonos[tono] || tonos.default}`}>
      <p className="font-display text-2xl">{valor}</p>
      <p className="text-xs text-bone-dim mt-0.5">{label}</p>
    </div>
  )
}
