import {Navigate, useLocation} from "react-router-dom";
import {JSX, useContext} from "react";
import {useAppConfigStore} from "@/api/ProjectStore";
import {AuthContext} from "@/auth/AuthProvider";
import {ROUTES} from "@/main/Routes";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const [readiness] = useAppConfigStore((s) => [s.readiness]);
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (readiness === undefined || readiness.status !== true) {
        if (location.pathname !== ROUTES.LOADER) {
            return <Navigate to={ROUTES.LOADER} state={{ from: location }} replace />;
        }
        return children; // stay on loader page if already there
    }

    if (!user && location.pathname !== ROUTES.LOGIN) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    if (user && location.pathname === ROUTES.LOGIN) {
        return <Navigate to={ROUTES.ROOT} state={{ from: location }} />;
    }

    return children;
}
