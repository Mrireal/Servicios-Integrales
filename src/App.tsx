import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import ServiceForm from './components/ServiceForm';
import ClientList from './components/ClientList';
import Calendar from './components/Calendar';
import Finances from './components/Finances';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <Navbar />
      <main className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <ServiceForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <ClientList />
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            }
          />
          <Route
            path="/finances"
            element={
              <PrivateRoute>
                <Finances />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;