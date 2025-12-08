import {Navigate, useLocation} from "react-router-dom";
import {JSX, useContext} from "react";
import {AuthContext} from "@api/auth/AuthProvider";
import {ROUTES} from "@app/navigation/Routes";
import {useReadinessStore} from "@stores/ReadinessStore";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { readiness } = useReadinessStore();
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (readiness === undefined || readiness.status !== true) {
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
