// routes.ts
export const ROUTES = {
    INTEGRATIONS: "/integrations",
    INTEGRATION_DETAIL: "/integrations/:projectId",
    INTEGRATION_FILE: "/integrations/:projectId/:fileName",
    RESOURCES: "/resources",
    RESOURCE_DETAIL: "/resources/:projectId",
    SYSTEM: "/system",
    DIAGNOSTICS: "/diagnostics",
    DOCUMENTATION: "/documentation",
    FORBIDDEN: "/403",
    ACL: "/acl",
    LOGIN: "/login",
    LOADER: "/loader",
    // fallback redirect
    ROOT: "/",
};
