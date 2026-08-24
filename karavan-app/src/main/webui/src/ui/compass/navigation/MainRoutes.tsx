/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Navigate, Route, Routes} from 'react-router-dom';
import React, {lazy, Suspense} from "react";
import {NotAuthorizedPage} from "@compass/navigation/NotAuthorizedPage";
import {ROUTES} from "./Routes";
import {ProtectedRoute} from "@compass/navigation/ProtectedRoute";
import {PageFallback} from "@compass/navigation/PageFallback";
import {LoginPage} from "@login/LoginPage";

const ProjectsPage = lazy(() => import("@page-projects/ProjectsPage").then(m => ({default: m.ProjectsPage})));
const ProjectPage = lazy(() => import("@page-project/ProjectPage").then(m => ({default: m.ProjectPage})));
const SettingsPage = lazy(() => import("@page-settings/SettingsPage").then(m => ({default: m.SettingsPage})));
const SystemPage = lazy(() => import("@page-system/SystemPage").then(m => ({default: m.SystemPage})));
const DocumentationPage = lazy(() => import("@page-documentation/DocumentationPage").then(m => ({default: m.DocumentationPage})));
const AccessPage = lazy(() => import("@page-access/AccessPage").then(m => ({default: m.AccessPage})));

export function MainRoutes() {

    return (
        <Suspense fallback={<PageFallback/>}>
            <Routes>
                <Route path={ROUTES.LOGIN} element={
                    <ProtectedRoute>
                        <LoginPage/>
                    </ProtectedRoute>}
                />
                <Route path={ROUTES.PROJECTS} element={
                    <ProtectedRoute>
                        <ProjectsPage key="integrations"/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.PROJECT_DETAIL} element={
                    <ProtectedRoute>
                        <ProjectPage key="project"/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.PROJECT_FILE} element={
                    <ProtectedRoute>
                        <ProjectPage key="project"/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.SETTINGS} element={
                    <ProtectedRoute>
                        <SettingsPage/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.SETTINGS_FILE} element={
                    <ProtectedRoute>
                        <SettingsPage/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.SYSTEM} element={
                    <ProtectedRoute>
                        <SystemPage/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.DOCUMENTATION} element={
                    <ProtectedRoute>
                        <DocumentationPage/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.ACL} element={
                    <ProtectedRoute>
                        <AccessPage/>
                    </ProtectedRoute>
                }/>
                <Route path={ROUTES.FORBIDDEN} element={
                    <NotAuthorizedPage/>
                }/>
                <Route path="*" element={<Navigate to={ROUTES.PROJECTS} replace/>}/>
            </Routes>
        </Suspense>
    )
}
