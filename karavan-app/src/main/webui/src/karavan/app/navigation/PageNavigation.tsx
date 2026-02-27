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
import React, {useContext, useState} from 'react';
import {Badge, Button,} from '@patternfly/react-core';
import './PageNavigation.css';
import {useAppConfigStore, useDevModeStore, useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useLocation, useNavigate} from "react-router-dom";
import {SsoApi} from "@api/auth/SsoApi";
import {UserPopupOidc} from "../login/UserPopupOidc";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import DarkModeToggle from "@app/theme/DarkModeToggle";
import {AuthApi} from "@api/auth/AuthApi";
import {getNavigationFirstMenu, getNavigationSecondMenu, MenuItem} from "@app/navigation/NavigationMenu";
import {AuthContext} from "@api/auth/AuthProvider";
import {PlatformLogoBase64} from "@app/navigation/PlatformLogo";
import {PlatformVersions} from "@shared/ui/PlatformLogos";

function PageNavigation() {

    const [config] = useAppConfigStore((s) => [s.config], shallow)
    const firstMenu = getNavigationFirstMenu();
    const secondMenu = getNavigationSecondMenu(config.environment, config.infrastructure);
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const [pageId, setPageId] = useState<string>();
    const navigate = useNavigate();
    const location = useLocation();
    const {reload} = useContext(AuthContext);

    React.useEffect(() => {
        var page = location.pathname?.split("/").filter(Boolean)[0];
        if (page === 'projects') {
            var projectId = location.pathname?.split("/").filter(Boolean)[1];
            if (BUILD_IN_PROJECTS.includes(projectId)) {
                setPageId('settings');
            } else {
                setPageId(page);
            }
        } else if (page !== undefined) {
            setPageId(page);
        } else if (config.environment === 'dev') {
            setPageId('projects');
        } else {
            setPageId('projects');
        }
    }, [location]);

    function onClick(page: MenuItem) {
        if (page.pageId === 'logout') {
            if (AuthApi.authType === 'oidc') {
                SsoApi.logout(() => {
                });
            } else if (AuthApi.authType === 'session') {
                AuthApi.logout();
                reload();
            }
        } else {
            setFile('none', undefined);
            setPodName(undefined);
            setStatus("none");
            setPageId(page.pageId);
            navigate(page.pageId);
        }
    }

    function getMenu(menu: MenuItem[]) {
        return (
            menu.map((page, index) => {
                    let className = "nav-button";
                    const isSelected = pageId === page.pageId;
                    className = className.concat(isSelected ? " nav-button-selected" : "");
                    return (
                        <div key={page.pageId} className={isSelected ? "nav-button-selected nav-button-wrapper" : "nav-button-wrapper"}>
                            <Button  id={page.pageId}
                                     style={{width: '100%'}}
                                     variant={"link"}
                                     className={className}
                                // countOptions={badge}
                                     onClick={_ => onClick(page)}
                            >
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px'}}>
                                    {page.icon}
                                    {page.name}
                                </div>
                            </Button>
                        </div>
                    )
                })
        )
    }

    return (
        <div className="nav-buttons pf-v6-theme-dark">
            <div className='nav-button-part-wrapper'>
                <img src={PlatformLogoBase64()} className="logo" alt='logo'/>
                <div style={{alignSelf: 'center'}} className='environment-wrapper'>
                    <Badge isRead className='environment'>{config.environment}</Badge>
                </div>
            </div>
            {getMenu(firstMenu)}
            <div style={{flex: 2}}/>
            {getMenu(secondMenu)}
            {AuthApi.authType === 'oidc' &&
                <div className='nav-button-part-wrapper'>
                    <UserPopupOidc/>
                </div>
            }
            <div className={"dark-mode-toggle"}>
                <DarkModeToggle/>
            </div>
            <PlatformVersions/>
        </div>
    )
}

export default PageNavigation