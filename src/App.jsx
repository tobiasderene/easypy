import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';

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

import { getMe, exchangeSession, getWalletByUser } from './services/api';
import './App.css';

/* ── Contexto ── */
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

/* ── Layout persistente — no se remonta en cada ruta ── */
const PersistentLayout = () => {
  const { user, walletBalance, setSearchQuery } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarComponent =
    user?.user_role === 'provider'  ? ProviderSidebar  :
    user?.user_role === 'logistics' ? LogisticsSidebar :
    user?.user_role === 'admin'     ? AdminSidebar     :
    Sidebar;

  return (
    <>
      <Header
        userName={user?.user_nickname || 'Usuario'}
        userBalance={walletBalance}
        onMenuClick={() => setSidebarOpen(true)}
        onSearch={(v) => setSearchQuery(v)}
      />
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main>
        <Outlet /> {/* ← solo esto cambia entre rutas */}
      </main>
    </>
  );
};

/* ── Guards ── */
const RequireAuth = () => {
  const { user, loading } = useUser();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;
  return <PersistentLayout />;
};

const RoleGuard = ({ roles }) => {
  const { user, loading } = useUser();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/" replace />;
  if (user.user_status === 'pending') return <PendingApproval />;
  if (!roles.includes(user.user_role)) return <Navigate to="/" replace />;
  return <PersistentLayout />;
};

/* ── Landing gate ── */
const LandingGate = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (user.user_status === 'pending') { navigate('/pending', { replace: true }); return; }
    if (user.user_role === 'provider')  { navigate('/provider-orders', { replace: true }); return; }
    if (user.user_role === 'admin')     { navigate('/admin',           { replace: true }); return; }
    if (user.user_role === 'logistics') { navigate('/logistics',       { replace: true }); return; }
    navigate('/catalogo', { replace: true });
  }, [user, loading]);

  if (loading) return <LoadingScreen />;
  return <LandingPage />;
};

/* ── App ── */
function App() {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Wallet en el contexto global — se carga una sola vez
  useEffect(() => {
    if (!user?.user_id) return;
    getWalletByUser(user.user_id)
      .then(w => setWalletBalance(w ? parseFloat(w.balance_available) : 0))
      .catch(() => setWalletBalance(0));
  }, [user?.user_id]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, walletBalance, setWalletBalance, searchQuery, setSearchQuery }}>
      <Router>
        <Routes>

          {/* Públicas */}
          <Route path="/"              element={<LandingGate />} />
          <Route path="/login"         element={<LoginMinimal />} />
          <Route path="/signup"        element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Seller */}
          <Route element={<RoleGuard roles={['buyer','seller']} />}>
            <Route path="/catalogo"      element={<Catalog />} />
            <Route path="/proveedor"     element={<Proveedor />} />
            <Route path="/proveedores"   element={<Providers />} />
            <Route path="/product/:id"   element={<ProductPage />} />
            <Route path="/transacciones" element={<Transactions />} />
          </Route>

          {/* Provider */}
          <Route element={<RoleGuard roles={['provider','admin']} />}>
            <Route path="/provider-orders"   element={<ProviderOrders />} />
            <Route path="/provider-catalog"  element={<ProviderCatalog />} />
            <Route path="/add-product"       element={<AddProductForm />} />
            <Route path="/edit-product/:id"  element={<EditProductForm />} />
          </Route>

          {/* Logistics */}
          <Route element={<RoleGuard roles={['logistics']} />}>
            <Route path="/logistics" element={<LogisticsPanel />} />
          </Route>

          {/* Admin */}
          <Route element={<RoleGuard roles={['admin']} />}>
            <Route path="/admin"                    element={<AdminPage />} />
            <Route path="/admin/create-logistics"   element={<CreateLogisticsUser />} />
          </Route>

          {/* Cualquier usuario autenticado */}
          <Route element={<RequireAuth />}>
            <Route path="/wallet"        element={<Wallet />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/configuracion" element={<Settings />} />
            <Route path="/order/new"     element={<OrderForm />} />
            <Route path="/perfil-proveedor/:id" element={<ProviderProfile />} />
            <Route path="*" element={
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h1>404 - No existe</h1>
              </div>
            } />
          </Route>

        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
