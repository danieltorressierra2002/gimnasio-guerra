import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

function categoriaEmoji(categoria) {
  const map = {
    "Suplementos": "💊",
    "Medicamentos": "💉",
    "Equipamiento": "🥊",
    "Ropa y accesorios": "🧤",
    "Otros": "📦",
  };
  return map[categoria] || "📦";
}

export default function PaginaPublica({ onLogin }) {
  const [productos, setProductos] = useState([]);
  const [ofertasFlash, setOfertasFlash] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");

  useEffect(() => {
    const unsubProductos = onSnapshot(collection(db, "productos"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(lista.filter(p => p.disponible));
      setCargando(false);
    });
    const unsubOfertas = onSnapshot(collection(db, "ofertasFlash"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOfertasFlash(lista.filter(o => o.activa && (o.visibilidad === "todos" || o.visibilidad === "publico")));
    });
    return () => { unsubProductos(); unsubOfertas(); };
  }, []);

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const productosFiltrados = productos.filter(p =>
    categoriaFiltro === "Todos" ? true : p.categoria === categoriaFiltro
  );

  return (
    <div className="min-h-screen bg-carbon texture-floor">
      {/* Header */}
      <header className="border-b border-steel/30 bg-carbon-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DumbbellMark />
            <h1 className="font-display text-xl text-bone uppercase tracking-wide">
              GYM <span className="text-forge-glow">GUERRA</span>
            </h1>
          </div>
          <button
            onClick={onLogin}
            className="bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-4 py-2 rounded-lg text-sm transition-all active:scale-95"
          >
            Mi membresía
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <div className="text-center py-8">
          <h2 className="font-display text-4xl text-bone uppercase tracking-widest2">
            Bienvenido a <span className="text-forge-glow">GYM GUERRA</span>
          </h2>
          <p className="text-bone-dim mt-3 text-sm max-w-md mx-auto">
            Entrena con los mejores. Revisa nuestros productos disponibles y consulta el estado de tu membresía.
          </p>
          <button
            onClick={onLogin}
            className="mt-6 inline-flex items-center gap-2 bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-6 py-3 rounded-xl transition-all active:scale-95 shadow-glow-gold"
          >
            🏋️ Ver mi membresía
          </button>
        </div>

        {/* Ofertas flash públicas */}
        {ofertasFlash.length > 0 && (
          <section>
            <h3 className="font-display text-xl text-bone uppercase tracking-wide mb-4">
              ⚡ Ofertas Flash
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {ofertasFlash.map(oferta => (
                <OfertaCard key={oferta.id} oferta={oferta} />
              ))}
            </div>
          </section>
        )}

        {/* Catálogo de productos */}
        <section>
          <h3 className="font-display text-xl text-bone uppercase tracking-wide mb-4">
            🛒 Productos disponibles
          </h3>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                  categoriaFiltro === cat
                    ? "bg-forge/15 border-forge/40 text-forge-glow"
                    : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {cargando ? (
            <p className="text-center text-bone-dim py-10">Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <p className="text-center text-bone-dim py-10">No hay productos disponibles en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productosFiltrados.map(p => (
                <ProductoCard key={p.id} producto={p} />
              ))}
            </div>
          )}
        </section>

        {/* CTA membresía */}
        <div className="bg-carbon-surface border border-forge/30 rounded-2xl p-6 text-center">
          <p className="font-display text-lg text-bone uppercase tracking-wide">¿Ya eres miembro?</p>
          <p className="text-bone-dim text-sm mt-2">Accede a tu panel para ver el estado de tu membresía y ofertas exclusivas.</p>
          <button
            onClick={onLogin}
            className="mt-4 bg-forge hover:bg-forge-glow text-carbon font-display font-semibold uppercase tracking-wide px-6 py-3 rounded-xl transition-all active:scale-95"
          >
            Ingresar al panel
          </button>
        </div>
      </main>

      <footer className="border-t border-steel/20 mt-10 py-6 text-center">
        <p className="text-bone-dim text-xs">© 2026 GYM GUERRA · Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

function ProductoCard({ producto }) {
  return (
    <div className="bg-carbon-surface border border-steel/40 rounded-xl p-4 flex items-start gap-4">
      <div className="shrink-0 w-12 h-12 rounded-xl bg-carbon-raised border border-steel/40 flex items-center justify-center text-2xl">
        {producto.fotoURL ? (
          <img src={producto.fotoURL} alt={producto.nombre} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          categoriaEmoji(producto.categoria)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-bone text-base tracking-wide">{producto.nombre}</p>
          <p className="font-display text-forge-glow text-lg shrink-0">
            ${Number(producto.precio).toLocaleString("es-ES")}
          </p>
        </div>
        <p className="text-xs text-bone-dim mt-0.5">{producto.categoria}</p>
        {producto.descripcion && <p className="text-xs text-bone-dim mt-1.5 line-clamp-2">{producto.descripcion}</p>}
        {producto.oferta && (
          <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-blood/15 border border-blood/40 text-blood-glow">
            🔥 {producto.descripcionOferta || "¡OFERTA!"}
          </span>
        )}
      </div>
    </div>
  );
}

function OfertaCard({ oferta }) {
  return (
    <div className="bg-blood/10 border border-blood/40 rounded-xl p-4 flex items-center gap-4">
      <span className="text-3xl shrink-0">{oferta.emoji || "⚡"}</span>
      <div>
        <p className="font-display text-bone uppercase tracking-wide">{oferta.titulo}</p>
        <p className="text-sm text-bone-dim mt-0.5">{oferta.descripcion}</p>
        {oferta.fechaFin && (
          <p className="text-xs text-blood-glow mt-1">Válido hasta: {oferta.fechaFin}</p>
        )}
      </div>
    </div>
  );
}

function DumbbellMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
      <rect x="2" y="20" width="8" height="16" rx="1.5" fill="#C9A646" />
      <rect x="6" y="14" width="5" height="28" rx="1.5" fill="#8A7330" />
      <rect x="14" y="25" width="28" height="6" rx="2" fill="#3D3D3D" />
      <rect x="46" y="20" width="8" height="16" rx="1.5" fill="#C9A646" />
      <rect x="45" y="14" width="5" height="28" rx="1.5" fill="#8A7330" />
    </svg>
  );
}
