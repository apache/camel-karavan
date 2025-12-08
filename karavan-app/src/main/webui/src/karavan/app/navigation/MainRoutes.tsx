import {Navigate, Route, Routes} from 'react-router-dom';
import React from "react";
import {NotAuthorizedPage} from "@app/navigation/NotAuthorizedPage";
import {SystemPage} from "@features/system/SystemPage";
import {AccessPage} from "@features/access/AccessPage";
import {DocumentationPage} from "@features/documentation/DocumentationPage";
import {ROUTES} from "./Routes";
import {ProtectedRoute} from "@app/navigation/ProtectedRoute";
import {LoginPage} from "@app/login/LoginPage";
import {ProjectFunctionHook} from "@app/navigation/ProjectFunctionHook";
import {ProjectProvider} from "@features/integration/ProjectContext";
import {DeveloperManager} from "@features/integration/developer/DeveloperManager";
import ProjectPage from "@features/integration/ProjectPage";
import {IntegrationsPage} from "@features/integrations/IntegrationsPage";

export function MainRoutes() {

    return (
        <Routes>
            <Route path={ROUTES.LOGIN} element={
                <ProtectedRoute>
                    <LoginPage/>
                </ProtectedRoute>}
            />
            <Route path={ROUTES.INTEGRATIONS} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <IntegrationsPage key="integrations"/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.INTEGRATION_DETAIL} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <ProjectPage key="project" developerManager={<DeveloperManager/>}/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.INTEGRATION_FILE} element={
                <ProtectedRoute>
                    <ProjectProvider useProjectHook={ProjectFunctionHook}>
                        <ProjectPage key="project" developerManager={<DeveloperManager/>}/>
                    </ProjectProvider>
                </ProtectedRoute>
            }/>
            <Route path={ROUTES.SYSTEM} element={<ProtectedRoute><SystemPage/></ProtectedRoute>}/>
            <Route path={ROUTES.DOCUMENTATION} element={<ProtectedRoute><DocumentationPage/></ProtectedRoute>}/>
            <Route path={ROUTES.ACL} element={<ProtectedRoute><AccessPage/></ProtectedRoute>}/>
            <Route path={ROUTES.FORBIDDEN} element={<NotAuthorizedPage/>}/>
            <Route path="*" element={<Navigate to={ROUTES.INTEGRATIONS} replace/>}/>
        </Routes>
    )
}