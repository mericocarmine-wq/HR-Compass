import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider, useCompany } from "@/hooks/useCompany";
import { useRole } from "@/hooks/useRole";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";

import CompanySetup from "./pages/CompanySetup";
import Dashboard from "./pages/Dashboard";
import Empleados from "./pages/Empleados";
import EmpleadoDetalle from "./pages/EmpleadoDetalle";
import Equipo from "./pages/Equipo";
import Jornada from "./pages/Jornada";
import Vacaciones from "./pages/Vacaciones";
import Nominas from "./pages/Nominas";
import Documentos from "./pages/Documentos";
import Configuracion from "./pages/Configuracion";
import InformeLaboral from "./pages/InformeLaboral";
import RegistroHorarioEmpresa from "./pages/RegistroHorarioEmpresa";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ minRole, children }: { minRole: string; children: React.ReactNode }) {
  const { role } = useRole();
  const hierarchy: Record<string, number> = { owner: 4, admin: 3, manager: 2, empleado: 1 };
  if ((hierarchy[role] || 1) < (hierarchy[minRole] || 1)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();

  if (authLoading || (user && companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }
  if (!company) return <CompanySetup />;


  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/empleados" element={<ProtectedRoute minRole="manager"><Empleados /></ProtectedRoute>} />
        <Route path="/empleados/:id" element={<ProtectedRoute minRole="manager"><EmpleadoDetalle /></ProtectedRoute>} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/jornada" element={<Jornada />} />
        <Route path="/vacaciones" element={<Vacaciones />} />
        <Route path="/nominas" element={<Nominas />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/informe-laboral" element={<InformeLaboral />} />
        <Route path="/registro-horario" element={<RegistroHorarioEmpresa />} />
        <Route path="/configuracion" element={<ProtectedRoute minRole="manager"><Configuracion /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <AppRoutes />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
