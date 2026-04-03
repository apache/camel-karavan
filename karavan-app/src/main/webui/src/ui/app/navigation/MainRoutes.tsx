import {Navigate, Route, Routes} from 'react-router-dom';
import React from "react";
import {NotAuthorizedPage} from "@app/navigation/NotAuthorizedPage";
import {SystemPage} from "@features/system/SystemPage";
import {AccessPage} from "@features/access/AccessPage";
import {DocumentationPage} from "@features/documentation/DocumentationPage";
import {ROUTES} from "./Routes";
import {ProtectedRoute} from "@app/navigation/ProtectedRoute";
import {ProjectFunctionHook} from "@app/navigation/ProjectFunctionHook";
import {ProjectProvider} from "@features/project/ProjectContext";
import {DeveloperManager} from "@features/project/developer/DeveloperManager";
import {ProjectPage} from "@features/project/ProjectPage";
import {ProjectsPage} from "@features/projects/ProjectsPage";
import {DashboardPage} from "@features/dashboard/DashboardPage";
import {LoginPage} from "@app/login/LoginPage";
import {useReadinessStore} from "@stores/ReadinessStore";
import {SettingsPage} from "@features/settings/SettingsPage";

export function MainRoutes() {

    const { readiness } = useReadinessStore();

    // @ts-ignore
    return (
        <Routes>
            <Route path={ROUTES.LOGIN} element={
                <ProtectedRoute>
                    <LoginPage/>
                </ProtectedRoute>}
            />
            <Route path={ROUTES.DASHBOARD} element={
                <ProtectedRoute>
                    <DashboardPage/>
                </ProtectedRoute>}
            />
            <Route path={ROUTES.PROJECTS} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <ProjectsPage key="integrations"/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.PROJECT_DETAIL} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <ProjectPage key="project" developerManager={<DeveloperManager/>}/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.PROJECT_FILE} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <ProjectPage key="project" developerManager={<DeveloperManager/>}/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>

            <Route path={ROUTES.SETTINGS} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <SettingsPage/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.SETTINGS_FILE} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <SettingsPage/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.SYSTEM} element={<ProtectedRoute><SystemPage/></ProtectedRoute>}/>
            <Route path={ROUTES.DOCUMENTATION} element={<ProtectedRoute><DocumentationPage/></ProtectedRoute>}/>
            <Route path={ROUTES.ACL} element={<ProtectedRoute><AccessPage/></ProtectedRoute>}/>
            <Route path={ROUTES.FORBIDDEN} element={<NotAuthorizedPage/>}/>
            {/*{readiness?.environment === 'dev' && <Route path="*" element={<Navigate to={ROUTES.PROJECTS} replace/>}/>}*/}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace/>}/>
        </Routes>
    )
}