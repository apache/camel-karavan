import axios from "axios";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {AccessPassword, AccessUser} from "@/access/AccessModels";
import {SsoApi} from "@/auth/SsoApi";

// --- axios base ---
axios.defaults.timeout = 30000;
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.headers.common["Content-Type"] = "application/json";

const instance = axios.create({ withCredentials: true });

// --- simple state (no tokens) ---
let currentUser: AccessUser | null = null;
export function setCurrentUser(u: AccessUser | null) { currentUser = u; }
export function getCurrentUser() { return currentUser; }
export function getInstance() { return instance; }

// --- cookies / csrf ---
const CSRF_COOKIE = "csrf";
function readCookie(name: string): string | null {
    return document.cookie
        .split("; ")
        .map((p) => p.trim())
        .filter((p) => p.startsWith(name + "="))
        .map((p) => p.substring(name.length + 1))[0] ?? null;
}

function isNoAuth(cfg: any) {
    const method = (cfg.method || "GET").toUpperCase();
    const url = new URL(cfg.url!, cfg.baseURL || window.location.origin);
    const path = url.pathname;
    // Endpoints where we intentionally skip CSRF/auth headers
    return (
        cfg.headers?.["X-Skip-Auth"] === "1" ||
        method === "OPTIONS" ||
        path.endsWith("/ui/auth/login") ||
        path.endsWith("/ui/auth/logout") ||
        path.endsWith("/health") ||
        path.endsWith("/q/health")
    );
}

// --- API surface (no tokens involved) ---
export class AuthApi {
    static authType?: "session" | "oidc";
    static getInstance() {
        return instance;
    }

    static async getMe(after: (user: AccessUser) => void) {
        instance
            .get("/ui/auth/me", { withCredentials: true })
            .then((res) => {
                if (res.status === 200) {
                    setCurrentUser(res.data);
                    after(res.data);
                }
            })
            .catch((err) => {
                // 401 here means "not logged in"
                setCurrentUser(null);
                // optional: bubble error to a global bus/router
                // ErrorEventBus.sendApiError(err);
            });
    }

    static async login(
        username: string,
        password: string,
        after: (ok: boolean, res: any) => void
    ) {
        instance
            .post("/ui/auth/login", { username, password }, { withCredentials: true })
            .then((res) => {
                console.log(res);
                if (res.status === 200) {
                    // server may return user; if not, fetch it
                    if (res.data?.username) {
                        setCurrentUser(res.data.username);
                        after(true, res);
                    } else {
                        AuthApi.getMe(() => after(true, res));
                    }
                } else {
                    setCurrentUser(null);
                    after(false, res);
                }
            })
            .catch((err) => {
                setCurrentUser(null);
                after(false, err);
                console.error(err)
            });
    }

    static async logout() {
        // Tell interceptors to skip CSRF on logout
        instance
            .post(
                "/ui/auth/logout",
                {},
                { withCredentials: true, headers: { "X-Skip-Auth": "1" } }
            )
            .then((res) => {
                if (res.status === 204) {
                    setCurrentUser(null);
                }
            })
            .catch((err) => {
                console.error(err);
                setCurrentUser(null);
            });
    }


    static setPassword(password: AccessPassword, after: (result: boolean, res: any) => void) {
        instance
            .post("/ui/auth/password", password)
            .then((res) => {
                if (res.status === 200 || res.status === 201) after(true, res);
                else after(false, res);
            })
            .catch((err) => {
                console.error(err);
                after(false, err);
            });
    }

    // Optional: keep if your UI still reads SSO config (even though auth is session-based)
    static async getSsoConfig(after: (config: {}) => void) {
        instance.get("/ui/auth/sso-config", { headers: { Accept: "application/json" } })
            .then((res) => {
                if (res.status === 200) after(res.data);
            })
            .catch((err) => {
                ErrorEventBus.sendApiError(err);
            });
    }

    static setAuthType(authType: "session" | "oidc") {
        this.authType = authType;
        switch (authType) {
            case "oidc":
                AuthApi.setOidcAuthentication();
                break;
            case "session":
                AuthApi.setSessionIdAuthentication();
                break;
        }
    }

    static async getAuthType(after: (authType: string) => void) {
        instance
            .get("/ui/auth/type", { headers: { Accept: "text/plain" } })
            .then((res) => {
                if (res.status === 200) {
                    const authType = res.data as "session" | "oidc";
                    AuthApi.setAuthType(authType);
                    after(authType);
                }
            })
            .catch((err) => {
                ErrorEventBus.sendApiError(err);
            });
    }

    private static setSessionIdAuthentication() {
        // --- request interceptor: add CSRF header on unsafe methods, never set Authorization ---
        instance.interceptors.request.use((cfg: any) => {
            // ensure no Authorization header sneaks in
            if (cfg?.headers?.Authorization) delete cfg.headers.Authorization;

            if (!isNoAuth(cfg)) {
                const m = (cfg.method || "GET").toLowerCase();
                const unsafe = m === "post" || m === "put" || m === "patch" || m === "delete";
                if (unsafe) {
                    const csrf = readCookie(CSRF_COOKIE);
                    if (csrf) cfg.headers = { ...cfg.headers, "X-CSRF-Token": csrf };
                }
            }
            return cfg;
        });

// --- response interceptor: normalize 401 handling ---
        instance.interceptors.response.use(
            (res) => res,
            async (error) => {
                const original = error?.config;
                if (!original) throw error;

                if (error?.response?.status === 401 && !original._retry && !isNoAuth(original)) {
                    original._retry = true;
                    // Session missing/expired → clear user; let caller redirect to /login
                    setCurrentUser(null);
                    // Optionally: return a rejected promise with a sentinel
                    return Promise.reject({ ...error, _auth: "unauthorized" });
                }

                return Promise.reject(error);
            }
        );
    }

    static setOidcAuthentication() {
        instance.interceptors.request.use(
            async (config) => {
                const token = SsoApi.keycloak?.token;
                if (token) config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => Promise.reject(error)
        );

        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const original = error.config;
                if (!original || original._retry) return Promise.reject(error);

                const status = error?.response?.status;
                if ((status === 401 || status === 403) && SsoApi.keycloak) {
                    original._retry = true;
                    try {
                        const refreshed = await SsoApi.keycloak.updateToken(30);
                        if (refreshed) {
                            original.headers = {
                                ...original.headers,
                                Authorization: `Bearer ${SsoApi.keycloak.token}`,
                            };
                            return instance(original);
                        }
                    } catch (e) {
                        // fall-through
                    }
                }
                return Promise.reject(error);
            }
        );
    }
}
