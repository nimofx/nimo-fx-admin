import { getItem, removeItem } from "../utils/storage.js";

export const BASE_URL = "https://nimo-fx-backend.onrender.com/api";

async function apiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    isAuth = false,
    isFormData = false,
  } = options;

  try {
    const headers = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (isAuth) {
      const token = getItem("nimo_fx_admin_token");

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        removeItem("nimo_fx_admin_token");
      }

      throw new Error(data?.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw new Error(error?.message || "Network error");
  }
}

/* 🔐 AUTH */
export const loginApi = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const getProfileApi = () =>
  apiRequest("/user/me", {
    isAuth: true,
  });

/* 👥 USERS */
export const getAllUsersApi = () =>
  apiRequest("/admin/users", {
    isAuth: true,
  });

export const blockUserApi = (id) =>
  apiRequest(`/admin/users/${id}/block`, {
    method: "PATCH",
    isAuth: true,
  });

export const unblockUserApi = (id) =>
  apiRequest(`/admin/users/${id}/unblock`, {
    method: "PATCH",
    isAuth: true,
  });

export const updateUserBalanceApi = (id, amount, action) =>
  apiRequest(`/admin/users/${id}/balance`, {
    method: "PATCH",
    body: { amount, action },
    isAuth: true,
  });

/* 🪪 KYC */
export const getAllKycApi = () =>
  apiRequest("/admin/kyc", {
    isAuth: true,
  });

export const approveKycApi = (id) =>
  apiRequest(`/admin/kyc/${id}/approve`, {
    method: "PATCH",
    isAuth: true,
  });

export const rejectKycApi = (id) =>
  apiRequest(`/admin/kyc/${id}/reject`, {
    method: "PATCH",
    isAuth: true,
  });

/* 🎧 SUPPORT */
export const getAllSupportApi = () =>
  apiRequest("/admin/support", {
    isAuth: true,
  });

export const replySupportApi = (id, reply) =>
  apiRequest(`/admin/support/${id}/reply`, {
    method: "PATCH",
    body: { reply },
    isAuth: true,
  });

export const closeSupportApi = (id) =>
  apiRequest(`/admin/support/${id}/close`, {
    method: "PATCH",
    isAuth: true,
  });

/* 💳 DEPOSIT ADDRESS + QR SETTINGS */
export const getDepositSettingsApi = () =>
  apiRequest("/admin/deposit-settings", {
    isAuth: true,
  });

export const updateDepositSettingApi = (chain, address, qrFile) => {
  const formData = new FormData();

  formData.append("address", address || "");

  if (qrFile) {
    formData.append("qrImage", qrFile);
  }

  return apiRequest(`/admin/deposit-settings/${encodeURIComponent(chain)}`, {
    method: "PUT",
    body: formData,
    isAuth: true,
    isFormData: true,
  });
};

/* 📈 TRADE PROFIT SETTINGS */
export const getAdminTradeProfitsApi = () =>
  apiRequest("/admin/trade-profits", {
    isAuth: true,
  });

export const createTradeProfitApi = (profitPercent) =>
  apiRequest("/admin/trade-profits", {
    method: "POST",
    body: { profitPercent },
    isAuth: true,
  });

/* 💰 TRANSACTIONS */
export const getPendingTransactionsApi = () =>
  apiRequest("/admin/transactions/pending", {
    isAuth: true,
  });

export const getAllTransactionsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(`/admin/transactions${query ? `?${query}` : ""}`, {
    isAuth: true,
  });
};

export const approveTransactionApi = (id) =>
  apiRequest(`/admin/transactions/${id}/approve`, {
    method: "PATCH",
    isAuth: true,
  });

export const rejectTransactionApi = (id) =>
  apiRequest(`/admin/transactions/${id}/reject`, {
    method: "PATCH",
    isAuth: true,
  });