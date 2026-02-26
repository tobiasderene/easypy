// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginMinimal from './pages/Login';
import Signup from './pages/SignUp';
import Catalog from './pages/Catalog';
import Proveedor from './pages/Supplier';
import Providers from './pages/Providers';
import ProductPage from './pages/ProductPage';
import Transactions from './pages/Transactions';
import Wallet from './pages/Wallet';
import ProviderOrders from './pages/ProviderOrders';
import OrderForm from './components/OrderForm';
import './App.css';

// Layout Component - Envuelve las páginas que necesitan Header y Sidebar
const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSearch = (value) => {
    console.log('Searching:', value);
  };

  const handleUserClick = () => {
    console.log('User profile clicked');
  };

  // Obtener nombre de usuario del localStorage
  const userName = localStorage.getItem('userName') || 'Usuario';

  return (
    <>
      <Header 
        userName={userName}
        userBalance="1,250.00"
        userAvatar={null}
        onMenuClick={handleMenuClick}
        onSearch={handleSearch}
        onUserClick={handleUserClick}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />
      
      <main>
        {children}
      </main>
    </>
  );
};

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Componente de ruta pública (Login y Signup)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/catalogo" replace />;
  }
  
  return children;
};

const ProtectedRoutePlain = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;  // ← sin <Layout>
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta de Login - Sin Header */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginMinimal />
            </PublicRoute>
          } 
        />

        {/* Ruta de Signup - Sin Header */}
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />

        {/* Ruta de Nueva Orden - Sin Header ni Sidebar */}
        <Route 
          path="/order/new" 
          element={
            <ProtectedRoutePlain>
              <OrderForm />
            </ProtectedRoutePlain>
          } 
        />

        {/* Rutas Protegidas - Con Header y Sidebar */}

        <Route 
          path="/catalogo" 
          element={
            <ProtectedRoute>
              <Catalog />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/proveedor" 
          element={
            <ProtectedRoute>
              <Proveedor />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de Proveedores - Con Header y Sidebar */}
        <Route 
          path="/proveedores" 
          element={
            <ProtectedRoute>
              <Providers />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de Transacciones - Con Header y Sidebar */}
        <Route 
          path="/transacciones" 
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de Wallet - Con Header y Sidebar */}
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de Provider Orders - Con Header y Sidebar */}
        <Route 
          path="/provider-orders" 
          element={
            <ProtectedRoute>
              <ProviderOrders />
            </ProtectedRoute>
          } 
        />

        {/* Ruta de Producto - Con Header y Sidebar */}
        <Route 
          path="/product/:id" 
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          } 
        />

        {/* Ruta raíz - Redirige según autenticación */}
        <Route 
          path="/" 
          element={
            localStorage.getItem('isAuthenticated') === 'true' 
              ? <Navigate to="/catalogo" replace /> 
              : <Navigate to="/login" replace />
          } 
        />

        {/* Ruta 404 - Página no encontrada */}
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>404 - Página no encontrada</h1>
                <p>La página que buscas no existe.</p>
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;