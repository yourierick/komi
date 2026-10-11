"use client"; // IMPORTANT : axios + cookies doivent être côté client

import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";
//const API_URL = "http://172.20.10.4:8000/api/v1";

// Gestion d’événements (session expirée)
export const sessionEvents = {
  expired: new EventTarget(),
};

let redirectionInProgress = false;

// --- Helpers ---
function getCookie(name) {
  if (typeof document === "undefined") return null; // Next.js SSR protection

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(";").shift());
  }
  return null;
}

// --- Instances axios ---
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

// Instance pour les routes web (sans /api)
export const webApi = axios.create({
  baseURL: "http://localhost:8000",
  //baseURL: "http://172.20.10.4:8000",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

// --- Interceptor Request pour CSRF ---
api.interceptors.request.use(
  (config) => {
    const token = getCookie("XSRF-TOKEN");
    if (token) {
      config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

webApi.interceptors.request.use(
  (config) => {
    const token = getCookie("XSRF-TOKEN");
    if (token) {
      config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Fonction CSRF à appeler manuellement ---
export async function initSanctum() {
  // Appelle la route Sanctum
  await webApi.get("/sanctum/csrf-cookie");

  // Récupère le cookie XSRF-TOKEN
  const token = getCookie("XSRF-TOKEN");

  // Ajoute le token aux headers axios
  if (token) {
    api.defaults.headers["X-XSRF-TOKEN"] = token;
  }
}

// --- Interceptor Response ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Erreurs réseau
    if (!error.response && error.code) {
      let errorMessage = "Erreur de connexion";

      switch (error.code) {
        case "ERR_CONNECTION_CLOSED":
        case "ERR_CONNECTION_REFUSED":
        case "ERR_INTERNET_DISCONNECTED":
        case "ERR_NETWORK":
          errorMessage =
            "Erreur de connexion, veuillez vérifier votre connexion internet ou sa qualité";
          break;
        case "ERR_NAME_NOT_RESOLVED":
          errorMessage =
            "Impossible de se connecter au serveur, vérifiez votre configuration réseau";
          break;
        case "ERR_TIMED_OUT":
          errorMessage = "La connexion a expiré, veuillez réessayer";
          break;
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.code = error.code;
      enhancedError.isNetworkError = true;
      enhancedError.originalError = error;

      return Promise.reject(enhancedError);
    }

    // Gestion des erreurs 401 (non autorisé) et 419 (session expirée)
    if (error.response?.status === 401 || error.response?.status === 419) {
        // Certaines requêtes (ex: vérification silencieuse du profil) ne doivent
        // jamais déclencher de redirection, ni impacter le flag global.
        if (error.config?.skipAuthRedirect) {
            return Promise.reject(error);
        }

        // Liste des pages publiques (pas de redirection nécessaire)
        const publicPages = [
          { path: '/', exact: true },
          { path: '/auth/sign-in', exact: false },
          { path: '/auth/sign-up', exact: false },
          { path: '/products', exact: false },
          { path: '/rentals', exact: false },
        ];
        const pathname = window.location.pathname;
        const isPublicPage = publicPages.some(page =>
          page.exact ? pathname === page.path : pathname.startsWith(page.path)
        );

        // Ne rien faire si on est déjà sur une page publique : cela ne doit
        // jamais verrouiller le flag de redirection pour les autres pages.
        if (isPublicPage) {
            return Promise.reject(error);
        }

        // Éviter les redirections multiples
        if (!redirectionInProgress) {
            redirectionInProgress = true;

            // Déclencher l'événement d'expiration de session
            const sessionExpiredEvent = new Event('session-expired');
            sessionEvents.expired.dispatchEvent(sessionExpiredEvent);

            // Rediriger vers la page de connexion après un court délai
            setTimeout(() => {
                window.location.href = '/auth/sign-in';
                // Réinitialise le flag au cas où la navigation serait annulée
                redirectionInProgress = false;
            }, 100);
        }

        return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// --- API Modules ---
export const authAPI = {
  getProfile: () => api.get("/auth/profile", { skipAuthRedirect: true }),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  register: (data) => api.post("/auth/register", data),
  updateProfile: (data) => {
    data.append("_method", "PUT");
    return api.post("/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const itemAPI = {
  create: (data) =>
    api.post("/items", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  get: (id) => api.get(`/items/${id}`),
  getMyItems: () => api.get("/my-items"),
  list: () => api.get("/items"),
};

export const resellAPI = {
  create: (itemId) => api.post(`/items/${itemId}/resell`),
  getByCode: (code) => api.get(`/r/${code}`),
};

export const resellerLinkAPI = {
  createProductLink: (productId) => api.post(`/reseller-links/product/${productId}`),
  createRentalLink: (rentalId) => api.post(`/reseller-links/rental/${rentalId}`),
  getResellerByCode: (code) => api.get(`/public/reseller-links/${code}/reseller`),
};

export const shopAPI = {
  create: (data) =>
    api.post("/shops", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/shops/${id}`),
  get: (id) => api.get(`/shops/${id}`),
  list: () => api.get("/shops"),
  products: (id) => api.get(`/shops/${id}/products`),
  update: (id, data) => {
    data.append("_method", "PUT");
    return api.post(`/shops/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const storeReviewAPI = {
  create: (shopId, data) => api.post(`/shops/${shopId}/reviews`, data),
  delete: (shopId, id) => api.delete(`/shops/${shopId}/reviews/${id}`),
  get: (shopId, id) => api.get(`/shops/${shopId}/reviews/${id}`),
  list: (shopId) => api.get(`/shops/${shopId}/reviews`),
  update: (shopId, id, data) => api.put(`/shops/${shopId}/reviews/${id}`, data),
};

export const productAPI = {
  create: (data) =>
    api.post("/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/products/${id}`),
  get: (id) => api.get(`/products/${id}`),
  list: () => api.get("/products"),
  update: (id, data) => {
    data.append("_method", "PUT");
    return api.post(`/products/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const publicProductAPI = {
  categories: () => api.get("/public/products/categories"),
  featured: () => api.get("/public/products/featured"),
  get: (id) => api.get(`/public/products/${id}`),
  list: (params = {}) => api.get("/public/products", { params }),
};

export const publicRentalAPI = {
  categories: () => api.get("/public/rentals/categories"),
  get: (id) => api.get(`/public/rentals/${id}`),
  list: (params = {}) => api.get("/public/rentals", { params }),
};

export const publicServiceAPI = {
  categories: () => api.get("/public/services/categories"),
  get: (id) => api.get(`/public/services/${id}`),
  list: (params = {}) => api.get("/public/services", { params }),
};

export const rentalAPI = {
  create: (data) =>
    api.post("/rentals", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/rentals/${id}`),
  get: (id) => api.get(`/rentals/${id}`),
  list: () => api.get("/rentals"),
  update: (id, data) => {
    data.append("_method", "PUT");
    return api.post(`/rentals/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const serviceAPI = {
  create: (data) =>
    api.post("/services", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/services/${id}`),
  get: (id) => api.get(`/services/${id}`),
  list: () => api.get("/services"),
  update: (id, data) => {
    data.append("_method", "PUT");
    return api.post(`/services/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  delete: (id) => api.delete(`/orders/${id}`),
  get: (id) => api.get(`/orders/${id}`),
  sendInvoice: (id) => api.patch(`/orders/sendinvoice/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  list: (params) => api.get("/orders", { params }),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  receivedOrders: (params) => api.get("/orders/received", { params }),
  updateReceivedOrder: (id, data) => api.put(`/orders/received/${id}`, data),
};

export const invoiceAPI = {
  uploadPaymentProof: (invoiceId, data) =>
    api.post(`/invoices/${invoiceId}/payment-proofs`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const commissionAPI = {
  list: (params = {}) => api.get("/commissions", { params }),
};

export const productCommentAPI = {
  list: (productId) => api.get(`/products/${productId}/comments`),
  approvedlist: (productId) => api.get(`/products/${productId}/approvedcomments`),
  create: (productId, data) => api.post(`/products/${productId}/comments`, data),
  update: (commentId, data) => api.put(`/comments/${commentId}`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
  approve: (commentId, approved) => api.patch(`/comments/${commentId}/approve`, { approved }),
};

export const rentalCommentAPI = {
  list: (rentalId) => api.get(`/rentals/${rentalId}/comments`),
  create: (rentalId, data) => api.post(`/rentals/${rentalId}/comments`, data),
  update: (commentId, data) => api.put(`/rental-comments/${commentId}`, data),
  delete: (commentId) => api.delete(`/rental-comments/${commentId}`),
  approve: (commentId, approved) => api.patch(`/rental-comments/${commentId}/approve`, { approved }),
};

export const serviceCommentAPI = {
  list: (serviceId) => api.get(`/services/${serviceId}/comments`),
  create: (serviceId, data) => api.post(`/services/${serviceId}/comments`, data),
  update: (commentId, data) => api.put(`/service-comments/${commentId}`, data),
  delete: (commentId) => api.delete(`/service-comments/${commentId}`),
  approve: (commentId, approved) => api.patch(`/service-comments/${commentId}/approve`, { approved }),
};

export const supplierAPI = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
};

export const supplierReviewAPI = {
  list: (supplierId) => api.get(`/suppliers/${supplierId}/reviews`),
  create: (supplierId, data) => api.post(`/suppliers/${supplierId}/reviews`, data),
  update: (reviewId, data) => api.put(`/supplier-reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/supplier-reviews/${reviewId}`),
  approve: (reviewId, approved) => api.patch(`/supplier-reviews/${reviewId}/approve`, { approved }),
};

// --- Fonction pour vérifier si l'utilisateur est connecté ---
export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/profile");
    return response.data.data;
  } catch (error) {
    // Utilisateur non connecté ou erreur
    if (error.response?.status === 401) {
      return null;
    }
    console.error("Error checking auth status:", error);
    return null;
  }
}

// --- Fonction pour rediriger si déjà connecté (pour page login) ---
export async function redirectIfAuthenticated(redirectTo = "/dashboard") {
  const user = await getCurrentUser();
  if (user && typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

// --- Fonction pour rediriger si non connecté (pour pages protégées) ---
export async function requireAuth(redirectTo = "/auth/sign-in") {
  const user = await getCurrentUser();
  if (!user && typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

export default api;
