export const API_ROUTES = {
  POST: {
    LOGIN: "/api/auth/login/",
    REGISTER: "/api/auth/register/",
    LOGOUT: "/api/auth/logout/",
    TOKEN_REFRESH: "/api/auth/token/refresh/",
  },
} as const;
