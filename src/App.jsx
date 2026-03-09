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
import OrderForm from './components/OrderForm';
import { getMe } from './services/api';
import './App.css';

const BASE_URL = "https://easypy-backend-430520813248.us-central1.run.app";

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

  // Calculate total items in cart
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

      {/* Cart Sidebar */}
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

// ─── Ruta pública ─────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (user) {
    return <Navigate to={user.user_role === 'provider' ? '/provider-orders' : '/catalogo'} replace />;
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
      // canjear token temporal por cookie de sesión
      fetch(`${BASE_URL}/auth/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(() => getMe())
        .then((u) => {
          if (u) {
            setUser(u);
            navigate(u.user_role === 'provider' ? '/provider-orders' : '/catalogo', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        })
        .catch(() => navigate('/login', { replace: true }));
    } else if (user) {
      navigate(user.user_role === 'provider' ? '/provider-orders' : '/catalogo', { replace: true });
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

  // Add to cart with provider validation
  const addToCart = (product, provider) => {
    // Check if cart is empty or if product is from same provider
    if (cart.length > 0 && cart[0].provider !== provider) {
      alert(`Solo puedes agregar productos del mismo proveedor.\nTu carrito actual contiene productos de: ${cart[0].provider}`);
      return false;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if product already in cart
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new product to cart
        return [...prevCart, { ...product, provider, quantity: 1 }];
      }
    });

    // Show success message
    alert('Producto agregado al carrito');
    return true;
  };

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Clear cart
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
            <Route path="/login" element={<PublicRoute><LoginMinimal /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/order/new" element={<ProtectedRoute withLayout={false}><OrderForm /></ProtectedRoute>} />
            <Route path="/catalogo"         element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
            <Route path="/proveedor"        element={<ProtectedRoute><Proveedor /></ProtectedRoute>} />
            <Route path="/proveedores"      element={<ProtectedRoute><Providers /></ProtectedRoute>} />
            <Route path="/transacciones"    element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/wallet"           element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/provider-orders"  element={<ProtectedRoute><ProviderOrders /></ProtectedRoute>} />
            <Route path="/provider-catalog" element={<ProtectedRoute><ProviderCatalog /></ProtectedRoute>} />
            <Route path="/add-product"      element={<ProtectedRoute><AddProductForm /></ProtectedRoute>} />
            <Route path="/product/:id"      element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
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