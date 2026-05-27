const BASE_URL = "https://easypy-backend-430520813248.us-central1.run.app";

// ─── Token helpers ────────────────────────────────────
const getToken   = ()      => localStorage.getItem("auth_token");
const saveToken  = (token) => localStorage.setItem("auth_token", token);
const clearToken = ()      => localStorage.removeItem("auth_token");

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractAndSaveToken = (data) => {
  if (data?.token) saveToken(data.token);
  return data;
};

// ─── Base fetch ───────────────────────────────────────
const api = async (endpoint, options = {}) => {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || "Error en la solicitud");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  extractAndSaveToken(data);
  return data;
};

// ─── Auth ─────────────────────────────────────────────
export const getGoogleAuthUrl = () => api("/auth/google");
export const exchangeSession  = (token) => api("/auth/session", { method: "POST", body: JSON.stringify({ token }) });

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || "Error en la solicitud");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const logout = async () => {
  clearToken();
  return api("/auth/logout", { method: "POST" });
};

export const loginLocal = (email, password) =>
  api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const registerLocal = (email, name, password, userRole, extraFields = {}) =>
  api("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password, user_role: userRole, ...extraFields }) });

// ── Customers ────────────────────────────────────────────────────────────────
export const getCustomers       = (skip = 0, limit = 100) => api(`/customers?skip=${skip}&limit=${limit}`);
export const searchCustomers    = (q, limit = 8) => api(`/customers/search?q=${encodeURIComponent(q)}&limit=${limit}`);
export const createCustomer     = (data) => api('/customers', { method: 'POST', body: JSON.stringify(data) });
export const updateCustomer     = (id, data) => api(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCustomer     = (id) => api(`/customers/${id}`, { method: 'DELETE' });

export const adminRegisterUser = (data) =>
  api('/auth/register/admin', { method: 'POST', body: JSON.stringify(data) });

export const registerGoogle = (email, name, userRole, googleId) =>
  api("/auth/register/google", { method: "POST", body: JSON.stringify({ email, name, user_role: userRole, google_id: googleId }) });

// ─── Users ────────────────────────────────────────────
export const getUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api(`/users${query ? `?${query}` : ''}`);
};
export const getProviders = () => api("/users/providers");
export const getUser      = (userId) => api(`/users/${userId}`);
export const getBankAccounts   = ()       => api('/bank-accounts');
export const createBankAccount = (data)    => api('/bank-accounts', { method: 'POST', body: JSON.stringify(data) });
export const setDefaultAccount = (id)      => api(`/bank-accounts/${id}/default`, { method: 'PATCH' });
export const deleteBankAccount = (id)      => api(`/bank-accounts/${id}`, { method: 'DELETE' });

export const getCities    = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api(`/cities${q ? '?' + q : ''}`);
};
export const updateUser        = (userId, data) =>
  api(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) });
export const adminUpdateStatus = (userId, status) =>
  api(`/users/admin/${userId}/status?status=${status}`, { method: "PATCH" });
export const adminDeleteUser   = (userId) =>
  api(`/users/${userId}`, { method: "DELETE" });

// ─── Products ─────────────────────────────────────────
export const getProducts   = (skip = 0, limit = 100) => api(`/products?skip=${skip}&limit=${limit}`);
export const getMyProducts    = (skip = 0, limit = 100) => api(`/products/my-products?skip=${skip}&limit=${limit}`);
export const getProductsByUser = (userId, skip = 0, limit = 100) => api(`/products/user/${userId}?skip=${skip}&limit=${limit}`);
export const getProduct    = (productId)             => api(`/products/${productId}`);
export const createProduct = (data)                  => api("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (productId, data)       => api(`/products/${productId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProduct = (productId)             => api(`/products/${productId}`, { method: "DELETE" });

// ─── Images ───────────────────────────────────────────
export const getProductImages = (productId) => api(`/images/product/${productId}`);
export const getProfileImage  = (userId)    => api(`/images/profile/${userId}`);
export const deleteImage      = (imageId)   => api(`/images/${imageId}`, { method: "DELETE" });

export const uploadProductImage = (productId, file, isPrimary = false, position = 0) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${BASE_URL}/images/product/${productId}?is_primary=${isPrimary}&position=${position}`, {
    method: "POST", credentials: "include", headers: authHeaders(), body: formData,
  }).then(res => res.json());
};

export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${BASE_URL}/images/profile`, {
    method: "POST", credentials: "include", headers: authHeaders(), body: formData,
  }).then(res => res.json());
};

// ─── Orders ───────────────────────────────────────────
export const getOrders           = (skip = 0, limit = 100) => api(`/orders?skip=${skip}&limit=${limit}`);
export const getOrder            = (orderId)       => api(`/orders/${orderId}`);
export const getOrdersByBuyer    = (buyerId)       => api(`/orders/buyer/${buyerId}`);
export const getOrdersBySupplier = (supplierId)    => api(`/orders/supplier/${supplierId}`);
export const createOrder         = (data)          => api("/orders", { method: "POST", body: JSON.stringify(data) });
export const updateOrder         = (orderId, data) => api(`/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) });
export const getOrderHistory     = (orderId)       => api(`/orders/${orderId}/history`);

export const getOrdersByStatus = (status) =>
  fetch(`${BASE_URL}/orders/status/${status}`, {
    credentials: "include", headers: authHeaders(),
  }).then(r => r.json());

export const confirmOrderAdmin = (orderId) =>
  fetch(`${BASE_URL}/orders/${orderId}/confirm/admin`, {
    method: "POST", credentials: "include", headers: authHeaders(),
  }).then(r => { if (!r.ok) throw new Error(); return r.json(); });

export const cancelOrderAdmin = (orderId) =>
  fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
    method: "POST", credentials: "include", headers: authHeaders(),
  }).then(r => { if (!r.ok) throw new Error(); return r.json(); });

export const getOrdersBySupplierApi = (supplierId) => api(`/orders/supplier/${supplierId}`);
export const confirmOrderSupplier   = (orderId)    => api(`/orders/${orderId}/confirm/supplier`, { method: "POST" });
export const cancelOrderSupplier    = (orderId)    => api(`/orders/${orderId}/cancel`,            { method: "POST" });

// ─── Logistics orders ─────────────────────────────────
export const getOrdersByLogistics  = (logisticId, limit = 200) => api(`/orders/logistics/${logisticId}?limit=${limit}`);
export const pickupOrder             = (orderId) => api(`/orders/${orderId}/pickup`,  { method: 'POST' });
export const deliverOrder            = (orderId) => api(`/orders/${orderId}/deliver`, { method: 'POST' });
export const markOrderReadyForPickup = (orderId) => api(`/orders/${orderId}/ready`,      { method: 'POST' });
export const redeliveryOrder         = (orderId) => api(`/orders/${orderId}/redelivery`, { method: 'POST' });

// ─── Wallets ──────────────────────────────────────────
export const getWallet       = (walletId)       => api(`/wallets/${walletId}`);
export const getWalletByUser = (userId)         => api(`/wallets/user/${userId}`);
export const updateWallet    = (walletId, data) => api(`/wallets/${walletId}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Transactions ─────────────────────────────────────
export const getTransactions         = ()         => api("/transactions");
export const getTransactionsByWallet = (walletId) => api(`/transactions/wallet/${walletId}`);
export const getTransactionsByOrder  = (orderId)  => api(`/transactions/order/${orderId}`);

// ─── Withdrawals ──────────────────────────────────────
export const getWithdrawals         = ()         => api("/withdrawals");
export const getWithdrawalsByWallet = (walletId) => api(`/withdrawals/wallet/${walletId}`);
export const createWithdrawal       = (data)     => api("/withdrawals", { method: "POST", body: JSON.stringify(data) });
export const getWithdrawalsByStatus = (status)   => api(`/withdrawals/status/${status}`);
export const updateWithdrawal       = (id, data) => api(`/withdrawals/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Bank Movements ───────────────────────────────────
export const getBankMovements             = ()         => api("/bank-movements");
export const getBankMovementsByWithdrawal = (wId)      => api(`/bank-movements/withdrawal/${wId}`);
export const createBankMovement           = (data)     => api("/bank-movements", { method: "POST", body: JSON.stringify(data) });
export const getBankMovementsByStatus     = (status)   => api(`/bank-movements/status/${status}`);
export const updateBankMovement           = (id, data) => api(`/bank-movements/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Logistics ────────────────────────────────────────
export const getLogistics       = ()           => api("/logistics");
export const getLogistic        = (logisticId) => api(`/logistics/${logisticId}`);
export const getMyLogistics     = ()           => api("/logistics/me");
export const getLogisticsQuote  = (logisticId, bultos = 1, peso = 1.0, cp = null) => api(`/logistics/${logisticId}/quote?bultos=${bultos}&peso=${peso}${cp ? `&cp=${cp}` : ''}`, { method: 'POST' });
export const getLogisticsZones  = (logisticId) => api(`/logistics/${logisticId}/zones`);
export const createLogistics    = (data)       => api("/logistics", { method: "POST", body: JSON.stringify(data) });
export const updateLogistics    = (id, data)   => api(`/logistics/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const assignUserToLogistics = (logisticId, userId) =>
  api(`/logistics/${logisticId}/assign/${userId}`, { method: "PATCH" });

export default api;

// ─── Deposits ─────────────────────────────────
export const createDeposit = (walletId, amount, file) => {
  const formData = new FormData();
  formData.append("wallet_id", walletId);
  formData.append("amount", amount);
  formData.append("file", file);
  return fetch(`${BASE_URL}/deposits`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(err.detail || "Error al crear el depósito");
    }
    return res.json();
  });
};

export const getMyDeposits      = (walletId) => api(`/deposits/wallet/${walletId}`);
export const getDeposits        = ()         => api("/deposits");
export const getDepositsByStatus = (status)  => api(`/deposits/status/${status}`);
export const approveDeposit     = (id, notes = "") => api(`/deposits/${id}/approve?notes=${encodeURIComponent(notes)}`, { method: "POST" });
export const rejectDeposit      = (id, notes = "") => api(`/deposits/${id}/reject?notes=${encodeURIComponent(notes)}`,  { method: "POST" });

// ─── Notifications ────────────────────────────
export const getNotifications        = ()   => api('/notifications');
export const getUnreadCount          = ()   => api('/notifications/unread-count');
export const markNotificationRead    = (id) => api(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = ()  => api('/notifications/read-all', { method: 'PATCH' });
