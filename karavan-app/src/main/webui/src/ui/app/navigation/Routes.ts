// routes.ts
export const ROUTES = {
    DASHBOARD: "/dashboard",
    PROJECTS: "/projects",
    PROJECT_DETAIL: "/projects/:projectId",
    PROJECT_FILE: "/projects/:projectId/:fileName",
    SYSTEM: "/system",
    SETTINGS: "/settings",
    SETTINGS_FILE: "/settings/:projectId/:fileName",
    DOCUMENTATION: "/documentation",
    FORBIDDEN: "/403",
    ACL: "/acl",
    LOGIN: "/login",
    // fallback redirect
    ROOT: "/",
};
