import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

const LOGO_URL = "/icons/icon-512x512.png"

function categoriaEmoji(categoria) {
  const map = { "Suplementos": "💊", "Medicamentos": "💉", "Equipamiento": "🥊", "Ropa y accesorios": "🧤", "Otros": "📦" }
  return map[categoria] || "📦"
}

export default function PaginaPublica({ onLogin }) {
  const [productos, setProductos] = useState([])
  const [ofertasFlash, setOfertasFlash] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")

  useEffect(() => {
    async function cargarDatos() {
      const { data: prods } = await supabase.from("productos").select("*").eq("disponible", true).order("nombre")
      const { data: ofertas } = await supabase.from("ofertas_flash").select("*").eq("activa", true)
      setProductos(prods || [])
      setOfertasFlash((ofertas || []).filter(o => o.visibilidad === "todos" || o.visibilidad === "publico"))
      setCargando(false)
    }
    cargarDatos()
  }, [])

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria).filter(Boolean))]
  const productosFiltrados = productos.filter(p => categoriaFiltro === "Todos" ? true : p.categoria === categoriaFiltro)

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      <header className="border-b border-steel/30 bg-carbon-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="GYM GUERRA" className="w-8 h-8 rounded-full object-cover" />
            <h1 className="font-display text-xl text-bone uppercase tracking-wide">GYM <span className="text-forge-glow">GUERRA</span></h1>
          </div>
          <button onClick={onLogin} className="bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-lg text-sm transition-all active:scale-95">
            Mi membresía
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="relative text-center py-16 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <img src={LOGO_URL} alt="" className="w-72 h-72 object-contain opacity-10 blur-sm select-none" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-carbon/60 via-transparent to-carbon/60 pointer-events-none" />
          <div className="relative z-10">
            <img src={LOGO_URL} alt="GYM GUERRA" className="w-24 h-24 object-contain mx-auto mb-4 rounded-full border-2 border-forge/40" />
            <h2 className="font-display text-4xl text-bone uppercase tracking-widest2">GYM <span className="text-forge-glow">GUERRA</span></h2>
            <p className="text-bone-dim text-sm mt-1 font-display tracking-widest uppercase">Fitness Center</p>
            <p className="text-bone-dim mt-4 text-sm max-w-md mx-auto">Entrena con los mejores. Revisa nuestros productos y el estado de tu membresía.</p>
            <button onClick={onLogin} className="mt-6 inline-flex items-center gap-2 bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-6 py-3 rounded-xl transition-all active:scale-95 shadow-glow-gold">
              🏋️ Ver mi membresía
            </button>
          </div>
        </div>

        {/* Ofertas flash */}
        {ofertasFlash.length > 0 && (
          <section>
            <h3 className="font-display text-xl text-bone uppercase tracking-wide mb-4">⚡ Ofertas Flash</h3>
            <div className="grid grid-cols-1 gap-3">
              {ofertasFlash.map(oferta => (
                <div key={oferta.id} className="bg-blood/10 border border-blood/40 rounded-xl p-4 flex items-center gap-4">
                  <span className="text-3xl shrink-0">{oferta.emoji || "⚡"}</span>
                  <div>
                    <p className="font-display text-bone uppercase tracking-wide">{oferta.titulo}</p>
                    <p className="text-sm text-bone-dim mt-0.5">{oferta.descripcion}</p>
                    {oferta.fecha_fin && <p className="text-xs text-blood-glow mt-1">Válido hasta: {oferta.fecha_fin}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Catálogo */}
        <section>
          <h3 className="font-display text-xl text-bone uppercase tracking-wide mb-4">🛒 Productos disponibles</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${categoriaFiltro === cat ? "bg-forge/15 border-forge/40 text-forge-glow" : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"}`}>
                {cat}
              </button>
            ))}
          </div>
          {cargando ? (
            <p className="text-center text-bone-dim py-10">Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <p className="text-center text-bone-dim py-10">No hay productos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productosFiltrados.map(p => (
                <div key={p.id} className="bg-carbon-surface border border-steel/40 rounded-xl overflow-hidden">
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
                      {p.oferta && <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-blood/15 border border-blood/40 text-blood-glow">🔥 {p.descripcion_oferta || "¡OFERTA!"}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="bg-carbon-surface border border-forge/30 rounded-2xl p-6 text-center">
          <p className="font-display text-lg text-bone uppercase tracking-wide">¿Ya eres miembro?</p>
          <p className="text-bone-dim text-sm mt-2">Accede a tu panel para ver el estado de tu membresía y ofertas exclusivas.</p>
          <button onClick={onLogin} className="mt-4 bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-6 py-3 rounded-xl transition-all active:scale-95">
            Ingresar al panel
          </button>
        </div>
      </main>

      <footer className="border-t border-steel/20 mt-10 py-6 text-center">
        <p className="text-bone-dim text-xs">© 2026 GYM GUERRA Fitness Center · Todos los derechos reservados</p>
      </footer>
    </div>
  )
}
