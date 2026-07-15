import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AuthProvider } from './context/AuthContext';

// Hooks
import useAuth from './hooks/useAuth';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import ProfileSettings from './pages/ProfileSettings';
// Global UI Shells
import ToastContainer from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';

import './styles/index.css';

// Route security guards
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthRoute = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

// Layout Wrappers for Router
const DashboardShell = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

const AuthShell = () => (
  <AuthLayout>
    <Outlet />
  </AuthLayout>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <Routes>
              {/* Authenticated Admin Views */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardShell />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/profile" element={<ProfileSettings />} />
                </Route>
              </Route>

              {/* Public/Auth Views */}
              <Route element={<AuthRoute />}>
                <Route element={<AuthShell />}>
                  <Route path="/login" element={<Login />} />
                </Route>
              </Route>
            </Routes>
          </Router>

          {/* Global Floating Overlays */}
          <ToastContainer />
          <ConfirmDialog />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
