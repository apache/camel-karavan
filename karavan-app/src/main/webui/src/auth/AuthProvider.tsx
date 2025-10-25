import React, {useCallback, useEffect, useState} from "react";
import {AuthApi} from "@/auth/AuthApi";

export const AuthContext = React.createContext({
    user: null as any,
    loading: true,
    reload: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        try {
            await AuthApi.getMe((u) => setUser(u));
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await AuthApi.logout();
        setUser(null);
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return (
        <AuthContext.Provider value={{ user, loading, reload, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
