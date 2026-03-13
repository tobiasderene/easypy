import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProviderSidebar from './components/ProviderSidebar';
import CartSidebar from './components/CartSidebar';
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
import AdminPage from './pages/AdminPage';
import OrderForm from './components/OrderForm';
import { getMe, exchangeSession } from './services/api';
import './App.css';

// ─── Context de usuario ───────────────────────────────
export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

// ─── Context de carrito ───────────────────────────────
export const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// ─── Layout ───────────────────────────────────────────
const Layout = ({ children }) => {
  const { user } = useUser();
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Header
        userName={user?.user_nickname || 'Usuario'}
        userBalance="1,250.00"
        userAvatar={null}
        onMenuClick={() => setIsSidebarOpen(true)}
        onSearch={(v) => console.log('Searching:', v)}
        onUserClick={() => console.log('User profile clicked')}
        onCartClick={() => setIsCartOpen(true)}
        cartItemsCount={cartItemsCount}
      />

      {user?.user_role === 'provider' ? (
        <ProviderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      ) : (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
      />

      <main>{children}</main>
    </>
  );
};

// ─── Ruta protegida ───────────────────────────────────
const ProtectedRoute = ({ children, withLayout = true }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return withLayout ? <Layout>{children}</Layout> : children;
};

// ─── Ruta solo admin ──────────────────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.user_role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

// ─── Ruta pública ─────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (user) {
    if (user.user_role === 'provider') return <Navigate to="/provider-orders" replace />;
    if (user.user_role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/catalogo" replace />;
  }
  return children;
};

// ─── Dashboard: maneja redirect de Google ─────────────
const Dashboard = () => {
  const { user, setUser } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      exchangeSession(token)
        .then(() => getMe())
        .then((u) => {
          if (u) {
            setUser(u);
            if (u.user_role === 'provider') navigate('/provider-orders', { replace: true });
            else if (u.user_role === 'admin') navigate('/admin', { replace: true });
            else navigate('/catalogo', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        })
        .catch(() => navigate('/login', { replace: true }));
    } else if (user) {
      if (user.user_role === 'provider') navigate('/provider-orders', { replace: true });
      else if (user.user_role === 'admin') navigate('/admin', { replace: true });
      else navigate('/catalogo', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return <div className="loading-screen">Cargando...</div>;
};

// ─── Cart Provider ────────────────────────────────────
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product, provider) => {
    if (cart.length > 0 && cart[0].provider !== provider) {
      alert(`Solo puedes agregar productos del mismo proveedor.\nTu carrito actual contiene productos de: ${cart[0].provider}`);
      return false;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, provider, quantity: 1 }];
      }
    });

    alert('Producto agregado al carrito');
    return true;
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
      setCart([]);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// ─── App ──────────────────────────────────────────────
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
      <CartProvider>
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
      </CartProvider>
    </UserContext.Provider>
  );
}

export default App;