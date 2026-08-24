import {Navigate, useLocation} from "react-router-dom";
import {JSX, useContext} from "react";
import {AuthContext} from "@api/auth/AuthProvider";
import {ROUTES} from "@compass/navigation/Routes";
import {useReadinessStore} from "@stores/ReadinessStore";
import {PageFallback} from "@compass/navigation/PageFallback";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { readiness } = useReadinessStore();
    const { user, loading, authType } = useContext(AuthContext);
    const location = useLocation();

    if (readiness === undefined || readiness.status !== true) {
        return children; // stay on loader page if already there
    }

    // OIDC never uses the internal login page: the browser is redirected to
    // Keycloak by SsoApi, so show a spinner while that is in flight.
    if (!user && authType === 'oidc') {
        return <PageFallback/>;
    }

    if (!user && location.pathname !== ROUTES.LOGIN) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    if (user && location.pathname === ROUTES.LOGIN) {
        return <Navigate to={ROUTES.ROOT} state={{ from: location }} />;
    }

    return children;
}
