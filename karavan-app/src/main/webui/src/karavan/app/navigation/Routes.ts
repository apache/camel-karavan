// routes.ts
export const ROUTES = {
    INTEGRATIONS: "/integrations",
    INTEGRATION_DETAIL: "/integrations/:projectId",
    INTEGRATION_FILE: "/integrations/:projectId/:fileName",
    SERVICES: "/services",
    SYSTEM: "/system",
    DOCUMENTATION: "/documentation",
    FORBIDDEN: "/403",
    ACL: "/acl",
    LOGIN: "/login",
    // fallback redirect
    ROOT: "/",
};
