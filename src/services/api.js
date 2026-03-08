const BASE_URL = "https://easypy-backend-430520813248.us-central1.run.app";

const api = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include", // necesario para mandar las cookies de sesión
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || "Error en la solicitud");
  }

  // algunos endpoints devuelven 204 sin body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ─── Auth ────────────────────────────────────────────
export const getGoogleAuthUrl = () => api("/auth/google");
export const getMe = () => api("/auth/me");
export const logout = () => api("/auth/logout", { method: "POST" });

export const loginLocal = (email, password) =>
  api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const registerLocal = (email, name, password, userRole) =>
  api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password, user_role: userRole }),
  });

export const registerGoogle = (email, name, userRole) =>
  api("/auth/register/google", {
    method: "POST",
    body: JSON.stringify({ email, name, user_role: userRole }),
  });

// ─── Users ───────────────────────────────────────────
export const getUser = (userId) => api(`/users/${userId}`);
export const updateUser = (userId, data) =>
  api(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Products ────────────────────────────────────────
export const getProducts = (skip = 0, limit = 100) =>
  api(`/products?skip=${skip}&limit=${limit}`);
export const getMyProducts = (skip = 0, limit = 100) =>
  api(`/products/my-products?skip=${skip}&limit=${limit}`);
export const getProduct = (productId) => api(`/products/${productId}`);
export const createProduct = (data) =>
  api("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (productId, data) =>
  api(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProduct = (productId) =>
  api(`/products/${productId}`, { method: "DELETE" });

// ─── Images ──────────────────────────────────────────
export const getProductImages = (productId) => api(`/images/product/${productId}`);
export const getProfileImage = (userId) => api(`/images/profile/${userId}`);
export const deleteImage = (imageId) => api(`/images/${imageId}`, { method: "DELETE" });

export const uploadProductImage = (productId, file, isPrimary = false, position = 0) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${BASE_URL}/images/product/${productId}?is_primary=${isPrimary}&position=${position}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((res) => res.json());
};

export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${BASE_URL}/images/profile`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((res) => res.json());
};

// ─── Orders ──────────────────────────────────────────
export const getOrders = (skip = 0, limit = 100) =>
  api(`/orders?skip=${skip}&limit=${limit}`);
export const getOrder = (orderId) => api(`/orders/${orderId}`);
export const getOrdersByBuyer = (buyerId) => api(`/orders/buyer/${buyerId}`);
export const getOrdersBySupplier = (supplierId) => api(`/orders/supplier/${supplierId}`);
export const createOrder = (data) =>
  api("/orders", { method: "POST", body: JSON.stringify(data) });
export const updateOrder = (orderId, data) =>
  api(`/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) });
export const getOrderHistory = (orderId) => api(`/orders/${orderId}/history`);

// ─── Wallets ─────────────────────────────────────────
export const getWallet = (walletId) => api(`/wallets/${walletId}`);
export const getWalletByUser = (userId) => api(`/wallets/user/${userId}`);
export const updateWallet = (walletId, data) =>
  api(`/wallets/${walletId}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Transactions ─────────────────────────────────────
export const getTransactions = () => api("/transactions");
export const getTransactionsByWallet = (walletId) =>
  api(`/transactions/wallet/${walletId}`);
export const getTransactionsByOrder = (orderId) =>
  api(`/transactions/order/${orderId}`);

// ─── Withdrawals ──────────────────────────────────────
export const getWithdrawals = () => api("/withdrawals");
export const getWithdrawalsByWallet = (walletId) =>
  api(`/withdrawals/wallet/${walletId}`);
export const createWithdrawal = (data) =>
  api("/withdrawals", { method: "POST", body: JSON.stringify(data) });
export const updateWithdrawal = (withdrawalId, data) =>
  api(`/withdrawals/${withdrawalId}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Bank Movements ───────────────────────────────────
export const getBankMovements = () => api("/bank-movements");
export const getBankMovementsByWithdrawal = (withdrawalId) =>
  api(`/bank-movements/withdrawal/${withdrawalId}`);
export const createBankMovement = (data) =>
  api("/bank-movements", { method: "POST", body: JSON.stringify(data) });