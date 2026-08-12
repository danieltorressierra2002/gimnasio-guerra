import { useState, useMemo, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { calcularEstadoMembresia, hoyISO } from "../lib/membership"
import { useAuth } from "../contexts/AuthContext"
import UserCard from "./UserCard"
import UserFormModal from "./UserFormModal"
import Tienda from "./Tienda"
import OfertasFlash from "./OfertasFlash"
import HistorialPagos from "./HistorialPagos"

export default function AdminDashboard() {
  const { perfil, cerrarSesion } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [seccion, setSeccion] = useState("miembros")

  useEffect(() => {
    cargarUsuarios()
    // Suscripción en tiempo real
    const subscription = supabase
      .channel('usuarios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, cargarUsuarios)
      .subscribe()
    return () => supabase.removeChannel(subscription)
  }, [])

  async function cargarUsuarios() {
    const { data } = await supabase.from("usuarios").select("*").order("nombre")
    setUsuarios(data || [])
    setCargando(false)
  }

  const conteos = useMemo(() => {
    const c = { activo: 0, porVencer: 0, vencido: 0 }
    usuarios.forEach(u => { c[calcularEstadoMembresia(u.fecha_vencimiento)]++ })
    return c
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const coincide = u.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      if (!coincide) return false
      if (filtro === "todos") return true
      return calcularEstadoMembresia(u.fecha_vencimiento) === filtro
    })
  }, [usuarios, busqueda, filtro])

  async function guardarUsuario(datos) {
    if (usuarioSeleccionado) {
      const { password, email, ...resto } = datos
      const fechaAnterior = usuarioSeleccionado.fecha_inicio_pago
      await supabase.from("usuarios").update(resto).eq("id", usuarioSeleccionado.id)

      // Actualizar perfil si cambió el rol
      await supabase.from("perfiles").update({ rol: datos.rol, nombre: datos.nombre }).eq("id", usuarioSeleccionado.id)

      // Registrar en historial si cambió la fecha
      if (datos.fecha_inicio_pago && datos.fecha_inicio_pago !== fechaAnterior) {
        await supabase.from("historial_pagos").insert({
          usuario_id: usuarioSeleccionado.id,
          nombre_usuario: datos.nombre,
          fecha_pago: hoyISO(),
          fecha_inicio_pago: datos.fecha_inicio_pago,
          fecha_vencimiento: datos.fecha_vencimiento,
          metodo_pago: datos.metodo_pago || "directo",
        })
      }
    } else {
      // Crear usuario en Supabase Auth
      const { data: authData, error } = await supabase.auth.admin.createUser({
        email: datos.email.trim(),
        password: datos.password,
        email_confirm: true,
      })

      // Si admin.createUser no funciona, usar signUp
      if (error) {
        const res = await fetch(`https://avhahgquikdpobdjjtlw.supabase.co/auth/v1/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': 'sb_publishable_phEu8tinedpzf8egkGtrNg_TmxsbEvs' },
          body: JSON.stringify({ email: datos.email.trim(), password: datos.password })
        })
        const resData = await res.json()
        if (!res.ok) throw new Error(resData.msg || "Error al crear usuario")

        const uid = resData.user?.id
        if (!uid) throw new Error("No se pudo obtener el ID del usuario")

        const { password, ...datosUsuario } = datos
        await supabase.from("usuarios").insert({ ...datosUsuario, id: uid })
        await supabase.from("perfiles").insert({ id: uid, rol: datos.rol || "usuario", nombre: datos.nombre, email: datos.email.trim() })
        await supabase.from("historial_pagos").insert({
          usuario_id: uid, nombre_usuario: datos.nombre, fecha_pago: hoyISO(),
          fecha_inicio_pago: datos.fecha_inicio_pago, fecha_vencimiento: datos.fecha_vencimiento,
          metodo_pago: datos.metodo_pago || "directo",
        })
      } else {
        const uid = authData.user.id
        const { password, ...datosUsuario } = datos
        await supabase.from("usuarios").insert({ ...datosUsuario, id: uid })
        await supabase.from("perfiles").insert({ id: uid, rol: datos.rol || "usuario", nombre: datos.nombre, email: datos.email.trim() })
        await supabase.from("historial_pagos").insert({
          usuario_id: uid, nombre_usuario: datos.nombre, fecha_pago: hoyISO(),
          fecha_inicio_pago: datos.fecha_inicio_pago, fecha_vencimiento: datos.fecha_vencimiento,
          metodo_pago: datos.metodo_pago || "directo",
        })
      }
    }
    setModalAbierto(false)
    cargarUsuarios()
  }

  async function eliminarUsuario(usuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre}?`)) return
    await supabase.from("usuarios").delete().eq("id", usuario.id)
    setModalAbierto(false)
    cargarUsuarios()
  }

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-bone uppercase tracking-wide">GYM <span className="text-forge-glow">GUERRA</span></h1>
            <p className="text-xs text-bone-dim">Hola, {perfil?.nombre || "Admin"}</p>
          </div>
          <button onClick={cerrarSesion} className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors">Salir</button>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex border-t border-steel/20 overflow-x-auto">
          <NavTab activo={seccion === "miembros"} onClick={() => setSeccion("miembros")}>👥 Miembros</NavTab>
          <NavTab activo={seccion === "historial"} onClick={() => setSeccion("historial")}>📊 Historial</NavTab>
          <NavTab activo={seccion === "tienda"} onClick={() => setSeccion("tienda")}>🛒 Tienda</NavTab>
          <NavTab activo={seccion === "ofertas"} onClick={() => setSeccion("ofertas")}>⚡ Ofertas</NavTab>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-28">
        {seccion === "miembros" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Al día" valor={conteos.activo} tono="verde" />
              <StatCard label="Por vencer" valor={conteos.porVencer} tono="amarillo" />
              <StatCard label="Vencidos" valor={conteos.vencido} tono="rojo" />
            </div>
            <div className="space-y-3">
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar miembro..." className="campo-input" />
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FiltroChip activo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos ({usuarios.length})</FiltroChip>
                <FiltroChip activo={filtro === "activo"} onClick={() => setFiltro("activo")} tono="verde">Al día</FiltroChip>
                <FiltroChip activo={filtro === "porVencer"} onClick={() => setFiltro("porVencer")} tono="amarillo">Por vencer</FiltroChip>
                <FiltroChip activo={filtro === "vencido"} onClick={() => setFiltro("vencido")} tono="rojo">Vencidos</FiltroChip>
              </div>
            </div>
            {cargando ? (
              <p className="text-center text-bone-dim py-10">Cargando miembros...</p>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
                <p className="text-bone-dim">{usuarios.length === 0 ? "Aún no hay miembros registrados." : "No se encontraron miembros."}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {usuariosFiltrados.map(u => (
                  <UserCard key={u.id} usuario={u} onClick={() => { setUsuarioSeleccionado(u); setModalAbierto(true) }} />
                ))}
              </div>
            )}
            <button onClick={() => { setUsuarioSeleccionado(null); setModalAbierto(true) }}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-forge hover:bg-forge-glow text-carbon shadow-glow-gold flex items-center justify-center transition-transform active:scale-90 z-30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </>
        )}
        {seccion === "historial" && <HistorialPagos />}
        {seccion === "tienda" && <Tienda esAdmin={true} />}
        {seccion === "ofertas" && <OfertasFlash esAdmin={true} />}
      </main>

      {modalAbierto && seccion === "miembros" && (
        <UserFormModal
          usuarioExistente={usuarioSeleccionado}
          onClose={() => setModalAbierto(false)}
          onSave={guardarUsuario}
          onDelete={eliminarUsuario}
        />
      )}
    </div>
  )
}

function NavTab({ activo, onClick, children }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activo ? "border-forge text-forge-glow" : "border-transparent text-bone-dim hover:text-bone"}`}>
      {children}
    </button>
  )
}

function StatCard({ label, valor, tono }) {
  const tonos = { verde: "text-emerald-400 border-emerald-500/30", amarillo: "text-amberwarn-glow border-amber-500/30", rojo: "text-blood-glow border-blood/30" }
  return (
    <div className={`bg-carbon-surface border rounded-xl p-3.5 text-center ${tonos[tono]}`}>
      <p className="font-display text-2xl">{valor}</p>
      <p className="text-xs text-bone-dim mt-0.5">{label}</p>
    </div>
  )
}

function FiltroChip({ activo, onClick, children, tono }) {
  const tonoActivo = { verde: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400", amarillo: "bg-amber-500/15 border-amber-500/40 text-amberwarn-glow", rojo: "bg-blood/15 border-blood/40 text-blood-glow" }
  return (
    <button onClick={onClick} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${activo ? tono ? tonoActivo[tono] : "bg-forge/15 border-forge/40 text-forge-glow" : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"}`}>
      {children}
    </button>
  )
}
