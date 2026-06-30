import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos. Verifica tus datos.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-carbon texture-floor flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Signature: ícono de mancuerna construido en SVG */}
        <div className="flex justify-center mb-6">
          <DumbbellMark />
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-bone tracking-widest2 uppercase">
            Gimnasio <span className="text-forge-glow">Guerra</span>
          </h1>
          <p className="text-bone-dim text-sm mt-2 tracking-wide">
            Acceso al panel de membresías
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-carbon-surface border border-steel/40 rounded-xl p-6 shadow-plate space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">
              Correo
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-carbon-raised border border-steel/50 rounded-lg px-4 py-2.5 text-bone placeholder:text-bone-dim/50 focus:border-forge outline-none transition-colors"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-carbon-raised border border-steel/50 rounded-lg px-4 py-2.5 text-bone placeholder:text-bone-dim/50 focus:border-forge outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-forge hover:bg-forge-glow disabled:opacity-50 disabled:cursor-not-allowed text-carbon font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all duration-150 active:scale-[0.98] shadow-glow-gold"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-bone-dim/60 text-xs mt-6">
          ¿Olvidaste tu contraseña? Contacta al administrador del gimnasio.
        </p>
      </div>
    </div>
  );
}

function DumbbellMark() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect x="2" y="20" width="8" height="16" rx="1.5" fill="#C9A646" />
      <rect x="6" y="14" width="5" height="28" rx="1.5" fill="#8A7330" />
      <rect x="14" y="25" width="28" height="6" rx="2" fill="#3D3D3D" />
      <rect x="46" y="20" width="8" height="16" rx="1.5" fill="#C9A646" />
      <rect x="45" y="14" width="5" height="28" rx="1.5" fill="#8A7330" />
    </svg>
  );
}
