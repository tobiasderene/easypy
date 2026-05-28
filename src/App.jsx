import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProviderSidebar from './components/ProviderSidebar';
import LogisticsSidebar from './components/LogisticsSidebar';
import AdminSidebar from './components/AdminSidebar';

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
import EditProductForm from './pages/EditProductForm';

import AdminPage from './pages/AdminPage';
import CreateLogisticsUser from './pages/CreateLogisticsUser';

import LogisticsPanel from './pages/LogisticsPanel';
import ProviderProfile from './pages/ProviderProfile';

import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

import PendingApproval from './pages/PendingApproval';
import AuthCallback from './pages/AuthCallback';
import OrderForm from './components/OrderForm';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './components/LoadingScreen';

import {
  getMe,
  exchangeSession,
  getWalletByUser
} from './services/api';

import './App.css';

/* ───────────────────────────────
   CONTEXTO USER
────────────────────────────── */
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

/* ───────────────────────────────
   LAYOUT
────────────────────────────── */
const Layout = ({ children }) => {
  const { user } = useUser();
  const [walletBalance, setWalletBalance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user?.user_id) return;

    getWalletByUser(user.user_id)
      .then(w => setWalletBalance(w ? parseFloat(w.balance_available) : 0))
      .catch(() => setWalletBalance(0));
  }, [user]);

  const SidebarComponent =
    user?.user_role === 'provider'
      ? ProviderSidebar
      : user?.user_role === 'logistics'
      ? LogisticsSidebar
      : user?.user_role === 'admin'
      ? AdminSidebar
      : Sidebar;

  return (
    <>
      <Header
        userName={user?.user_nickname || 'Usuario'}
        userBalance={walletBalance}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main>{children}</main>
    </>
  );
};

/* ───────────────────────────────
   GUARDS
────────────────────────────── */

const useAuth = () => {
  const { user, loading } = useUser();
  return { user, loading };
};

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;

  return children;
};

const RoleGuard = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;

  if (!roles.includes(user.user_role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

/* ───────────────────────────────
   LANDING GATE (/)
────────────────────────────── */
const LandingGate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) return; // se queda en landing

    if (user.user_status === 'pending') {
      navigate('/pending', { replace: true });
      return;
    }

    if (user.user_role === 'provider') return navigate('/provider-orders', { replace: true });
    if (user.user_role === 'admin') return navigate('/admin', { replace: true });
    if (user.user_role === 'logistics') return navigate('/logistics', { replace: true });

    navigate('/catalogo', { replace: true });
  }, [user, loading]);

  if (loading) return <LoadingScreen />;

  return <LandingPage />;
};

/* ───────────────────────────────
   APP
────────────────────────────── */
function App() {
  const [user, setUser] = useState(null);
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

          {/* PUBLIC */}
          <Route path="/" element={<LandingGate />} />
          <Route path="/login" element={<LoginMinimal />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* SELLER */}
          <Route path="/catalogo" element={
            <RoleGuard roles={['buyer', 'seller']}>
              <Catalog />
            </RoleGuard>
          } />

          <Route path="/proveedor" element={
            <RoleGuard roles={['buyer', 'seller']}>
              <Proveedor />
            </RoleGuard>
          } />

          <Route path="/proveedores" element={
            <RoleGuard roles={['buyer', 'seller']}>
              <Providers />
            </RoleGuard>
          } />

          <Route path="/product/:id" element={
            <RoleGuard roles={['buyer', 'seller']}>
              <ProductPage />
            </RoleGuard>
          } />

          <Route path="/transacciones" element={
            <RoleGuard roles={['buyer', 'seller']}>
              <Transactions />
            </RoleGuard>
          } />

          <Route path="/wallet" element={
            <RequireAuth>
              <Wallet />
            </RequireAuth>
          } />

          <Route path="/analytics" element={
            <RequireAuth>
              <Analytics />
            </RequireAuth>
          } />

          <Route path="/configuracion" element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          } />

          {/* PROVIDER */}
          <Route path="/provider-orders" element={
            <RoleGuard roles={['provider', 'admin']}>
              <ProviderOrders />
            </RoleGuard>
          } />

          <Route path="/provider-catalog" element={
            <RoleGuard roles={['provider', 'admin']}>
              <ProviderCatalog />
            </RoleGuard>
          } />

          <Route path="/add-product" element={
            <RoleGuard roles={['provider', 'admin']}>
              <AddProductForm />
            </RoleGuard>
          } />

          <Route path="/edit-product/:id" element={
            <RoleGuard roles={['provider', 'admin']}>
              <EditProductForm />
            </RoleGuard>
          } />

          {/* LOGISTICS */}
          <Route path="/logistics" element={
            <RoleGuard roles={['logistics']}>
              <LogisticsPanel />
            </RoleGuard>
          } />

          {/* ADMIN */}
          <Route path="/admin" element={
            <RoleGuard roles={['admin']}>
              <AdminPage />
            </RoleGuard>
          } />

          <Route path="/admin/create-logistics" element={
            <RoleGuard roles={['admin']}>
              <CreateLogisticsUser />
            </RoleGuard>
          } />

          {/* ORDER */}
          <Route path="/order/new" element={
            <RequireAuth>
              <OrderForm />
            </RequireAuth>
          } />

          {/* FALLBACK */}
          <Route path="*" element={
            <RequireAuth>
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h1>404 - No existe</h1>
              </div>
            </RequireAuth>
          } />

        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;