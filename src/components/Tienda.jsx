import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { uploadPhotoToCloudinary } from "../lib/cloudinary"

const CATEGORIAS = ["Suplementos", "Medicamentos", "Equipamiento", "Ropa y accesorios", "Otros"]

const VACIO = {
  nombre: "", categoria: "Suplementos", precio: "", disponible: true,
  oferta: false, descripcion_oferta: "", descripcion: "", foto_url: "",
}

function categoriaEmoji(categoria) {
  const map = { "Suplementos": "💊", "Medicamentos": "💉", "Equipamiento": "🥊", "Ropa y accesorios": "🧤", "Otros": "📦" }
  return map[categoria] || "📦"
}

export default function Tienda({ esAdmin }) {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")

  useEffect(() => { cargarProductos() }, [])

  async function cargarProductos() {
    const { data } = await supabase.from("productos").select("*").order("nombre")
    setProductos(data || [])
    setCargando(false)
  }

  const productosFiltrados = productos.filter(p => categoriaFiltro === "Todos" ? true : p.categoria === categoriaFiltro)

  async function guardarProducto(datos) {
    if (productoSeleccionado) {
      await supabase.from("productos").update(datos).eq("id", productoSeleccionado.id)
    } else {
      await supabase.from("productos").insert(datos)
    }
    setModalAbierto(false)
    cargarProductos()
  }

  async function eliminarProducto(producto) {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return
    await supabase.from("productos").delete().eq("id", producto.id)
    setModalAbierto(false)
    cargarProductos()
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todos", ...CATEGORIAS].map(cat => (
          <button key={cat} onClick={() => setCategoriaFiltro(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${categoriaFiltro === cat ? "bg-forge/15 border-forge/40 text-forge-glow" : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"}`}>
            {cat}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-center text-bone-dim py-10">Cargando productos...</p>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
          <p className="text-bone-dim">{productos.length === 0 ? "Aún no hay productos." : "No hay productos en esta categoría."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {productosFiltrados.map(p => (
            <div key={p.id} onClick={() => { if (esAdmin) { setProductoSeleccionado(p); setModalAbierto(true) } }}
              className={`bg-carbon-surface border border-steel/40 rounded-xl overflow-hidden ${esAdmin ? "cursor-pointer hover:border-steel-light" : ""} ${!p.disponible ? "opacity-60" : ""}`}>
              {p.foto_url && <img src={p.foto_url} alt={p.nombre} className="w-full h-40 object-cover" />}
              <div className="p-4 flex items-start gap-3">
                {!p.foto_url && (
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-carbon-raised border border-steel/40 flex items-center justify-center text-2xl">{categoriaEmoji(p.categoria)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-bone text-base tracking-wide">{p.nombre}</p>
                    <p className="font-display text-forge-glow text-lg shrink-0">${Number(p.precio).toLocaleString("es-ES")}</p>
                  </div>
                  <p className="text-xs text-bone-dim mt-0.5">{p.categoria}</p>
                  {p.descripcion && <p className="text-xs text-bone-dim mt-1.5 line-clamp-2">{p.descripcion}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.oferta && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blood/15 border border-blood/40 text-blood-glow">🔥 {p.descripcion_oferta || "¡OFERTA!"}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.disponible ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-steel/20 border-steel/40 text-bone-dim"}`}>
                      {p.disponible ? "✓ Disponible" : "Agotado"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {esAdmin && (
        <button onClick={() => { setProductoSeleccionado(null); setModalAbierto(true) }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-forge hover:bg-forge-glow text-carbon shadow-glow-gold flex items-center justify-center transition-transform active:scale-90 z-30">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {modalAbierto && esAdmin && (
        <ProductoFormModal
          productoExistente={productoSeleccionado}
          onClose={() => setModalAbierto(false)}
          onSave={guardarProducto}
          onDelete={eliminarProducto}
        />
      )}
    </div>
  )
}

function ProductoFormModal({ productoExistente, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(productoExistente ? { ...VACIO, ...productoExistente } : VACIO)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(productoExistente?.foto_url || "")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const esEdicion = Boolean(productoExistente)

  function actualizar(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }

  function manejarSeleccionFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivoFoto(file)
    setPreviewFoto(URL.createObjectURL(file))
  }

  async function manejarGuardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return }
    if (!form.precio || isNaN(form.precio)) { setError("El precio debe ser un número válido."); return }
    setGuardando(true)
    try {
      let foto_url = form.foto_url
      if (archivoFoto) foto_url = await uploadPhotoToCloudinary(archivoFoto)
      await onSave({ ...form, foto_url })
    } catch (err) {
      setError(err.message || "Error al guardar.")
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-carbon-surface border border-steel/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-plate">
        <div className="sticky top-0 bg-carbon-surface border-b border-steel/30 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-bone uppercase tracking-wide">{esEdicion ? "Editar producto" : "Agregar producto"}</h2>
          <button onClick={onClose} className="text-bone-dim hover:text-bone p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={manejarGuardar} className="p-5 space-y-4">
          <Campo label="Foto del producto">
            <div className="space-y-2">
              {previewFoto && <img src={previewFoto} alt="Vista previa" className="w-full h-40 object-cover rounded-lg border border-steel/40" />}
              <label className="cursor-pointer block">
                <span className="inline-flex items-center gap-2 bg-carbon-raised border border-steel/50 hover:border-forge text-bone text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-full justify-center">
                  📷 {previewFoto ? "Cambiar foto" : "Subir foto del producto"}
                </span>
                <input type="file" accept="image/*" onChange={manejarSeleccionFoto} className="hidden" />
              </label>
            </div>
          </Campo>
          <Campo label="Nombre">
            <input required value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} className="campo-input" placeholder="Ej. Creatina 500g" />
          </Campo>
          <Campo label="Categoría">
            <select value={form.categoria} onChange={(e) => actualizar("categoria", e.target.value)} className="campo-input">
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Precio">
            <input type="number" required min="0" step="0.01" value={form.precio} onChange={(e) => actualizar("precio", e.target.value)} className="campo-input" placeholder="25.00" />
          </Campo>
          <Campo label="Descripción (opcional)">
            <textarea value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)} className="campo-input resize-none" rows={2} />
          </Campo>
          <Campo label="Disponibilidad">
            <div className="grid grid-cols-2 gap-2">
              <BotonToggle activo={form.disponible === true} onClick={() => actualizar("disponible", true)}>✓ Disponible</BotonToggle>
              <BotonToggle activo={form.disponible === false} onClick={() => actualizar("disponible", false)}>Agotado</BotonToggle>
            </div>
          </Campo>
          <Campo label="¿Tiene oferta?">
            <div className="grid grid-cols-2 gap-2">
              <BotonToggle activo={form.oferta === true} onClick={() => actualizar("oferta", true)}>🔥 Sí</BotonToggle>
              <BotonToggle activo={form.oferta === false} onClick={() => actualizar("oferta", false)}>No</BotonToggle>
            </div>
          </Campo>
          {form.oferta && (
            <Campo label="Descripción de la oferta">
              <input value={form.descripcion_oferta} onChange={(e) => actualizar("descripcion_oferta", e.target.value)} className="campo-input" placeholder="Ej. 20% OFF esta semana 🔥" />
            </Campo>
          )}
          {error && <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            {esEdicion && onDelete && (
              <button type="button" onClick={() => onDelete(productoExistente)} className="flex-1 bg-transparent border border-blood/40 text-blood-glow hover:bg-blood/10 font-medium py-3 rounded-lg transition-colors">Eliminar</button>
            )}
            <button type="submit" disabled={guardando} className="flex-1 bg-forge hover:bg-forge-glow disabled:opacity-50 text-carbon font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all active:scale-[0.98]">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function BotonToggle({ activo, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`py-2.5 rounded-lg font-medium text-sm border transition-colors ${activo ? "bg-forge/15 border-forge text-forge-glow" : "bg-carbon-raised border-steel/50 text-bone-dim hover:border-steel-light"}`}>
      {children}
    </button>
  )
}
