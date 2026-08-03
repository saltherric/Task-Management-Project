import axios from "axios";
import { getAuthToken } from "../helpers/auth";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const publicPaths = ["/login", "/register", "/verify-email", "/resend-verification", "/forgot-password", "/reset-password", "/oauth-success", "/invite"];
            const isPublicPage = publicPaths.some(path => window.location.pathname.startsWith(path) || window.location.pathname === "/");

            if (!isPublicPage) {
                localStorage.removeItem("userInfo");
                window.dispatchEvent(new Event("userInfoUpdated"));
                window.location.href = "/login?expired=true";
            }
        }
        return Promise.reject(error);
    }
);

export default API;