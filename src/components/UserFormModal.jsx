import { useState, useEffect } from "react";
import { uploadPhotoToCloudinary } from "../lib/cloudinary";
import { calcularVencimientoDesdeInicio, hoyISO, formatearFecha } from "../lib/membership";

const VACIO = {
  nombre: "",
  telefono: "",
  fotoURL: "",
  tieneEntrenador: false,
  metodoPago: "directo", // "directo" | "online"
  fechaInicioPago: hoyISO(),
  fechaVencimiento: calcularVencimientoDesdeInicio(hoyISO()),
  email: "",
  password: "",
};

export default function UserFormModal({ usuarioExistente, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(VACIO);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = Boolean(usuarioExistente);

  useEffect(() => {
    if (usuarioExistente) {
      setForm({ ...VACIO, ...usuarioExistente, password: "" });
      setPreviewFoto(usuarioExistente.fotoURL || "");
    } else {
      setForm(VACIO);
      setPreviewFoto("");
    }
  }, [usuarioExistente]);

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarSeleccionFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoFoto(file);
    setPreviewFoto(URL.createObjectURL(file));
  }

  function manejarCambioFechaInicio(fechaInicio) {
    setForm((prev) => ({
      ...prev,
      fechaInicioPago: fechaInicio,
      fechaVencimiento: calcularVencimientoDesdeInicio(fechaInicio),
    }));
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!esEdicion && (!form.email.trim() || !form.password.trim())) {
      setError("Correo y contraseña son obligatorios para crear el acceso del usuario.");
      return;
    }
    if (!esEdicion && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubiendo(true);
    try {
      let fotoURL = form.fotoURL;
      if (archivoFoto) {
        fotoURL = await uploadPhotoToCloudinary(archivoFoto);
      }
      await onSave({ ...form, fotoURL });
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-carbon-surface border border-steel/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-plate">
        <div className="sticky top-0 bg-carbon-surface border-b border-steel/30 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-bone uppercase tracking-wide">
            {esEdicion ? "Editar usuario" : "Agregar usuario"}
          </h2>
          <button onClick={onClose} className="text-bone-dim hover:text-bone p-1" aria-label="Cerrar">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={manejarGuardar} className="p-5 space-y-5">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {previewFoto ? (
                <img src={previewFoto} alt="Vista previa" className="w-20 h-20 rounded-full object-cover border-2 border-steel" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-carbon-raised border-2 border-steel flex items-center justify-center">
                  <svg className="w-8 h-8 text-bone-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="inline-block bg-carbon-raised border border-steel/50 hover:border-forge text-bone text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {previewFoto ? "Cambiar foto" : "Subir foto"}
              </span>
              <input type="file" accept="image/*" onChange={manejarSeleccionFoto} className="hidden" />
            </label>
          </div>

          {/* Nombre */}
          <Campo label="Nombre completo">
            <input
              required
              value={form.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
              className="campo-input"
              placeholder="Ej. Carlos Pérez"
            />
          </Campo>

          {/* Teléfono */}
          <Campo label="Teléfono (opcional)">
            <input
              value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)}
              className="campo-input"
              placeholder="Ej. 0414-1234567"
            />
          </Campo>

          {/* Fecha de inicio de pago */}
          <Campo label="Fecha de inicio del mes pagado">
            <input
              type="date"
              required
              value={form.fechaInicioPago}
              onChange={(e) => manejarCambioFechaInicio(e.target.value)}
              className="campo-input"
            />
            <p className="text-xs text-bone-dim mt-1.5">
              Vence el {formatearFecha(form.fechaVencimiento)} (un mes después)
            </p>
          </Campo>

          {/* Método de pago */}
          <Campo label="Método de pago">
            <div className="grid grid-cols-2 gap-2">
              <BotonToggle
                activo={form.metodoPago === "directo"}
                onClick={() => actualizar("metodoPago", "directo")}
              >
                Pago directo
              </BotonToggle>
              <BotonToggle
                activo={form.metodoPago === "online"}
                onClick={() => actualizar("metodoPago", "online")}
              >
                Pago online
              </BotonToggle>
            </div>
          </Campo>

          {/* Entrenador */}
          <Campo label="¿Tiene entrenador?">
            <div className="grid grid-cols-2 gap-2">
              <BotonToggle
                activo={form.tieneEntrenador === true}
                onClick={() => actualizar("tieneEntrenador", true)}
              >
                Sí
              </BotonToggle>
              <BotonToggle
                activo={form.tieneEntrenador === false}
                onClick={() => actualizar("tieneEntrenador", false)}
              >
                No
              </BotonToggle>
            </div>
          </Campo>

          {!esEdicion && (
            <div className="border-t border-steel/30 pt-4 space-y-4">
              <p className="text-xs font-medium text-forge-glow uppercase tracking-wide">
                Acceso del usuario
              </p>
              <Campo label="Correo de acceso">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => actualizar("email", e.target.value)}
                  className="campo-input"
                  placeholder="correo@ejemplo.com"
                />
              </Campo>
              <Campo label="Contraseña">
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => actualizar("password", e.target.value)}
                  className="campo-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </Campo>
            </div>
          )}

          {error && (
            <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {esEdicion && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(usuarioExistente)}
                className="flex-1 bg-transparent border border-blood/40 text-blood-glow hover:bg-blood/10 font-medium py-3 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={subiendo}
              className="flex-1 bg-forge hover:bg-forge-glow disabled:opacity-50 text-carbon font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all active:scale-[0.98]"
            >
              {subiendo ? "Guardando..." : "Guardar"}
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
      <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function BotonToggle({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 rounded-lg font-medium text-sm border transition-colors ${
        activo
          ? "bg-forge/15 border-forge text-forge-glow"
          : "bg-carbon-raised border-steel/50 text-bone-dim hover:border-steel-light"
      }`}
    >
      {children}
    </button>
  );
}
