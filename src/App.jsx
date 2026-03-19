import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProviderSidebar from './components/ProviderSidebar';
import LoginMinimal from './pages/Login';
import Signup from './pages/SignUp';
import Catalog from './pages/Catalog';
import Proveedor from './pages/Supplier';
import Providers from './pages/Providers';
import ProductPage from './pages/ProductPage';
import Transactions from './pages/Transactions';
import Wallet from './pages/Wallet';
import ProviderOrders from './pages/ProviderOrders';
import ProviderCatalog from './pages/ProviderCatalog';
import AddProductForm from './pages/AddProductForm';
import AdminPage from './pages/Adminpage';
import PendingApproval from './pages/PendingApproval';
import OrderForm from './components/OrderForm';
import { getMe, exchangeSession, getWalletByUser } from './services/api';
import './App.css';

// ─── Context de usuario ───────────────────────────────
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

// ─── Layout ───────────────────────────────────────────
const Layout = ({ children }) => {
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      getWalletByUser(user.user_id)
        .then(w => setWalletBalance(w ? parseFloat(w.balance_available) : 0))
        .catch(() => setWalletBalance(0));
    }
  }, [user]);

  return (
    <>
      <Header
        userName={user?.user_nickname || 'Usuario'}
        userBalance={walletBalance}
        userAvatar={null}
        onMenuClick={() => setIsSidebarOpen(true)}
        onSearch={(v) => console.log('Searching:', v)}
        onUserClick={() => console.log('User profile clicked')}
      />

      {user?.user_role === 'provider' ? (
        <ProviderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      ) : (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      <main>{children}</main>
    </>
  );
};

// ─── Ruta protegida ───────────────────────────────────
const ProtectedRoute = ({ children, withLayout = true }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;
  return withLayout ? <Layout>{children}</Layout> : children;
};

// ─── Ruta solo admin ──────────────────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;
  if (user.user_role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

// ─── Ruta pública ─────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (user) {
    if (user.user_status === 'pending') return <PendingApproval />;
    if (user.user_role === 'provider') return <Navigate to="/provider-orders" replace />;
    if (user.user_role === 'admin')    return <Navigate to="/admin" replace />;
    return <Navigate to="/catalogo" replace />;
  }
  return children;
};

// ─── Dashboard ────────────────────────────────────────
const Dashboard = () => {
  const { user, setUser } = useUser();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      exchangeSession(token)
        .then(() => getMe())
        .then((u) => {
          if (u) {
            setUser(u);
            if (u.user_status === 'pending') return;
            if (u.user_role === 'provider') navigate('/provider-orders', { replace: true });
            else if (u.user_role === 'admin') navigate('/admin', { replace: true });
            else navigate('/catalogo', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        })
        .catch(() => navigate('/login', { replace: true }));
    } else if (user) {
      if (user.user_status === 'pending') return;
      if (user.user_role === 'provider') navigate('/provider-orders', { replace: true });
      else if (user.user_role === 'admin') navigate('/admin', { replace: true });
      else navigate('/catalogo', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return <div className="loading-screen">Cargando...</div>;
};

// ─── App ──────────────────────────────────────────────
function App() {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      <Router>
        <Routes>
          <Route path="/login"     element={<PublicRoute><LoginMinimal /></PublicRoute>} />
          <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/order/new" element={<ProtectedRoute withLayout={false}><OrderForm /></ProtectedRoute>} />

          {/* Rutas seller */}
          <Route path="/catalogo"      element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="/proveedor"     element={<ProtectedRoute><Proveedor /></ProtectedRoute>} />
          <Route path="/proveedores"   element={<ProtectedRoute><Providers /></ProtectedRoute>} />
          <Route path="/transacciones" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/wallet"        element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/product/:id"   element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />

          {/* Rutas provider */}
          <Route path="/provider-orders"  element={<ProtectedRoute><ProviderOrders /></ProtectedRoute>} />
          <Route path="/provider-catalog" element={<ProtectedRoute><ProviderCatalog /></ProtectedRoute>} />
          <Route path="/add-product"      element={<ProtectedRoute><AddProductForm /></ProtectedRoute>} />

          {/* Rutas admin */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={
            <ProtectedRoute>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>404 - Página no encontrada</h1>
                <p>La página que buscas no existe.</p>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;