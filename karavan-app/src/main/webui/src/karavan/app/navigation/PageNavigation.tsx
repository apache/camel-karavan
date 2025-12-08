import React, {useContext, useState} from 'react';
import {Badge, Button,} from '@patternfly/react-core';
import './PageNavigation.css';
import LogoutIcon from "@patternfly/react-icons/dist/esm/icons/door-open-icon";
import {useAppConfigStore, useDevModeStore, useFileStore, useProjectsStore, useStatusesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useLocation, useNavigate} from "react-router-dom";
import {SsoApi} from "@api/auth/SsoApi";
import {UserPopupOidc} from "../login/UserPopupOidc";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import DarkModeToggle from "@app/theme/DarkModeToggle";
import {AuthApi} from "@api/auth/AuthApi";
import {getNavigationMenu} from "@app/navigation/NavigationMenu";
import {AuthContext} from "@api/auth/AuthProvider";
import {KaravanIcon} from "@features/integration/designer/icons/KaravanIcons";


export function PageNavigation() {

    const [config] = useAppConfigStore((s) => [s.config], shallow)
    const menu = getNavigationMenu(config.environment, config.infrastructure);
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const [projects] = useProjectsStore((s) => [s.projects], shallow)
    const [deployments, containers] = useStatusesStore((state) => [state.deployments, state.containers], shallow)
    const [pageId, setPageId] = useState<string>(menu?.at(0)?.pageId || 'integrations');
    const navigate = useNavigate();
    const location = useLocation();
    const {reload} = useContext(AuthContext);

    const projectCount = projects.filter(p => !BUILD_IN_PROJECTS.includes(p.projectId))?.length;

    React.useEffect(() => {
        var page = location.pathname?.split("/").filter(Boolean)[0];
        if (page === 'integrations') {
            var projectId = location.pathname?.split("/").filter(Boolean)[1];
            if (BUILD_IN_PROJECTS.includes(projectId)) {
                setPageId('settings');
            } else {
                setPageId(page);
            }
        } else if (page !== undefined) {
            setPageId(page);
        } else {
            setPageId('integrations');
        }
    }, [location]);


    return (
        <div className="nav-buttons pf-v6-theme-dark">
            <div className='nav-button-part-wrapper'>
                {KaravanIcon()}
            </div>
            <div style={{alignSelf: 'center'}} className='environment-wrapper'>
            </div>
            {menu.map((page, index) => {
                let className = "nav-button";
                className = className.concat(pageId === page.pageId ? " nav-button-selected" : "");
                className = className.concat((index === menu.length - 1) ? " nav-button-last" : "");
                return (
                    <div key={page.pageId} className={pageId === page.pageId ? "nav-button-selected nav-button-wrapper" : "nav-button-wrapper"}>
                        <Button id={page.pageId}
                                style={{width: '100%'}}
                                icon={page.icon}
                                variant={"link"}
                                className={className}
                                onClick={event => {
                                    setFile('none', undefined);
                                    setPodName(undefined);
                                    setStatus("none");
                                    setPageId(page.pageId);
                                    navigate(page.pageId);
                                }}
                        >
                            {page.name}
                        </Button>
                    </div>
                )
            })}
            <div className='nav-button-part-wrapper' style={{flexGrow: '2'}}/>
            {AuthApi.authType === 'oidc' &&
                <div className='nav-button-part-wrapper'>
                    <UserPopupOidc/>
                </div>
            }

            <div className='nav-button-part-wrapper'>
                <DarkModeToggle/>
            </div>
            <div className='nav-button-part-wrapper'>
                <Button icon={<LogoutIcon/>} className={"nav-button"} style={{width: '100%'}} variant={"link"}
                        onClick={event => {
                            if (AuthApi.authType === 'oidc') {
                                SsoApi.logout(() => {
                                });
                            } else if (AuthApi.authType === 'session') {
                                AuthApi.logout();
                                reload();
                            }
                        }}
                >Exit</Button>
            </div>
        </div>
    )
}