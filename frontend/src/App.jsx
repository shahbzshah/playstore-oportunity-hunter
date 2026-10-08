import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Login, Register } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import OpportunityDetail from "./pages/OpportunityDetail";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page"><p className="muted">Loading…</p></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page"><p className="muted">Loading…</p></div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route
            path="/opportunities/:id"
            element={<Protected><OpportunityDetail /></Protected>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
