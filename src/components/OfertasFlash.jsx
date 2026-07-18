import { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

const EMOJIS = ["⚡", "🔥", "💥", "🎯", "🏆", "💪", "⭐", "🎁"];

const VACIO = {
  titulo: "",
  descripcion: "",
  emoji: "⚡",
  visibilidad: "todos", // "todos" | "miembros_activos"
  activa: true,
  fechaFin: "",
};

export default function OfertasFlash({ esAdmin }) {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ofertasFlash"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
      setOfertas(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  async function toggleActiva(oferta) {
    await updateDoc(doc(db, "ofertasFlash", oferta.id), { activa: !oferta.activa });
  }

  async function guardarOferta(datos) {
    if (ofertaSeleccionada) {
      await updateDoc(doc(db, "ofertasFlash", ofertaSeleccionada.id), { ...datos, actualizadoEn: serverTimestamp() });
    } else {
      const ref = doc(collection(db, "ofertasFlash"));
      await setDoc(ref, { ...datos, creadoEn: serverTimestamp() });
    }
    setModalAbierto(false);
  }

  async function eliminarOferta(oferta) {
    if (!confirm(`¿Eliminar la oferta "${oferta.titulo}"?`)) return;
    await deleteDoc(doc(db, "ofertasFlash", oferta.id));
    setModalAbierto(false);
  }

  if (cargando) return <p className="text-center text-bone-dim py-10">Cargando ofertas...</p>;

  return (
    <div className="space-y-4">
      {ofertas.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
          <p className="text-bone-dim">No hay ofertas flash creadas.</p>
          {esAdmin && (
            <button onClick={() => { setOfertaSeleccionada(null); setModalAbierto(true); }} className="mt-4 text-forge-glow font-medium underline">
              Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ofertas.map(oferta => (
            <div key={oferta.id} className={`bg-carbon-surface border rounded-xl p-4 flex items-start gap-4 transition-all ${oferta.activa ? "border-blood/40" : "border-steel/40 opacity-60"}`}>
              <span className="text-3xl shrink-0">{oferta.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-bone uppercase tracking-wide">{oferta.titulo}</p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${oferta.activa ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-steel/20 border-steel/40 text-bone-dim"}`}>
                    {oferta.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="text-sm text-bone-dim mt-0.5">{oferta.descripcion}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${oferta.visibilidad === "todos" || oferta.visibilidad === "publico" ? "bg-forge/10 border-forge/30 text-forge-glow" : "bg-amberwarn/10 border-amberwarn/30 text-amberwarn-glow"}`}>
                    {oferta.visibilidad === "todos" || oferta.visibilidad === "publico" ? "🌍 Para todos" : "⭐ Solo miembros activos"}
                  </span>
                  {oferta.fechaFin && <span className="text-xs text-bone-dim">Hasta: {oferta.fechaFin}</span>}
                </div>
                {esAdmin && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleActiva(oferta)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${oferta.activa ? "border-steel/40 text-bone-dim hover:border-blood/40 hover:text-blood-glow" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}>
                      {oferta.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button onClick={() => { setOfertaSeleccionada(oferta); setModalAbierto(true); }} className="text-xs px-3 py-1.5 rounded-lg border border-steel/40 text-bone-dim hover:border-forge hover:text-forge-glow transition-colors">
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {esAdmin && (
        <button
          onClick={() => { setOfertaSeleccionada(null); setModalAbierto(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-forge hover:bg-forge-glow text-carbon shadow-glow-gold flex items-center justify-center transition-transform active:scale-90 z-30"
          aria-label="Nueva oferta"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {modalAbierto && esAdmin && (
        <OfertaFormModal
          ofertaExistente={ofertaSeleccionada}
          onClose={() => setModalAbierto(false)}
          onSave={guardarOferta}
          onDelete={eliminarOferta}
        />
      )}
    </div>
  );
}

function OfertaFormModal({ ofertaExistente, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(ofertaExistente ? { ...VACIO, ...ofertaExistente } : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = Boolean(ofertaExistente);

  function actualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return; }
    setGuardando(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || "Error al guardar.");
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-carbon-surface border border-steel/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-plate">
        <div className="sticky top-0 bg-carbon-surface border-b border-steel/30 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-bone uppercase tracking-wide">
            {esEdicion ? "Editar oferta" : "Nueva oferta flash"}
          </h2>
          <button onClick={onClose} className="text-bone-dim hover:text-bone p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={manejarGuardar} className="p-5 space-y-4">
          <Campo label="Emoji">
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => actualizar("emoji", e)}
                  className={`w-10 h-10 rounded-lg text-xl border transition-colors ${form.emoji === e ? "border-forge bg-forge/15" : "border-steel/40 bg-carbon-raised"}`}>
                  {e}
                </button>
              ))}
            </div>
          </Campo>

          <Campo label="Título">
            <input required value={form.titulo} onChange={(e) => actualizar("titulo", e.target.value)} className="campo-input" placeholder="Ej. 20% OFF en creatinas" />
          </Campo>

          <Campo label="Descripción">
            <textarea value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)} className="campo-input resize-none" rows={2} placeholder="Detalles de la oferta..." />
          </Campo>

          <Campo label="¿Hasta cuándo es válida? (opcional)">
            <input type="date" value={form.fechaFin} onChange={(e) => actualizar("fechaFin", e.target.value)} className="campo-input" />
          </Campo>

          <Campo label="Visibilidad">
            <div className="grid grid-cols-1 gap-2">
              <BotonToggle activo={form.visibilidad === "todos"} onClick={() => actualizar("visibilidad", "todos")}>
                🌍 Para todos (público + miembros)
              </BotonToggle>
              <BotonToggle activo={form.visibilidad === "miembros_activos"} onClick={() => actualizar("visibilidad", "miembros_activos")}>
                ⭐ Solo miembros con membresía activa
              </BotonToggle>
            </div>
          </Campo>

          <Campo label="Estado">
            <div className="grid grid-cols-2 gap-2">
              <BotonToggle activo={form.activa === true} onClick={() => actualizar("activa", true)}>✓ Activa</BotonToggle>
              <BotonToggle activo={form.activa === false} onClick={() => actualizar("activa", false)}>Inactiva</BotonToggle>
            </div>
          </Campo>

          {error && <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            {esEdicion && (
              <button type="button" onClick={() => onDelete(ofertaExistente)} className="flex-1 bg-transparent border border-blood/40 text-blood-glow hover:bg-blood/10 font-medium py-3 rounded-lg transition-colors">
                Eliminar
              </button>
            )}
            <button type="submit" disabled={guardando} className="flex-1 bg-forge hover:bg-forge-glow disabled:opacity-50 text-carbon font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all active:scale-[0.98]">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function BotonToggle({ activo, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`py-2.5 px-3 rounded-lg font-medium text-sm border transition-colors text-left ${activo ? "bg-forge/15 border-forge text-forge-glow" : "bg-carbon-raised border-steel/50 text-bone-dim hover:border-steel-light"}`}>
      {children}
    </button>
  );
}
