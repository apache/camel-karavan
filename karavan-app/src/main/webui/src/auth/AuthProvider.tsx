import React, {useCallback, useEffect, useState} from "react";
// Import all the APIs we need
import {AuthApi, getCurrentUser} from "@/auth/AuthApi";
import {SsoApi} from "@/auth/SsoApi";
import {AccessUser} from "@/access/AccessModels"; // Assuming AccessUser is here

// We'll add `authType` to the context for consumers
export const AuthContext = React.createContext({
    user: null as AccessUser | null,
    loading: true,
    authType: null as "session" | "oidc" | null,
    reload: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AccessUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authType, setAuthType] = useState<"session" | "oidc" | null>(null);

    // This is the main initialization effect.
    // It replaces the simple `useEffect(() => { reload() }, [reload])`
    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted component
        // 1. Fetch the authentication type.
        // This call also sets up the correct axios interceptors inside AuthApi.
        AuthApi.getAuthType(type => {
            if (!isMounted) return;

            setAuthType(type as "session" | "oidc" | null); // Save the type

            if (type === 'oidc') {
                // 2a. OIDC Flow: Initialize Keycloak.
                // SsoApi.auth() handles the 'check-sso' logic.
                SsoApi.auth(() => {
                    // This callback runs after Keycloak init (login or silent check)
                    if (isMounted) {
                        // SsoApi.auth() has updated the global currentUser
                        setUser(getCurrentUser());
                        setLoading(false);
                    }
                });
            } else {
                // 2b. Session Flow: Just call /me to check for an existing cookie.
                AuthApi.getMe(userFromApi => {
                    if (isMounted) {
                        // AuthApi.getMe() updates global user and returns it
                        setUser(userFromApi);
                        setLoading(false);
                    }
                });
            }
        });

        // Cleanup function in case component unmounts during auth
        return () => { isMounted = false; };
    }, []); // Run only once on mount

    // The original `reload` was flawed (awaiting a non-promise).
    // This implementation matches the callback-style of AuthApi.getMe.
    const reload = useCallback(async () => {
        setLoading(true);
        // getMe will use the correct interceptor (OIDC or session)
        // because getAuthType() already ran and set it up.
        AuthApi.getMe((u) => {
            setUser(u);
            setLoading(false);
        });
        // We keep the `async` signature to match the context interface,
        // even though the implementation is callback-based.
    }, []);

    // The logout function MUST now be conditional
    const logout = useCallback(async () => {
        setLoading(true);

        if (authType === 'oidc') {
            // Use OIDC logout
            SsoApi.logout(() => {
                setUser(null);
                setLoading(false);
                // OIDC logout often involves a page redirect,
                // which SsoApi.logout() will trigger.
            });
        } else if (authType === 'session') {
            // Use session logout
            await AuthApi.logout(); // This is async
            setUser(null);
            setLoading(false);
        } else {
            // Fallback if authType isn't set for some reason
            setUser(null);
            setLoading(false);
        }
    }, [authType]); // Re-create this function if authType changes

    return (
        <AuthContext.Provider value={{ user, loading, authType, reload, logout }}>
            {children}
        </AuthContext.Provider>
    );
}