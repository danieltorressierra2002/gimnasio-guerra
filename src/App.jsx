import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Login from "./components/Login"
import AdminDashboard from "./components/AdminDashboard"
import UserDashboard from "./components/UserDashboard"
import PaginaPublica from "./components/PaginaPublica"
import { useState } from "react"

function AppContent() {
  const { user, perfil, cargando, esAdmin, esUsuario } = useAuth()
  const [mostrarLogin, setMostrarLogin] = useState(false)

  if (cargando) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <p className="text-bone-dim font-display tracking-wide">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    if (mostrarLogin) return <Login onVolver={() => setMostrarLogin(false)} />
    return <PaginaPublica onLogin={() => setMostrarLogin(true)} />
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-4 text-center">
        <p className="text-bone-dim">Tu cuenta no tiene perfil asignado. Contacta al administrador.</p>
      </div>
    )
  }

  if (esAdmin) return <AdminDashboard />
  if (esUsuario) return <UserDashboard />

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center px-4 text-center">
      <p className="text-bone-dim">Rol no reconocido.</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
