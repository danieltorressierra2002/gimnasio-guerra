import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

function AppContent() {
  const { firebaseUser, perfil, cargando, esAdmin, esUsuario } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <p className="text-bone-dim font-display tracking-wide">Cargando...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Login />;
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-4 text-center">
        <p className="text-bone-dim">
          Tu cuenta no tiene un perfil asignado. Contacta al administrador del gimnasio.
        </p>
      </div>
    );
  }

  if (esAdmin) return <AdminDashboard />;
  if (esUsuario) return <UserDashboard />;

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center px-4 text-center">
      <p className="text-bone-dim">Rol de usuario no reconocido.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
