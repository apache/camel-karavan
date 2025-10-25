import {Navigate, Route, Routes} from 'react-router-dom';
import React from "react";
import {ResourcesPage} from "@/resources/ResourcesPage";
import {NotAuthorizedPage} from "@/main/NotAuthorizedPage";
import {DiagnosticsPage} from "@/diagnostics/DiagnosticsPage";
import {SystemPage} from "@/system/SystemPage";
import {AccessPage} from "@/access/AccessPage";
import {DocumentationPage} from "@/documentation/DocumentationPage";
import {ROUTES} from "./Routes";
import {ProtectedRoute} from "@/main/ProtectedRoute";
import {LoginPage} from "@/custom/LoginPage";
import {LoaderPage} from "@/main/LoaderPage";
import { ProjectsPage } from "@/projects/ProjectsPage";


export function MainRoutes() {

    return (
        <Routes>
            <Route path={ROUTES.LOGIN} element={<ProtectedRoute><LoginPage/></ProtectedRoute>}/>
            <Route path={ROUTES.LOADER} element={<ProtectedRoute><LoaderPage/></ProtectedRoute>}/>
            <Route path={ROUTES.INTEGRATIONS} element={<ProtectedRoute><ProjectsPage key="projects"/></ProtectedRoute>}/>
            <Route path={ROUTES.INTEGRATION_DETAIL} element={<ProtectedRoute><ProjectsPage key="project"/></ProtectedRoute>}/>
            <Route path={ROUTES.INTEGRATION_FILE} element={<ProtectedRoute><ProjectsPage key="project"/></ProtectedRoute>}/>
            <Route path={ROUTES.RESOURCES} element={<ProtectedRoute><ResourcesPage key="resources"/></ProtectedRoute>}/>
            <Route path={ROUTES.RESOURCE_DETAIL} element={<ProtectedRoute><ProjectsPage key="project"/></ProtectedRoute>}/>
            <Route path={ROUTES.SYSTEM} element={<ProtectedRoute><SystemPage/></ProtectedRoute>}/>
            <Route path={ROUTES.DIAGNOSTICS} element={<ProtectedRoute><DiagnosticsPage/></ProtectedRoute>}/>
            <Route path={ROUTES.DOCUMENTATION} element={<ProtectedRoute><DocumentationPage/></ProtectedRoute>}/>
            <Route path={ROUTES.ACL} element={<ProtectedRoute><AccessPage/></ProtectedRoute>}/>
            <Route path={ROUTES.FORBIDDEN} element={<NotAuthorizedPage/>}/>
            <Route path="*" element={<Navigate to={ROUTES.INTEGRATIONS} replace/>}/>
        </Routes>
    )
}