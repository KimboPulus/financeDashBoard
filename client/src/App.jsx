import { Navigate, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { useAuth } from './services/AuthContext.jsx';

function PrivateRoute({ children }) {
  const { booting, isAuthed } = useAuth();

  if (booting) {
    return <main className="center-screen">Checking your session...</main>;
  }

  return isAuthed ? children : <Navigate to="/login" replace />;
}

export function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthed ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
